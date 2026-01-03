// frontend/src/components/views/panels/AttemptHistoryPanel.tsx
import { History, ChevronRight } from "lucide-react";
import { ent } from "../../../wailsjs/go/models";

interface AttemptHistoryPanelProps {
  attempts?: ent.Attempt[];
  onViewDetails?: (attempt: ent.Attempt) => void;
  maxDisplay?: number;
}

export default function AttemptHistoryPanel({
  attempts,
  onViewDetails,
  maxDisplay = 5
}: AttemptHistoryPanelProps) {
  const displayAttempts = attempts?.slice(0, maxDisplay) || [];

  return (
    <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <History size={14} /> Attempt History
      </h3>

      <div className="space-y-2">
        {displayAttempts.map((attempt: ent.Attempt, idx: number) => (
          <div
            key={idx}
            className="flex items-center justify-between text-sm p-2 rounded hover:bg-[#2f334d]/50 transition-colors border border-transparent hover:border-[#2f334d] group cursor-pointer"
            onClick={() => onViewDetails?.(attempt)}
          >
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-mono text-[10px] text-gray-500">
                {new Date(attempt.created_at).toLocaleDateString()}
              </span>
              <span className={`text-xs font-bold ${attempt.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                {attempt.is_correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-600 text-xs">
                {Math.round((attempt?.duration_ms ?? 0) / 1000)}s
              </span>
              <ChevronRight
                size={12}
                className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        ))}

        {(!attempts || attempts.length === 0) && (
          <div className="text-center py-6 text-gray-600 text-xs italic">
            No attempts yet.
          </div>
        )}

        {attempts && attempts.length > maxDisplay && (
          <button className="w-full text-[10px] text-blue-400 hover:text-blue-300 py-2 text-center border-t border-[#2f334d]/50 mt-2">
            View all {attempts.length} attempts →
          </button>
        )}
      </div>
    </div>
  );
}
