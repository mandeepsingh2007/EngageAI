import { supabase } from './supabaseClient';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'poll' | 'qna' | 'resource' | 'attendance' | 'overall';
  threshold: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  session_id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

class BadgeService {
  // Badge definitions
  private badgeDefinitions: Badge[] = [
    // Poll Badges
    {
      id: 'poll_participant',
      name: 'Poll Enthusiast',
      description: 'Participated in 5+ polls',
      icon: '📊',
      color: 'blue',
      category: 'poll',
      threshold: 5,
      level: 'bronze',
      created_at: new Date().toISOString(),
    },
    {
      id: 'poll_expert',
      name: 'Poll Master',
      description: 'Participated in 15+ polls',
      icon: '🏆',
      color: 'yellow',
      category: 'poll',
      threshold: 15,
      level: 'gold',
      created_at: new Date().toISOString(),
    },
    
    // Q&A Badges
    {
      id: 'curious_mind',
      name: 'Curious Mind',
      description: 'Asked 3+ questions',
      icon: '❓',
      color: 'purple',
      category: 'qna',
      threshold: 3,
      level: 'bronze',
      created_at: new Date().toISOString(),
    },
    {
      id: 'knowledge_sharer',
      name: 'Knowledge Sharer',
      description: 'Answered 5+ questions',
      icon: '💡',
      color: 'green',
      category: 'qna',
      threshold: 5,
      level: 'silver',
      created_at: new Date().toISOString(),
    },
    
    // Resource Badges
    {
      id: 'resource_explorer',
      name: 'Resource Explorer',
      description: 'Downloaded 3+ resources',
      icon: '📚',
      color: 'blue',
      category: 'resource',
      threshold: 3,
      level: 'bronze',
      created_at: new Date().toISOString(),
    },
    
    // Attendance Badges
    {
      id: 'dedicated_learner',
      name: 'Dedicated Learner',
      description: 'Attended 80%+ of session time',
      icon: '⏱️',
      color: 'purple',
      category: 'attendance',
      threshold: 80, // percentage
      level: 'silver',
      created_at: new Date().toISOString(),
    },
    
    // Overall Engagement Badges
    {
      id: 'engagement_champion',
      name: 'Engagement Champion',
      description: 'Top 10% in session engagement',
      icon: '🚀',
      color: 'gold',
      category: 'overall',
      threshold: 90, // percentile
      level: 'platinum',
      created_at: new Date().toISOString(),
    },
  ];

  /**
   * Check and award badges based on user's engagement scores
   */
  async checkAndAwardBadges(
    userId: string, 
    sessionId: string, 
    engagementScores: {
      poll_score: number;
      qna_score: number;
      resource_score: number;
      attendance_score: number;
      total_score: number;
      rank_percentile?: number;
    }
  ): Promise<Badge[]> {
    try {
      const badgesToAward: Badge[] = [];
      const { 
        poll_score = 0, 
        qna_score = 0, 
        resource_score = 0, 
        attendance_score = 0, 
        total_score = 0,
        rank_percentile = 0 
      } = engagementScores;

      console.log('Checking badges for user:', { 
        userId, 
        sessionId, 
        poll_score, 
        qna_score, 
        resource_score, 
        attendance_score, 
        total_score, 
        rank_percentile 
      });

      // Check each badge definition
      for (const badge of this.badgeDefinitions) {
        try {
          const hasBadge = await this.userHasBadge(userId, sessionId, badge.id);
          if (hasBadge) {
            console.log(`User ${userId} already has badge ${badge.id}`);
            continue;
          }

          let shouldAward = false;
          let scoreValue = 0;
          
          switch (badge.category) {
            case 'poll':
              scoreValue = poll_score;
              shouldAward = poll_score >= badge.threshold;
              break;
            case 'qna':
              scoreValue = qna_score;
              shouldAward = qna_score >= badge.threshold;
              break;
            case 'resource':
              scoreValue = resource_score;
              shouldAward = resource_score >= badge.threshold;
              break;
            case 'attendance':
              scoreValue = attendance_score;
              shouldAward = attendance_score >= badge.threshold;
              break;
            case 'overall':
              scoreValue = rank_percentile;
              shouldAward = rank_percentile >= badge.threshold;
              break;
          }

          console.log(`Checking badge ${badge.id} (${badge.category}):`, {
            threshold: badge.threshold,
            currentScore: scoreValue,
            shouldAward
          });

          if (shouldAward) {
            console.log(`Queueing badge ${badge.id} for award to user ${userId}`);
            badgesToAward.push(badge);
          }
        } catch (error) {
          console.error(`Error processing badge ${badge.id}:`, error);
          // Continue with other badges even if one fails
          continue;
        }
      }

      // Award all eligible badges
      const awardedBadges: Badge[] = [];
      for (const badge of badgesToAward) {
        try {
          const success = await this.awardBadge(userId, sessionId, badge.id);
          if (success) {
            awardedBadges.push(badge);
          }
        } catch (error) {
          console.error(`Failed to award badge ${badge.id}:`, error);
          // Continue with other badges even if one fails
          continue;
        }
      }

      console.log(`Awarded ${awardedBadges.length} badges to user ${userId}`);
      return awardedBadges;
    } catch (error) {
      console.error('Error in checkAndAwardBadges:', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, sessionId: string, badgeId: string): Promise<boolean> {
    try {
      // First, verify the badge exists
      const badge = this.badgeDefinitions.find(b => b.id === badgeId);
      if (!badge) {
        console.error(`Badge with ID ${badgeId} not found in definitions`);
        return false;
      }

      // Check if user already has this badge
      const hasBadge = await this.userHasBadge(userId, sessionId, badgeId);
      if (hasBadge) {
        console.log(`User ${userId} already has badge ${badgeId}`);
        return true; // Consider this a success case
      }

      // Insert the badge
      const { error } = await supabase
        .from('user_badges')
        .insert([
          { 
            user_id: userId, 
            session_id: sessionId, 
            badge_id: badgeId,
            earned_at: new Date().toISOString()
          },
        ]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          console.log(`User ${userId} already has badge ${badgeId} (race condition)`);
          return true; // Consider this a success case
        }
        throw error;
      }
      
      console.log(`Awarded badge ${badgeId} to user ${userId} in session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error in awardBadge:', {
        userId,
        sessionId,
        badgeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check if user already has a specific badge
   */
  async userHasBadge(userId: string, sessionId: string, badgeId: string): Promise<boolean> {
    try {
      if (!userId || !sessionId || !badgeId) {
        console.error('Missing required parameters:', { userId, sessionId, badgeId });
        return false;
      }

      const { data, error } = await supabase
        .from('user_badges')
        .select('id,earned_at')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .eq('badge_id', badgeId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return false;
        }
        throw error;
      }

      const hasBadge = !!data;
      if (hasBadge) {
        console.log(`User ${userId} already has badge ${badgeId} (earned at: ${data.earned_at})`);
      }
      
      return hasBadge;
    } catch (error: any) {
      const errorInfo = {
        userId,
        sessionId,
        badgeId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error?.code,
        errorDetails: error?.details
      };
      
      console.error('Error in userHasBadge:', errorInfo);
      
      // In case of error, assume user doesn't have the badge to prevent duplicate awards
      return false;
    }
  }

  /**
   * Get all badges earned by a user in a session
   */
  async getUserBadges(userId: string, sessionId: string): Promise<UserBadge[]> {
    console.log('Fetching badges for user:', { userId, sessionId });
    
    try {
      // Directly attempt to fetch badges without checking table existence
      // This is more reliable across different Supabase environments

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          user_id,
          session_id,
          badge_id,
          earned_at,
          badge:badge_id(*)
        `)
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }

      console.log('Fetched badges data:', data);

      if (!data || data.length === 0) {
        console.log('No badges found for user in this session');
        return [];
      }

      return data
        .filter(item => item) // Filter out any null/undefined items
        .map(item => {
          // Type assertion for the badge data from Supabase
          const badgeData = item.badge as unknown as Partial<Badge> | null;
          const fallbackBadge = this.badgeDefinitions.find(b => b.id === item.badge_id);
          
          const badge: Badge = badgeData ? {
            id: badgeData.id || item.badge_id,
            name: badgeData.name || 'Unknown Badge',
            description: badgeData.description || 'This badge information could not be loaded',
            icon: badgeData.icon || '❓',
            color: badgeData.color || 'gray',
            category: badgeData.category || 'overall',
            threshold: badgeData.threshold || 0,
            level: badgeData.level || 'bronze',
            created_at: badgeData.created_at || new Date().toISOString()
          } : fallbackBadge || {
            id: item.badge_id,
            name: 'Unknown Badge',
            description: 'This badge information could not be loaded',
            icon: '❓',
            color: 'gray',
            category: 'overall',
            threshold: 0,
            level: 'bronze',
            created_at: new Date().toISOString()
          };

          return {
            id: item.id,
            user_id: item.user_id,
            session_id: item.session_id,
            badge_id: item.badge_id,
            earned_at: item.earned_at,
            badge
          };
        });
    } catch (error) {
      console.error('Error in getUserBadges:', error);
      return [];
    }
  }

  /**
   * Get all available badge definitions
   */
  getAllBadgeDefinitions(): Badge[] {
    return [...this.badgeDefinitions];
  }
}

export const badgeService = new BadgeService();
