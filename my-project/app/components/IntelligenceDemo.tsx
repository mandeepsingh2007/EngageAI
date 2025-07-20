"use client";
import { useState } from 'react';
import { useSessionIntelligence } from '@/hooks/useSessionIntelligence';
import { Brain, TrendingUp, Users, AlertTriangle, Lightbulb, Trophy } from 'lucide-react';

interface IntelligenceDemoProps {
  sessionId: string;
  userId: string;
  userRole: 'organizer' | 'participant';
}

export default function IntelligenceDemo({ sessionId, userId, userRole }: IntelligenceDemoProps) {
  const [demoMode, setDemoMode] = useState(false);
  
  const {
    intelligence,
    insights = [],
    metrics,
    recommendations,
    sessionHealthSummary,
    isLoading,
    error,
    lastUpdated,
    hasUrgentInsights,
    getInsightsByType,
    getInsightsByPriority
  } = useSessionIntelligence({
    sessionId,
    userId,
    userRole,
    autoStart: !demoMode
  });
  
  // Mock demo scenario data
  const handleDemoScenario = (scenario: 'low' | 'medium' | 'high') => {
    console.log(`Demo scenario loaded: ${scenario}`);
    // In a real implementation, this would load demo data
  };
  
  // Mock event simulation
  const handleSimulateEvent = (eventType: 'poll_response' | 'question_asked' | 'resource_download') => {
    console.log(`Simulated event: ${eventType}`);
    // In a real implementation, this would simulate an event
  };

  // Demo scenario handler is now defined above

  if (isLoading && !intelligence) {
    return (
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center">
          <Brain className="w-8 h-8 text-blue-400 animate-pulse mr-3" />
          <span className="text-white">Analyzing session intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/30">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
          <span className="text-red-200">Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Brain className="w-7 h-7 mr-3 text-blue-400" />
            Session Intelligence
          </h2>
          {lastUpdated && (
            <span className="text-gray-400 text-sm">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Demo Controls */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-white font-semibold mb-3">🎮 Demo Controls</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => handleDemoScenario('low')}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Low Engagement
            </button>
            <button
              onClick={() => handleDemoScenario('medium')}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
            >
              Medium Engagement
            </button>
            <button
              onClick={() => handleDemoScenario('high')}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              High Engagement
            </button>
          </div>
          
          {userRole === 'participant' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateEvent('poll_response')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Simulate Poll Response
              </button>
              <button
                onClick={() => handleSimulateEvent('question_asked')}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
              >
                Simulate Question
              </button>
              <button
                onClick={() => handleSimulateEvent('resource_download')}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
              >
                Simulate Download
              </button>
            </div>
          )}
        </div>

        {/* Session Health Summary */}
        {sessionHealthSummary && (
          <div className={`p-4 rounded-lg border-2 ${
            sessionHealthSummary.status === 'excellent' ? 'bg-green-500/20 border-green-500/50' :
            sessionHealthSummary.status === 'good' ? 'bg-blue-500/20 border-blue-500/50' :
            sessionHealthSummary.status === 'needs_attention' ? 'bg-orange-500/20 border-orange-500/50' :
            'bg-red-500/20 border-red-500/50'
          }`}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">{sessionHealthSummary.icon}</span>
              <div>
                <h3 className="text-white font-semibold capitalize">
                  {sessionHealthSummary.status.replace('_', ' ')}
                </h3>
                <p className="text-gray-300 text-sm">{sessionHealthSummary.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Live Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {metrics.sessionHealth}%
              </div>
              <div className="text-gray-400 text-sm">Session Health</div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${metrics.sessionHealth}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {metrics.participationRate}%
              </div>
              <div className="text-gray-400 text-sm">Participation</div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${metrics.participationRate}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {metrics.engagementVelocity}
              </div>
              <div className="text-gray-400 text-sm">Actions/Min</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">
                {metrics.attentionSpan}s
              </div>
              <div className="text-gray-400 text-sm">Attention Span</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {metrics.momentumScore}
              </div>
              <div className="text-gray-400 text-sm">Momentum</div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                metrics.riskLevel === 'low' ? 'text-green-400' :
                metrics.riskLevel === 'medium' ? 'text-orange-400' : 'text-red-400'
              }`}>
                {metrics.riskLevel.toUpperCase()}
              </div>
              <div className="text-gray-400 text-sm">Risk Level</div>
            </div>
          </div>
        </div>
      )}

      {/* Live Insights */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Live Insights
            {hasUrgentInsights && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                URGENT
              </span>
            )}
          </h3>
          <span className="text-gray-400 text-sm">{insights.length} insights</span>
        </div>

        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'urgent' ? 'bg-red-500/20 border-red-500' :
                  insight.priority === 'high' ? 'bg-orange-500/20 border-orange-500' :
                  insight.priority === 'medium' ? 'bg-blue-500/20 border-blue-500' :
                  'bg-gray-500/20 border-gray-500'
                } ${insight.priority === 'urgent' ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{insight.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-semibold">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.type === 'alert' ? 'bg-red-600 text-white' :
                          insight.type === 'recommendation' ? 'bg-blue-600 text-white' :
                          insight.type === 'celebration' ? 'bg-green-600 text-white' :
                          'bg-purple-600 text-white'
                        }`}>
                          {insight.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.priority === 'urgent' ? 'bg-red-500 text-white' :
                          insight.priority === 'high' ? 'bg-orange-500 text-white' :
                          insight.priority === 'medium' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {insight.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{insight.message}</p>
                    {insight.actionable && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          ⚡ Actionable
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No insights available yet. Engage with the session to generate intelligence!</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations && (recommendations.immediate.length > 0 || recommendations.strategic.length > 0) && (
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            AI Recommendations
          </h3>
          
          {recommendations.immediate.length > 0 && (
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">
                🚨 Immediate Actions
              </h4>
              <ul className="space-y-2">
                {recommendations.immediate.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-400 mr-2">•</span>
                    <span className="text-gray-300 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {recommendations.strategic.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">
                💡 Strategic Improvements
              </h4>
              <ul className="space-y-2">
                {recommendations.strategic.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span className="text-gray-300 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
