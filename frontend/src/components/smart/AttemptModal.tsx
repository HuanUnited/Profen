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
  const [difficultyRating, setDifficultyRating] = useState<number>(3); // 1-5
  const [errorLog, setErrorLog] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    if (isOpen) {
      setStartTime(Date.now());
      setElapsed(0);
      setStep("answering");
      setAnswer("");
      setFsrsGrade(null);
      setErrorLog("");

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]); // Reset when reopened

  const handleStopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep("grading");
  };

  const handleSubmit = async () => {
    if (!fsrsGrade) return;

    try {
      // Pack metadata into answer field since backend ReviewCard signature is fixed
      const payload = JSON.stringify({
        text: answer,
        errorLog: errorLog,
        userDifficultyRating: difficultyRating,
        submittedAt: new Date().toISOString()
      });

      // Calculate final duration
      const duration = Date.now() - startTime;

      await ReviewCard(String(node.id), fsrsGrade, duration, payload);

      // Invalidate queries to refresh history
      await queryClient.invalidateQueries({ queryKey: ["attempts", String(node.id)] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] }); // If dashboard exists

      toast.success("Attempt recorded!");
      onClose();
    } catch (e: any) {
      console.error("Failed to submit review:", e);
      toast.error("Failed to save attempt");
    }
  };

  if (!isOpen) return null;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const modal = (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div className="w-[90vw] max-w-5xl h-[90vh] bg-[#16161e] border border-[#2f334d] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">

        {/* Header */}
        <div className="h-16 px-8 border-b border-[#2f334d] flex items-center justify-between bg-[#1a1b26] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#89b4fa]/10 border border-[#89b4fa]/20 rounded-lg text-[#89b4fa]">
              <Timer size={16} />
              <span className="font-mono font-bold">{formatTime(step === "answering" ? Date.now() - startTime : elapsed)}</span>
            </div>
            <h2 className="text-xl font-bold text-white truncate max-w-xl">{node.title}</h2>
          </div>
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Problem Content (Always visible) */}
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
              <div className="flex-1 flex flex-col p-6 space-y-8 animate-in slide-in-from-right-4 overflow-y-auto">

                {/* 1. FSRS Grading */}
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
                        className={`p-3 rounded-xl border transition-all font-bold text-sm ${fsrsGrade === btn.val ? "ring-2 ring-white scale-[1.02]" : "opacity-70 hover:opacity-100"
                          } ${btn.color}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Error Logging (Conditional) */}
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

                {/* 3. Difficulty Rating */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Problem Difficulty Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setDifficultyRating(star)}
                        className={`transition-all hover:scale-110 ${star <= difficultyRating ? "text-yellow-400" : "text-gray-700"
                          }`}
                      >
                        <Star size={24} fill={star <= difficultyRating ? "currentColor" : "none"} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-gray-500 font-mono">({difficultyRating}/5)</span>
                  </div>
                </div>

                <div className="flex-1" /> {/* Spacer */}

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
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
