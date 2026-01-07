"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Clock } from "lucide-react";
import { Button, Card } from "@/components/ui";

interface MemoryMatchProps {
  onComplete: (score: number, maxScore: number, duration: number, metadata: Record<string, unknown>) => void;
  difficulty?: number;
}

interface GameCard {
  id: string;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_PAIRS = [
  ["🌟", "🌟"], ["🎈", "🎈"], ["🌸", "🌸"], ["🎵", "🎵"],
  ["🍎", "🍎"], ["🌈", "🌈"], ["🦋", "🦋"], ["🎨", "🎨"],
  ["🌻", "🌻"], ["🎪", "🎪"], ["🎭", "🎭"], ["🎯", "🎯"],
];

export function MemoryMatch({ onComplete, difficulty = 1 }: MemoryMatchProps) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalScore, setFinalScore] = useState<{ score: number; duration: number; metadata: Record<string, unknown> } | null>(null);

  const pairCount = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
  const maxScore = pairCount;

  // Initialize game
  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, gameOver]);

  const initializeGame = useCallback(() => {
    const selectedPairs = EMOJI_PAIRS.slice(0, pairCount);
    const gameCards: GameCard[] = [];

    selectedPairs.forEach((pair, pairIndex) => {
      pair.forEach((emoji, cardIndex) => {
        gameCards.push({
          id: `${pairIndex}-${cardIndex}`,
          content: emoji,
          isFlipped: false,
          isMatched: false,
        });
      });
    });

    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    setCards(gameCards);
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setGameOver(false);
    setIsLocked(false);
  }, [pairCount]);

  const handleCardClick = (cardId: string) => {
    if (isLocked || gameOver) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // Flip the card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      setIsLocked(true);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.content === secondCard.content) {
        // Match found!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches((prev) => {
            const newMatches = prev + 1;
            if (newMatches === pairCount) {
              setGameOver(true);
              const duration = Math.floor((Date.now() - startTime) / 1000);
              setFinalScore({
                score: pairCount,
                duration,
                metadata: {
                  moves,
                  difficulty,
                  pairCount,
                },
              });
            }
            return newMatches;
          });
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        // No match, flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Trophy className="h-5 w-5 text-primary-500" />
            <span className="font-medium">
              {matches}/{pairCount} pairs
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-5 w-5" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={initializeGame}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Game Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${pairCount === 4 ? 4 : pairCount === 6 ? 4 : 4}, 1fr)`,
        }}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0, rotateY: 0 }}
              animate={{
                scale: card.isMatched ? [1, 1.1, 0] : 1,
                rotateY: card.isFlipped ? 180 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="aspect-square"
            >
              <button
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || card.isFlipped || isLocked}
                className={`w-full h-full rounded-xl text-4xl flex items-center justify-center transition-all duration-300 transform-gpu ${
                  card.isFlipped || card.isMatched
                    ? "bg-white shadow-md"
                    : "bg-primary-100 hover:bg-primary-200 cursor-pointer"
                } ${card.isMatched ? "opacity-0" : ""}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {(card.isFlipped || card.isMatched) && (
                  <span style={{ transform: "rotateY(180deg)" }}>
                    {card.content}
                  </span>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Over */}
      {gameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6 text-center bg-success-50 border border-success-200">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Excellent Memory!
            </h3>
            <p className="text-gray-600 mb-4">
              You found all pairs in {moves} moves and {formatTime(elapsedTime)}!
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={initializeGame} className="flex-1">
                Play Again
              </Button>
              <Button
                onClick={() => {
                  if (finalScore) {
                    onComplete(finalScore.score, maxScore, finalScore.duration, finalScore.metadata);
                  }
                }}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Moves Counter */}
      <p className="text-center text-gray-500">
        Moves: <span className="font-medium">{moves}</span>
      </p>
    </div>
  );
}
