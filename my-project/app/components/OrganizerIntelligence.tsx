"use client";
import { useState, useEffect } from 'react';
import { useSessionIntelligence } from '@/hooks/useSessionIntelligence';
import RealTimeDashboard from './RealTimeDashboard';
import { Brain, TrendingUp, Users, AlertTriangle, Lightbulb, Trophy, Activity, Clock, BarChart3, Target, Zap, MessageSquare, FileText, BarChart2 } from 'lucide-react';

interface OrganizerIntelligenceProps {
  sessionId: string;
  userId: string;
}

export default function OrganizerIntelligence({ sessionId, userId }: OrganizerIntelligenceProps) {
  const {
    intelligence,
    insights,
    metrics,
    recommendations,
    sessionHealthSummary,
    topPerformers,
    atRiskParticipants,
    isLoading,
    error,
    lastUpdated,
    hasUrgentInsights,
    getInsightsByType,
    getInsightsByPriority
  } = useSessionIntelligence({
    sessionId,
    userId,
    userRole: 'organizer',
    autoStart: true
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'participants' | 'recommendations' | 'charts'>('overview');

  if (isLoading && !intelligence) {
    return (
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center">
          <Brain className="w-8 h-8 text-blue-400 animate-pulse mr-3" />
          <span className="text-white">Analyzing live session data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/30">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
          <span className="text-red-200">Error loading intelligence: {error}</span>
        </div>
      </div>
    );
  }

  const urgentInsights = getInsightsByPriority('urgent');
  const highInsights = getInsightsByPriority('high');
  const alerts = getInsightsByType('alert');
  const celebrations = getInsightsByType('celebration');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: Brain },
          { id: 'charts', label: 'Real-Time Charts', icon: BarChart3 },
          { id: 'insights', label: 'Live Insights', icon: Lightbulb },
          { id: 'participants', label: 'Participants', icon: Users },
          { id: 'recommendations', label: 'Actions', icon: Trophy },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-all ${
              activeTab === id
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Brain className="w-7 h-7 mr-3 text-blue-400" />
                Live Session Intelligence
              </h2>
              <div className="flex items-center space-x-4">
                {hasUrgentInsights && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full animate-pulse flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {urgentInsights.length} Urgent
                  </span>
                )}
                {lastUpdated && (
                  <span className="text-gray-400 text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
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
                  <span className="text-3xl mr-3">{sessionHealthSummary.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold capitalize text-lg">
                      {sessionHealthSummary.status.replace('_', ' ')}
                    </h3>
                    <p className="text-gray-300">{sessionHealthSummary.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Metrics Dashboard */}
          {metrics && (
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Real-Time Engagement Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {/* Session Health */}
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    metrics.sessionHealth >= 80 ? 'text-green-400' :
                    metrics.sessionHealth >= 60 ? 'text-blue-400' :
                    metrics.sessionHealth >= 40 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {metrics.sessionHealth}%
                  </div>
                  <div className="text-gray-400 text-sm mb-2">Session Health</div>
                  <div className="w-full h-3 bg-gray-700 rounded-full">
                    <div
                      className={`h-3 rounded-full ${
                        metrics.sessionHealth >= 80 ? 'bg-green-500' :
                        metrics.sessionHealth >= 60 ? 'bg-blue-500' :
                        metrics.sessionHealth >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.sessionHealth}%` }}
                    />
                  </div>
                </div>
                
                {/* Participation Rate */}
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    metrics.participationRate >= 70 ? 'text-green-400' :
                    metrics.participationRate >= 50 ? 'text-blue-400' :
                    metrics.participationRate >= 30 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {metrics.participationRate}%
                  </div>
                  <div className="text-gray-400 text-sm mb-2">Participation Rate</div>
                  <div className="w-full h-3 bg-gray-700 rounded-full">
                    <div
                      className={`h-3 rounded-full ${
                        metrics.participationRate >= 70 ? 'bg-green-500' :
                        metrics.participationRate >= 50 ? 'bg-blue-500' :
                        metrics.participationRate >= 30 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.participationRate}%` }}
                    />
                  </div>
                </div>
                
                {/* Engagement Velocity */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {metrics.engagementVelocity}
                  </div>
                  <div className="text-gray-400 text-sm">Actions per Minute</div>
                </div>
                
                {/* Attention Span */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-400 mb-2">
                    {metrics.attentionSpan}s
                  </div>
                  <div className="text-gray-400 text-sm">Avg Attention Span</div>
                </div>
                
                {/* Momentum Score */}
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    metrics.momentumScore >= 70 ? 'text-green-400' :
                    metrics.momentumScore >= 50 ? 'text-blue-400' : 'text-orange-400'
                  }`}>
                    {metrics.momentumScore}
                  </div>
                  <div className="text-gray-400 text-sm">Momentum Score</div>
                </div>
                
                {/* Risk Level */}
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
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

          {/* Urgent Alerts */}
          {urgentInsights.length > 0 && (
            <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                Urgent Actions Required
              </h3>
              <div className="space-y-3">
                {urgentInsights.map((insight) => (
                  <div key={insight.id} className="bg-red-600/30 p-4 rounded-lg border border-red-500/50 animate-pulse">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">{insight.icon}</span>
                      <div>
                        <h4 className="text-white font-semibold mb-1">{insight.title}</h4>
                        <p className="text-red-100 text-sm">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Insights */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Live Session Insights
              </h3>
              <span className="text-gray-400 text-sm">{insights.length} active insights</span>
            </div>

            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.slice(0, 8).map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.priority === 'urgent' ? 'bg-red-500/20 border-red-500' :
                      insight.priority === 'high' ? 'bg-orange-500/20 border-orange-500' :
                      insight.priority === 'medium' ? 'bg-blue-500/20 border-blue-500' :
                      'bg-gray-500/20 border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <span className="text-xl mr-3">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{insight.title}</h4>
                          <p className="text-gray-300 text-sm">{insight.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.type === 'alert' ? 'bg-red-600 text-white' :
                          insight.type === 'recommendation' ? 'bg-blue-600 text-white' :
                          insight.type === 'celebration' ? 'bg-green-600 text-white' :
                          'bg-purple-600 text-white'
                        }`}>
                          {insight.type}
                        </span>
                        {insight.actionable && (
                          <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                            Action
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Analyzing session... Insights will appear as participants engage.</p>
              </div>
            )}
          </div>

          {/* Participant Analysis */}
          {(topPerformers.length > 0 || atRiskParticipants.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Performers */}
              {topPerformers.length > 0 && (
                <div className="bg-green-500/20 rounded-lg p-6 border border-green-500/30">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-green-400" />
                    Top Performers
                  </h3>
                  <div className="space-y-3">
                    {topPerformers.slice(0, 5).map((participant, index) => (
                      <div key={participant.userId} className="flex items-center justify-between p-3 bg-green-600/20 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-green-400 font-bold mr-3">#{index + 1}</span>
                          <div>
                            <div className="text-white font-medium">Participant {participant.userId.slice(-4)}</div>
                            <div className="text-green-300 text-sm capitalize">{participant.engagementLevel} engagement</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">{participant.recentActivity}</div>
                          <div className="text-green-300 text-sm">recent actions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* At-Risk Participants */}
              {atRiskParticipants.length > 0 && (
                <div className="bg-orange-500/20 rounded-lg p-6 border border-orange-500/30">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                    Needs Attention
                  </h3>
                  <div className="space-y-3">
                    {atRiskParticipants.slice(0, 5).map((participant) => (
                      <div key={participant.userId} className="flex items-center justify-between p-3 bg-orange-600/20 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 text-orange-400 mr-3" />
                          <div>
                            <div className="text-white font-medium">Participant {participant.userId.slice(-4)}</div>
                            <div className="text-orange-300 text-sm">
                              {participant.riskOfDropoff ? 'Risk of dropout' : `${participant.momentum} momentum`}
                            </div>
                          </div>
                        </div>
                        <div className="text-orange-400 text-sm">
                          {participant.recentActivity} recent
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Recommendations */}
          {recommendations && (recommendations.immediate.length > 0 || recommendations.strategic.length > 0) && (
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Smart Recommendations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Immediate Actions */}
                {recommendations.immediate.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                      Immediate Actions
                    </h4>
                    <ul className="space-y-2">
                      {recommendations.immediate.map((rec, index) => (
                        <li key={index} className="flex items-start p-3 bg-red-500/20 rounded-lg">
                          <span className="text-red-400 mr-2 mt-1">•</span>
                          <span className="text-gray-200 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Strategic Improvements */}
                {recommendations.strategic.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
                      Strategic Improvements
                    </h4>
                    <ul className="space-y-2">
                      {recommendations.strategic.map((rec, index) => (
                        <li key={index} className="flex items-start p-3 bg-blue-500/20 rounded-lg">
                          <span className="text-blue-400 mr-2 mt-1">•</span>
                          <span className="text-gray-200 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'charts' && (
        <RealTimeDashboard sessionId={sessionId} userRole="organizer" />
      )}

      {activeTab === 'insights' && (
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Live Session Insights
            </h3>
            <span className="text-gray-400 text-sm">{insights.length} active insights</span>
          </div>

          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.slice(0, 8).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.priority === 'urgent' ? 'bg-red-500/20 border-red-500' :
                    insight.priority === 'high' ? 'bg-orange-500/20 border-orange-500' :
                    insight.priority === 'medium' ? 'bg-blue-500/20 border-blue-500' :
                    'bg-gray-500/20 border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <span className="text-xl mr-3">{insight.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{insight.title}</h4>
                        <p className="text-gray-300 text-sm">{insight.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        insight.type === 'alert' ? 'bg-red-600 text-white' :
                        insight.type === 'recommendation' ? 'bg-blue-600 text-white' :
                        insight.type === 'celebration' ? 'bg-green-600 text-white' :
                        'bg-purple-600 text-white'
                      }`}>
                        {insight.type}
                      </span>
                      {insight.actionable && (
                        <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                          Action
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Analyzing session... Insights will appear as participants engage.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="space-y-6">
          {/* Participant Overview */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Participant Analysis
              </h3>
              <span className="text-gray-400 text-sm">
                {topPerformers.length + atRiskParticipants.length} participants tracked
              </span>
            </div>

            {/* Participant Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              {topPerformers.length > 0 && (
                <div className="bg-green-500/20 rounded-lg p-6 border border-green-500/30">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-green-400" />
                    Top Performers ({topPerformers.length})
                  </h4>
                  <div className="space-y-3">
                    {topPerformers.map((participant, index) => (
                      <div key={participant.userId} className="flex items-center justify-between p-4 bg-green-600/20 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-bold text-sm mr-3">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="text-white font-medium">Participant {participant.userId.slice(-4)}</div>
                            <div className="text-green-300 text-sm capitalize flex items-center">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                              {participant.engagementLevel} engagement
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold text-lg">{participant.recentActivity}</div>
                          <div className="text-green-300 text-xs">recent actions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* At-Risk Participants */}
              {atRiskParticipants.length > 0 && (
                <div className="bg-orange-500/20 rounded-lg p-6 border border-orange-500/30">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                    Needs Attention ({atRiskParticipants.length})
                  </h4>
                  <div className="space-y-3">
                    {atRiskParticipants.map((participant) => (
                      <div key={participant.userId} className="flex items-center justify-between p-4 bg-orange-600/20 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="w-6 h-6 text-orange-400 mr-3" />
                          <div>
                            <div className="text-white font-medium">Participant {participant.userId.slice(-4)}</div>
                            <div className="text-orange-300 text-sm flex items-center">
                              <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></span>
                              {participant.riskOfDropoff ? 'Risk of dropout' : `${participant.momentum} momentum`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400 font-bold">{participant.recentActivity}</div>
                          <div className="text-orange-300 text-xs">recent activity</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Engagement Distribution */}
            <div className="mt-6 bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Engagement Distribution</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {topPerformers.filter(p => p.engagementLevel === 'superstar').length}
                  </div>
                  <div className="text-xs text-white/60">Superstars</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {topPerformers.filter(p => p.engagementLevel === 'high').length}
                  </div>
                  <div className="text-xs text-white/60">High</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {topPerformers.filter(p => p.engagementLevel === 'medium').length}
                  </div>
                  <div className="text-xs text-white/60">Medium</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-400">
                    {atRiskParticipants.length}
                  </div>
                  <div className="text-xs text-white/60">At Risk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Action Center */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Action Center
              </h3>
              <div className="flex items-center space-x-2 text-sm text-white/60">
                <Clock className="w-4 h-4" />
                <span>Updated {lastUpdated?.toLocaleTimeString()}</span>
              </div>
            </div>

            {recommendations && (recommendations.immediate.length > 0 || recommendations.strategic.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Immediate Actions */}
                {recommendations.immediate.length > 0 && (
                  <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/30">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-red-400" />
                      Immediate Actions
                      <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        {recommendations.immediate.length}
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {recommendations.immediate.map((rec, index) => (
                        <div key={index} className="flex items-start p-4 bg-red-600/30 rounded-lg hover:bg-red-600/40 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm leading-relaxed">{rec}</p>
                          </div>
                          <button className="flex-shrink-0 ml-3 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors">
                            Act Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Strategic Improvements */}
                {recommendations.strategic.length > 0 && (
                  <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-500/30">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                      Strategic Improvements
                      <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        {recommendations.strategic.length}
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {recommendations.strategic.map((rec, index) => (
                        <div key={index} className="flex items-start p-4 bg-blue-600/30 rounded-lg hover:bg-blue-600/40 transition-colors">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm leading-relaxed">{rec}</p>
                          </div>
                          <button className="flex-shrink-0 ml-3 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors">
                            Plan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-semibold mb-2">No Actions Required</h4>
                <p className="text-sm">Your session is running smoothly. Keep up the great work!</p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-white font-semibold mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button className="flex items-center justify-center p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 text-sm transition-colors">
                  <span className="mr-2">📊</span>
                  Create Poll
                </button>
                <button className="flex items-center justify-center p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm transition-colors">
                  <span className="mr-2">❓</span>
                  Ask Question
                </button>
                <button className="flex items-center justify-center p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors">
                  <span className="mr-2">📎</span>
                  Share Resource
                </button>
                <button className="flex items-center justify-center p-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-300 text-sm transition-colors">
                  <span className="mr-2">💬</span>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
