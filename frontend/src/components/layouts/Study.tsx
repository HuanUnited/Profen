import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Timer, Check, AlertCircle, Star, ChevronRight, BookOpen } from 'lucide-react';
import { GetNodeWithCard, ReviewCard, GetSchedulingInfo } from '../../wailsjs/go/app/App';
import StyledButton from '../atomic/StylizedButton';
import MarkdownRenderer from '../atomic/MarkdownRenderer';
import Loading from '../atomic/Loading';
import { toast } from 'sonner';
import styled from 'styled-components';

type ModalStep = "answering" | "grading";

// Styled wrapper for animated gradient border + panel background
const StudyWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;

  /* Panel background pattern (like in views) */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(47, 51, 77, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(47, 51, 77, 0.1) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    opacity: 0.3;
  }

  .study-container {
    background: linear-gradient(#16161e, #16161e) padding-box,
                linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
    border: 2px solid transparent;
    animation: gradient 5s ease infinite;
    background-size: 200% 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
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

export default function Study() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queue State
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Session State
  const [step, setStep] = useState<ModalStep>("answering");
  const [answer, setAnswer] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Grading State
  const [fsrsGrade, setFsrsGrade] = useState<number | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number>(5);
  const [errorLog, setErrorLog] = useState("");

  // FSRS Intervals
  const [intervals, setIntervals] = useState<Record<number, string>>({
    1: "...", 2: "...", 3: "...", 4: "..."
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Queue
  useEffect(() => {
    const queueParam = searchParams.get('queue');
    if (queueParam) {
      setQueue(queueParam.split(','));
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  // Current Node
  const currentNodeId = queue[currentIndex];

  const { data: node, isLoading } = useQuery({
    queryKey: ['studyNode', currentNodeId],
    queryFn: () => GetNodeWithCard(currentNodeId),
    enabled: !!currentNodeId,
    staleTime: 0,
  });

  // Reset per card + fetch intervals
  useEffect(() => {
    if (currentNodeId) {
      setStartTime(Date.now());
      setElapsed(0);
      setStep("answering");
      setAnswer("");
      setFsrsGrade(null);
      setDifficultyRating(5);
      setErrorLog("");

      GetSchedulingInfo(currentNodeId).then(setIntervals).catch(() => {
        setIntervals({ 1: "?", 2: "?", 3: "?", 4: "?" });
      });

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 10);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentNodeId, startTime]);

  const handleStopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(Date.now() - startTime);
    setStep("grading");
  };

  const handleStarClick = (star: number) => {
    const starValue = star * 2;
    const halfValue = starValue - 1;

    if (difficultyRating === starValue) {
      setDifficultyRating(halfValue - 1);
    } else if (difficultyRating === halfValue) {
      setDifficultyRating(starValue);
    } else {
      setDifficultyRating(halfValue);
    }
  };

  const handleSubmit = async () => {
    if (!fsrsGrade || !node) return;

    try {
      const payload = JSON.stringify({
        text: answer,
        errorLog: errorLog,
        userDifficultyRating: difficultyRating,
        submittedAt: new Date().toISOString()
      });

      const duration = Date.now() - startTime;

      await ReviewCard(node.id, fsrsGrade, duration, payload);

      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ["attempts", node.id] });
      await queryClient.invalidateQueries({ queryKey: ["cardState", node.id] });
      await queryClient.invalidateQueries({ queryKey: ["dueCards"] });
      await queryClient.invalidateQueries({ queryKey: ["node", node.id] });

      toast.success("Review recorded!");

      // Next card or exit
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const returnPath = searchParams.get('returnTo') || '/';
        navigate(returnPath);
      }
    } catch (e: any) {
      console.error("Failed to submit review:", e);
      toast.error("Failed to save review: " + e);
    }
  };

  const handleExit = () => {
    const returnPath = searchParams.get('returnTo') || '/';
    navigate(returnPath);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const getBadgeColor = (state: string) => {
    switch (state.toLowerCase()) {
      case "new": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "learning": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "review": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "relearning": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (isLoading || !node) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#13141f]">
        <Loading message="Loading card..." />
      </div>
    );
  }

  const cardState = node.card_state === 2 ? 'Review' :
    node.card_state === 1 ? 'Learning' :
      node.card_state === 3 ? 'Relearning' : 'New';
  const currentStep = node.current_step || 0;

  return (
    <StudyWrapper>
      <div className="study-container w-[90vw] max-w-5xl h-[90vh] rounded-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="h-16 px-8 border-b border-[#2f334d]/50 flex items-center justify-between bg-[#1a1b26] shrink-0">
          <div className="flex items-center gap-4">

            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1 bg-[#89b4fa]/10 border border-[#89b4fa]/20 rounded-lg text-[#89b4fa]">
              <Timer size={16} />
              <span className="font-mono font-bold text-lg tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>

            {/* State Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getBadgeColor(cardState)}`}>
              <BookOpen size={14} />
              <span>{cardState}</span>
              {cardState === "Learning" && (
                <span className="opacity-70 ml-1 border-l border-white/20 pl-2">
                  Step {currentStep + 1}
                </span>
              )}
            </div>

            {/* Progress */}
            <span className="text-xs text-gray-500 font-mono border-l border-[#2f334d] pl-4">
              {currentIndex + 1} / {queue.length}
            </span>

            <h2 className="text-xl font-bold text-white truncate max-w-xl">
              {node.title}
            </h2>
          </div>
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={handleExit} />
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
              <div className="flex-1 flex flex-col p-6 space-y-4">
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
              <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">

                {/* FSRS Grading */}
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
                        <div className="flex justify-between items-center w-full">
                          <span>{btn.label}</span>
                          <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono opacity-80">
                            {intervals[btn.val]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Logging */}
                {(fsrsGrade === 1 || fsrsGrade === 2) && (
                  <div className="space-y-3 animate-in fade-in">
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

                {/* Difficulty Rating */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Problem Difficulty Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const starValue = star * 2;
                      const halfValue = starValue - 1;
                      const isFull = difficultyRating >= starValue;
                      const isHalf = difficultyRating === halfValue;

                      return (
                        <button
                          key={star}
                          onClick={() => handleStarClick(star)}
                          className={`transition-all hover:scale-110 ${isFull || isHalf ? "text-yellow-400" : "text-gray-700"}`}
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
                </div>

                <div className="flex-1" />

                {/* Footer */}
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
                    {currentIndex < queue.length - 1 ? "NEXT CARD" : "FINISH"}
                  </StyledButton>
                </div>
              </div>
            )}
          </div>
        </div>

        <svg width="0" height="0">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </StudyWrapper>
  );
}
