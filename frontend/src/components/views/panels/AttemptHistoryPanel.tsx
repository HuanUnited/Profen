// frontend/src/components/views/panels/AttemptHistoryPanel.tsx
import { useState } from "react";
import { Clock, CheckCircle2, XCircle, History, Eye } from "lucide-react";
import { ent } from "../../../wailsjs/go/models";
import AttemptDetailModal from "../../smart/AttemptDetailModal";

interface AttemptHistoryPanelProps {
  attempts?: ent.Attempt[];
}

export default function AttemptHistoryPanel({ attempts }: AttemptHistoryPanelProps) {
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return "text-red-400";
      case 2: return "text-orange-400";
      case 3: return "text-green-400";
      case 4: return "text-blue-400";
      default: return "text-gray-400";
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl overflow-hidden flex flex-col h-full">
        <div className="border-b border-[#2f334d] px-4 py-2.5 flex items-center gap-2 shrink-0">
          <History size={12} className="text-gray-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Attempt History
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!attempts || attempts.length === 0 ? (
            <div className="text-center text-gray-600 text-xs py-8">No attempts yet</div>
          ) : (
            <div className="space-y-2">
              {attempts.map((attempt) => (
                <div
                  key={String(attempt.id)}
                  onClick={() => setSelectedAttemptId(String(attempt.id))}
                  className="bg-[#16161e] border border-[#2f334d] rounded-lg p-3 hover:border-blue-500/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {attempt.is_correct ? (
                        <CheckCircle2 size={14} className="text-green-400" />
                      ) : (
                        <XCircle size={14} className="text-red-400" />
                      )}
                      <span className={`text-xs font-bold ${getRatingColor(attempt.rating ?? 0)}`}>
                        {attempt.rating === 1 ? "Again" :
                          attempt.rating === 2 ? "Hard" :
                            attempt.rating === 3 ? "Good" : "Easy"}
                      </span>
                    </div>
                    <Eye size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">{formatDate(attempt.created_at)}</span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={10} />
                      <span>{Math.floor(attempt.duration_ms ?? 0 / 1000)}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attempt Detail Modal */}
      {selectedAttemptId && (
        <AttemptDetailModal
          isOpen={!!selectedAttemptId}
          onClose={() => setSelectedAttemptId(null)}
          attemptId={selectedAttemptId}
        />
      )}
    </>
  );
}
