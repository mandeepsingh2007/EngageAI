'use client';

import React, { useState, useEffect } from 'react';
import { realTimeAnalytics, ActivityStreamItem } from '../../lib/realTimeAnalytics';
import { 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ActivityStreamProps {
  sessionId: string;
  maxItems?: number;
  showFilters?: boolean;
}

const ActivityStream: React.FC<ActivityStreamProps> = ({ 
  sessionId, 
  maxItems = 20,
  showFilters = true 
}) => {
  const [activities, setActivities] = useState<ActivityStreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'actionable'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const streamData = await realTimeAnalytics.getActivityStream(sessionId, maxItems);
        setActivities(streamData);
      } catch (error) {
        console.error('Error fetching activity stream:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Update every 10 seconds for real-time feel
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [sessionId, maxItems]);

  const getTypeIcon = (type: string, priority: string) => {
    const iconClass = `w-5 h-5 ${priority === 'urgent' ? 'animate-pulse' : ''}`;
    
    switch (type) {
      case 'alert': return <AlertTriangle className={iconClass} />;
      case 'recommendation': return <Lightbulb className={iconClass} />;
      case 'insight': return <TrendingUp className={iconClass} />;
      case 'celebration': return <Zap className={iconClass} />;
      default: return <CheckCircle className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-400 bg-red-500/20';
      case 'high': return 'border-orange-400 bg-orange-500/20';
      case 'medium': return 'border-blue-400 bg-blue-500/20';
      case 'low': return 'border-green-400 bg-green-500/20';
      default: return 'border-gray-400 bg-gray-500/20';
    }
  };

  const getTextColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-300';
      case 'high': return 'text-orange-300';
      case 'medium': return 'text-blue-300';
      case 'low': return 'text-green-300';
      default: return 'text-gray-300';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  };

  const filteredActivities = activities.filter(activity => {
    switch (filter) {
      case 'urgent': return activity.priority === 'urgent';
      case 'actionable': return activity.actionable;
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="bg-white/10 rounded-lg p-6 border border-white/20 h-96">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="text-white/70">Loading activity stream...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-lg p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Activity Stream</h3>
          <div className="flex items-center space-x-1 text-sm text-white/60">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-white/60" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="actionable">Actionable</option>
            </select>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activities match the current filter</p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`relative p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                getPriorityColor(activity.priority)
              } ${activity.animated ? 'animate-slideInRight' : ''}`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Priority Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                activity.priority === 'urgent' ? 'bg-red-400' :
                activity.priority === 'high' ? 'bg-orange-400' :
                activity.priority === 'medium' ? 'bg-blue-400' :
                'bg-green-400'
              }`} />

              <div className="flex items-start space-x-3 ml-2">
                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${
                  activity.priority === 'urgent' ? 'bg-red-500/30' :
                  activity.priority === 'high' ? 'bg-orange-500/30' :
                  activity.priority === 'medium' ? 'bg-blue-500/30' :
                  'bg-green-500/30'
                }`}>
                  {activity.icon ? (
                    <span className="text-lg">{activity.icon}</span>
                  ) : (
                    getTypeIcon(activity.type, activity.priority)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm ${getTextColor(activity.priority)}`}>
                        {activity.title}
                      </h4>
                      <p className="text-white/80 text-sm mt-1 leading-relaxed">
                        {activity.message}
                      </p>
                    </div>

                    {/* Action Button */}
                    {activity.actionable && (
                      <button className="flex-shrink-0 ml-3 p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-3">
                      {/* Type Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.type === 'alert' ? 'bg-red-500/20 text-red-300' :
                        activity.type === 'recommendation' ? 'bg-blue-500/20 text-blue-300' :
                        activity.type === 'insight' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {activity.type}
                      </span>

                      {/* Priority Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.priority === 'urgent' ? 'bg-red-500/30 text-red-200' :
                        activity.priority === 'high' ? 'bg-orange-500/30 text-orange-200' :
                        activity.priority === 'medium' ? 'bg-blue-500/30 text-blue-200' :
                        'bg-green-500/30 text-green-200'
                      }`}>
                        {activity.priority}
                      </span>

                      {activity.actionable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
                          actionable
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-white/50">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-red-400">
              {activities.filter(a => a.priority === 'urgent').length}
            </div>
            <div className="text-xs text-white/60">Urgent</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-400">
              {activities.filter(a => a.priority === 'high').length}
            </div>
            <div className="text-xs text-white/60">High</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-400">
              {activities.filter(a => a.actionable).length}
            </div>
            <div className="text-xs text-white/60">Actionable</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-400">
              {activities.filter(a => a.type === 'celebration').length}
            </div>
            <div className="text-xs text-white/60">Celebrations</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityStream;
