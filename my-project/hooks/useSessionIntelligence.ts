import { useState, useEffect, useCallback } from 'react';
import { sessionIntelligence, SessionIntelligence } from '@/lib/sessionIntelligence';
import { SessionInsight } from '@/lib/smartAnalytics';

export interface UseSessionIntelligenceOptions {
  sessionId: string;
  userId?: string;
  userRole: 'organizer' | 'participant';
  autoStart?: boolean;
  updateInterval?: number;
}

export interface SessionIntelligenceState {
  intelligence: SessionIntelligence | null;
  personalInsights: SessionInsight[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useSessionIntelligence({
  sessionId,
  userId,
  userRole,
  autoStart = true,
  updateInterval = 30000
}: UseSessionIntelligenceOptions) {
  const [state, setState] = useState<SessionIntelligenceState>({
    intelligence: null,
    personalInsights: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const [isTracking, setIsTracking] = useState(false);

  // Update intelligence data
  const updateIntelligence = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const intelligence = await sessionIntelligence.getSessionIntelligence(sessionId);
      
      let personalInsights: SessionInsight[] = [];
      if (userId && userRole === 'participant') {
        personalInsights = await sessionIntelligence.getParticipantPersonalInsights(sessionId, userId);
      }

      setState({
        intelligence,
        personalInsights,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating session intelligence:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load intelligence'
      }));
    }
  }, [sessionId, userId, userRole]);

  // Start intelligence tracking
  const startTracking = useCallback(() => {
    if (isTracking) return;

    sessionIntelligence.startIntelligenceTracking(sessionId, (intelligence) => {
      setState(prev => ({
        ...prev,
        intelligence,
        lastUpdated: new Date(),
        isLoading: false
      }));
    });

    setIsTracking(true);
  }, [sessionId, isTracking]);

  // Stop intelligence tracking
  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    sessionIntelligence.stopIntelligenceTracking(sessionId);
    setIsTracking(false);
  }, [sessionId, isTracking]);

  // Manual refresh
  const refresh = useCallback(() => {
    updateIntelligence();
  }, [updateIntelligence]);



  // Auto-start tracking on mount
  useEffect(() => {
    if (autoStart) {
      startTracking();
      updateIntelligence();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [autoStart, startTracking, updateIntelligence, stopTracking, isTracking]);

  // Derived state for easy access
  const insights = state.intelligence ? (
    userRole === 'organizer' 
      ? state.intelligence.organizerInsights 
      : [...state.intelligence.participantInsights, ...state.personalInsights]
  ) : [];

  const metrics = state.intelligence?.metrics;
  const recommendations = state.intelligence?.recommendations;
  const topPerformers = state.intelligence?.topPerformers || [];
  const atRiskParticipants = state.intelligence?.atRiskParticipants || [];

  const sessionHealthSummary = metrics 
    ? sessionIntelligence.getSessionHealthSummary(metrics)
    : null;

  // Helper functions
  const getInsightsByPriority = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    return insights.filter(insight => insight.priority === priority);
  };

  const getInsightsByType = (type: 'recommendation' | 'alert' | 'celebration' | 'trend') => {
    return insights.filter(insight => insight.type === type);
  };

  const hasUrgentInsights = insights.some(insight => insight.priority === 'urgent');
  const hasActionableInsights = insights.some(insight => insight.actionable);

  return {
    // Core state
    ...state,
    isTracking,

    // Derived data
    insights,
    metrics,
    recommendations,
    topPerformers,
    atRiskParticipants,
    sessionHealthSummary,

    // Helper functions
    getInsightsByPriority,
    getInsightsByType,
    hasUrgentInsights,
    hasActionableInsights,

    // Actions
    startTracking,
    stopTracking,
    refresh
  };
}

// Additional hook for just session health monitoring
export function useSessionHealth(sessionId: string) {
  const { metrics, sessionHealthSummary, isLoading } = useSessionIntelligence({
    sessionId,
    userRole: 'organizer',
    autoStart: true
  });

  return {
    health: metrics?.sessionHealth || 0,
    participationRate: metrics?.participationRate || 0,
    riskLevel: metrics?.riskLevel || 'low',
    summary: sessionHealthSummary,
    isLoading
  };
}

// Hook for participant-specific intelligence
export function useParticipantIntelligence(sessionId: string, userId: string) {
  const intelligence = useSessionIntelligence({
    sessionId,
    userId,
    userRole: 'participant',
    autoStart: true
  });

  const myAnalysis = intelligence.intelligence?.topPerformers.find(p => p.userId === userId) ||
                    intelligence.intelligence?.atRiskParticipants.find(p => p.userId === userId);

  return {
    ...intelligence,
    myEngagementLevel: myAnalysis?.engagementLevel || 'low',
    myStreak: myAnalysis?.streak || 0,
    myMomentum: myAnalysis?.momentum || 'stable',
    isAtRisk: myAnalysis?.riskOfDropoff || false,
    mySuggestions: myAnalysis?.suggestedActions || []
  };
}
