"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Trophy,
  Flame,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Calendar,
  Play,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/navigation/top-bar";
import { MemoryMatch, WordRecall, DailyQuiz } from "@/components/games";

type GameType = "memory-match" | "word-recall" | "daily-quiz" | null;
type Difficulty = "easy" | "medium" | "hard";

interface GameStats {
  gamesPlayed: number;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
  lastPlayedAt: string | null;
}

interface DailyChallenge {
  id: string;
  game: GameType;
  difficulty: Difficulty;
  targetScore: number;
  completed: boolean;
  reward: number;
}

const games = [
  {
    id: "memory-match" as GameType,
    name: "Memory Match",
    description: "Match pairs of cards to exercise visual memory",
    icon: Brain,
    color: "from-purple-500 to-indigo-500",
    estimatedTime: "2-5 min",
    difficulty: "Easy to Hard",
  },
  {
    id: "word-recall" as GameType,
    name: "Word Recall",
    description: "Memorize and recall words to strengthen verbal memory",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-500",
    estimatedTime: "3-5 min",
    difficulty: "Easy to Hard",
  },
  {
    id: "daily-quiz" as GameType,
    name: "Daily Quiz",
    description: "Test your knowledge with AI-generated questions",
    icon: Target,
    color: "from-orange-500 to-red-500",
    estimatedTime: "5-10 min",
    difficulty: "Adaptive",
  },
];

export default function TrainPage() {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    totalScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageScore: 0,
    lastPlayedAt: null,
  });
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    generateDailyChallenge();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/games/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyChallenge = () => {
    // Generate a deterministic daily challenge based on date
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const gameIndex = seed % games.length;
    const difficulties: Difficulty[] = ["easy", "medium", "hard"];
    const difficultyIndex = (seed % 7) % 3;

    setDailyChallenge({
      id: `daily-${seed}`,
      game: games[gameIndex].id,
      difficulty: difficulties[difficultyIndex],
      targetScore: 70 + difficultyIndex * 10,
      completed: false,
      reward: 50 + difficultyIndex * 25,
    });
  };

  const handleGameComplete = async (score: number, maxScore: number, duration: number, metadata: Record<string, unknown>) => {
    // Calculate accuracy as a percentage
    const accuracy = maxScore > 0 ? Math.round((score / maxScore) * 100) : score;
    
    // Save game session
    try {
      await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: activeGame,
          score: accuracy, // Store as percentage
          accuracy,
          duration,
          difficulty: selectedDifficulty,
          ...metadata,
        }),
      });

      // Update local stats
      setStats((prev) => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        totalScore: prev.totalScore + accuracy,
        averageScore: Math.round((prev.totalScore + accuracy) / (prev.gamesPlayed + 1)),
        currentStreak: isConsecutiveDay(prev.lastPlayedAt) ? prev.currentStreak + 1 : 1,
        bestStreak: Math.max(
          prev.bestStreak,
          isConsecutiveDay(prev.lastPlayedAt) ? prev.currentStreak + 1 : 1
        ),
        lastPlayedAt: new Date().toISOString(),
      }));

      // Check daily challenge
      if (dailyChallenge && activeGame === dailyChallenge.game && accuracy >= dailyChallenge.targetScore) {
        setDailyChallenge((prev) => (prev ? { ...prev, completed: true } : null));
      }
    } catch (error) {
      console.error("Failed to save game:", error);
    }

    setActiveGame(null);
  };

  const difficultyToNumber = (diff: Difficulty): number => {
    switch (diff) {
      case "easy": return 1;
      case "medium": return 2;
      case "hard": return 3;
      default: return 2;
    }
  };

  const isConsecutiveDay = (lastPlayed: string | null): boolean => {
    if (!lastPlayed) return false;
    const last = new Date(lastPlayed);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  };

  const renderGame = () => {
    const numericDifficulty = difficultyToNumber(selectedDifficulty);
    const gameName = games.find(g => g.id === activeGame)?.name || "Game";
    
    switch (activeGame) {
      case "memory-match":
        return (
          <MemoryMatch
            difficulty={numericDifficulty}
            onComplete={handleGameComplete}
          />
        );
      case "word-recall":
        return (
          <WordRecall
            difficulty={numericDifficulty}
            onComplete={handleGameComplete}
          />
        );
      case "daily-quiz":
        return (
          <DailyQuiz
            onComplete={handleGameComplete}
          />
        );
      default:
        return null;
    }
  };

  if (activeGame) {
    const gameName = games.find(g => g.id === activeGame)?.name || "Game";
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBar title={gameName} showBack onBack={() => setActiveGame(null)} />
        <div className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-8 pt-4 md:pt-8">
          {renderGame()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Brain Training" showBack />

      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-8 space-y-6 md:space-y-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalScore}</p>
                <p className="text-xs text-gray-500">Total Points</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.gamesPlayed}</p>
                <p className="text-xs text-gray-500">Games Played</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Daily Challenge */}
        {dailyChallenge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`p-4 border-2 ${
              dailyChallenge.completed 
                ? "bg-emerald-500/10 border-emerald-500/50" 
                : "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/50"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-gray-900">Daily Challenge</h3>
                </div>
                {dailyChallenge.completed ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Completed!
                  </Badge>
                ) : (
                  <Badge variant="warning">+{dailyChallenge.reward} pts</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700">
                    {games.find((g) => g.id === dailyChallenge.game)?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Score {dailyChallenge.targetScore}% or higher on {dailyChallenge.difficulty}
                  </p>
                </div>
                {!dailyChallenge.completed && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDifficulty(dailyChallenge.difficulty);
                      setActiveGame(dailyChallenge.game);
                    }}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Play
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Difficulty Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3">Select Difficulty</h3>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
              <Button
                key={diff}
                variant={selectedDifficulty === diff ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDifficulty(diff)}
                className={`flex-1 capitalize ${
                  selectedDifficulty === diff
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {diff}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Games List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm md:text-base font-medium text-gray-600 mb-3 md:mb-4">Choose a Game</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:border-gray-300 transition-all duration-200 group"
                  onClick={() => setActiveGame(game.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg`}
                    >
                      <game.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {game.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {game.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Target className="w-3 h-3" />
                          {game.difficulty}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Progress + Tips - side by side on tablet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4 md:p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">This Week&apos;s Progress</h3>
                <span className="text-sm text-gray-500">{stats.gamesPlayed}/7 days</span>
              </div>
              <Progress 
                value={(stats.gamesPlayed / 7) * 100} 
                className="h-2 bg-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2">
                {stats.gamesPlayed >= 7
                  ? "🎉 You've completed your weekly goal!"
                  : `Play ${7 - stats.gamesPlayed} more days to complete your weekly goal`}
              </p>
            </Card>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="p-4 md:p-6 bg-gray-100 border-gray-200 h-full">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Training Tip</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Consistent daily practice, even for just 5 minutes, is more effective than
                    occasional longer sessions. Try to maintain your streak!
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
