"use client";
import { useState, useEffect } from 'react';
import { engagementService } from '@/lib/engagementService';
import { supabase } from '@/lib/supabaseClient';

interface PollProps {
  poll: any;
  userId: string;
  userRole: string;
  onResponse?: () => void;
}

export default function Poll({ poll, userId, userRole, onResponse }: PollProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasResponded, setHasResponded] = useState(false);
  const [results, setResults] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalResponses, setTotalResponses] = useState(0);

  useEffect(() => {
    checkUserResponse();
    if (userRole === 'organizer' || hasResponded) {
      loadResults();
    }
  }, [poll.id, userId]);

  const checkUserResponse = async () => {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select('selected_option')
        .eq('poll_id', poll.id)
        .eq('user_id', userId)
        .single();

      if (data) {
        setHasResponded(true);
        setSelectedOption(data.selected_option);
        setShowResults(true);
      }
    } catch (error) {
      // User hasn't responded yet
    }
  };

  const loadResults = async () => {
    try {
      const results = await engagementService.getPollResults(poll.id);
      setResults(results);
      setTotalResponses(Object.values(results).reduce((sum, count) => sum + count, 0));
    } catch (error) {
      console.error('Error loading poll results:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption || hasResponded) return;

    setLoading(true);
    try {
      await engagementService.submitPollResponse(poll.id, userId, selectedOption);
      setHasResponded(true);
      setShowResults(true);
      await loadResults();
      onResponse?.();
    } catch (error) {
      console.error('Error submitting poll response:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (option: string) => {
    if (totalResponses === 0) return 0;
    return Math.round(((results[option] || 0) / totalResponses) * 100);
  };

  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();

  return (
    <div className="bg-white/10 rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{poll.title}</h3>
        <div className="flex items-center space-x-2">
          {poll.is_active && !isExpired && (
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
              Active
            </span>
          )}
          {isExpired && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
              Expired
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-300 mb-6">{poll.question}</p>

      {!showResults && !isExpired && (
        <div className="space-y-3">
          {poll.options.map((option: any, index: number) => (
            <label
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name={`poll-${poll.id}`}
                value={option}
                checked={selectedOption === option}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-4 h-4 text-blue-500"
                disabled={hasResponded || loading}
              />
              <span className="text-white">{option}</span>
            </label>
          ))}

          <button
            onClick={handleSubmit}
            disabled={!selectedOption || hasResponded || loading || !!isExpired}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Submitting...' : hasResponded ? 'Response Submitted' : 'Submit Response'}
          </button>
        </div>
      )}

      {(showResults || userRole === 'organizer') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Results</h4>
            <span className="text-gray-400 text-sm">{totalResponses} responses</span>
          </div>

          {poll.options.map((option: any, index: number) => {
            const count = results[option] || 0;
            const percentage = getPercentage(option);
            const isSelected = selectedOption === option;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isSelected ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
                    {option} {isSelected && '(Your choice)'}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {!hasResponded && userRole === 'participant' && !isExpired && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-sm">
                Submit your response to participate in this poll
              </p>
            </div>
          )}
        </div>
      )}

      {poll.ends_at && (
        <div className="mt-4 text-xs text-gray-400">
          Ends: {new Date(poll.ends_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
