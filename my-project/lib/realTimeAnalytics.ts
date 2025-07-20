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
  engagementLevel: number; // 0-100
  recentActivity: number; // 0-10
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

class RealTimeAnalyticsService {
  private engagementHistory: Map<string, EngagementDataPoint[]> = new Map();
  private participantPositions: Map<string, { x: number; y: number }> = new Map();
  private eventHistory: Map<string, EngagementEvent[]> = new Map();

  // Get engagement flow data for line chart
  async getEngagementFlow(sessionId: string, timeRange: number = 30): Promise<EngagementDataPoint[]> {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeRange * 60 * 1000);

      // Get engagement metrics over time
      const { data: metrics, error } = await supabase
        .from('engagement_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get session events (polls, questions, resources)
      const events = await this.getSessionEvents(sessionId, startTime);

      // Group data by time intervals (1-minute buckets)
      const dataPoints: EngagementDataPoint[] = [];
      const intervalMs = 60 * 1000; // 1 minute intervals

      for (let time = startTime.getTime(); time <= now.getTime(); time += intervalMs) {
        const intervalStart = new Date(time);
        const intervalEnd = new Date(time + intervalMs);

        // Get metrics in this interval
        const intervalMetrics = metrics?.filter(m => {
          const metricTime = new Date(m.created_at);
          return metricTime >= intervalStart && metricTime < intervalEnd;
        }) || [];

        // Get events in this interval
        const intervalEvents = events.filter(e => {
          const eventTime = new Date(e.timestamp);
          return eventTime >= intervalStart && eventTime < intervalEnd;
        });

        // Calculate metrics for this interval
        const activeParticipants = new Set(intervalMetrics.map(m => m.user_id)).size;
        const totalActions = intervalMetrics.length;
        const engagementVelocity = totalActions; // actions per minute

        // Calculate session health based on activity
        let sessionHealth = 0;
        if (activeParticipants > 0) {
          const expectedActions = activeParticipants * 1; // 1 action per participant per minute
          sessionHealth = Math.min((totalActions / Math.max(expectedActions, 1)) * 100, 100);
        }

        // Calculate participation rate
        const { data: sessionParticipants } = await supabase
          .from('engagement_metrics')
          .select('user_id')
          .eq('session_id', sessionId);
        
        const totalParticipants = new Set(sessionParticipants?.map(p => p.user_id) || []).size;
        const participationRate = totalParticipants > 0 ? (activeParticipants / totalParticipants) * 100 : 0;

        // Calculate momentum (compare with previous interval)
        const prevDataPoint = dataPoints[dataPoints.length - 1];
        let momentumScore = 50; // neutral
        if (prevDataPoint) {
          const activityChange = totalActions - prevDataPoint.totalActions;
          momentumScore = Math.max(0, Math.min(100, 50 + activityChange * 10));
        }

        dataPoints.push({
          timestamp: intervalStart.toISOString(),
          sessionHealth: Math.round(sessionHealth),
          participationRate: Math.round(participationRate),
          engagementVelocity,
          momentumScore: Math.round(momentumScore),
          activeParticipants,
          totalActions,
          events: intervalEvents
        });
      }

      // Store in history
      this.engagementHistory.set(sessionId, dataPoints);
      return dataPoints;

    } catch (error) {
      console.error('Error getting engagement flow:', error);
      return [];
    }
  }

  // Get session events for annotations
  private async getSessionEvents(sessionId: string, startTime: Date): Promise<EngagementEvent[]> {
    try {
      const [polls, questions, resources] = await Promise.all([
        supabase.from('polls').select('*').eq('session_id', sessionId).gte('created_at', startTime.toISOString()),
        supabase.from('questions').select('*').eq('session_id', sessionId).gte('created_at', startTime.toISOString()),
        supabase.from('resources').select('*').eq('session_id', sessionId).gte('created_at', startTime.toISOString())
      ]);

      const events: EngagementEvent[] = [];

      // Add poll events
      polls.data?.forEach(poll => {
        events.push({
          id: `poll-${poll.id}`,
          type: 'poll_created',
          timestamp: poll.created_at,
          description: `Poll created: ${poll.question}`,
          impact: 'positive'
        });
      });

      // Add question events
      questions.data?.forEach(question => {
        events.push({
          id: `question-${question.id}`,
          type: 'question_asked',
          timestamp: question.created_at,
          description: `Question asked: ${question.question.substring(0, 50)}...`,
          impact: 'positive',
          userId: question.user_id
        });
      });

      // Add resource events
      resources.data?.forEach(resource => {
        events.push({
          id: `resource-${resource.id}`,
          type: 'resource_shared',
          timestamp: resource.created_at,
          description: `Resource shared: ${resource.title}`,
          impact: 'positive'
        });
      });

      return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    } catch (error) {
      console.error('Error getting session events:', error);
      return [];
    }
  }

  // Get participant radar data
  async getParticipantRadar(sessionId: string): Promise<ParticipantRadarData[]> {
    try {
      // Get all participants and their recent activity
      const { data: participants, error } = await supabase
        .from('engagement_metrics')
        .select('user_id, activity_type, score, created_at')
        .eq('session_id', sessionId);

      if (error) throw error;

      // Define interface for participant activity
      interface ParticipantActivity {
        user_id: string;
        activity_type: string;
        score: number;
        created_at: string;
      }

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

      Object.entries(userMap).forEach(([userId, activities]: [string, ParticipantActivity[]], index: number) => {
        // Calculate engagement metrics with proper typing
        const totalScore = activities.reduce((sum: number, a: ParticipantActivity) => sum + (a.score || 0), 0);
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
        
        // Get or generate consistent position
        const positionKey = `${sessionId}-${userId}`;
        let position = this.participantPositions.get(positionKey);
        
        if (!position) {
          position = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          };
          this.participantPositions.set(positionKey, position);
        }

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
  async getActivityStream(sessionId: string, limit: number = 20): Promise<ActivityStreamItem[]> {
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
