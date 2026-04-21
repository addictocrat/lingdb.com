"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Button from "@/components/ui/Button";
import { Word } from "@/lib/db/schema";
import { Check, X } from "lucide-react";

export type QuestionType = "multiple_choice" | "reverse_choice" | "type_answer";

export interface Question {
  id: string; // from Word.id
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options?: string[]; // only for multiple_choice and reverse_choice
  wordRef: Word;
}

interface QuizQuestionProps {
  question: Question;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
}

export default function QuizQuestion({
  question,
  onAnswer,
}: QuizQuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Focus input if type answer
  useGSAP(() => {
    if (question.type === "type_answer") {
      const input = document.getElementById("type-answer-input");
      if (input) input.focus();
    }

    // Animate in
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.3 },
    );
  }, { dependencies: [question], scope: containerRef });

  const handleChoiceClick = (
    option: string,
    buttonRef: HTMLButtonElement | null,
  ) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOption(option);

    const isCorrect = option === question.correctAnswer;

    if (buttonRef) {
      if (isCorrect) {
        gsap.to(buttonRef, {
          backgroundColor: "rgb(34, 197, 94)",
          color: "white",
          duration: 0.2,
        });
      } else {
        gsap.to(buttonRef, {
          backgroundColor: "rgb(239, 68, 68)",
          color: "white",
          duration: 0.2,
        });
        gsap.to(buttonRef, {
          keyframes: [{ x: -10 }, { x: 10 }, { x: -10 }, { x: 10 }, { x: 0 }],
          duration: 0.4,
          ease: "power2.out",
        });
      }
    }

    setTimeout(() => {
      onAnswer(isCorrect, option);
    }, 1000);
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasAnswered || !typedAnswer.trim()) return;
    setHasAnswered(true);

    const cleanAnswer = typedAnswer.trim().toLowerCase();
    const cleanCorrect = question.correctAnswer.toLowerCase();

    // Very basic fuzzy match: exact match or correct answer included (for articles)
    const isCorrect =
      cleanAnswer === cleanCorrect ||
      (cleanCorrect.includes(cleanAnswer) && cleanAnswer.length > 3);

    const inputArea = document.getElementById("type-answer-area");
    if (inputArea) {
      if (isCorrect) {
        gsap.to(inputArea, { borderColor: "rgb(34, 197, 94)", duration: 0.2 });
      } else {
        gsap.to(inputArea, { borderColor: "rgb(239, 68, 68)", duration: 0.2 });
        gsap.to(inputArea, {
          keyframes: [{ x: -10 }, { x: 10 }, { x: -10 }, { x: 10 }, { x: 0 }],
          duration: 0.4,
          ease: "power2.out",
        });
      }
    }

    setTimeout(() => {
      onAnswer(isCorrect, typedAnswer.trim());
    }, 1500);
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-xl mx-auto flex flex-col items-center p-6 bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl shadow-sm"
    >
      <h3 className="text-[var(--fg)]/60 text-lg uppercase tracking-widest font-semibold mb-6">
        {question.type === "multiple_choice" && "Select Translation"}
        {question.type === "reverse_choice" && "Select Word"}
        {question.type === "type_answer" && "Type Translation"}
      </h3>

      <div className="text-4xl sm:text-5xl font-bold text-center mb-10 w-full min-h-[80px] flex items-center justify-center">
        {question.prompt}
      </div>

      {(question.type === "multiple_choice" ||
        question.type === "reverse_choice") &&
        question.options && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {question.options.map((option) => {
              const isCorrect = option === question.correctAnswer;
              const isSelected = selectedOption === option;

              return (
                <button
                  key={option}
                  disabled={hasAnswered}
                  ref={(el) => {
                    if (isSelected && el && hasAnswered) {
                      if (isCorrect) {
                        el.style.backgroundColor = "rgb(34, 197, 94)";
                        el.style.color = "white";
                      } else {
                        el.style.backgroundColor = "rgb(239, 68, 68)";
                        el.style.color = "white";
                      }
                    } else if (el && hasAnswered && isCorrect) {
                      // Highlight correct answer if wrong one was picked
                      el.style.backgroundColor = "rgba(34, 197, 94, 0.2)";
                      el.style.borderColor = "rgb(34, 197, 94)";
                    }
                  }}
                  onClick={(e) => handleChoiceClick(option, e.currentTarget)}
                  className={`p-4 text-center rounded-xl border-2 transition-all font-medium text-xl ${
                    hasAnswered
                      ? "cursor-default opacity-90 border-[var(--border-color)]"
                      : "border-[var(--border-color)] hover:border-primary-500 hover:bg-primary-50/10 active:scale-95 cursor-pointer"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

      {question.type === "type_answer" && (
        <form onSubmit={handleTypeSubmit} className="w-full relative">
          <div
            id="type-answer-area"
            className="w-full rounded-xl border-2 border-[var(--border-color)] p-2 transition-colors"
          >
            <input
              id="type-answer-input"
              type="text"
              name="answer"
              autoComplete="off"
              disabled={hasAnswered}
              placeholder="Type here..."
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              className="w-full bg-transparent p-3 text-2xl text-center focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={hasAnswered || !typedAnswer.trim()}
            className="w-full mt-6"
          >
            Check Answer
          </Button>

          {hasAnswered && (
            <div
              className={`mt-6 p-4 rounded-xl flex items-center gap-3 w-full justify-center ${
                typedAnswer.trim().toLowerCase() ===
                  question.correctAnswer.toLowerCase() ||
                (question.correctAnswer
                  .toLowerCase()
                  .includes(typedAnswer.trim().toLowerCase()) &&
                  typedAnswer.trim().toLowerCase().length > 3)
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {typedAnswer.trim().toLowerCase() ===
                question.correctAnswer.toLowerCase() ||
              (question.correctAnswer
                .toLowerCase()
                .includes(typedAnswer.trim().toLowerCase()) &&
                typedAnswer.trim().toLowerCase().length > 3) ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Correct!</span>
                </>
              ) : (
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">Incorrect</span>
                  </div>
                  <p className="text-lg opacity-90 w-full whitespace-normal">
                    Correct answer: <strong>{question.correctAnswer}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
