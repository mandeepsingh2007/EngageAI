'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { realTimeAnalytics, EngagementDataPoint, EngagementEvent } from '../../lib/realTimeAnalytics';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface EngagementFlowChartProps {
  sessionId: string;
  height?: number;
  timeRange?: number; // minutes
}

interface ChartDataPoint extends EngagementDataPoint {
  formattedTime: string;
}

const EngagementFlowChart: React.FC<EngagementFlowChartProps> = ({ 
  sessionId, 
  height = 300, 
  timeRange = 30 
}) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'sessionHealth' | 'participationRate' | 'engagementVelocity' | 'momentumScore'>('sessionHealth');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const flowData = await realTimeAnalytics.getEngagementFlow(sessionId, timeRange);
        
        // Format data for chart
        const formattedData: ChartDataPoint[] = flowData.map(point => ({
          ...point,
          formattedTime: new Date(point.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }));

        setData(formattedData);
      } catch (error) {
        console.error('Error fetching engagement flow:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [sessionId, timeRange]);

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'sessionHealth': return '#10b981'; // green
      case 'participationRate': return '#3b82f6'; // blue
      case 'engagementVelocity': return '#f59e0b'; // orange
      case 'momentumScore': return '#8b5cf6'; // purple
      default: return '#6b7280';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'sessionHealth': return <Activity className="w-4 h-4" />;
      case 'participationRate': return <TrendingUp className="w-4 h-4" />;
      case 'engagementVelocity': return <Zap className="w-4 h-4" />;
      case 'momentumScore': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600 mb-2">
            {data.activeParticipants} active participants • {data.totalActions} actions
          </p>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Session Health:</span>
              <span className="font-medium text-green-600">{data.sessionHealth}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Participation:</span>
              <span className="font-medium text-blue-600">{data.participationRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Velocity:</span>
              <span className="font-medium text-orange-600">{data.engagementVelocity}/min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Momentum:</span>
              <span className="font-medium text-purple-600">{data.momentumScore}%</span>
            </div>
          </div>

          {data.events && data.events.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-1">Events:</p>
              {data.events.slice(0, 3).map((event: EngagementEvent) => (
                <p key={event.id} className="text-xs text-gray-600">
                  • {event.description}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.events && payload.events.length > 0) {
      return (
        <Dot 
          cx={cx} 
          cy={cy} 
          r={6} 
          fill="#f59e0b" 
          stroke="#ffffff" 
          strokeWidth={2}
          className="animate-pulse"
        />
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white/10 rounded-lg p-6 border border-white/20" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="text-white/70">Loading engagement flow...</span>
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
          <Activity className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Engagement Flow</h3>
          <div className="flex items-center space-x-1 text-sm text-white/60">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex bg-white/5 rounded-lg p-1">
          {(['sessionHealth', 'participationRate', 'engagementVelocity', 'momentumScore'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all ${
                selectedMetric === metric
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              {getMetricIcon(metric)}
              <span className="hidden sm:inline">
                {metric === 'sessionHealth' && 'Health'}
                {metric === 'participationRate' && 'Participation'}
                {metric === 'engagementVelocity' && 'Velocity'}
                {metric === 'momentumScore' && 'Momentum'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: height - 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="formattedTime" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for thresholds */}
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.5} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.5} />
            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
            
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={getMetricColor(selectedMetric)}
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 6, stroke: getMetricColor(selectedMetric), strokeWidth: 2, fill: '#ffffff' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-white/60">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-green-400"></div>
          <span>Excellent (80%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-orange-400"></div>
          <span>Good (50%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-red-400"></div>
          <span>Needs Attention (&lt;20%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span>Events</span>
        </div>
      </div>
    </div>
  );
};

export default EngagementFlowChart;
