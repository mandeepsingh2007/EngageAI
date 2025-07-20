"use client";
import { useState, useEffect } from 'react';
import { engagementService, UserEngagementScore } from '@/lib/engagementService';
import { Trophy, TrendingUp, Users, Award, Target, Brain } from 'lucide-react';
import OrganizerIntelligence from './OrganizerIntelligence';

interface EngagementScoreProps {
  sessionId: string;
  userId: string;
  userRole: string;
}

interface LeaderboardEntry extends UserEngagementScore {
  users: { name: string; email: string };
  rank: number;
}

export default function EngagementScore({ sessionId, userId, userRole }: EngagementScoreProps) {
  const [userScore, setUserScore] = useState<UserEngagementScore | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'score' | 'leaderboard' | 'analytics' | 'intelligence'>('score');

  useEffect(() => {
    console.log('[EngagementScore] Mount: sessionId, userId, userRole', sessionId, userId, userRole);
    loadEngagementData();
    
    // Subscribe to real-time engagement updates
    const channel = engagementService.subscribeToEngagementUpdates(sessionId, () => {
      console.log('[EngagementScore] Real-time update received, reloading data');
      loadEngagementData();
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [sessionId, userId]);

  const loadEngagementData = async () => {
    try {
      // Load user's engagement score
      const score = await engagementService.getUserEngagementScore(userId, sessionId);
      setUserScore(score);

      // Load leaderboard
      const leaderboardData = await engagementService.getSessionLeaderboard(sessionId, 10);
      const leaderboardWithRanks = leaderboardData.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      setLeaderboard(leaderboardWithRanks);

      // Load session analytics
      const analyticsData = await engagementService.getSessionAnalytics(sessionId);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserRank = () => {
    const userEntry = leaderboard.find(entry => entry.user_id === userId);
    return userEntry?.rank || 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 100) return 'text-yellow-400';
    if (score >= 50) return 'text-green-400';
    if (score >= 25) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 100) return 'from-yellow-500 to-orange-500';
    if (score >= 50) return 'from-green-500 to-emerald-500';
    if (score >= 25) return 'from-blue-500 to-cyan-500';
    return 'from-gray-500 to-slate-500';
  };

  if (loading) {
    return (
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-white/20 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white/10 rounded-lg p-1 border border-white/20">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('score')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'score'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Score
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          {userRole === 'organizer' && (
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'intelligence'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Intelligence
            </button>
          )}
        </div>
      </div>
      {/* Tab Content */}
      {activeTab === 'intelligence' && userRole === 'organizer' ? (
        <OrganizerIntelligence 
          sessionId={sessionId} 
          userId={userId} 
        />
      ) : (
        <>
          {/* User's Engagement Score */}
          {activeTab === 'score' && userScore && (
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Your Engagement Score
                </h3>
                {getUserRank() > 0 && (
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">
                      Rank #{getUserRank()}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(userScore.total_score)} mb-2`}>
                    {userScore.total_score}
                  </div>
                  <div className="text-gray-400 text-sm">Total Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {userScore.attendance_score}
                  </div>
                  <div className="text-gray-400 text-sm">Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {userScore.poll_score}
                  </div>
                  <div className="text-gray-400 text-sm">Polls</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {userScore.qna_score}
                  </div>
                  <div className="text-gray-400 text-sm">Q&A</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-2">
                    {userScore.resource_score}
                  </div>
                  <div className="text-gray-400 text-sm">Resources</div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Leaderboard
              </h3>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry: LeaderboardEntry, index: number) => {
                    const isCurrentUser = entry.user_id === userId;
                    const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                    const rankColor = rankColors[index] || 'text-gray-400';

                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                          isCurrentUser 
                            ? 'bg-blue-500/20 border border-blue-500/30' 
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`text-xl font-bold ${rankColor} w-8 text-center`}>
                            #{entry.rank}
                          </div>
                          <div>
                            <div className={`font-semibold ${isCurrentUser ? 'text-blue-300' : 'text-white'}`}>
                              Anonymous {isCurrentUser && ' (You)'}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Last active: {new Date(entry.last_updated).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${getScoreColor(entry.total_score)}`}>
                            {entry.total_score}
                          </div>
                          <div className="text-gray-400 text-sm">points</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No leaderboard data available.</p>
                </div>
              )}
            </div>
          )}

          {/* Session Analytics */}
          {activeTab === 'analytics' && userRole === 'organizer' && analytics && (
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Session Analytics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {analytics.totalParticipants}
                  </div>
                  <div className="text-gray-400 text-sm">Total Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {analytics.activeParticipants}
                  </div>
                  <div className="text-gray-400 text-sm">Active Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {analytics.totalPolls}
                  </div>
                  <div className="text-gray-400 text-sm">Polls Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">
                    {analytics.totalQuestions}
                  </div>
                  <div className="text-gray-400 text-sm">Questions Asked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-2">
                    {analytics.totalResources}
                  </div>
                  <div className="text-gray-400 text-sm">Resources Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400 mb-2">
                    {analytics.averageEngagementScore}
                  </div>
                  <div className="text-gray-400 text-sm">Avg. Score</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
