import { smartAnalytics, SessionInsight, EngagementMetrics, ParticipantAnalysis } from './smartAnalytics';
import { engagementService } from './engagementService';

export interface SessionIntelligence {
  sessionId: string;
  metrics: EngagementMetrics;
  organizerInsights: SessionInsight[];
  participantInsights: SessionInsight[];
  topPerformers: ParticipantAnalysis[];
  atRiskParticipants: ParticipantAnalysis[];
  recommendations: {
    immediate: string[];
    strategic: string[];
  };
  lastUpdated: string;
}

class SessionIntelligenceService {
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private intelligenceCache: Map<string, SessionIntelligence> = new Map();

  // Start real-time intelligence for a session
  startIntelligenceTracking(sessionId: string, updateCallback?: (intelligence: SessionIntelligence) => void) {
    // Initialize the session in analytics
    smartAnalytics.initializeSession(sessionId);

    // Set up periodic analysis (every 30 seconds)
    const interval = setInterval(async () => {
      try {
        const intelligence = await this.generateSessionIntelligence(sessionId);
        this.intelligenceCache.set(sessionId, intelligence);
        
        if (updateCallback) {
          updateCallback(intelligence);
        }
      } catch (error) {
        console.error('Error updating session intelligence:', error);
      }
    }, 30000); // Update every 30 seconds

    this.updateIntervals.set(sessionId, interval);

    // Generate initial intelligence
    this.generateSessionIntelligence(sessionId).then(intelligence => {
      this.intelligenceCache.set(sessionId, intelligence);
      if (updateCallback) {
        updateCallback(intelligence);
      }
    });
  }

  // Stop intelligence tracking
  stopIntelligenceTracking(sessionId: string) {
    const interval = this.updateIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(sessionId);
    }
    this.intelligenceCache.delete(sessionId);
  }

  // Get current intelligence for a session
  async getSessionIntelligence(sessionId: string): Promise<SessionIntelligence> {
    const cached = this.intelligenceCache.get(sessionId);
    if (cached) {
      return cached;
    }

    return await this.generateSessionIntelligence(sessionId);
  }

  // Generate comprehensive session intelligence with enhanced organizer tracking
  async generateSessionIntelligence(sessionId: string): Promise<SessionIntelligence> {
    try {
      const analysis = await smartAnalytics.analyzeSession(sessionId);
      
      // Get top performers and at-risk participants
      const topPerformers = analysis.participants
        .filter(p => p.engagementLevel === 'high' || p.engagementLevel === 'superstar')
        .sort((a, b) => b.recentActivity - a.recentActivity)
        .slice(0, 5);
      
      const atRiskParticipants = analysis.participants
        .filter(p => p.riskOfDropoff || p.momentum === 'declining')
        .slice(0, 5);
      
      // Generate enhanced actionable recommendations
      const recommendations = this.generateEnhancedRecommendations(analysis.metrics, analysis.participants, analysis.insights);
      
      return {
        sessionId,
        metrics: analysis.metrics,
        organizerInsights: analysis.insights, // Now includes organizer activity tracking
        participantInsights: [], // Will be populated per-user
        topPerformers,
        atRiskParticipants,
        recommendations,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating session intelligence:', error);
      
      // Return basic intelligence structure on error
      return {
        sessionId,
        metrics: {
          sessionHealth: 0,
          participationRate: 0,
          engagementVelocity: 0,
          attentionSpan: 60,
          momentumScore: 0,
          riskLevel: 'high'
        },
        organizerInsights: [{
          id: 'error-insight',
          type: 'alert',
          priority: 'medium',
          title: 'Analysis Error',
          message: 'Unable to analyze session data. Please check your connection.',
          icon: '⚠️',
          color: 'orange',
          timestamp: new Date().toISOString(),
          targetRole: 'organizer',
          actionable: false
        }],
        participantInsights: [],
        topPerformers: [],
        atRiskParticipants: [],
        recommendations: {
          immediate: ['Check session connectivity'],
          strategic: ['Review session setup']
        },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Generate enhanced actionable recommendations based on insights and activity patterns
  private generateEnhancedRecommendations(
    metrics: EngagementMetrics, 
    participants: ParticipantAnalysis[],
    insights: SessionInsight[]
  ): {
    immediate: string[];
    strategic: string[];
  } {
    const immediate: string[] = [];
    const strategic: string[] = [];

    // Extract actionable insights for immediate recommendations
    const actionableInsights = insights.filter(insight => insight.actionable && insight.priority !== 'low');
    
    actionableInsights.forEach(insight => {
      if (insight.priority === 'urgent' || insight.priority === 'high') {
        // Extract actionable text from insight messages
        if (insight.message.includes('poll')) {
          immediate.push('📊 Create an interactive poll now');
        } else if (insight.message.includes('question')) {
          immediate.push('❓ Ask an engaging question to the group');
        } else if (insight.message.includes('activity')) {
          immediate.push('🎯 Launch an interactive activity');
        } else {
          immediate.push(`📝 ${insight.title}`); // Use title as fallback
        }
      }
    });

    // Organizer activity-based recommendations
    const organizerAlerts = insights.filter(i => i.id.includes('organizer'));
    if (organizerAlerts.length > 0) {
      immediate.push('👨‍🏫 Increase organizer engagement with participants');
      immediate.push('✨ Create new content or activities');
    }

    // Participant response time recommendations with topic-specific strategies
    const unresponsiveAlerts = insights.filter(i => i.id.includes('unresponsive'));
    if (unresponsiveAlerts.length > 0) {
      // Get topic-specific engagement strategies from the first insight message
      const topicStrategy = insights.find(i => i.message.includes('Try:'))?.message.split('Try: ')[1] || null;
      
      if (topicStrategy) {
        immediate.push(`🎯 ${topicStrategy}`);
      } else {
        immediate.push('🎯 Use direct engagement techniques');
      }
      immediate.push('👋 Try "raise your hand" or "type in chat" prompts');
      
      // Add specific AI/ML engagement if detected
      const hasAIContent = insights.some(i => 
        i.message.toLowerCase().includes('ai') || 
        i.message.toLowerCase().includes('ml') || 
        i.message.toLowerCase().includes('machine learning')
      );
      
      if (hasAIContent) {
        immediate.push('🤖 Try: "What AI tool have you used recently?" or "Share an AI experience"');
        immediate.push('📊 Create poll: "Which is more important: Data Quality or Algorithm Choice?"');
      }
    }

    // Strategic recommendations based on patterns
    if (metrics.riskLevel === 'high') {
      strategic.push('🔄 Review session structure and pacing');
      strategic.push('🎆 Prepare more interactive backup content');
    }

    if (participants.filter(p => p.riskOfDropoff).length > participants.length * 0.3) {
      strategic.push('⏱️ Consider shorter content segments');
      strategic.push('📍 Implement regular engagement checkpoints');
    }

    if (metrics.attentionSpan > 90) {
      strategic.push('📅 Break content into 5-10 minute chunks');
      strategic.push('🎮 Add interactive elements every few minutes');
    }

    // Momentum-based strategic advice
    if (metrics.momentumScore < 25) {
      strategic.push('🔄 Redesign session flow for better engagement');
      strategic.push('🎨 Add more variety in content delivery methods');
    }

    // Default recommendations if none triggered - check for topic context
    if (immediate.length === 0) {
      // Check if this is an AI/ML session for better defaults
      const hasAIInsights = insights.some(i => 
        i.message.toLowerCase().includes('ai') || 
        i.message.toLowerCase().includes('ml') ||
        i.message.toLowerCase().includes('machine learning') ||
        i.message.toLowerCase().includes('data science')
      );
      
      if (hasAIInsights) {
        immediate.push('🤖 Ask: "What\'s your biggest AI/ML question?"');
        immediate.push('📊 Create poll: "Supervised vs Unsupervised learning preference?"');
      } else {
        immediate.push('🚀 Maintain current engagement momentum');
        immediate.push('💬 Consider introducing new discussion topics');
      }
    }

    if (strategic.length === 0) {
      strategic.push('📈 Continue monitoring real-time engagement patterns');
      strategic.push('🎯 Develop contingency plans for engagement drops');
    }

    return { immediate, strategic };
  }

  // Get personalized insights for a specific participant
  async getParticipantPersonalInsights(sessionId: string, userId: string): Promise<SessionInsight[]> {
    const analysis = await smartAnalytics.analyzeSession(sessionId);
    const userAnalysis = analysis.participants.find(p => p.userId === userId);
    
    if (!userAnalysis) {
      return [];
    }

    return smartAnalytics.getParticipantInsights(userId, userAnalysis);
  }



  // Get session health summary for quick overview
  getSessionHealthSummary(metrics: EngagementMetrics): {
    status: 'excellent' | 'good' | 'needs_attention' | 'critical';
    message: string;
    color: string;
    icon: string;
  } {
    const health = metrics.sessionHealth;
    const participation = metrics.participationRate;
    
    if (health >= 80 && participation >= 70) {
      return {
        status: 'excellent',
        message: 'Session is thriving! Participants are highly engaged.',
        color: 'green',
        icon: '🚀'
      };
    } else if (health >= 60 && participation >= 50) {
      return {
        status: 'good',
        message: 'Good engagement levels. Keep the momentum going.',
        color: 'blue',
        icon: '👍'
      };
    } else if (health >= 40 || participation >= 30) {
      return {
        status: 'needs_attention',
        message: 'Engagement is declining. Consider interactive elements.',
        color: 'orange',
        icon: '⚠️'
      };
    } else {
      return {
        status: 'critical',
        message: 'Low engagement detected. Immediate action recommended.',
        color: 'red',
        icon: '🚨'
      };
    }
  }


}

export const sessionIntelligence = new SessionIntelligenceService();
