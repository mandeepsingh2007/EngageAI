"use client";
import { useEffect, useState } from "react";
import { engagementService, EngagementMetric } from "@/lib/engagementService";

interface EngagementScoreHistoryProps {
  sessionId: string;
  userId: string;
}

export default function EngagementScoreHistory({ sessionId, userId }: EngagementScoreHistoryProps) {
  const [history, setHistory] = useState<EngagementMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    // Subscribe to real-time updates
    const channel = engagementService.subscribeToEngagementUpdates(sessionId, loadHistory);
    return () => { if (channel) channel.unsubscribe(); };
  }, [sessionId, userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const metrics = await engagementService.getUserEngagementMetrics(userId, sessionId);
      setHistory(metrics);
    } catch (e) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Score over time
  let cumulative = 0;
  const scoreTimeline = history
    .slice()
    .reverse()
    .map((event) => {
      cumulative += event.score;
      return { ...event, cumulative };
    })
    .reverse();

  return (
    <div className="bg-white/10 rounded-lg p-6 border border-white/20 mt-6">
      <h3 className="text-xl font-bold text-white mb-4">Engagement History</h3>
      {loading ? (
        <div className="animate-pulse h-10 bg-white/20 rounded" />
      ) : history.length === 0 ? (
        <div className="text-gray-400">No engagement events yet.</div>
      ) : (
        <>
          {/* Score over time (simple SVG line graph) */}
          <div className="mb-6">
            <div className="text-gray-400 text-sm mb-2">Score Over Time</div>
            <svg width="100%" height="60" viewBox="0 0 300 60" className="bg-white/5 rounded">
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                points={scoreTimeline.map((pt, i) => `${(i / (scoreTimeline.length - 1 || 1)) * 300},${60 - (pt.cumulative / (scoreTimeline[scoreTimeline.length-1]?.cumulative||1)) * 50}`).join(" ")}
              />
            </svg>
          </div>
          {/* Table of events */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Activity</th>
                  <th className="px-2 py-1 text-left">Points</th>
                  <th className="px-2 py-1 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((event) => (
                  <tr key={event.id} className="border-b border-white/10">
                    <td className="px-2 py-1">{new Date(event.created_at).toLocaleString()}</td>
                    <td className="px-2 py-1">{event.activity_type.replace(/_/g, " ")}</td>
                    <td className="px-2 py-1 text-blue-400 font-bold">+{event.score}</td>
                    <td className="px-2 py-1 text-gray-300">{event.metadata?.details || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
