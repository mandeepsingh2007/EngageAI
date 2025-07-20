'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { Badge as BadgeUI } from './ui/badge';
import { badgeService, UserBadge } from '@/lib/badgeService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Award, Star, Zap, Lightbulb, BookOpen, Clock } from 'lucide-react';

interface BadgesProps {
  userId: string;
  sessionId: string;
  userRole?: string;
}

const BadgeIcon = ({ icon, className = '' }: { icon: string; className?: string }) => {
  const iconMap = {
    '🏆': <Trophy className={className} />,
    '🚀': <Zap className={className} />,
    '💡': <Lightbulb className={className} />,
    '📚': <BookOpen className={className} />,
    '⏱️': <Clock className={className} />,
  } as const;

  const SelectedIcon = iconMap[icon as keyof typeof iconMap] || <Award className={className} />;
  return SelectedIcon;
};

export function Badges({ userId, sessionId, userRole }: BadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userBadges = await badgeService.getUserBadges(userId, sessionId);
        setBadges(userBadges);
      } catch (err) {
        console.error('Error loading badges:', err);
        setError(err instanceof Error ? err.message : 'Failed to load badges');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && sessionId) {
      loadBadges();
    }
  }, [userId, sessionId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-400">Error loading badges: {error}</p>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-block p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-sm text-gray-300">No badges earned yet.</p>
          <p className="text-xs text-gray-400 mt-1">Participate in the session to earn badges!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((userBadge) => {
          const badge = userBadge.badge;
          const levelColors = {
            bronze: 'bg-amber-600/20 border-amber-600/50 text-amber-400',
            silver: 'bg-gray-400/20 border-gray-400/50 text-gray-200',
            gold: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
            platinum: 'bg-blue-400/20 border-blue-400/50 text-blue-300',
          };
          
          const levelClass = levelColors[badge.level] || levelColors.bronze;
          
          return (
            <Card key={userBadge.id} className={`relative overflow-hidden border ${levelClass} bg-gradient-to-br from-transparent to-black/20`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="text-3xl">
                    <BadgeIcon icon={badge.icon} />
                  </div>
                  <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/30">
                    {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                <p className="text-xs text-gray-300">{badge.description}</p>
                <div className="absolute top-2 right-2 text-xs opacity-50">
                  {new Date(userBadge.earned_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
