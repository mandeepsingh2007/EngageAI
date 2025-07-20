"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Trophy, BarChart3, MessageSquare, FileText, Zap, X, Users, Award } from 'lucide-react';
import Poll from '@/app/components/Poll';
import QASection from '@/app/components/QASection';
import Resources from '@/app/components/Resources';
import EngagementScore from '@/app/components/EngagementScore';
import { GameChallenge } from '@/app/components/GameChallenge';
import { Badges } from '@/app/components/Badges';
import { engagementService } from '@/lib/engagementService';
import PollCreator from "@/app/components/PollCreator";

export default function JoinSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [engagementScore, setEngagementScore] = useState(0);
  const [showGameChallenge, setShowGameChallenge] = useState(false);
  const [polls, setPolls] = useState<any[]>([]);
  const [lastEngagementTime, setLastEngagementTime] = useState<Date>(new Date());

  // 1. Check user auth and role
  useEffect(() => {
    const checkUserAndRole = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        // Save intended path
        localStorage.setItem("postSignInRedirect", window.location.pathname);
        router.push("/"); // redirect to sign-in page
        return;
      }
      
      setUser(data.user);
      
      // Check if user has a role
      const { data: userRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      
      if (!userRow?.role) {
        // User needs to select a role, redirect to main page
        localStorage.setItem("postSignInRedirect", window.location.pathname);
        router.push("/");
        return;
      }
      
      setUserRole(userRow.role);
      setLoading(false);
    };
    
    checkUserAndRole();
  }, [router, sessionId]);

  // 2. Mark attendance, add to session participants, and start session tracking
  useEffect(() => {
    if (user && sessionId && userRole && !attendanceMarked) {
      const markAttendance = async () => {
        try {
          // Mark attendance
          await supabase
            .from("attendance")
            .insert({ user_id: user.id, session_id: sessionId });
          
          // Add to session_participants
          const { error: participantError } = await supabase
            .from('session_participants')
            .upsert({
              session_id: sessionId,
              user_id: user.id,
              role: userRole,
              status: 'active',
              joined_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            }, {
              onConflict: 'session_id,user_id',
              ignoreDuplicates: true
            });
          
          if (participantError) {
            console.error('Error adding to session participants:', participantError);
            throw participantError;
          }
          
          setAttendanceMarked(true);
          
          // Start session duration tracking
          await engagementService.startSessionTracking(user.id, sessionId);
        } catch (error: any) {
          console.error("Error in attendance flow:", error);
          // Still set as marked to avoid infinite retries
          setAttendanceMarked(true);
        }
      };
      markAttendance();
    }
  }, [user, sessionId, userRole, attendanceMarked]);

  // 2.5. Load polls
  useEffect(() => {
    if (sessionId && userRole) {
      loadPolls();
    }
  }, [sessionId, userRole]);

  // 2.6. Handle page unload to end session tracking
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && sessionId) {
        engagementService.endSessionTracking(user.id, sessionId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user && sessionId) {
        engagementService.endSessionTracking(user.id, sessionId);
      }
    };
  }, [user, sessionId]);

  // 3. Listen for real-time activities
  useEffect(() => {
    if (!sessionId || !userRole) return;
    
    // Initial fetch
    supabase
      .from("activities")
      .select("*")
      .eq("session_id", sessionId)
      .then(({ data }) => setActivities(data || []));
    
    // Real-time subscription
    const channel = supabase
      .channel("realtime:activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setActivities((prev) => [...prev, payload.new]);
          // Auto-refresh polls when new poll activity is detected
          if (payload.new.type === 'poll') {
            loadPolls();
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userRole]);

  const loadPolls = async () => {
    try {
      const pollsData = await engagementService.getSessionPolls(sessionId);
      setPolls(pollsData);
    } catch (error) {
      console.error('Error loading polls:', error);
    }
  };

  // Monitor engagement and show game challenge when needed
  useEffect(() => {
    // Check engagement every 30 seconds
    const interval = setInterval(() => {
      const now = new Date();
      const minutesSinceEngagement = (now.getTime() - lastEngagementTime.getTime()) / (1000 * 60);
      
      // Show game challenge if no engagement in last 2 minutes and not already showing
      if (minutesSinceEngagement >= 2 && !showGameChallenge) {
        setShowGameChallenge(true);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [lastEngagementTime, showGameChallenge]);
  
  // Update last engagement time when user interacts with the session
  const updateEngagement = () => {
    setLastEngagementTime(new Date());
  };
  
  // Simulate engagement score changes for demo
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const minutesSinceEngagement = (now.getTime() - lastEngagementTime.getTime()) / (1000 * 60);
      
      // Decrease engagement score if no recent engagement
      let engagementChange = 0;
      if (minutesSinceEngagement > 2) {
        engagementChange = -5; // Decrease faster if inactive
      } else {
        // Small random fluctuation when active
        engagementChange = Math.random() * 4 - 2; // -2 to +2
      }
      
      setEngagementScore(prev => {
        const newScore = Math.min(100, Math.max(0, prev + engagementChange));
        return Math.round(newScore * 10) / 10; // Round to 1 decimal
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, [lastEngagementTime]);

  if (loading || !user || !userRole) {
    return <div className="text-center mt-20 text-white">Loading session...</div>;
  }
  
  if (!attendanceMarked) {
    return <div className="text-center mt-20 text-white">Marking attendance...</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'polls', label: 'Polls', icon: BarChart3 },

    { id: 'resources', label: 'Resources', icon: FileText },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'engagement', label: 'Engagement', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Engagement Alert */}
      {showGameChallenge && userRole === 'participant' && (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-yellow-200">Your engagement is low! Try a quick challenge to earn bonus points!</p>
            </div>
            <button 
              onClick={() => setShowGameChallenge(false)}
              className="text-yellow-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Session Dashboard</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>Session ID: <span className="font-mono text-blue-300">{sessionId}</span></span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Attendance Recorded
              </span>
              <span className="capitalize bg-blue-500/20 px-2 py-1 rounded-full text-blue-300">
                {userRole}
              </span>
              <span className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${engagementScore > 70 ? 'bg-green-400' : engagementScore > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                Engagement: {Math.round(engagementScore)}%
              </span>
            </div>
          </div>
          
          {userRole === 'organizer' && activeTab === 'polls' && (
            <PollCreator 
              sessionId={sessionId} 
              userId={user.id} 
              onPollCreated={loadPolls}
            />
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Challenge */}
      {showGameChallenge && userRole === 'participant' && (
        <div className="px-6 pb-2">
          <GameChallenge 
            sessionId={sessionId}
            userId={user?.id || 'anonymous'}
            engagementScore={engagementScore}
            onComplete={() => {
              setShowGameChallenge(false);
              setLastEngagementTime(new Date()); // Reset engagement timer
              // Small engagement boost after completing a game
              setEngagementScore(prev => Math.min(prev + 15, 100));
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activities */}
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activities</h2>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="text-gray-300 text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p>No activities yet. The session is ready for engagement!</p>
                    {userRole === 'organizer' && (
                      <p className="text-gray-400 text-sm mt-2">
                        Create polls, share resources, or start Q&A to engage participants.
                      </p>
                    )}
                  </div>
                ) : (
                  activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium mb-1">{activity.title}</div>
                          <div className="text-gray-400 text-sm capitalize">{activity.type}</div>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold text-blue-400">{polls.length}</div>
                <div className="text-gray-400 text-sm">Active Polls</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold text-green-400">{activities.filter(a => a.type === 'qna').length}</div>
                <div className="text-gray-400 text-sm">Questions</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold text-orange-400">{activities.filter(a => a.type === 'resource').length}</div>
                <div className="text-gray-400 text-sm">Resources</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold text-purple-400">{activities.length}</div>
                <div className="text-gray-400 text-sm">Total Activities</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="space-y-6">
            {polls.length === 0 ? (
              <div className="bg-white/5 rounded-lg p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No polls available yet.</p>
                {userRole === 'organizer' && (
                  <p className="text-gray-500 text-sm mt-2">Create the first poll to engage participants!</p>
                )}
              </div>
            ) : (
              polls.map((poll) => (
                <Poll
                  key={poll.id}
                  poll={poll}
                  userId={user.id}
                  userRole={userRole}
                  onResponse={loadPolls}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'qa' && (
          <QASection
            sessionId={sessionId}
            userId={user.id}
            userRole={userRole}
          />
        )}

        {activeTab === 'resources' && (
          <Resources
            sessionId={sessionId}
            userId={user.id}
            userRole={userRole}
          />
        )}

        {activeTab === 'badges' && user?.id && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6">Your Badges</h2>
              <Badges 
                userId={user.id} 
                sessionId={sessionId} 
                userRole={userRole || 'participant'} 
              />
            </div>
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">How to Earn Badges</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Participate in polls and Q&A to earn engagement points</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Download and view session resources</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Complete game challenges when they appear</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Maintain high engagement throughout the session</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <EngagementScore
            sessionId={sessionId}
            userId={user.id}
            userRole={userRole}
          />
        )}
      </div>
    </div>
  );
}