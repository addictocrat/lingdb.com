'use client';

import { useState, useEffect, useCallback } from 'react';
import QuizQuestion, { Question, QuestionType } from './QuizQuestion';
import QuizResults from './QuizResults';
import type { Word } from '@/lib/db/schema';

function generateOptions(
  correctAnswer: string,
  allPossible: string[]
): string[] {
  const wrongAnswers = Array.from(new Set(allPossible)).filter(
    (a) => a !== correctAnswer
  );
  const shuffledWrong = wrongAnswers
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return [correctAnswer, ...shuffledWrong].sort(() => Math.random() - 0.5);
}

export default function QuizEngine({
  words,
  dictionaryId,
}: {
  words: Word[];
  dictionaryId: string;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<
    { word: Word; userAnswer: string }[]
  >([]);
  const [isFinished, setIsFinished] = useState(false);

  const generateQuiz = useCallback(() => {
    // Generate questions
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    // Take up to 20 words for a quiz
    const quizWords = shuffledWords.slice(0, 20);

    const types: QuestionType[] = [
      'multiple_choice',
      'reverse_choice',
      'type_answer',
    ];

    const generated: Question[] = quizWords.map((word) => {
      const type = types[Math.floor(Math.random() * types.length)];

      let prompt = '';
      let correctAnswer = '';
      let options: string[] | undefined;

      if (type === 'multiple_choice') {
        prompt = word.title;
        correctAnswer = word.translation;
        options = generateOptions(
          word.translation,
          words.map((w) => w.translation)
        );
      } else if (type === 'reverse_choice') {
        prompt = word.translation;
        correctAnswer = word.title;
        options = generateOptions(
          word.title,
          words.map((w) => w.title)
        );
      } else {
        prompt = word.title;
        correctAnswer = word.translation;
      }

      return {
        id: word.id,
        type,
        prompt,
        correctAnswer,
        options,
        wordRef: word,
      };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setIncorrectAnswers([]);
    setIsFinished(false);
  }, [words]);

  useEffect(() => {
    generateQuiz();
  }, [generateQuiz]);

  const handleAnswer = (isCorrect: boolean, userAnswer: string) => {
    const currentScore = score + (isCorrect ? 1 : 0);
    const updatedIncorrect = isCorrect
      ? incorrectAnswers
      : [
          ...incorrectAnswers,
          { word: questions[currentIndex].wordRef, userAnswer: userAnswer || '(blank)' },
        ];

    if (isCorrect) {
      setScore(currentScore);
    } else {
      setIncorrectAnswers(updatedIncorrect);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      finishQuiz(currentScore, questions.length, updatedIncorrect);
    }
  };

  const finishQuiz = async (
    finalScore: number,
    total: number,
    finalIncorrect: { word: Word; userAnswer: string }[]
  ) => {
    setIsFinished(true);
    setScore(finalScore);
    setIncorrectAnswers(finalIncorrect);
    const percentage = Math.round((finalScore / total) * 100);
    const qTypes = Array.from(new Set(questions.map((q) => q.type)));

    try {
      await fetch('/api/study/quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dictionaryId,
          score: finalScore,
          totalQuestions: total,
          percentage,
          questionTypes: qTypes,
          duration: 0, // Placeholder
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--fg)]/60">
        Generating quiz...
      </div>
    );
  }

  if (isFinished) {
    return (
      <QuizResults
        score={score}
        totalQuestions={questions.length}
        percentage={Math.round((score / questions.length) * 100)}
        incorrectAnswers={incorrectAnswers}
        onRetry={generateQuiz}
        dictionaryId={dictionaryId}
      />
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex w-full justify-center py-6">
      <div className="flex w-full max-w-2xl flex-col items-center px-4">
        <div className="mb-4 h-3 w-full overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--surface)]">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${(currentIndex / questions.length) * 100}%` }}
          />
        </div>
        <div className="mb-8 self-start text-lg font-semibold text-[var(--fg)]/60 px-2">
          Question {currentIndex + 1} of {questions.length}
        </div>

        <QuizQuestion
          key={currentQ.id + currentIndex}
          question={currentQ}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}
