import { AlertCircle, Star, Check } from 'lucide-react';
import StyledButton from '../../atomic/StylizedButton';

interface GradingStepProps {
  fsrsGrade: number | null;
  intervals: Record<number, string>;
  errorLog: string;
  difficultyRating: number;
  onGradeSelect: (grade: number) => void;
  onErrorLogChange: (value: string) => void;
  onDifficultyChange: (rating: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function GradingStep({
  fsrsGrade,
  intervals,
  errorLog,
  difficultyRating,
  onGradeSelect,
  onErrorLogChange,
  onDifficultyChange,
  onBack,
  onSubmit
}: GradingStepProps) {

  const handleStarClick = (star: number) => {
    const starValue = star * 2;
    const halfValue = starValue - 1;

    if (difficultyRating === starValue) {
      onDifficultyChange(halfValue - 1);
    } else if (difficultyRating === halfValue) {
      onDifficultyChange(starValue);
    } else {
      onDifficultyChange(halfValue);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 animate-in slide-in-from-right-4 overflow-y-auto custom-scrollbar">

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
              onClick={() => onGradeSelect(btn.val)}
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
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle size={14} /> What went wrong?
          </label>
          <textarea
            value={errorLog}
            onChange={(e) => onErrorLogChange(e.target.value)}
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

      {/* Footer Actions */}
      <div className="flex gap-3 pt-6 border-t border-[#2f334d]">
        <StyledButton variant="ghost" onClick={onBack} className="flex-1">
          BACK
        </StyledButton>
        <StyledButton
          variant="primary"
          onClick={onSubmit}
          disabled={!fsrsGrade}
          className="flex-2"
          icon={<Check size={16} />}
        >
          FINISH SESSION
        </StyledButton>
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
  );
}
