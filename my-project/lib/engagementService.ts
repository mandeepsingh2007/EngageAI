import { supabase } from './supabaseClient';

export interface EngagementMetric {
  id: string;
  user_id: string;
  session_id: string;
  activity_type: 'poll' | 'question' | 'answer' | 'resource_download' | 'session_duration' | 'game_completed' | 'game_started';
  activity_id?: string;
  score: number;
  metadata?: any;
  created_at: string;
}

export interface GameChallenge {
  id: string;
  session_id: string;
  type: 'quiz' | 'wordchain' | 'trivia' | 'puzzle' | 'scavenger';
  title: string;
  description: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  points: number;
  duration: number;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

export interface GameParticipation {
  id: string;
  game_id: string;
  user_id: string;
  session_id: string;
  completed: boolean;
  points_earned: number;
  started_at: string;
  completed_at?: string;
  answer?: string;
  is_correct?: boolean;
  time_taken: number; // in seconds
}

export interface UserEngagementScore {
  id: string;
  user_id: string;
  session_id: string;
  total_score: number;
  attendance_score: number;
  poll_score: number;
  qna_score: number;
  resource_score: number;
  last_updated: string;
}

export interface Poll {
  id: string;
  session_id: string;
  title: string;
  question: string;
  options: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  ends_at?: string;
}

export interface PollResponse {
  id: string;
  poll_id: string;
  user_id: string;
  selected_option: string;
  created_at: string;
}

export interface Question {
  id: string;
  session_id: string;
  user_id: string;
  question: string;
  is_answered: boolean;
  upvotes: number;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  answer: string;
  is_official: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_type: string;
  file_size?: number;
  created_by: string;
  created_at: string;
}

class EngagementService {
  // Session Duration Tracking
  private sessionStartTimes: Map<string, number> = new Map();
  private gameChallenges: GameChallenge[] = [];
  
  // Initialize with some sample games
  constructor() {
    this.initializeSampleGames();
  }
  
  private initializeSampleGames() {
    this.gameChallenges = [
      {
        id: 'quiz-1',
        session_id: 'all',
        type: 'quiz',
        title: 'Quick Knowledge Check',
        description: 'Answer this question correctly to earn bonus points!',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correct_answer: '2', // index of correct answer
        points: 20,
        duration: 30,
        created_at: new Date().toISOString(),
        created_by: 'system',
        is_active: true,
      },
      {
        id: 'wordchain-1',
        session_id: 'all',
        type: 'wordchain',
        title: 'Word Chain Game',
        description: 'Type a word that starts with the last letter of the previous word!',
        question: 'Start with: SESSION',
        correct_answer: 'N',
        points: 15,
        duration: 45,
        created_at: new Date().toISOString(),
        created_by: 'system',
        is_active: true,
      },
      {
        id: 'trivia-1',
        session_id: 'all',
        type: 'trivia',
        title: 'Tech Trivia',
        description: 'Test your tech knowledge!',
        question: 'Which company developed React?',
        options: ['Google', 'Facebook', 'Microsoft', 'Apple'],
        correct_answer: '1',
        points: 25,
        duration: 30,
        created_at: new Date().toISOString(),
        created_by: 'system',
        is_active: true,
      },
    ];
  }

  async startSessionTracking(userId: string, sessionId: string) {
    this.sessionStartTimes.set(`${userId}-${sessionId}`, Date.now());
  }

  async endSessionTracking(userId: string, sessionId: string) {
    const startTime = this.sessionStartTimes.get(`${userId}-${sessionId}`);
    if (!startTime) return;

    const duration = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
    this.sessionStartTimes.delete(`${userId}-${sessionId}`);

    // Update attendance record with duration
    await supabase
      .from('attendance')
      .update({ 
        duration_minutes: duration,
        left_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    // Record session duration engagement
    await this.recordEngagement(userId, sessionId, 'session_duration', undefined, { minutes: duration });
  }

  async recordEngagement(
    userId: string, 
    sessionId: string, 
    activityType: string, 
    activityId?: string, 
    metadata?: any
  ) {
    try {
      const { data, error } = await supabase.rpc('calculate_engagement_score', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_activity_type: activityType,
        p_activity_data: metadata || {}
      });

      if (error) throw error;

      const score = data || 0;

      await supabase.from('engagement_metrics').insert({
        user_id: userId,
        session_id: sessionId,
        activity_type: activityType,
        activity_id: activityId,
        score,
        metadata
      });

      await supabase.rpc('update_user_engagement_score', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_activity_type: activityType,
        p_score: score
      });

      // After updating engagement, check for badge eligibility
      try {
        const { badgeService } = await import('./badgeService');
        const engagementScore = await this.getUserEngagementScore(userId, sessionId);
        
        if (engagementScore) {
          // Get leaderboard to calculate rank percentile
          const leaderboard = await this.getSessionLeaderboard(sessionId);
          const userRank = leaderboard.findIndex(entry => entry.user_id === userId) + 1;
          const totalParticipants = leaderboard.length;
          const rankPercentile = totalParticipants > 0 
            ? Math.round(((totalParticipants - userRank) / totalParticipants) * 100)
            : 0;

          await badgeService.checkAndAwardBadges(userId, sessionId, {
            poll_score: engagementScore.poll_score,
            qna_score: engagementScore.qna_score,
            resource_score: engagementScore.resource_score,
            attendance_score: engagementScore.attendance_score,
            total_score: engagementScore.total_score,
            rank_percentile: rankPercentile
          });
        }
      } catch (badgeError) {
        console.error('Error in badge service after recording engagement:', badgeError);
        // Don't fail the engagement recording if badge service fails
      }

      return score;
    } catch (error) {
      console.error('Error recording engagement:', error);
      return 0;
    }
  }

  // Poll Management
  async createPoll(sessionId: string, title: string, question: string, options: string[], createdBy: string, endsAt?: string) {
    const { data, error } = await supabase
      .from('polls')
      .insert({
        session_id: sessionId,
        title,
        question,
        options,
        created_by: createdBy,
        ends_at: endsAt
      })
      .select()
      .single();

    if (error) throw error;

    // Create activity for real-time updates
    await supabase.from('activities').insert({
      session_id: sessionId,
      type: 'poll',
      title: `New Poll: ${title}`,
      data: { poll_id: data.id, question, options },
      created_by: createdBy
    });

    return data;
  }

  async getSessionPolls(sessionId: string) {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async submitPollResponse(pollId: string, userId: string, selectedOption: string) {
    const { data, error } = await supabase
      .from('poll_responses')
      .insert({
        poll_id: pollId,
        user_id: userId,
        selected_option: selectedOption
      })
      .select()
      .single();

    if (error) throw error;

    // Get poll info to get session_id
    const { data: poll } = await supabase
      .from('polls')
      .select('session_id')
      .eq('id', pollId)
      .single();

    if (poll) {
      // Record engagement for participant responding to poll
      await this.recordEngagement(userId, poll.session_id, 'poll', pollId, {
        selected_option: selectedOption
      });

      // Import the badge service
      const { badgeService } = await import('./badgeService');
      
      // Get the user's current engagement score
      const engagementScore = await this.getUserEngagementScore(userId, poll.session_id);
      
      if (engagementScore) {
        // Check and award badges based on updated engagement score
        await badgeService.checkAndAwardBadges(userId, poll.session_id, {
          poll_score: engagementScore.poll_score,
          qna_score: engagementScore.qna_score,
          resource_score: engagementScore.resource_score,
          attendance_score: engagementScore.attendance_score,
          total_score: engagementScore.total_score,
          // Calculate rank percentile if needed
          rank_percentile: 0 // You can calculate this based on leaderboard position
        });
      }
    }

    return data;
  }

  async getPollResults(pollId: string) {
    const { data, error } = await supabase
      .from('poll_responses')
      .select('selected_option')
      .eq('poll_id', pollId);

    if (error) throw error;

    // Count responses
    const results: { [key: string]: number } = {};
    data.forEach(response => {
      results[response.selected_option] = (results[response.selected_option] || 0) + 1;
    });

    return results;
  }

  // Q&A Management
  async askQuestion(sessionId: string, userId: string, question: string) {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        question
      })
      .select()
      .single();

    if (error) throw error;

    // Create activity for real-time updates
    await supabase.from('activities').insert({
      session_id: sessionId,
      type: 'qna',
      title: 'New Question Asked',
      data: { question_id: data.id, question },
      created_by: userId
    });

    // Record engagement for participant asking question
    await this.recordEngagement(userId, sessionId, 'qna', data.id, {
      question
    });

    return data;
  }

  async answerQuestion(questionId: string, userId: string, answer: string, isOfficial: boolean = false) {
    const { data, error } = await supabase
      .from('answers')
      .insert({
        question_id: questionId,
        user_id: userId,
        answer,
        is_official: isOfficial
      })
      .select()
      .single();

    if (error) throw error;

    // Mark question as answered if it's an official answer
    if (isOfficial) {
      await supabase
        .from('questions')
        .update({ is_answered: true })
        .eq('id', questionId);
    }

    // Get question info to get session_id
    const { data: question } = await supabase
      .from('questions')
      .select('session_id')
      .eq('id', questionId)
      .single();

    if (question) {
      // Record engagement for participant answering question
      await this.recordEngagement(userId, question.session_id, 'qna', questionId, {
        answer,
        is_official: isOfficial
      });
    }

    return data;
  }

  async upvoteQuestion(questionId: string, userId: string) {
    const { data, error } = await supabase
      .from('question_upvotes')
      .insert({
        question_id: questionId,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Update question upvote count
    await supabase.rpc('increment', {
      table_name: 'questions',
      row_id: questionId,
      column_name: 'upvotes'
    });

    // Get question info to get session_id
    const { data: question } = await supabase
      .from('questions')
      .select('session_id')
      .eq('id', questionId)
      .single();

    if (question) {
      // Record engagement for participant upvoting question
      await this.recordEngagement(userId, question.session_id, 'qna', questionId, {
        action: 'upvote'
      });
    }

    return data;
  }

  async getSessionQuestions(sessionId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        answers (
          *,
          users (name, email)
        ),
        users (name, email)
      `)
      .eq('session_id', sessionId)
      .order('upvotes', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Resource Management
  async createResource(
    sessionId: string, 
    title: string, 
    description: string, 
    fileUrl: string, 
    fileType: string, 
    fileSize: number, 
    createdBy: string
  ) {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        session_id: sessionId,
        title,
        description,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) throw error;

    // Create activity for real-time updates
    await supabase.from('activities').insert({
      session_id: sessionId,
      type: 'resource',
      title: `New Resource: ${title}`,
      data: { resource_id: data.id, file_type: fileType },
      created_by: createdBy
    });

    return data;
  }

  async downloadResource(resourceId: string, userId: string) {
    const { data, error } = await supabase
      .from('resource_downloads')
      .insert({
        resource_id: resourceId,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Get resource info to get session_id
    const { data: resource } = await supabase
      .from('resources')
      .select('session_id, title')
      .eq('id', resourceId)
      .single();

    if (resource) {
      // Record engagement for participant downloading resource
      await this.recordEngagement(userId, resource.session_id, 'resource', resourceId, {
        resource_title: resource.title
      });
    }

    return data;
  }

  async getSessionResources(sessionId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getResourceDownloadCount(resourceId: string) {
    const { count, error } = await supabase
      .from('resource_downloads')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', resourceId);

    if (error) throw error;
    return count || 0;
  }

  async getSessionAnalytics(sessionId: string) {
    // Get total participants
    const { count: totalParticipants } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Get total polls
    const { count: totalPolls } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Get total questions
    const { count: totalQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Get total resources
    const { count: totalResources } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Get average engagement score
    const { data: avgScore } = await supabase
      .from('user_engagement_scores')
      .select('total_score')
      .eq('session_id', sessionId);

    const averageScore = avgScore?.length 
      ? avgScore.reduce((sum, score) => sum + score.total_score, 0) / avgScore.length 
      : 0;

    return {
      totalParticipants: totalParticipants || 0,
      totalPolls: totalPolls || 0,
      totalQuestions: totalQuestions || 0,
      totalResources: totalResources || 0,
      averageEngagementScore: Math.round(averageScore),
      activeParticipants: avgScore?.length || 0
    };
  }

  async getUserEngagementScore(userId: string, sessionId: string): Promise<UserEngagementScore | null> {
    const { data, error } = await supabase
      .from('engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (error) throw error;
    if (!data || data.length === 0) return {
      id: '',
      user_id: userId,
      session_id: sessionId,
      total_score: 0,
      attendance_score: 0,
      poll_score: 0,
      qna_score: 0,
      resource_score: 0,
      last_updated: new Date().toISOString(),
    };

    let attendance_score = 0, poll_score = 0, qna_score = 0, resource_score = 0, total_score = 0;
    let last_updated = data[0].created_at;
    data.forEach((row: any) => {
      switch (row.activity_type) {
        case 'attendance': attendance_score += row.score; break;
        case 'poll': poll_score += row.score; break;
        case 'qna': qna_score += row.score; break;
        case 'resource': resource_score += row.score; break;
        default: break;
      }
      total_score += row.score;
      if (row.created_at > last_updated) last_updated = row.created_at;
    });
    return {
      id: '',
      user_id: userId,
      session_id: sessionId,
      total_score,
      attendance_score,
      poll_score,
      qna_score,
      resource_score,
      last_updated,
    };
  }

  async getSessionLeaderboard(sessionId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('engagement_metrics')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const userMap: Record<string, any> = {};
    data.forEach((row: any) => {
      if (!userMap[row.user_id]) {
        userMap[row.user_id] = {
          user_id: row.user_id,
          users: row.users,
          total_score: 0,
          attendance_score: 0,
          poll_score: 0,
          qna_score: 0,
          resource_score: 0,
          last_updated: row.created_at,
        };
      }
      switch (row.activity_type) {
        case 'attendance': userMap[row.user_id].attendance_score += row.score; break;
        case 'poll': userMap[row.user_id].poll_score += row.score; break;
        case 'qna': userMap[row.user_id].qna_score += row.score; break;
        case 'resource': userMap[row.user_id].resource_score += row.score; break;
        default: break;
      }
      userMap[row.user_id].total_score += row.score;
      if (row.created_at > userMap[row.user_id].last_updated) userMap[row.user_id].last_updated = row.created_at;
    });

    const leaderboard = Object.values(userMap)
      .sort((a: any, b: any) => b.total_score - a.total_score)
      .slice(0, limit)
      .map((entry: any, idx: number) => ({ ...entry, rank: idx + 1 }));

    return leaderboard;
  }

  async getUserEngagementMetrics(userId: string, sessionId: string) {
    const { data, error } = await supabase
      .from('engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Game Challenge Methods
  async getAvailableGames(sessionId: string): Promise<GameChallenge[]> {
    // In a real implementation, this would fetch from the database
    // For now, return the in-memory games
    return this.gameChallenges.filter(game => 
      (game.session_id === 'all' || game.session_id === sessionId) && game.is_active
    );
  }

  async startGameChallenge(gameId: string, userId: string, sessionId: string): Promise<{success: boolean; game?: GameChallenge}> {
    const game = this.gameChallenges.find(g => g.id === gameId);
    if (!game) {
      return { success: false };
    }

    // Record game start
    await this.recordEngagement(
      userId,
      sessionId,
      'game_started',
      gameId,
      { game_type: game.type }
    );

    return { success: true, game };
  }

  async completeGameChallenge(
    gameId: string, 
    userId: string, 
    sessionId: string, 
    isSuccess: boolean, 
    timeTaken: number,
    answer?: string
  ): Promise<{success: boolean; pointsEarned: number}> {
    const game = this.gameChallenges.find(g => g.id === gameId);
    if (!game) {
      return { success: false, pointsEarned: 0 };
    }

    const pointsEarned = isSuccess ? game.points : 0;
    
    // Record game completion
    await this.recordEngagement(
      userId,
      sessionId,
      'game_completed',
      gameId,
      { 
        game_type: game.type,
        points_earned: pointsEarned,
        is_success: isSuccess,
        time_taken: timeTaken,
        answer
      }
    );

    return { success: true, pointsEarned };
  }

  // Real-time subscriptions
  subscribeToSessionActivities(sessionId: string, callback: (activity: any) => void) {
    const subscription = supabase
      .channel(`session_${sessionId}_activities`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'engagement_metrics',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  subscribeToEngagementUpdates(sessionId: string, callback: (update: any) => void) {
    return supabase
      .channel(`engagement-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_engagement_scores',
          filter: `session_id=eq.${sessionId}`
        },
        callback
      )
      .subscribe();
  }
}

export const engagementService = new EngagementService();
