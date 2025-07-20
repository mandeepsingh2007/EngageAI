'use client';

import React, { useState } from 'react';
import EngagementFlowChart from './EngagementFlowChart';
import ParticipantRadar from './ParticipantRadar';
import ActivityStream from './ActivityStream';
import { BarChart3, Users, Activity, Maximize2, Minimize2, PieChart } from 'lucide-react';
import { ParticipantClusters } from './ParticipantClusters';

interface RealTimeDashboardProps {
  sessionId: string;
  userRole?: 'organizer' | 'participant';
}

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ 
  sessionId, 
  userRole = 'organizer' 
}) => {
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const toggleExpand = (chartId: string) => {
    setExpandedChart(expandedChart === chartId ? null : chartId);
  };

  if (expandedChart) {
    // Full-screen view for expanded chart
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {expandedChart === 'flow' && 'Engagement Flow Analysis'}
              {expandedChart === 'radar' && 'Participant Radar View'}
              {expandedChart === 'stream' && 'Live Activity Stream'}
              {expandedChart === 'clusters' && 'Participant Clusters'}
            </h2>
            <button
              onClick={() => setExpandedChart(null)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit Full Screen</span>
            </button>
          </div>

          {/* Expanded Chart */}
          <div className="flex-1">
            {expandedChart === 'flow' && (
              <EngagementFlowChart sessionId={sessionId} height={600} timeRange={60} />
            )}
            {expandedChart === 'radar' && (
              <ParticipantRadar sessionId={sessionId} size={600} />
            )}
            {expandedChart === 'stream' && (
              <ActivityStream sessionId={sessionId} maxItems={50} />
            )}
            {expandedChart === 'clusters' && (
              <div className="w-full h-full">
                <ParticipantClusters sessionId={sessionId} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Real-Time Analytics</h2>
              <p className="text-white/60">Live engagement insights and participant monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-white/60">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Auto-refresh: 30s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Participant Clusters Card */}
        <div className="lg:col-span-3 bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Participant Clusters</h3>
            <button
              onClick={() => setExpandedChart('clusters')}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Expand</span>
            </button>
          </div>
          <div className="h-64">
            <ParticipantClusters sessionId={sessionId} />
          </div>
        </div>
        {/* Engagement Flow Chart - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2">
          <div className="relative">
            <button
              onClick={() => toggleExpand('flow')}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-colors"
              title="Expand to full screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <EngagementFlowChart sessionId={sessionId} height={400} />
          </div>
        </div>

        {/* Activity Stream */}
        <div className="relative">
          <button
            onClick={() => toggleExpand('stream')}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-colors"
            title="Expand to full screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <ActivityStream sessionId={sessionId} maxItems={15} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participant Radar */}
        <div className="relative">
          <button
            onClick={() => toggleExpand('radar')}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-colors"
            title="Expand to full screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <ParticipantRadar sessionId={sessionId} size={350} />
        </div>

        {/* Quick Stats & Controls */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">--</div>
                <div className="text-sm text-white/60">Session Health</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">--</div>
                <div className="text-sm text-white/60">Active Users</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-1">--</div>
                <div className="text-sm text-white/60">Engagement Rate</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">--</div>
                <div className="text-sm text-white/60">Momentum</div>
              </div>
            </div>
          </div>

          {/* Dashboard Controls */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Dashboard Controls</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Auto-refresh</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/70">Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-white/70 text-sm mb-2">Time Range</label>
                <select className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="15">Last 15 minutes</option>
                  <option value="30" selected>Last 30 minutes</option>
                  <option value="60">Last hour</option>
                  <option value="120">Last 2 hours</option>
                </select>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center space-x-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>•</span>
            <span>Session ID: {sessionId.substring(0, 8)}...</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Real-time monitoring active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
