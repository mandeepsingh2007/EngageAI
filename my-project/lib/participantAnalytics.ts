import { supabase } from './supabaseClient';
import { Badge } from './badgeService';

export interface ParticipantActivity {
  userId: string;
  name: string;
  email: string;
  pollCount: number;
  questionCount: number;
  answerCount: number;
  resourceDownloads: number;
  attendanceMinutes: number;
  badges: Badge[];
  lastActivity: string;
}

export interface ActivityCluster {
  clusterId: number;
  name: string;
  description: string;
  participants: string[];
  percentage: number; // Total percentage of participants in this cluster
  dominantActivity: {
    type: 'poll' | 'qna' | 'resource' | 'attendance';
    percentage: number; // Percentage of dominant activity within this cluster
  };
  badgeDistribution: Record<string, number>;
}

class ParticipantAnalytics {
  /**
   * Get all participants with their activity metrics
   */
  async getParticipantActivities(sessionId: string): Promise<ParticipantActivity[]> {
    try {
      // First get all participant user IDs for this session
      const { data: participantIds, error: participantsError } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;
      if (!participantIds || participantIds.length === 0) return [];

      const userIds = participantIds.map(p => p.user_id);

      // Get user details in a separate query
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) throw usersError;
      if (!usersData) return [];

      // Create a map of user details for quick lookup
      const usersMap = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, { id: string; name: string | null; email: string | null }>);

      // Get engagement metrics for all participants with proper grouping
      const { data: engagementData, error: engagementError } = await supabase
        .rpc('get_engagement_counts', {
          p_session_id: sessionId,
          p_user_ids: userIds
        });

      if (engagementError) throw engagementError;

      // Define types for engagement data
      interface EngagementItem {
        user_id: string;
        activity_type: string;
        activity_count: number;
      }

      // Transform the data to count activities per user and type
      const engagementCounts = engagementData?.reduce(
        (acc: Record<string, number>, item: EngagementItem) => {
          if (item.user_id && item.activity_type) {
            const key = `${item.user_id}_${item.activity_type}`;
            acc[key] = Number(item.activity_count) || 0;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      if (engagementError) throw engagementError;

      // Get badge information for all participants
      const { data: badgeData, error: badgeError } = await supabase
        .from('user_badges')
        .select('user_id, badge_id, badges!inner(*)')
        .in('user_id', userIds)
        .eq('session_id', sessionId);

      if (badgeError) {
        console.error('Error fetching badge data:', badgeError);
        throw badgeError;
      }

      // Helper function to check if an object is a valid Badge
      const isBadge = (badge: any): badge is Badge => {
        return badge && 
               typeof badge.id === 'string' && 
               typeof badge.name === 'string' &&
               typeof badge.description === 'string';
      };

      // Process and aggregate the data for each user
      return userIds.map(userId => {
        const user = usersMap[userId];
        const getEngagementCount = (activityType: string) => {
          const key = `${userId}_${activityType}`;
          return engagementCounts?.[key] || 0;
        };
        
        // Get user badges with proper type checking
        const userBadges = (badgeData || [])
          .filter((b: { user_id: string }) => b.user_id === userId)
          .flatMap((b: { badges: any }) => {
            // Handle both array and single badge cases
            const badges = Array.isArray(b.badges) ? b.badges : [b.badges];
            return badges.filter(isBadge);
          });
        
        return {
          userId,
          name: user?.name || 'Anonymous',
          email: user?.email || '',
          pollCount: getEngagementCount('poll'),
          questionCount: getEngagementCount('question'),
          answerCount: getEngagementCount('answer'),
          resourceDownloads: getEngagementCount('resource_download'),
          attendanceMinutes: 0, // This would come from attendance tracking
          badges: userBadges,
          lastActivity: new Date().toISOString() // Would be calculated from actual data
        };
      });
    } catch (error) {
      console.error('Error getting participant activities:', error);
      return [];
    }
  }

  /**
   * Cluster participants based on their activity patterns
   */
  async getActivityClusters(sessionId: string): Promise<ActivityCluster[]> {
    const participants = await this.getParticipantActivities(sessionId);
    
    // Simple clustering based on dominant activity type
    const clusters: Record<string, ActivityCluster> = {
      pollLovers: {
        clusterId: 1,
        name: 'Poll Enthusiasts',
        description: 'Participants who actively engage with polls',
        participants: [],
        percentage: 30, // 30% of participants
        dominantActivity: { type: 'poll', percentage: 80 },
        badgeDistribution: { 'Poll Master': 5, 'Active Participant': 3 }
      },
      qnaActive: {
        clusterId: 2,
        name: 'Q&A Stars',
        description: 'Participants who ask and answer questions',
        participants: [],
        percentage: 25, // 25% of participants
        dominantActivity: { type: 'qna', percentage: 70 },
        badgeDistribution: { 'Question Master': 3, 'Helpful Answer': 2 }
      },
      resourceCollectors: {
        clusterId: 3,
        name: 'Resource Collectors',
        description: 'Participants who download resources',
        participants: [],
        percentage: 25, // 25% of participants
        dominantActivity: { type: 'resource', percentage: 60 },
        badgeDistribution: { 'Resource Collector': 4, 'Early Adopter': 2 }
      },
      passiveParticipants: {
        clusterId: 4,
        name: 'Observers',
        description: 'Participants with minimal engagement',
        participants: [],
        percentage: 20, // 20% of participants
        dominantActivity: { type: 'attendance', percentage: 20 },
        badgeDistribution: { 'First Timer': 2 }
      }
    };

    // Categorize each participant
    participants.forEach(participant => {
      // Calculate engagement scores for each activity type
      const activities = {
        poll: participant.pollCount * 10, // Weight poll activity
        qna: (participant.questionCount * 8) + (participant.answerCount * 6), // Weight Q&A
        resource: participant.resourceDownloads * 5, // Weight resource downloads
        attendance: Math.min(participant.attendanceMinutes, 60) // Cap attendance at 60 minutes
      };

      const totalScore = Object.values(activities).reduce((a, b) => a + b, 0);
      
      // If no significant activity, mark as passive
      if (totalScore < 5) {
        clusters.passiveParticipants.participants.push(participant.userId);
        return;
      }

      // Find dominant activity type
      let maxScore = 0;
      let dominantActivity: keyof typeof activities = 'attendance';
      
      for (const [activity, score] of Object.entries(activities) as [keyof typeof activities, number][]) {
        if (score > maxScore) {
          maxScore = score;
          dominantActivity = activity;
        }
      }

      // Assign to appropriate cluster
      let cluster: ActivityCluster;
      switch (dominantActivity) {
        case 'poll':
          cluster = clusters.pollLovers;
          break;
        case 'qna':
          cluster = clusters.qnaActive;
          break;
        case 'resource':
          cluster = clusters.resourceCollectors;
          break;
        default:
          cluster = clusters.passiveParticipants;
      }

      // Update cluster data
      cluster.participants.push(participant.userId);
      participant.badges.forEach(badge => {
        cluster.badgeDistribution[badge.id] = (cluster.badgeDistribution[badge.id] || 0) + 1;
      });
    });

    // Calculate percentages and clean up empty clusters
    return Object.values(clusters)
      .filter(cluster => cluster.participants.length > 0)
      .map(cluster => ({
        ...cluster,
        dominantActivity: {
          type: cluster.dominantActivity.type,
          percentage: Math.round((cluster.participants.length / participants.length) * 100) || 0
        }
      }));
  }

  /**
   * Get activity distribution for visualization
   */
  async getActivityDistribution(sessionId: string) {
    try {
      // First get all participants in the session
      const { count: totalCount } = await supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      
      if (!totalCount || totalCount === 0) {
        return { totalParticipants: 0, clusters: [] };
      }
      
      const clusters = await this.getActivityClusters(sessionId);
      
      // Calculate percentages based on total participants in the session
      return {
        totalParticipants: totalCount,
        clusters: clusters.map(cluster => ({
          ...cluster,
          percentage: Math.round((cluster.participants.length / totalCount) * 100) || 0,
          badgeCount: Object.keys(cluster.badgeDistribution).length
        })).filter(cluster => cluster.participants.length > 0) // Only include non-empty clusters
      };
    } catch (error) {
      console.error('Error in getActivityDistribution:', error);
      return { totalParticipants: 0, clusters: [] };
    }
  }
}

export const participantAnalytics = new ParticipantAnalytics();
