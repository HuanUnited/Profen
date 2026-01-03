// frontend/src/components/smart/AttemptDetailModal.tsx
import { X, Clock, Target, AlertCircle, Calendar, TrendingUp, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GetAttemptDetails } from "../../wailsjs/go/app/App";

interface AttemptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId: string;
}

export default function AttemptDetailModal({ isOpen, onClose, attemptId }: AttemptDetailModalProps) {
  const { data: attempt, isLoading } = useQuery({
    queryKey: ["attemptDetails", attemptId],
    queryFn: () => GetAttemptDetails(attemptId),
    enabled: isOpen && !!attemptId,
  });

  if (!isOpen) return null;

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return { text: "Again", color: "text-red-400", bg: "bg-red-900/20" };
      case 2: return { text: "Hard", color: "text-orange-400", bg: "bg-orange-900/20" };
      case 3: return { text: "Good", color: "text-green-400", bg: "bg-green-900/20" };
      case 4: return { text: "Easy", color: "text-blue-400", bg: "bg-blue-900/20" };
      default: return { text: "Unknown", color: "text-gray-400", bg: "bg-gray-900/20" };
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}.${centiseconds.toString().padStart(2, '0')}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const rating = attempt ? getRatingLabel(attempt.rating) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1b26] border-2 border-[#2f334d] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-[#2f334d] to-[#1a1b26] px-6 py-4 flex items-center justify-between border-b border-[#2f334d]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            Attempt Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading attempt details...</div>
          ) : attempt ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Rating */}
                <div className={`${rating?.bg} border border-gray-800 rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className={rating?.color} />
                    <span className="text-xs font-bold text-gray-400 uppercase">Rating</span>
                  </div>
                  <div className={`text-2xl font-bold ${rating?.color}`}>
                    {rating?.text}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {attempt.is_correct ? "✓ Correct" : "✗ Incorrect"}
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-purple-900/20 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-purple-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {formatDuration(attempt.duration_ms)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Time spent</div>
                </div>

                {/* Difficulty Rating */}
                {attempt.difficulty_rating && (
                  <div className="bg-yellow-900/20 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-yellow-400" />
                      <span className="text-xs font-bold text-gray-400 uppercase">Difficulty</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {attempt.difficulty_rating}/10
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const starValue = star * 2;
                        const halfValue = starValue - 1;
                        const isFull = attempt.difficulty_rating >= starValue;
                        const isHalf = attempt.difficulty_rating === halfValue;

                        return (
                          <Star
                            key={star}
                            size={16}
                            className={isFull || isHalf ? "text-yellow-400" : "text-gray-700"}
                            fill={isFull ? "currentColor" : isHalf ? "url(#half-detail)" : "none"}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="bg-gray-900/20 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase">Submitted</span>
                  </div>
                  <div className="text-sm font-mono text-gray-300">
                    {formatDate(attempt.created_at)}
                  </div>
                </div>
              </div>

              {/* FSRS Stats */}
              <div className="bg-[#16161e] border border-[#2f334d] rounded-lg p-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-3">FSRS Metrics</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500">State</div>
                    <div className="text-sm font-bold text-blue-400 uppercase mt-1">
                      {attempt.state}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Stability</div>
                    <div className="text-sm font-bold text-green-400 mt-1">
                      {attempt.stability?.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Difficulty</div>
                    <div className="text-sm font-bold text-orange-400 mt-1">
                      {attempt.difficulty?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Answer */}
              {attempt.user_answer && (
                <div className="bg-[#16161e] border border-[#2f334d] rounded-lg p-4">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-3">Your Solution</div>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {attempt.user_answer}
                  </div>
                </div>
              )}

              {/* Error Log */}
              {attempt.error_log && (
                <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase">Error Analysis</span>
                  </div>
                  <div className="text-sm text-gray-300 leading-relaxed">
                    {attempt.error_log}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-red-400">Failed to load attempt details</div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#16161e] px-6 py-4 border-t border-[#2f334d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2f334d] hover:bg-[#3f435d] text-white rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>

        {/* SVG for half-star in detail view */}
        <svg width="0" height="0">
          <defs>
            <linearGradient id="half-detail">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
