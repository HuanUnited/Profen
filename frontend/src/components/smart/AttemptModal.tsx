import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ent } from "../../wailsjs/go/models";
import { ReviewCard, GetSchedulingInfo } from "../../wailsjs/go/app/App";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { X } from "lucide-react";
import StyledButton from "../atomic/StylizedButton";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import AttemptHeader from "./attempt/AttemptHeader";
import AnsweringStep from "./attempt/AnsweringStep";
import GradingStep from "./attempt/GradingStep";
import { toast } from 'sonner';

interface AttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: ent.Node;
}

type ModalStep = "answering" | "grading";

// Styled wrapper with proper background canvas
const AttemptWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;

  /* Canvas background pattern */
  background-image: 
    linear-gradient(to right, rgba(47, 51, 77, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(47, 51, 77, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;

  .attempt-container {
    background: linear-gradient(#16161e, #16161e) padding-box,
                linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
    border: 2px solid transparent;
    animation: gradient 5s ease infinite;
    background-size: 200% 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #2f334d; border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #40c9ff; }
`;

export default function AttemptModal({ isOpen, onClose, node }: AttemptModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ModalStep>("answering");
  const [answer, setAnswer] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Grading State
  const [fsrsGrade, setFsrsGrade] = useState<number | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number>(5);
  const [errorLog, setErrorLog] = useState("");
  const [errorTags, setErrorTags] = useState<string[]>([]);

  // FSRS Data
  const [intervals, setIntervals] = useState<Record<number, string>>({
    1: "...", 2: "...", 3: "...", 4: "..."
  });

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
      setErrorTags([]);

      GetSchedulingInfo(String(node.id))
        .then(setIntervals)
        .catch(e => {
          console.error("Failed to fetch intervals:", e);
          setIntervals({ 1: "?", 2: "?", 3: "?", 4: "?" });
        });

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 10);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, startTime, node.id]);

  const handleStopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(Date.now() - startTime);
    setStep("grading");
  };

  const handleSubmit = async () => {
    if (!fsrsGrade) return;

    try {
      const payload = JSON.stringify({
        text: answer,
        errorLog: errorLog,
        errorTags: errorTags,
        userDifficultyRating: difficultyRating,
        submittedAt: new Date().toISOString()
      });

      const duration = Date.now() - startTime;

      await ReviewCard(String(node.id), fsrsGrade, duration, payload);

      await queryClient.invalidateQueries({ queryKey: ["attempts", String(node.id)] });
      await queryClient.invalidateQueries({ queryKey: ["cardState", String(node.id)] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      await queryClient.invalidateQueries({ queryKey: ["node", String(node.id)] });

      toast.success("Attempt recorded!");
      onClose();
    } catch (e: any) {
      console.error("Failed to submit review:", e);
      toast.error("Failed to save attempt: " + e);
    }
  };

  if (!isOpen) return null;

  const cardState = (node as any).card_state === 2 ? 'Review' :
    (node as any).card_state === 1 ? 'Learning' :
      (node as any).card_state === 3 ? 'Relearning' : 'New';
  const currentStep = (node as any).current_step || 0;

  const modal = (
    <AttemptWrapper className="animate-in fade-in duration-200">
      <div className="attempt-container w-[90vw] max-w-5xl h-[90vh] rounded-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="h-16 px-8 border-b border-[#2f334d]/50 flex items-center justify-between bg-[#1a1b26] shrink-0">
          <AttemptHeader
            elapsed={elapsed}
            cardState={cardState}
            currentStep={currentStep}
            title={node.title || "Problem"}
          />
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Problem Content */}
          <div className="flex-1 p-8 overflow-y-auto border-r border-[#2f334d] custom-scrollbar">
            <div className="prose prose-invert max-w-none prose-headings:text-blue-300">
              <MarkdownRenderer content={node.body || "_No content provided._"} />
            </div>
          </div>

          {/* Right: Interaction Area */}
          <div className="w-112.5 flex flex-col bg-[#1a1b26]/50">
            {step === "answering" ? (
              <AnsweringStep
                answer={answer}
                onAnswerChange={setAnswer}
                onReveal={handleStopTimer}
              />
            ) : (
              <GradingStep
                fsrsGrade={fsrsGrade}
                intervals={intervals}
                errorLog={errorLog}
                errorTags={errorTags}
                difficultyRating={difficultyRating}
                onGradeSelect={setFsrsGrade}
                onErrorLogChange={setErrorLog}
                onErrorTagsChange={setErrorTags}
                onDifficultyChange={setDifficultyRating}
                onBack={() => setStep("answering")}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </AttemptWrapper>
  );

  return createPortal(modal, document.body);
}
