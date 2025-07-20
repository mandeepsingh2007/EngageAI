import { supabase } from './supabaseClient';

export interface EngagementDataPoint {
  timestamp: string;
  sessionHealth: number;
  participationRate: number;
  engagementVelocity: number;
  momentumScore: number;
  activeParticipants: number;
  totalActions: number;
  events: EngagementEvent[];
}

export interface EngagementEvent {
  id: string;
  type: 'poll_created' | 'question_asked' | 'resource_shared' | 'high_activity' | 'low_activity';
  timestamp: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  userId?: string;
}

export interface ParticipantRadarData {
  userId: string;
  username: string;
  engagementLevel: number;
  recentActivity: number;
  position: { x: number; y: number };
  status: 'active' | 'idle' | 'at-risk' | 'superstar';
  color: string;
  size: number;
}

export interface ActivityStreamItem {
  id: string;
  type: 'insight' | 'alert' | 'recommendation' | 'celebration';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  icon: string;
  color: string;
  timestamp: string;
  actionable: boolean;
  animated?: boolean;
}

interface ParticipantActivity {
  user_id: string;
  activity_type: string;
  score: number;
  created_at: string;
}

class RealTimeAnalyticsService {
  private engagementHistory: Map<string, EngagementDataPoint[]> = new Map();
  private participantPositions: Map<string, { x: number; y: number }> = new Map();
  private eventHistory: Map<string, EngagementEvent[]> = new Map();

  // Get engagement flow data for line chart
  async getEngagementFlow(sessionId: string, timeRange = 30): Promise<EngagementDataPoint[]> {
    // Implementation here
    return [];
  }

  // Get session events for annotations
  async getSessionEvents(sessionId: string, startTime: Date): Promise<EngagementEvent[]> {
    // Implementation here
    return [];
  }

  // Get participant radar data
  async getParticipantRadar(sessionId: string): Promise<ParticipantRadarData[]> {
    try {
      const { data: participants, error } = await supabase
        .from('engagement_metrics')
        .select('user_id, activity_type, score, created_at')
        .eq('session_id', sessionId);

      if (error) throw error;

      // Group by user with proper typing
      const userMap: Record<string, ParticipantActivity[]> = {};
      participants?.forEach((p: ParticipantActivity) => {
        if (!userMap[p.user_id]) userMap[p.user_id] = [];
        userMap[p.user_id].push(p);
      });

      const radarData: ParticipantRadarData[] = [];
      const centerX = 200; // Center of radar circle
      const centerY = 200;
      const maxRadius = 150;
      const baseHealth = 50; // Default base health score

      Object.entries(userMap).forEach(([userId, activities], index) => {
        // Calculate engagement metrics with proper typing
        const totalScore = activities.reduce((sum, a) => sum + (a.score || 0), 0);
        const recentActivities = activities.filter((a: ParticipantActivity) => 
          new Date(a.created_at) > new Date(Date.now() - 5 * 60 * 1000)
        );
        const recentActivity = recentActivities.length;

        // Determine engagement level (0-100)
        const engagementLevel = Math.min(totalScore * 2, 100);

        // Determine status
        let status: 'active' | 'idle' | 'at-risk' | 'superstar' = 'idle';
        let color = '#94a3b8'; // gray
        let size = 8;

        if (engagementLevel > 80) {
          status = 'superstar';
          color = '#fbbf24'; // gold
          size = 16;
        } else if (recentActivity > 2) {
          status = 'active';
          color = '#10b981'; // green
          size = 12;
        } else if (totalScore > 0 && recentActivity === 0) {
          status = 'at-risk';
          color = '#f59e0b'; // orange
          size = 10;
        }

        // Calculate position (circular arrangement)
        const angle = (index / Object.keys(userMap).length) * 2 * Math.PI;
        const radius = Math.min(maxRadius, 50 + engagementLevel * 1.0);
        const position = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        };

        radarData.push({
          userId,
          username: `User ${userId.substring(0, 8)}`,
          engagementLevel,
          recentActivity,
          position,
          status,
          color,
          size
        });
      });

      return radarData;
    } catch (error) {
      console.error('Error getting participant radar:', error);
      return [];
    }
  }

  // Get activity stream data
  async getActivityStream(sessionId: string, limit = 20): Promise<ActivityStreamItem[]> {
    try {
      const stream: ActivityStreamItem[] = [];
      const now = new Date();

      // Get recent activities from the database
      const { data: activities, error } = await supabase
        .from('engagement_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Check for recent activity patterns
      if (!activities || activities.length === 0) {
        stream.push({
          id: `no-activity-${now.getTime()}`,
          type: 'alert',
          priority: 'urgent',
          title: 'Low Activity Detected',
          message: 'No participant engagement in the last 10 minutes. Consider launching a poll!',
          icon: '⚠️',
          color: 'red',
          timestamp: now.toISOString(),
          actionable: true,
          animated: true
        });
      }

      // Check for high activity
      if (activities && activities.length > 10) {
        stream.push({
          id: `high-activity-${now.getTime()}`,
          type: 'celebration',
          priority: 'low',
          title: 'High Engagement!',
          message: `${activities.length} actions in the last 10 minutes. Great momentum!`,
          icon: '🔥',
          color: 'green',
          timestamp: now.toISOString(),
          actionable: false,
          animated: true
        });
      }

      // Add some sample insights
      stream.push({
        id: `insight-${now.getTime()}`,
        type: 'recommendation',
        priority: 'medium',
        title: 'Engagement Opportunity',
        message: 'Perfect time to ask: "What questions do you have so far?"',
        icon: '💡',
        color: 'blue',
        timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        actionable: true
      });

      return stream.sort((a, b) => {
        // Sort by priority first, then by timestamp
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    } catch (error) {
      console.error('Error getting activity stream:', error);
      return [];
    }
  }

  // Clear cached data for a session
  clearSessionData(sessionId: string) {
    this.engagementHistory.delete(sessionId);
    this.eventHistory.delete(sessionId);
    
    // Clear participant positions for this session
    const keysToDelete = Array.from(this.participantPositions.keys())
      .filter(key => key.startsWith(`${sessionId}-`));
    keysToDelete.forEach(key => this.participantPositions.delete(key));
  }
}

export const realTimeAnalytics = new RealTimeAnalyticsService();
