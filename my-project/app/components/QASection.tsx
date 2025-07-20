"use client";
import { useState, useEffect } from 'react';
import { engagementService, Question, Answer } from '@/lib/engagementService';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, ThumbsUp, Send, CheckCircle } from 'lucide-react';

interface QASectionProps {
  sessionId: string;
  userId: string;
  userRole: string;
}

interface QuestionWithDetails extends Question {
  answers: (Answer & { users: { name: string; email: string } })[];
  users: { name: string; email: string };
  user_has_upvoted?: boolean;
}

export default function QASection({ sessionId, userId, userRole }: QASectionProps) {
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadQuestions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`qa-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `session_id=eq.${sessionId}`
        },
        () => loadQuestions()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers'
        },
        () => loadQuestions()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_upvotes'
        },
        () => loadQuestions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadQuestions = async () => {
    try {
      const data = await engagementService.getSessionQuestions(sessionId);
      
      // Check which questions the user has upvoted
      const questionsWithUpvotes = await Promise.all(
        data.map(async (question: any) => {
          const { data: upvote } = await supabase
            .from('question_upvotes')
            .select('id')
            .eq('question_id', question.id)
            .eq('user_id', userId)
            .single();
          
          return {
            ...question,
            user_has_upvoted: !!upvote
          };
        })
      );
      
      setQuestions(questionsWithUpvotes);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || loading) return;

    setLoading(true);
    try {
      await engagementService.askQuestion(sessionId, userId, newQuestion.trim());
      setNewQuestion('');
      await loadQuestions();
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    const answer = newAnswer[questionId]?.trim();
    if (!answer || submittingAnswer[questionId]) return;

    setSubmittingAnswer(prev => ({ ...prev, [questionId]: true }));
    try {
      await engagementService.answerQuestion(
        questionId, 
        userId, 
        answer, 
        userRole === 'organizer'
      );
      setNewAnswer(prev => ({ ...prev, [questionId]: '' }));
      await loadQuestions();
    } catch (error) {
      console.error('Error answering question:', error);
    } finally {
      setSubmittingAnswer(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    try {
      await engagementService.upvoteQuestion(questionId, userId);
      await loadQuestions();
    } catch (error) {
      console.error('Error upvoting question:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ask Question Section */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Ask a Question
        </h3>
        
        <div className="space-y-4">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What would you like to know?"
            className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={loading}
          />
          
          <button
            onClick={handleAskQuestion}
            disabled={!newQuestion.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Submitting...' : 'Ask Question'}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">
          Questions ({questions.length})
        </h3>

        {questions.length === 0 ? (
          <div className="bg-white/5 rounded-lg p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="bg-white/10 rounded-lg p-6 border border-white/20">
              {/* Question */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-white text-lg mb-2">{question.question}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>by {question.users?.name || 'Anonymous'}</span>
                    <span>{new Date(question.created_at).toLocaleString()}</span>
                    {question.is_answered && (
                      <span className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Answered
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Upvote Button */}
                <button
                  onClick={() => handleUpvoteQuestion(question.id)}
                  disabled={question.user_has_upvoted}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
                    question.user_has_upvoted
                      ? 'bg-blue-600 text-white cursor-not-allowed'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{question.upvotes}</span>
                </button>
              </div>

              {/* Answers */}
              {question.answers && question.answers.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-white font-medium">Answers:</h4>
                  {question.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className={`p-4 rounded-lg ${
                        answer.is_official
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <p className="text-white mb-2">{answer.answer}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>by {answer.users?.name || 'Anonymous'}</span>
                        <span>{new Date(answer.created_at).toLocaleString()}</span>
                        {answer.is_official && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                            Official Answer
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Input */}
              <div className="space-y-3">
                <textarea
                  value={newAnswer[question.id] || ''}
                  onChange={(e) => setNewAnswer(prev => ({ ...prev, [question.id]: e.target.value }))}
                  placeholder="Write your answer..."
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  disabled={submittingAnswer[question.id]}
                />
                
                <button
                  onClick={() => handleAnswerQuestion(question.id)}
                  disabled={!newAnswer[question.id]?.trim() || submittingAnswer[question.id]}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submittingAnswer[question.id] ? 'Submitting...' : 
                   userRole === 'organizer' ? 'Post Official Answer' : 'Post Answer'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
