"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X, Calendar, Lightbulb } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import type { QuizQuestion } from "@/types";

interface DailyQuizProps {
  onComplete: (score: number, maxScore: number, duration: number, metadata: Record<string, unknown>) => void;
  customQuestions?: QuizQuestion[];
}

// Default quiz questions (will be replaced with memory-based questions when available)
const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: "1",
    question: "What activity helps improve memory retention?",
    options: [
      "Watching TV",
      "Regular exercise",
      "Sleeping less",
      "Eating fast food",
    ],
    correctAnswer: 1,
  },
  {
    id: "2",
    question: "Which of these is a good habit for brain health?",
    options: [
      "Skipping breakfast",
      "Reading regularly",
      "Avoiding social interaction",
      "Staying up late",
    ],
    correctAnswer: 1,
  },
  {
    id: "3",
    question: "What type of food is beneficial for brain function?",
    options: [
      "Sugary snacks",
      "Processed foods",
      "Fatty fish like salmon",
      "Fried foods",
    ],
    correctAnswer: 2,
  },
  {
    id: "4",
    question: "How much sleep do adults typically need for optimal brain function?",
    options: [
      "4-5 hours",
      "5-6 hours",
      "7-9 hours",
      "10-12 hours",
    ],
    correctAnswer: 2,
  },
  {
    id: "5",
    question: "Which activity can help maintain cognitive function as you age?",
    options: [
      "Watching the same shows repeatedly",
      "Learning new skills",
      "Avoiding challenges",
      "Sticking to familiar routines only",
    ],
    correctAnswer: 1,
  },
];

export function DailyQuiz({ onComplete, customQuestions }: DailyQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ correct: boolean; selected: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [finalScore, setFinalScore] = useState<{ score: number; duration: number; metadata: Record<string, unknown> } | null>(null);

  // Initialize quiz
  useEffect(() => {
    const quizQuestions = customQuestions || DEFAULT_QUESTIONS;
    // Shuffle and take 5 questions
    const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);
  }, [customQuestions]);

  const currentQuestion = questions[currentIndex];
  const score = answers.filter((a) => a.correct).length;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newAnswers = [...answers, { correct: isCorrect, selected: selectedAnswer }];
    setAnswers(newAnswers);
    setShowResult(true);

    // Move to next question after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Quiz complete
        setIsComplete(true);
        const finalScoreValue = newAnswers.filter((a) => a.correct).length;
        const duration = Math.floor((Date.now() - startTime) / 1000);
        setFinalScore({
          score: finalScoreValue,
          duration,
          metadata: {
            answers: newAnswers,
            questionsCount: questions.length,
          },
        });
      }
    }, 1500);
  };

  const handlePlayAgain = useCallback(() => {
    const quizQuestions = customQuestions || DEFAULT_QUESTIONS;
    const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
    setIsComplete(false);
  }, [customQuestions]);

  if (questions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Loading quiz...</p>
      </Card>
    );
  }

  // Results screen
  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? "🏆" : percentage >= 60 ? "🌟" : "💪"}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {score} / {questions.length}
          </h2>
          <p className="text-lg text-gray-500 mb-6">
            {percentage >= 80
              ? "Excellent! Your memory is sharp!"
              : percentage >= 60
              ? "Good job! Keep practicing!"
              : "Keep going! Practice makes perfect!"}
          </p>

          {/* Answer breakdown */}
          <div className="flex justify-center gap-2 mb-6">
            {answers.map((answer, idx) => (
              <div
                key={idx}
                className={`h-3 w-3 rounded-full ${
                  answer.correct ? "bg-success-500" : "bg-error-500"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePlayAgain} className="flex-1">
              Play Again
            </Button>
            <Button
              onClick={() => {
                if (finalScore) {
                  onComplete(finalScore.score, questions.length, finalScore.duration, finalScore.metadata);
                }
              }}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <Badge variant="primary">
          <Calendar className="h-3 w-3 mr-1" />
          Daily Quiz
        </Badge>
        <span className="text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <Lightbulb className="h-4 w-4 text-primary-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Source reference if available */}
        {currentQuestion.sourceRecording && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            From your recording on {currentQuestion.sourceRecording.date}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQuestion.correctAnswer;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isSelected && !isCorrect;

            return (
              <motion.button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  showCorrect
                    ? "bg-success-100 border-2 border-success-500"
                    : showWrong
                    ? "bg-error-100 border-2 border-error-500"
                    : isSelected
                    ? "bg-primary-50 border-2 border-primary-500"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium ${
                      showCorrect
                        ? "text-success-700"
                        : showWrong
                        ? "text-error-700"
                        : isSelected
                        ? "text-primary-700"
                        : "text-gray-700"
                    }`}
                  >
                    {option}
                  </span>
                  {showCorrect && <Check className="h-5 w-5 text-success-500" />}
                  {showWrong && <X className="h-5 w-5 text-error-500" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Submit button */}
      {!showResult && (
        <Button
          onClick={handleSubmitAnswer}
          disabled={selectedAnswer === null}
          className="w-full"
        >
          Submit Answer
        </Button>
      )}

      {/* Score so far */}
      <p className="text-center text-sm text-gray-500">
        Score: {score} correct so far
      </p>
    </div>
  );
}
