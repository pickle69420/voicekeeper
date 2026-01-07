"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Brain } from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui";

interface WordRecallProps {
  onComplete: (score: number, maxScore: number, duration: number, metadata: Record<string, unknown>) => void;
  difficulty?: number;
}

// Word sets by difficulty
const WORD_SETS = {
  easy: [
    ["apple", "house", "water", "happy", "cloud"],
    ["music", "garden", "beach", "flower", "smile"],
    ["sunny", "dance", "bread", "friend", "sleep"],
  ],
  medium: [
    ["memory", "journey", "kitchen", "rainbow", "harmony", "blanket"],
    ["whisper", "morning", "courage", "picture", "comfort", "library"],
    ["weather", "holiday", "message", "laughter", "pattern", "chapter"],
  ],
  hard: [
    ["adventure", "beautiful", "celebrate", "discovery", "excellent", "gratitude", "happiness"],
    ["important", "knowledge", "mountains", "nostalgia", "wonderful", "yesterday", "abundance"],
  ],
};

type GamePhase = "memorize" | "recall" | "results";

export function WordRecall({ onComplete, difficulty = 1 }: WordRecallProps) {
  const [phase, setPhase] = useState<GamePhase>("memorize");
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [results, setResults] = useState<{ word: string; input: string; correct: boolean }[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [finalScore, setFinalScore] = useState<{ score: number; duration: number; metadata: Record<string, unknown> } | null>(null);

  const difficultyLevel = difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard";
  const displayDuration = difficulty === 1 ? 3000 : difficulty === 2 ? 2500 : 2000;

  // Initialize game
  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const initializeGame = useCallback(() => {
    const wordSets = WORD_SETS[difficultyLevel];
    const randomSet = wordSets[Math.floor(Math.random() * wordSets.length)];
    setWords(randomSet);
    setCurrentWordIndex(0);
    setUserInputs([]);
    setCurrentInput("");
    setPhase("memorize");
    setResults([]);
    setStartTime(Date.now());
  }, [difficultyLevel]);

  // Memorize phase: show words one by one
  useEffect(() => {
    if (phase !== "memorize" || words.length === 0) return;
    
    // Guard against going over the limit
    if (currentWordIndex >= words.length) {
      setPhase("recall");
      return;
    }

    // Show each word for displayDuration, then move to next
    const timer = setTimeout(() => {
      const nextIndex = currentWordIndex + 1;
      if (nextIndex >= words.length) {
        // All words shown, move to recall phase
        setPhase("recall");
      } else {
        setCurrentWordIndex(nextIndex);
      }
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [phase, currentWordIndex, words.length, displayDuration]);

  const handleInputSubmit = () => {
    if (!currentInput.trim()) return;

    const newInputs = [...userInputs, currentInput.toLowerCase().trim()];
    setUserInputs(newInputs);
    setCurrentInput("");

    if (newInputs.length >= words.length) {
      // Calculate results with free recall (any order counts)
      const inputsLower = newInputs.map((i) => i.toLowerCase());
      const wordsLower = words.map((w) => w.toLowerCase());
      
      // Track which words were correctly recalled
      const matchedWords = new Set<string>();
      inputsLower.forEach((input) => {
        if (wordsLower.includes(input) && !matchedWords.has(input)) {
          matchedWords.add(input);
        }
      });

      const gameResults = words.map((word) => ({
        word,
        input: "",
        correct: matchedWords.has(word.toLowerCase()),
      }));
      setResults(gameResults);
      setPhase("results");

      const score = matchedWords.size;
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setFinalScore({
        score,
        duration,
        metadata: {
          difficulty,
          wordCount: words.length,
          correctWords: Array.from(matchedWords),
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    }
  };

  const handleGiveUp = () => {
    // Calculate results with free recall (any order counts)
    const inputsLower = userInputs.map((i) => i.toLowerCase());
    const wordsLower = words.map((w) => w.toLowerCase());
    
    // Track which words were correctly recalled
    const matchedWords = new Set<string>();
    inputsLower.forEach((input) => {
      if (wordsLower.includes(input) && !matchedWords.has(input)) {
        matchedWords.add(input);
      }
    });

    const gameResults = words.map((word) => ({
      word,
      input: "",
      correct: matchedWords.has(word.toLowerCase()),
    }));
    setResults(gameResults);
    setPhase("results");

    const score = matchedWords.size;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    setFinalScore({
      score,
      duration,
      metadata: {
        difficulty,
        wordCount: words.length,
        correctWords: Array.from(matchedWords),
        gaveUp: true,
      },
    });
  };

  const handleContinue = () => {
    if (finalScore) {
      onComplete(finalScore.score, words.length, finalScore.duration, finalScore.metadata);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Difficulty: {difficultyLevel}</span>
        <span>
          {phase === "memorize"
            ? `Memorizing ${currentWordIndex + 1}/${words.length}`
            : phase === "recall"
            ? `Recalled ${userInputs.length}/${words.length}`
            : "Results"}
        </span>
      </div>

      {/* Memorize Phase */}
      {phase === "memorize" && currentWordIndex < words.length && (
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-500">
            <Brain className="h-5 w-5 text-primary-500" />
            <span>Remember this word ({currentWordIndex + 1}/{words.length})</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentWordIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-5xl font-semibold text-gray-900"
            >
              {words[currentWordIndex]}
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-8">
            {words.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-colors ${
                  idx < currentWordIndex
                    ? "bg-primary-500"
                    : idx === currentWordIndex
                    ? "bg-primary-300"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recall Phase */}
      {phase === "recall" && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Time to recall!
            </h3>
            <p className="text-gray-500">
              Enter the {words.length} words you just saw
            </p>
          </div>

          {/* Already entered words */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {userInputs.map((input, idx) => (
              <Badge key={idx} variant="primary">
                {idx + 1}. {input}
              </Badge>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Word ${userInputs.length + 1} of ${words.length}`}
              autoFocus
              className="flex-1"
            />
            <Button onClick={handleInputSubmit} disabled={!currentInput.trim()}>
              Next
            </Button>
          </div>

          <p className="text-center text-sm text-gray-400">
            Press Enter to submit each word
          </p>

          <Button
            variant="secondary"
            onClick={handleGiveUp}
            className="w-full"
          >
            I don&apos;t remember the rest
          </Button>
        </div>
      )}

      {/* Results Phase */}
      {phase === "results" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Score */}
          <Card className="p-6 text-center">
            <div className="text-6xl mb-4">
              {results.filter((r) => r.correct).length >= words.length * 0.8
                ? "🏆"
                : results.filter((r) => r.correct).length >= words.length * 0.5
                ? "👍"
                : "💪"}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {results.filter((r) => r.correct).length} / {words.length}
            </h3>
            <p className="text-gray-500">words recalled correctly</p>
          </Card>

          {/* Word breakdown */}
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.correct ? "bg-success-50" : "bg-error-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.correct ? (
                    <Check className="h-5 w-5 text-success-500" />
                  ) : (
                    <X className="h-5 w-5 text-error-500" />
                  )}
                  <span className="font-medium text-gray-900">{result.word}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {result.correct ? "Recalled" : "Missed"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={initializeGame} className="flex-1">
              Play Again
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              Continue
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
