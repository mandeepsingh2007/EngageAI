import { supabase } from './supabaseClient';

export interface SessionInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'celebration' | 'trend';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  icon: string;
  color: string;
  timestamp: string;
  targetRole: 'organizer' | 'participant' | 'both';
  actionable: boolean;
  metadata?: any;
}

export interface EngagementMetrics {
  sessionHealth: number; // 0-100
  participationRate: number; // 0-100
  engagementVelocity: number; // actions per minute
  attentionSpan: number; // average time between actions
  momentumScore: number; // trending engagement
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ParticipantAnalysis {
  userId: string;
  engagementLevel: 'low' | 'medium' | 'high' | 'superstar';
  recentActivity: number; // last 5 minutes
  streak: number; // consecutive active minutes
  momentum: 'rising' | 'stable' | 'declining';
  riskOfDropoff: boolean;
  suggestedActions: string[];
}

class SmartAnalyticsEngine {
  private sessionStartTime: Map<string, number> = new Map();
  private lastAnalysis: Map<string, number> = new Map();
  private insightHistory: Map<string, SessionInsight[]> = new Map();

  // Initialize session tracking
  initializeSession(sessionId: string) {
    this.sessionStartTime.set(sessionId, Date.now());
    this.lastAnalysis.set(sessionId, Date.now());
    this.insightHistory.set(sessionId, []);
  }

  // Main analysis function
  async analyzeSession(sessionId: string): Promise<{
    metrics: EngagementMetrics;
    insights: SessionInsight[];
    participants: ParticipantAnalysis[];
  }> {
    const now = Date.now();
    const sessionStart = this.sessionStartTime.get(sessionId) || now;
    const sessionDuration = (now - sessionStart) / 1000 / 60; // minutes

    // Get recent engagement data
    const engagementData = await this.getRecentEngagementData(sessionId);
    const participantData = await this.getParticipantActivity(sessionId);
    
    // Get organizer activity data
    const organizerActivity = await this.getOrganizerActivity(sessionId);
    
    // Get session details for topic-based recommendations
    const sessionDetails = await this.getSessionDetails(sessionId);

    // Calculate core metrics
    const metrics = await this.calculateEngagementMetrics(engagementData, sessionDuration, sessionId, organizerActivity);
    
    // Analyze individual participants
    const participants = this.analyzeParticipants(participantData, sessionDuration);
    
    // Generate smart insights
    const insights = await this.generateInsights(metrics, participants, sessionDuration, sessionId, organizerActivity, sessionDetails);

    return { metrics, insights, participants };
  }

  private async getRecentEngagementData(sessionId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('engagement_metrics')
      .select('*')
      .eq('session_id', sessionId)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent engagement data:', error);
      return [];
    }

    return data || [];
  }

  private async getParticipantActivity(sessionId: string) {
    const { data, error } = await supabase
      .from('engagement_metrics')
      .select('user_id, activity_type, score, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching participant activity:', error);
      return [];
    }

    return data || [];
  }

  // Get organizer activity (polls created, questions posted, resources shared)
  private async getOrganizerActivity(sessionId: string) {
    try {
      const [polls, questions, resources] = await Promise.all([
        supabase.from('polls').select('created_at, created_by').eq('session_id', sessionId).order('created_at', { ascending: false }),
        supabase.from('questions').select('created_at, user_id').eq('session_id', sessionId).order('created_at', { ascending: false }),
        supabase.from('resources').select('created_at, created_by').eq('session_id', sessionId).order('created_at', { ascending: false })
      ]);

      const activities = [
        ...(polls.data || []).map(p => ({ type: 'poll', created_at: p.created_at, user_id: p.created_by })),
        ...(questions.data || []).map(q => ({ type: 'question', created_at: q.created_at, user_id: q.user_id })),
        ...(resources.data || []).map(r => ({ type: 'resource', created_at: r.created_at, user_id: r.created_by }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return activities;
    } catch (error) {
      console.error('Error fetching organizer activity:', error);
      return [];
    }
  }

  // Get session details for topic-based recommendations
  private async getSessionDetails(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('title, description, organizer_id')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session details:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching session details:', error);
      return null;
    }
  }

  private async calculateEngagementMetrics(engagementData: any[], sessionDuration: number, sessionId: string, organizerActivity: any[] = []): Promise<EngagementMetrics> {
    // Get total participants for this session
    const { data: sessionParticipants } = await supabase
      .from('engagement_metrics')
      .select('user_id')
      .eq('session_id', sessionId);
    
    const totalParticipants = new Set(sessionParticipants?.map(e => e.user_id) || []).size;
    const recentActions = engagementData.length;
    const activeParticipants = new Set(engagementData.map(e => e.user_id)).size;
    
    // Session Health (0-100) - based on recent activity vs expected, with organizer activity factor
    let sessionHealth = 0;
    if (totalParticipants > 0) {
      const expectedActionsPerParticipant = sessionDuration > 30 ? 2 : 1;
      const expectedActions = totalParticipants * expectedActionsPerParticipant;
      let baseHealth = Math.min((recentActions / Math.max(expectedActions, 1)) * 100, 100);
      
      // Factor in organizer activity - if organizer is inactive, gradually reduce health
      const recentOrganizerActivity = organizerActivity.filter(a => 
        new Date(a.created_at) > new Date(Date.now() - 10 * 60 * 1000) // last 10 minutes
      ).length;
      
      const organizerActivityFactor = sessionDuration > 10 ? 
        Math.min(recentOrganizerActivity / Math.max(sessionDuration / 10, 1), 1) : 1;
      
      // Gradual degradation instead of immediate drop
      if (baseHealth < 30 && organizerActivityFactor < 0.5) {
        sessionHealth = Math.max(baseHealth * 0.7, 15); // minimum 15% to avoid complete zero
      } else {
        sessionHealth = baseHealth * (0.7 + 0.3 * organizerActivityFactor);
      }
    } else {
      // If no participants yet, base health on organizer preparation
      const recentOrganizerActivity = organizerActivity.filter(a => 
        new Date(a.created_at) > new Date(Date.now() - 5 * 60 * 1000)
      ).length;
      sessionHealth = Math.min(recentOrganizerActivity * 25, 75); // max 75% without participants
    }

    // Participation Rate - percentage of total participants active recently
    const participationRate = totalParticipants > 0 ? (activeParticipants / totalParticipants) * 100 : 0;

    // Engagement Velocity - actions per minute in last 5 minutes
    const engagementVelocity = recentActions / 5;

    // Attention Span - calculate from actual time gaps between actions
    let attentionSpan = 60; // default
    if (engagementData.length > 1) {
      const timeGaps = [];
      for (let i = 0; i < engagementData.length - 1; i++) {
        const gap = (new Date(engagementData[i].created_at).getTime() - 
                    new Date(engagementData[i + 1].created_at).getTime()) / 1000;
        if (gap > 0 && gap < 600) timeGaps.push(gap); // ignore gaps > 10 minutes
      }
      if (timeGaps.length > 0) {
        attentionSpan = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
      }
    }

    // Momentum Score - compare recent vs older activity
    const recentScore = engagementData.slice(0, Math.min(10, engagementData.length)).reduce((sum, e) => sum + (e.score || 0), 0);
    const olderScore = engagementData.slice(10, Math.min(20, engagementData.length)).reduce((sum, e) => sum + (e.score || 0), 0);
    let momentumScore = 50; // neutral
    if (olderScore > 0) {
      momentumScore = Math.min((recentScore / olderScore) * 50, 100);
    } else if (recentScore > 0) {
      momentumScore = 75; // positive momentum if only recent activity
    }

    // Risk Level based on multiple factors
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (sessionHealth < 25 || (participationRate < 20 && totalParticipants > 1)) {
      riskLevel = 'high';
    } else if (sessionHealth < 50 || participationRate < 40) {
      riskLevel = 'medium';
    }

    return {
      sessionHealth: Math.round(Math.max(0, sessionHealth)),
      participationRate: Math.round(Math.max(0, participationRate)),
      engagementVelocity: Math.round(engagementVelocity * 10) / 10,
      attentionSpan: Math.round(attentionSpan),
      momentumScore: Math.round(Math.max(0, momentumScore)),
      riskLevel
    };
  }

  private analyzeParticipants(participantData: any[], sessionDuration: number): ParticipantAnalysis[] {
    const userMap: { [userId: string]: any[] } = {};
    
    // Group by user
    participantData.forEach(entry => {
      if (!userMap[entry.user_id]) userMap[entry.user_id] = [];
      userMap[entry.user_id].push(entry);
    });

    return Object.entries(userMap).map(([userId, activities]) => {
      const recentActivities = activities.filter(a => 
        new Date(a.created_at) > new Date(Date.now() - 5 * 60 * 1000)
      );
      
      const totalScore = activities.reduce((sum, a) => sum + a.score, 0);
      const recentActivity = recentActivities.length;
      
      // Engagement Level
      let engagementLevel: 'low' | 'medium' | 'high' | 'superstar' = 'low';
      if (totalScore > 100) engagementLevel = 'superstar';
      else if (totalScore > 50) engagementLevel = 'high';
      else if (totalScore > 20) engagementLevel = 'medium';

      // Streak calculation (simulated)
      const streak = Math.min(Math.floor(totalScore / 10), 30);

      // Momentum
      const oldActivities = activities.filter(a => 
        new Date(a.created_at) < new Date(Date.now() - 5 * 60 * 1000)
      ).length;
      let momentum: 'rising' | 'stable' | 'declining' = 'stable';
      if (recentActivity > oldActivities) momentum = 'rising';
      else if (recentActivity < oldActivities && oldActivities > 0) momentum = 'declining';

      // Risk of dropoff
      const riskOfDropoff = recentActivity === 0 && activities.length > 0;

      // Suggested actions
      const suggestedActions = this.generateParticipantSuggestions(
        engagementLevel, 
        recentActivity, 
        totalScore,
        momentum
      );

      return {
        userId,
        engagementLevel,
        recentActivity,
        streak,
        momentum,
        riskOfDropoff,
        suggestedActions
      };
    });
  }

  private generateParticipantSuggestions(
    level: string, 
    recentActivity: number, 
    totalScore: number,
    momentum: string
  ): string[] {
    const suggestions: string[] = [];

    if (level === 'low') {
      suggestions.push("Ask a question to get started");
      suggestions.push("Participate in the next poll");
    } else if (level === 'medium') {
      suggestions.push("You're doing great! Keep the momentum going");
      suggestions.push("Try downloading a resource for extra points");
    } else if (level === 'high') {
      suggestions.push("You're a top performer! Help others by answering questions");
      suggestions.push("Share your insights in the discussion");
    } else {
      suggestions.push("Amazing engagement! You're setting the standard");
      suggestions.push("Consider becoming a session ambassador");
    }

    if (momentum === 'declining') {
      suggestions.push("Jump back in - the discussion is heating up!");
    }

    return suggestions;
  }

  private async generateInsights(
    metrics: EngagementMetrics, 
    participants: ParticipantAnalysis[], 
    sessionDuration: number,
    sessionId: string,
    organizerActivity: any[] = [],
    sessionDetails: any = null
  ): Promise<SessionInsight[]> {
    const insights: SessionInsight[] = [];
    const now = new Date().toISOString();
    
    // Check organizer activity patterns
    const recentOrganizerActivity = organizerActivity.filter(a => 
      new Date(a.created_at) > new Date(Date.now() - 5 * 60 * 1000) // last 5 minutes
    );
    
    const lastOrganizerActivity = organizerActivity.length > 0 ? 
      new Date(organizerActivity[0].created_at) : null;
    
    const timeSinceLastOrganizerActivity = lastOrganizerActivity ? 
      (Date.now() - lastOrganizerActivity.getTime()) / 1000 : Infinity;
    
    // Check participant response times
    const unresponsiveParticipants = participants.filter(p => 
      p.recentActivity === 0 && !p.riskOfDropoff
    );
    
    // Generate topic-based recommendations
    const topicRecommendations = this.getTopicBasedRecommendations(sessionDetails);

    // ORGANIZER ACTIVITY ALERTS
    if (timeSinceLastOrganizerActivity > 300) { // 5 minutes
      insights.push({
        id: `organizer-inactive-${Date.now()}`,
        type: 'alert',
        priority: 'urgent',
        title: 'Organizer Action Needed',
        message: `No organizer activity for ${Math.round(timeSinceLastOrganizerActivity / 60)} minutes. Participants need your engagement!`,
        icon: '👨‍🏫',
        color: 'orange',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    }
    
    if (recentOrganizerActivity.length === 0 && sessionDuration > 10) {
      insights.push({
        id: `organizer-engagement-${Date.now()}`,
        type: 'recommendation',
        priority: 'high',
        title: 'Boost Session Energy',
        message: topicRecommendations.immediate[0] || 'Create a poll or ask an engaging question to re-energize participants.',
        icon: '🚀',
        color: 'blue',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    }

    // PARTICIPANT RESPONSE TIME ALERTS
    if (unresponsiveParticipants.length > participants.length * 0.3) {
      insights.push({
        id: `participants-unresponsive-${Date.now()}`,
        type: 'alert',
        priority: 'medium',
        title: 'Participants Not Responding',
        message: `${unresponsiveParticipants.length} participants haven't engaged recently. Try: ${topicRecommendations.engagement[0] || 'asking direct questions or creating interactive content'}.`,
        icon: '💤',
        color: 'yellow',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    }

    // SESSION HEALTH INSIGHTS
    if (metrics.riskLevel === 'high') {
      insights.push({
        id: `health-${Date.now()}`,
        type: 'alert',
        priority: 'urgent',
        title: 'Critical: Low Engagement',
        message: `Session health at ${metrics.sessionHealth}%. ${topicRecommendations.urgent[0] || 'Launch an interactive poll immediately!'}`,
        icon: '🚨',
        color: 'red',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    } else if (metrics.riskLevel === 'medium') {
      insights.push({
        id: `health-medium-${Date.now()}`,
        type: 'recommendation',
        priority: 'medium',
        title: 'Engagement Opportunity',
        message: `Session health at ${metrics.sessionHealth}%. ${topicRecommendations.medium[0] || 'Add more interactive elements to boost participation.'}`,
        icon: '📈',
        color: 'orange',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    } else if (metrics.sessionHealth > 80) {
      insights.push({
        id: `health-excellent-${Date.now()}`,
        type: 'celebration',
        priority: 'low',
        title: 'Excellent Engagement!',
        message: `Amazing ${metrics.sessionHealth}% session health! ${topicRecommendations.success[0] || 'Perfect time for advanced topics or deeper discussions.'}`,
        icon: '🎉',
        color: 'green',
        timestamp: now,
        targetRole: 'organizer',
        actionable: false
      });
    }

    // PARTICIPATION RATE INSIGHTS
    if (metrics.participationRate < 30 && participants.length > 2) {
      insights.push({
        id: `participation-${Date.now()}`,
        type: 'recommendation',
        priority: 'high',
        title: 'Low Participation Rate',
        message: `Only ${Math.round(metrics.participationRate)}% active. ${topicRecommendations.participation[0] || 'Try asking: "What questions do you have so far?" or create a quick poll.'}`,
        icon: '👥',
        color: 'red',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    }

    // MOMENTUM INSIGHTS
    if (metrics.momentumScore > 75) {
      insights.push({
        id: `momentum-high-${Date.now()}`,
        type: 'celebration',
        priority: 'low',
        title: 'Great Momentum!',
        message: `Excellent momentum score of ${metrics.momentumScore}%! ${topicRecommendations.momentum[0] || 'Keep the energy flowing with advanced topics.'}`,
        icon: '🔥',
        color: 'green',
        timestamp: now,
        targetRole: 'organizer',
        actionable: false
      });
    } else if (metrics.momentumScore < 25) {
      insights.push({
        id: `momentum-low-${Date.now()}`,
        type: 'alert',
        priority: 'medium',
        title: 'Momentum Declining',
        message: `Momentum at ${metrics.momentumScore}%. ${topicRecommendations.reengage[0] || 'Re-energize with: "Let\'s try a quick knowledge check!" or share an interesting fact.'}`,
        icon: '📉',
        color: 'orange',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    }

    // TIME-BASED RECOMMENDATIONS
    if (sessionDuration > 20 && recentOrganizerActivity.length === 0) {
      insights.push({
        id: `time-based-${Date.now()}`,
        type: 'recommendation',
        priority: 'medium',
        title: 'Session Checkpoint',
        message: `${Math.round(sessionDuration)} minutes in. ${topicRecommendations.checkpoint[0] || 'Perfect time for a quick recap or Q&A break.'}`,
        icon: '⏰',
        color: 'blue',
        timestamp: now,
        targetRole: 'organizer',
        actionable: true
      });
    }

    return insights;
  }

  // Generate topic-based recommendations based on session content
  private getTopicBasedRecommendations(sessionDetails: any) {
    const title = sessionDetails?.title?.toLowerCase() || '';
    const description = sessionDetails?.description?.toLowerCase() || '';
    const content = `${title} ${description}`.toLowerCase();
    
    // Enhanced debugging
    console.log('=== TOPIC DETECTION DEBUG ===');
    console.log('Session Details:', sessionDetails);
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Combined Content:', content);
    console.log('============================');

    // Default recommendations
    const defaults = {
      immediate: ['Create an engaging poll about the current topic'],
      urgent: ['Launch a quick "Yes/No" poll to re-engage participants'],
      medium: ['Add a discussion question or share a relevant resource'],
      success: ['Dive deeper with advanced questions or case studies'],
      participation: ['Ask "What\'s your biggest question about this topic?"'],
      engagement: ['Try: "Share one word that describes your experience so far"'],
      momentum: ['Build on this energy with interactive scenarios'],
      reengage: ['Ask: "What would you like to explore next?"'],
      checkpoint: ['Time for a quick knowledge check or Q&A session']
    };

    // Topic-specific recommendations
    
    // AI/ML specific recommendations (enhanced detection)
    if (content.includes('ai') || content.includes('ml') || content.includes('aiml') || 
        content.includes('artificial intelligence') || content.includes('machine learning') ||
        content.includes('deep learning') || content.includes('neural') || content.includes('data science') ||
        content.includes('tensorflow') || content.includes('pytorch') || content.includes('sklearn') ||
        content.includes('algorithm') || content.includes('model') || content.includes('prediction')) {
      
      console.log('🤖 AI/ML TOPIC DETECTED! Using AI-specific recommendations');
      
      return {
        immediate: ['Poll: "What\'s your experience with AI/ML?" (Beginner/Intermediate/Advanced)'],
        urgent: ['Quick poll: "Supervised or Unsupervised learning?" or "Python or R for ML?"'],
        medium: ['Share an AI/ML use case or ask about real-world applications they\'ve seen'],
        success: ['Dive into advanced algorithms, model optimization, or ethical AI discussions'],
        participation: ['"What\'s the most exciting AI application you\'ve heard about?"'],
        engagement: ['"One word: What comes to mind when you hear \'AI\'?"'],
        momentum: ['Present an AI scenario: "How would you solve this with ML?"'],
        reengage: ['"What AI trend excites or worries you most?"'],
        checkpoint: ['Quick AI quiz: "What\'s the difference between AI and ML?" or share AI news']
      };
    }
    
    // General tech/programming recommendations
    if (content.includes('tech') || content.includes('programming') || content.includes('coding') ||
        content.includes('software') || content.includes('development')) {
      return {
        immediate: ['Poll: "What\'s your experience level with this technology?"'],
        urgent: ['Quick poll: "Which IDE do you prefer?" or "Tabs vs Spaces?"'],
        medium: ['Share a code snippet or ask about real-world applications'],
        success: ['Dive into advanced patterns or architecture discussions'],
        participation: ['"What\'s the biggest challenge you face with this tech?"'],
        engagement: ['"One word: How do you feel about this technology?"'],
        momentum: ['Present a coding challenge or technical scenario'],
        reengage: ['"What technology trend excites you most?"'],
        checkpoint: ['Quick tech quiz or "Show and tell" your current project']
      };
    }

    if (content.includes('business') || content.includes('marketing') || content.includes('sales')) {
      return {
        immediate: ['Poll: "What\'s your biggest business challenge?"'],
        urgent: ['Quick poll: "B2B or B2C?" or "Startup or Enterprise?"'],
        medium: ['Share a case study or ask about market experiences'],
        success: ['Explore advanced strategies or industry insights'],
        participation: ['"What\'s one business lesson you learned recently?"'],
        engagement: ['"One word: Describe your ideal customer"'],
        momentum: ['Present a business scenario or market analysis'],
        reengage: ['"What business trend worries you most?"'],
        checkpoint: ['Quick business quiz or share success stories']
      };
    }

    if (content.includes('design') || content.includes('creative') || content.includes('art')) {
      return {
        immediate: ['Poll: "What\'s your favorite design tool?"'],
        urgent: ['Quick poll: "Dark mode or Light mode?" or "Minimalist or Detailed?"'],
        medium: ['Share design inspiration or critique examples'],
        success: ['Explore advanced design principles or portfolio reviews'],
        participation: ['"What\'s your design philosophy in one sentence?"'],
        engagement: ['"One word: Describe good design"'],
        momentum: ['Present a design challenge or critique session'],
        reengage: ['"What design trend do you love or hate?"'],
        checkpoint: ['Quick design quiz or show your recent work']
      };
    }

    if (content.includes('education') || content.includes('learning') || content.includes('training') ||
        content.includes('course') || content.includes('tutorial') || content.includes('workshop')) {
      return {
        immediate: ['Poll: "What\'s your preferred learning style?"'],
        urgent: ['Quick poll: "Video or Text?" or "Theory or Practice?"'],
        medium: ['Share learning resources or discuss study methods'],
        success: ['Explore advanced pedagogical techniques'],
        participation: ['"What\'s the best lesson you\'ve learned recently?"'],
        engagement: ['"One word: Describe effective learning"'],
        momentum: ['Present a learning challenge or knowledge test'],
        reengage: ['"What skill do you want to master next?"'],
        checkpoint: ['Quick knowledge check or share learning tips']
      };
    }
    
    // Data Science specific recommendations
    if (content.includes('data') || content.includes('analytics') || content.includes('statistics') ||
        content.includes('visualization') || content.includes('pandas') || content.includes('numpy')) {
      return {
        immediate: ['Poll: "What\'s your go-to data analysis tool?" (Excel/Python/R/SQL)'],
        urgent: ['Quick poll: "Pandas or NumPy?" or "Jupyter or VS Code?"'],
        medium: ['Share a dataset example or discuss data cleaning challenges'],
        success: ['Explore advanced statistical methods or visualization techniques'],
        participation: ['"What\'s the messiest dataset you\'ve worked with?"'],
        engagement: ['"One word: Describe working with data"'],
        momentum: ['Present a data problem: "How would you analyze this?"'],
        reengage: ['"What data trend interests you most?"'],
        checkpoint: ['Quick data quiz or share interesting data insights']
      };
    }

    // If no specific topic detected, provide enhanced defaults
    console.log('⚠️ NO SPECIFIC TOPIC DETECTED - Using default recommendations');
    console.log('Content analyzed:', content);
    
    // Enhanced defaults with some AI/ML fallbacks if any tech keywords found
    if (content.includes('tech') || content.includes('computer') || content.includes('digital') || 
        content.includes('software') || content.includes('algorithm') || content.includes('code')) {
      console.log('🔧 TECH CONTENT DETECTED - Using tech-enhanced defaults');
      return {
        immediate: ['Poll: "What\'s your technical background?" or "Rate your comfort with technology"'],
        urgent: ['Quick poll: "Beginner or Advanced?" or "Theory or Hands-on practice?"'],
        medium: ['Share a practical example or ask about real-world applications'],
        success: ['Explore advanced concepts or dive into implementation details'],
        participation: ['"What\'s your biggest challenge with this technology?"'],
        engagement: ['"One word: How do you feel about learning this?"'],
        momentum: ['Present a practical scenario or challenge'],
        reengage: ['"What aspect interests you most?" or "Any questions so far?"'],
        checkpoint: ['Quick knowledge check or "What have you learned so far?"']
      };
    }
    
    return defaults;
  }

  // Get participant insights for personalized recommendations
  getParticipantInsights(userId: string, analysis: ParticipantAnalysis): SessionInsight[] {
    const insights: SessionInsight[] = [];
    const now = new Date().toISOString();

    // Check if participant hasn't responded for more than 30 seconds to recent activity
    const timeSinceLastActivity = analysis.recentActivity === 0 ? 'over 30 seconds' : 'recently';

    if (analysis.riskOfDropoff) {
      insights.push({
        id: `participant-risk-${userId}`,
        type: 'alert',
        priority: 'medium',
        title: 'Jump Back In!',
        message: `You\'ve been quiet for ${timeSinceLastActivity}. The discussion is getting interesting!`,
        icon: '👋',
        color: 'orange',
        timestamp: now,
        targetRole: 'participant',
        actionable: true
      });
    }

    if (analysis.recentActivity === 0 && !analysis.riskOfDropoff) {
      insights.push({
        id: `participant-inactive-${userId}`,
        type: 'recommendation',
        priority: 'medium',
        title: 'Stay Engaged',
        message: 'No recent activity detected. Try answering the current poll or asking a question!',
        icon: '💡',
        color: 'blue',
        timestamp: now,
        targetRole: 'participant',
        actionable: true
      });
    }

    if (analysis.engagementLevel === 'superstar') {
      insights.push({
        id: `participant-superstar-${userId}`,
        type: 'celebration',
        priority: 'low',
        title: 'You\'re on Fire! 🔥',
        message: 'Amazing engagement! You\'re setting the standard for others.',
        icon: '⭐',
        color: 'gold',
        timestamp: now,
        targetRole: 'participant',
        actionable: false
      });
    }

    return insights;
  }
}

export const smartAnalytics = new SmartAnalyticsEngine();
