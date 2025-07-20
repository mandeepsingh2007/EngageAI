'use client';

import { useEffect, useState } from 'react';
import { participantAnalytics, type ActivityCluster } from '@/lib/participantAnalytics';
// Custom Progress component since we don't have the UI library
interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

const Progress = ({ value, className = '', indicatorClassName = '' }: ProgressProps) => (
  <div className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <div 
      className={`h-full transition-all duration-300 ${indicatorClassName}`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Simple Badge component
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: string;
}

const Badge = ({ children, className = '', variant = 'default' }: BadgeProps) => (
  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
    {children}
  </div>
);

// Card components for consistency
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card = ({ children, className = '', onClick }: CardProps) => (
  <div 
    className={`rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: CardProps) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: CardProps) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);
import { User, MessageSquare, FileText, Users, BarChart2, PieChart, BarChart3, Activity } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const activityIcons = {
  poll: <BarChart2 className="h-5 w-5 text-blue-500" />,
  qna: <MessageSquare className="h-5 w-5 text-green-500" />,
  resource: <FileText className="h-5 w-5 text-purple-500" />,
  attendance: <Users className="h-5 w-5 text-yellow-500" />
};

const activityColors = {
  poll: '#3B82F6', // blue-500
  qna: '#10B981',  // emerald-500
  resource: '#8B5CF6', // violet-500
  attendance: '#F59E0B' // amber-500
};

const chartColors = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16'  // lime-500
];

const badgeLevelColors = {
  bronze: 'bg-amber-500',
  silver: 'bg-gray-300',
  gold: 'bg-yellow-400',
  platinum: 'bg-blue-400'
};

export const ParticipantClusters = ({ sessionId }: { sessionId: string }) => {
  const [clusters, setClusters] = useState<ActivityCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');
  const [selectedCluster, setSelectedCluster] = useState<ActivityCluster | null>(null);

  const loadClusters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const clusters = await participantAnalytics.getActivityClusters(sessionId);
      
      if (!clusters) {
        throw new Error('No data returned from server');
      }
      
      // Calculate total participants from all clusters
      const total = clusters.reduce((sum, cluster) => sum + cluster.participants.length, 0);
      
      setClusters(clusters);
      setTotalParticipants(total);
      
      // If no clusters but we have participants, show a message
      if (clusters.length === 0) {
        setError('No engagement data available yet. Participants need to interact with the session.');
      }
    } catch (error) {
      console.error('Error loading participant clusters:', error);
      setError('Failed to load participant data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadClusters, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const getRecommendation = (cluster: ActivityCluster) => {
    switch (cluster.clusterId) {
      case 1: // Poll Enthusiasts
        return 'Create more interactive polls with varied question types to keep them engaged.';
      case 2: // Q&A Stars
        return 'Encourage them to answer questions from others and highlight their contributions.';
      case 3: // Resource Collectors
        return 'Provide additional resources and materials for them to download and share.';
      case 4: // Passive Participants
        return 'Try to engage them with targeted questions or simpler interactive elements.';
      default:
        return 'Monitor their engagement and adjust activities accordingly.';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Loading participant data...</h3>
          <div className="h-2 w-24 bg-muted rounded-full"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-4"></div>
                <div className="h-3 bg-muted rounded w-5/6 mb-2"></div>
                <div className="h-3 bg-muted rounded w-4/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Data</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <button 
            onClick={loadClusters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (clusters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No participant data available</CardTitle>
          <CardDescription>Engagement data will appear as participants interact with the session.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const radarData = clusters.flatMap(cluster => [
    { subject: 'Engagement', [cluster.name]: cluster.dominantActivity.percentage, fullMark: 100 },
    { subject: 'Participation', [cluster.name]: cluster.percentage, fullMark: 100 }
  ]);

  // Close modal when clicking outside content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveTab('summary');
    }
  };

  return (
    <div className={`w-full max-w-full overflow-hidden px-4 ${activeTab === 'details' ? 'relative' : ''}`}>
      {/* Blur overlay when in details view */}
      {activeTab === 'details' && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20"
          onClick={handleBackdropClick}
        />
      )}
      {/* Summary View */}
      {activeTab === 'summary' && (
        <div className="w-full overflow-x-auto pb-2">
          <div className="flex w-max min-w-full gap-4">
            {clusters.map((cluster) => (
              <Card 
                key={cluster.clusterId}
                className="w-64 flex-shrink-0 cursor-pointer transition-shadow hover:shadow-lg bg-gray-800 border-gray-700"
                onClick={() => {
                  setSelectedCluster(cluster);
                  setActiveTab('details');
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">{cluster.name}</CardTitle>
                    <div className="rounded-full bg-gray-700 p-2 text-white">
                      {activityIcons[cluster.dominantActivity.type]}
                    </div>
                  </div>
                  <CardDescription className="text-gray-300">{cluster.participants.length} participants ({cluster.percentage}%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-24 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{
                        name: 'Engagement',
                        value: cluster.dominantActivity.percentage
                      }]}>
                        <Bar 
                          dataKey="value" 
                          fill={activityColors[cluster.dominantActivity.type]}
                          radius={[4, 4, 0, 0]}
                        >
                          <Cell fill={activityColors[cluster.dominantActivity.type]} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Detailed View - Modal */}
      {activeTab === 'details' && selectedCluster && (
        <div className="fixed inset-0 flex items-center justify-center z-30 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground">
            <CardHeader className="sticky top-0 bg-card z-10 border-b">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('summary')}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                    <path d="m12 19-7-7 7-7"/>
                    <path d="M19 12H5"/>
                  </svg>
                  Back to Overview
                </button>
                <div>
                  <CardTitle className="text-2xl text-white">{selectedCluster.name}</CardTitle>
                  <CardDescription className="text-white/80">{selectedCluster.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="flex w-max min-w-full gap-6">
                  <div className="w-96 flex-shrink-0">
                    <h3 className="mb-4 text-lg font-semibold text-white">Engagement Breakdown</h3>
                    <div className="h-64 w-full overflow-hidden rounded-lg border bg-gray-900/50 p-4 shadow-sm">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Engagement', A: selectedCluster.dominantActivity.percentage, fullMark: 100 },
                          { subject: 'Participation', A: selectedCluster.percentage, fullMark: 100 },
                          { subject: 'Badges', A: Object.keys(selectedCluster.badgeDistribution).length * 10, fullMark: 100 }
                        ]}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <PolarAngleAxis dataKey="subject" stroke="white" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="white" />
                          <Radar 
                            name="Metrics" 
                            dataKey="A" 
                            stroke={activityColors[selectedCluster.dominantActivity.type]}
                            fill={activityColors[selectedCluster.dominantActivity.type]}
                            fillOpacity={0.4}
                            strokeWidth={2}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="w-96 flex-shrink-0">
                    <h3 className="mb-4 text-lg font-semibold text-white">Recommendations</h3>
                    <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-900/80 to-purple-900/80 p-4 shadow-sm text-white">
                      <p className="mb-4 text-white/90">{getRecommendation(selectedCluster)}</p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-white">Quick Actions:</h4>
                        <ul className="list-disc space-y-1 pl-5 text-white/80">
                          <li>Send a targeted poll to this group</li>
                          <li>Highlight their contributions in the session</li>
                          <li>Assign a special badge for engagement</li>
                        </ul>
                      </div>
                    </div>

                    <h3 className="mb-4 mt-6 text-lg font-semibold text-white">Badge Distribution</h3>
                    <div className="h-48 w-full overflow-hidden rounded-lg border bg-gray-900/50 p-4 shadow-sm">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={Object.entries(selectedCluster.badgeDistribution)
                            .sort(([,a], [,b]) => b - a)
                            .map(([name, value]) => ({ name, value }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis type="number" stroke="white" />
                          <YAxis dataKey="name" type="category" width={100} stroke="white" />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              borderRadius: '0.5rem'
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill={activityColors[selectedCluster.dominantActivity.type]}
                            radius={[0, 4, 4, 0]}
                          >
                            {
                              Object.entries(selectedCluster.badgeDistribution).map(([name], index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="sticky bottom-4 left-0 right-0 z-10 flex justify-center">
        <div className="flex space-x-4 rounded-lg bg-background/80 p-1 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('summary')}
            className={`rounded-md px-4 py-2 font-medium ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
          >
            Summary View
          </button>
          <button
            onClick={() => setActiveTab('details')}
            disabled={!selectedCluster}
            className={`rounded-md px-4 py-2 font-medium ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'} ${!selectedCluster ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            Detailed Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
