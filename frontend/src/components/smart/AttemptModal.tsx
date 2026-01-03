// frontend/src/components/smart/AttemptModal.tsx
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Timer, Check, AlertCircle, Star, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ent } from "../../wailsjs/go/models";
import { ReviewCard } from "../../wailsjs/go/app/App";
import StyledButton from "../atomic/StylizedButton";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import { toast } from 'sonner';

interface AttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: ent.Node;
}

type ModalStep = "answering" | "grading";

export default function AttemptModal({ isOpen, onClose, node }: AttemptModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ModalStep>("answering");
  const [answer, setAnswer] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Grading State
  const [fsrsGrade, setFsrsGrade] = useState<number | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number>(5); // 1-10
  const [errorLog, setErrorLog] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartTime(Date.now());
      setElapsed(0);
      setStep("answering");
      setAnswer("");
      setFsrsGrade(null);
      setDifficultyRating(5);
      setErrorLog("");

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 10); // Update every 10ms for millisecond precision
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, startTime]);

  const handleStopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(Date.now() - startTime);
    setStep("grading");
  };

  const handleStarClick = (star: number) => {
    const starValue = star * 2; // Each star represents 2 points (full star)
    const halfValue = starValue - 1; // Half star is 1 point less

    if (difficultyRating === starValue) {
      // Third click: Full star -> Remove (go to previous star's value)
      setDifficultyRating(halfValue - 1);
    } else if (difficultyRating === halfValue) {
      // Second click: Half star -> Full star
      setDifficultyRating(starValue);
    } else {
      // First click: Empty -> Half star
      setDifficultyRating(halfValue);
    }
  };

  const handleSubmit = async () => {
    if (!fsrsGrade) return;

    try {
      const payload = JSON.stringify({
        text: answer,
        errorLog: errorLog,
        userDifficultyRating: difficultyRating,
        submittedAt: new Date().toISOString()
      });

      const duration = Date.now() - startTime;

      await ReviewCard(String(node.id), fsrsGrade, duration, payload);

      await queryClient.invalidateQueries({ queryKey: ["attempts", String(node.id)] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });

      toast.success("Attempt recorded!");
      onClose();
    } catch (e: any) {
      console.error("Failed to submit review:", e);
      toast.error("Failed to save attempt: " + e);
    }
  };

  if (!isOpen) return null;

  // Format: MM:SS.CS (centiseconds)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10); // 00-99

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  // Calculate next review intervals (Anki-style)
  const getNextIntervals = () => {
    // These are example intervals - adjust based on FSRS algorithm output
    return {
      1: "< 1m", // Again
      2: "5m",   // Hard
      3: "10m",  // Good
      4: "4d",   // Easy
    };
  };

  const intervals = getNextIntervals();

  const modal = (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div className="w-[90vw] max-w-5xl h-[90vh] bg-[#16161e] border border-[#2f334d] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">

        {/* Header */}
        <div className="h-16 px-8 border-b border-[#2f334d] flex items-center justify-between bg-[#1a1b26] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#89b4fa]/10 border border-[#89b4fa]/20 rounded-lg text-[#89b4fa]">
              <Timer size={16} />
              <span className="font-mono font-bold text-lg tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white truncate max-w-xl">{node.title}</h2>
          </div>
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Problem Content */}
          <div className="flex-1 p-8 overflow-y-auto border-r border-[#2f334d]">
            <div className="prose prose-invert max-w-none prose-headings:text-blue-300">
              <MarkdownRenderer content={node.body || "_No content provided._"} />
            </div>
          </div>

          {/* Right: Interaction Area */}
          <div className="w-112.5 flex flex-col bg-[#1a1b26]/50">

            {step === "answering" ? (
              <div className="flex-1 flex flex-col p-6 space-y-4 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <ChevronRight size={14} /> Your Solution
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your solution notes here (optional)..."
                  className="flex-1 bg-[#16161e] border border-[#2f334d] rounded-xl p-4 text-white resize-none focus:border-[#89b4fa] outline-none font-mono text-sm leading-relaxed"
                  autoFocus
                />
                <StyledButton
                  variant="primary"
                  size="lg"
                  onClick={handleStopTimer}
                  className="w-full"
                  rightElement={<ChevronRight size={16} />}
                >
                  REVEAL & GRADE
                </StyledButton>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 space-y-6 animate-in slide-in-from-right-4 overflow-y-auto">

                {/* 1. FSRS Grading with Intervals */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    How well did you know this?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 1, label: "Again", color: "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30" },
                      { val: 2, label: "Hard", color: "bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30" },
                      { val: 3, label: "Good", color: "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30" },
                      { val: 4, label: "Easy", color: "bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30" },
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        onClick={() => setFsrsGrade(btn.val)}
                        className={`p-3 rounded-xl border transition-all font-bold text-sm relative ${fsrsGrade === btn.val ? "ring-2 ring-white scale-[1.02]" : "opacity-70 hover:opacity-100"
                          } ${btn.color}`}
                      >
                        <div>{btn.label}</div>
                        <div className="text-[10px] font-normal mt-1 opacity-70">
                          {intervals[btn.val as keyof typeof intervals]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Error Logging */}
                {(fsrsGrade === 1 || fsrsGrade === 2) && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle size={14} /> What went wrong?
                    </label>
                    <textarea
                      value={errorLog}
                      onChange={(e) => setErrorLog(e.target.value)}
                      placeholder="Identify the gap in your knowledge..."
                      className="w-full h-24 bg-[#16161e] border border-red-900/30 rounded-lg p-3 text-sm text-gray-300 focus:border-red-500/50 outline-none resize-none"
                    />
                  </div>
                )}

                {/* 3. Difficulty Rating (1-10 with click system) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Problem Difficulty Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const starValue = star * 2; // Full star = 2, 4, 6, 8, 10
                      const halfValue = starValue - 1; // Half star = 1, 3, 5, 7, 9

                      const isFull = difficultyRating >= starValue;
                      const isHalf = difficultyRating === halfValue;

                      return (
                        <button
                          key={star}
                          onClick={() => handleStarClick(star)}
                          className={`transition-all hover:scale-110 ${isFull || isHalf ? "text-yellow-400" : "text-gray-700"
                            }`}
                          title={`Click 1: ${halfValue}/10 | Click 2: ${starValue}/10 | Click 3: Clear`}
                        >
                          <Star
                            size={28}
                            fill={isFull ? "currentColor" : isHalf ? "url(#half)" : "none"}
                            strokeWidth={2}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-sm text-gray-400 font-mono font-bold">
                      {difficultyRating}/10
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    Click: Empty → Half → Full → Empty
                  </p>
                </div>

                <div className="flex-1" />

                {/* Footer Actions */}
                <div className="flex gap-3 pt-6 border-t border-[#2f334d]">
                  <StyledButton variant="ghost" onClick={() => setStep("answering")} className="flex-1">
                    BACK
                  </StyledButton>
                  <StyledButton
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!fsrsGrade}
                    className="flex-2"
                    icon={<Check size={16} />}
                  >
                    FINISH SESSION
                  </StyledButton>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* SVG for half-star gradient */}
        <svg width="0" height="0">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
