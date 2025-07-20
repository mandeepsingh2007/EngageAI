"use client";
import { useState } from 'react';
import { engagementService } from '@/lib/engagementService';
import { Plus, X, Clock } from 'lucide-react';

interface PollCreatorProps {
  sessionId: string;
  userId: string;
  onPollCreated?: () => void;
}

export default function PollCreator({ sessionId, userId, onPollCreated }: PollCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [poll, setPoll] = useState({
    title: '',
    question: '',
    options: ['', ''],
    hasTimeLimit: false,
    timeLimit: 5 // minutes
  });

  const addOption = () => {
    if (poll.options.length < 6) {
      setPoll(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (poll.options.length > 2) {
      setPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPoll(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const handleSubmit = async () => {
    if (!poll.title.trim() || !poll.question.trim()) {
      alert('Please fill in title and question');
      return;
    }

    const validOptions = poll.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    setLoading(true);
    try {
      const endsAt = poll.hasTimeLimit 
        ? new Date(Date.now() + poll.timeLimit * 60 * 1000).toISOString()
        : undefined;

      await engagementService.createPoll(
        sessionId,
        poll.title.trim(),
        poll.question.trim(),
        validOptions,
        userId,
        endsAt
      );

      // Reset form
      setPoll({
        title: '',
        question: '',
        options: ['', ''],
        hasTimeLimit: false,
        timeLimit: 5
      });
      
      setIsOpen(false);
      onPollCreated?.();
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create Poll
      </button>
    );
  }

  return (
    <div className="bg-white/10 rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Create New Poll</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Poll Title *
          </label>
          <input
            type="text"
            value={poll.title}
            onChange={(e) => setPoll(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Quick Feedback Poll"
            className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Question */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Question *
          </label>
          <textarea
            value={poll.question}
            onChange={(e) => setPoll(prev => ({ ...prev, question: e.target.value }))}
            placeholder="What question would you like to ask?"
            className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Options *
          </label>
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                {poll.options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    disabled={loading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {poll.options.length < 6 && (
            <button
              onClick={addOption}
              className="mt-3 text-blue-400 hover:text-blue-300 transition-colors flex items-center text-sm"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </button>
          )}
        </div>

        {/* Time Limit */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={poll.hasTimeLimit}
              onChange={(e) => setPoll(prev => ({ ...prev, hasTimeLimit: e.target.checked }))}
              className="w-4 h-4 text-blue-500 rounded"
              disabled={loading}
            />
            <span className="text-white text-sm font-medium">Set time limit</span>
          </label>

          {poll.hasTimeLimit && (
            <div className="mt-3 flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={poll.timeLimit}
                onChange={(e) => setPoll(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 5 }))}
                min="1"
                max="60"
                className="w-20 p-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-gray-400 text-sm">minutes</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 pt-4 border-t border-white/20">
          <button
            onClick={handleSubmit}
            disabled={loading || !poll.title.trim() || !poll.question.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
