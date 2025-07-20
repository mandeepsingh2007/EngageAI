'use client';

import React, { useState, useEffect } from 'react';
import { realTimeAnalytics, ParticipantRadarData } from '../../lib/realTimeAnalytics';
import { Users, Star, AlertTriangle, Clock } from 'lucide-react';

interface ParticipantRadarProps {
  sessionId: string;
  size?: number;
}

const ParticipantRadar: React.FC<ParticipantRadarProps> = ({ 
  sessionId, 
  size = 400 
}) => {
  const [participants, setParticipants] = useState<ParticipantRadarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const radarData = await realTimeAnalytics.getParticipantRadar(sessionId);
        setParticipants(radarData);
      } catch (error) {
        console.error('Error fetching participant radar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Update every 15 seconds for smooth animations
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'superstar': return <Star className="w-3 h-3" />;
      case 'active': return <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />;
      case 'at-risk': return <AlertTriangle className="w-3 h-3" />;
      case 'idle': return <Clock className="w-3 h-3" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'superstar': return 'Superstar';
      case 'active': return 'Active';
      case 'at-risk': return 'At Risk';
      case 'idle': return 'Idle';
      default: return 'Unknown';
    }
  };

  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size * 0.35;

  // Create concentric circles for engagement levels
  const circles = [
    { radius: maxRadius * 0.3, label: 'Low', color: 'rgba(239, 68, 68, 0.2)' },
    { radius: maxRadius * 0.6, label: 'Medium', color: 'rgba(245, 158, 11, 0.2)' },
    { radius: maxRadius * 0.9, label: 'High', color: 'rgba(16, 185, 129, 0.2)' },
  ];

  if (loading) {
    return (
      <div className="bg-white/10 rounded-lg p-6 border border-white/20" style={{ height: size + 100 }}>
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="text-white/70">Loading participant radar...</span>
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
          <Users className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Participant Radar</h3>
          <div className="flex items-center space-x-1 text-sm text-white/60">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
        <div className="text-sm text-white/60">
          {participants.length} participants
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="overflow-visible">
            {/* Background circles */}
            {circles.map((circle, index) => (
              <g key={index}>
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={circle.radius}
                  fill={circle.color}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
                <text
                  x={centerX + circle.radius - 20}
                  y={centerY - 5}
                  fill="rgba(255,255,255,0.5)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {circle.label}
                </text>
              </g>
            ))}

            {/* Center point */}
            <circle
              cx={centerX}
              cy={centerY}
              r="4"
              fill="rgba(255,255,255,0.8)"
            />

            {/* Participants */}
            {participants.map((participant, index) => (
              <g key={participant.userId}>
                {/* Participant dot */}
                <circle
                  cx={participant.position.x}
                  cy={participant.position.y}
                  r={participant.size}
                  fill={participant.color}
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedParticipant === participant.userId ? 'animate-pulse' : ''
                  }`}
                  style={{
                    filter: selectedParticipant === participant.userId ? 'brightness(1.3)' : 'none',
                    transform: selectedParticipant === participant.userId ? 'scale(1.2)' : 'scale(1)',
                  }}
                  onClick={() => setSelectedParticipant(
                    selectedParticipant === participant.userId ? null : participant.userId
                  )}
                />

                {/* Engagement level ring */}
                <circle
                  cx={participant.position.x}
                  cy={participant.position.y}
                  r={participant.size + 4}
                  fill="none"
                  stroke={participant.color}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                  className="animate-pulse"
                />

                {/* Username label */}
                <text
                  x={participant.position.x}
                  y={participant.position.y + participant.size + 15}
                  fill="rgba(255,255,255,0.8)"
                  fontSize="10"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {participant.username}
                </text>

                {/* Status indicator */}
                {participant.status === 'superstar' && (
                  <text
                    x={participant.position.x + participant.size + 5}
                    y={participant.position.y - participant.size - 5}
                    fontSize="12"
                    className="pointer-events-none"
                  >
                    ⭐
                  </text>
                )}
                
                {participant.status === 'at-risk' && (
                  <text
                    x={participant.position.x + participant.size + 5}
                    y={participant.position.y - participant.size - 5}
                    fontSize="12"
                    className="pointer-events-none"
                  >
                    ⚠️
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Selected participant details */}
          {selectedParticipant && (
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg text-white text-sm max-w-48">
              {(() => {
                const participant = participants.find(p => p.userId === selectedParticipant);
                if (!participant) return null;
                
                return (
                  <div>
                    <div className="font-semibold mb-2">{participant.username}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${
                          participant.status === 'superstar' ? 'text-yellow-400' :
                          participant.status === 'active' ? 'text-green-400' :
                          participant.status === 'at-risk' ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          {getStatusLabel(participant.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engagement:</span>
                        <span className="font-medium">{participant.engagementLevel}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recent Activity:</span>
                        <span className="font-medium">{participant.recentActivity}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium text-white/80">Status</h4>
          <div className="space-y-1">
            {[
              { status: 'superstar', color: '#fbbf24', label: 'Superstar' },
              { status: 'active', color: '#10b981', label: 'Active' },
              { status: 'at-risk', color: '#f59e0b', label: 'At Risk' },
              { status: 'idle', color: '#94a3b8', label: 'Idle' },
            ].map(({ status, color, label }) => (
              <div key={status} className="flex items-center space-x-2 text-white/60">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-white/80">Engagement Zones</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-white/60">
              <div className="w-3 h-3 rounded-full bg-green-400/30 border border-green-400/50" />
              <span>High (Outer)</span>
            </div>
            <div className="flex items-center space-x-2 text-white/60">
              <div className="w-3 h-3 rounded-full bg-orange-400/30 border border-orange-400/50" />
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2 text-white/60">
              <div className="w-3 h-3 rounded-full bg-red-400/30 border border-red-400/50" />
              <span>Low (Inner)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-yellow-400">
              {participants.filter(p => p.status === 'superstar').length}
            </div>
            <div className="text-xs text-white/60">Superstars</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-400">
              {participants.filter(p => p.status === 'active').length}
            </div>
            <div className="text-xs text-white/60">Active</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-400">
              {participants.filter(p => p.status === 'at-risk').length}
            </div>
            <div className="text-xs text-white/60">At Risk</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-400">
              {participants.filter(p => p.status === 'idle').length}
            </div>
            <div className="text-xs text-white/60">Idle</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantRadar;
