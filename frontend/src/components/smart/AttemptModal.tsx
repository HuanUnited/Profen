import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ent } from "../../wailsjs/go/models";
import { ReviewCard, GetSchedulingInfo } from "../../wailsjs/go/app/App";
import ModalShell from "../layouts/ModalShell";
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

  const cardState = (node as any).card_state === 2 ? 'Review' :
    (node as any).card_state === 1 ? 'Learning' :
      (node as any).card_state === 3 ? 'Relearning' : 'New';
  const currentStep = (node as any).current_step || 0;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={node.title || "Problem"}
      badge={{ label: "SESSION", variant: "session" }}
      maxWidth="5xl"
    >
      {/* Custom Header Override */}
      <div className="absolute top-0 left-0 right-0 h-16 px-8 border-b border-[#2f334d]/50 flex items-center justify-between bg-[#1a1b26] z-10">
        <AttemptHeader
          elapsed={elapsed}
          cardState={cardState}
          currentStep={currentStep}
          title={node.title || "Problem"}
        />
      </div>

      <div className="flex h-full pt-16">
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
              difficultyRating={difficultyRating}
              onGradeSelect={setFsrsGrade}
              onErrorLogChange={setErrorLog}
              onDifficultyChange={setDifficultyRating}
              onBack={() => setStep("answering")}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </ModalShell>
  );
}
