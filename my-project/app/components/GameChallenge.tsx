'use client';

import { useState, useEffect } from 'react';
import { Trophy, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { engagementService } from '@/lib/engagementService';

type GameType = 'quiz' | 'wordchain' | 'trivia' | 'puzzle' | 'scavenger';

interface GameChallengeProps {
  sessionId: string;
  userId: string;
  engagementScore: number;
  onComplete?: () => void;
}

interface Game {
  id: string;
  type: GameType;
  title: string;
  description: string;
  duration: number; // in seconds
  question?: string;
  options?: string[];
  correctAnswer?: string | number;
}

export function GameChallenge({ sessionId, userId, engagementScore, onComplete }: GameChallengeProps) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [gameResult, setGameResult] = useState<{success: boolean; message: string} | null>(null);
  const [showChallenge, setShowChallenge] = useState(true);

  // Sample games database
  const availableGames: Game[] = [
    {
      id: 'quiz-1',
      type: 'quiz',
      title: 'Quick Knowledge Check',
      description: 'Answer this fun question to refresh your mind!',
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2, // index of correct answer
      duration: 30,
    },
    {
      id: 'wordchain-1',
      type: 'wordchain',
      title: 'Word Chain Game',
      description: 'Type a word that starts with the last letter of the previous word!',
      question: 'Start with: SESSION',
      correctAnswer: 'N',
      duration: 45,
    },
    {
      id: 'trivia-1',
      type: 'trivia',
      title: 'Tech Trivia',
      description: 'Test your tech knowledge!',
      question: 'Which company developed React?',
      options: ['Google', 'Facebook', 'Microsoft', 'Apple'],
      correctAnswer: 1,
      duration: 30,
    },
  ];

  // Check if engagement is low (below 50% of max possible score for demo)
  const isEngagementLow = engagementScore < 50;

  // Start a new game
  const startGame = (game: Game) => {
    const gameWithTime = {
      ...game,
      startedAt: new Date(),
      endsAt: new Date(Date.now() + game.duration * 1000),
    };
    setCurrentGame(gameWithTime);
    setGameActive(true);
    setTimeLeft(game.duration);
    setGameResult(null);
    setUserAnswer('');
  };

  // Handle game timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      endGame(false);
    }

    return () => clearTimeout(timer);
  }, [timeLeft, gameActive]);

  // End the game
  const endGame = (success: boolean) => {
    if (!currentGame) return;
    
    setGameActive(false);
    
    if (success) {
      setGameResult({
        success: true,
        message: 'Great job! Ready to participate in the session?'
      });
      
      // Close the game after a short delay
      setTimeout(() => {
        setShowChallenge(false);
        if (onComplete) onComplete();
      }, 2000);
    } else {
      setGameResult({
        success: false,
        message: 'Time\'s up! Check out the session activities!'
      });
    }
  };

  // Handle answer submission
  const handleSubmit = () => {
    if (!currentGame) return;
    
    let isCorrect = false;
    
    if (currentGame.type === 'wordchain') {
      const lastLetter = currentGame.question?.split(' ').pop()?.toLowerCase().slice(-1);
      isCorrect = userAnswer.toLowerCase().startsWith(lastLetter || '');
    } else if (currentGame.options) {
      // For quiz/trivia with multiple choice
      const selectedIndex = currentGame.options.indexOf(userAnswer);
      isCorrect = selectedIndex === currentGame.correctAnswer;
    }
    
    endGame(isCorrect);
  };

  // Skip the current challenge
  const skipChallenge = () => {
    setShowChallenge(false);
    // Show again after 5 minutes if engagement is still low
    setTimeout(() => setShowChallenge(true), 5 * 60 * 1000);
  };

  // Don't show if engagement is high or user dismissed
  if (!isEngagementLow || !showChallenge) return null;

  return (
    <Card className="mb-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Brain Teaser!
            </CardTitle>
            <CardDescription className="text-purple-200">
              Take a quick break with this fun challenge!
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={skipChallenge}
            className="text-purple-300 hover:bg-purple-800/50 hover:text-white"
          >
            Maybe later
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!currentGame ? (
          <div className="space-y-4">
            <h4 className="font-medium text-white">Choose a challenge:</h4>
            <div className="grid gap-3 md:grid-cols-3">
              {availableGames.map((game) => (
                <div 
                  key={game.id} 
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-colors cursor-pointer"
                  onClick={() => startGame(game)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-white">{game.title}</h3>
                      <p className="text-sm text-gray-300 mt-1">{game.description}</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {game.duration} sec
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-white">{currentGame.title}</h4>
              <div className="flex items-center text-sm text-yellow-400">
                <Clock className="w-4 h-4 mr-1" />
                {timeLeft}s left
              </div>
            </div>
            
            <p className="text-gray-300">{currentGame.question}</p>
            
            {gameResult && (
              <div className={`p-4 rounded-lg mb-4 ${
                gameResult.success 
                  ? 'bg-green-900/30 border border-green-700/50' 
                  : 'bg-amber-900/30 border border-amber-700/50'
              }`}>
                <div className="flex items-center">
                  {gameResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-400 mr-2" />
                  )}
                  <p className="text-sm">{gameResult.message}</p>
                </div>
                {!gameResult.success && (
                  <div className="mt-3 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs bg-transparent hover:bg-white/10 border-white/20 text-white"
                      onClick={() => {
                        setGameResult(null);
                        setCurrentGame(null);
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {gameResult ? (
              <div className={`p-4 rounded-lg ${gameResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="flex items-center gap-2">
                  {gameResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={gameResult.success ? 'text-green-300' : 'text-red-300'}>
                    {gameResult.message}
                  </p>
                </div>
                <Button 
                  onClick={() => setCurrentGame(null)}
                  className="mt-3"
                  variant={gameResult.success ? 'default' : 'outline'}
                >
                  {gameResult.success ? 'Play Another' : 'Try Again'}
                </Button>
              </div>
            ) : (
              <>
                {currentGame.options ? (
                  <div className="grid gap-2">
                    {currentGame.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`justify-start ${userAnswer === option ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10'}`}
                        onClick={() => setUserAnswer(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full p-2 rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Type your answer..."
                    autoFocus
                  />
                )}
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentGame(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSubmit}
                    disabled={!userAnswer}
                  >
                    Submit
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
