import { useQuery } from '@tanstack/react-query';
import { X, Clock, Calendar, Star, Tag, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import StyledButton from '../atomic/StylizedButton';
import MarkdownRenderer from '../atomic/MarkdownRenderer';

interface AttemptDetailModalProps {
  attemptId: string | null;
  onClose: () => void;
}

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;

  background-image: 
    linear-gradient(to right, rgba(47, 51, 77, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(47, 51, 77, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;

  .modal-container {
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

// Mock fetch - replace with actual backend call
const fetchAttemptDetails = async (attemptId: string) => {
  // TODO: Replace with actual API call
  // For now, return mock data structure
  return {
    id: attemptId,
    rating: 2,
    duration_ms: 125000,
    created_at: new Date().toISOString(),
    metadata: {
      text: "Sample solution text...",
      errorLog: "Forgot to apply chain rule",
      errorTags: ["Conceptual Misunderstanding", "Forgot Formula"],
      userDifficultyRating: 7
    }
  };
};

export default function AttemptDetailModal({ attemptId, onClose }: AttemptDetailModalProps) {
  const { data: attempt, isLoading } = useQuery({
    queryKey: ['attemptDetail', attemptId],
    queryFn: () => fetchAttemptDetails(attemptId!),
    enabled: !!attemptId,
  });

  if (!attemptId) return null;

  const modal = (
    <ModalWrapper className="animate-in fade-in duration-200" onClick={onClose}>
      <div className="modal-container w-[90vw] max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="h-16 px-8 border-b border-[#2f334d]/50 flex items-center justify-between bg-[#1a1b26] shrink-0">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border bg-purple-500/20 text-purple-400 border-purple-500/30">
              ATTEMPT DETAILS
            </span>
            <h2 className="text-xl font-bold text-white">Review Session</h2>
          </div>
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="text-gray-500 text-center py-12">Loading attempt details...</div>
          ) : attempt ? (
            <>
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Calendar size={12} />
                    <span className="uppercase">Date</span>
                  </div>
                  <p className="text-sm text-white font-mono">
                    {new Date(attempt.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Clock size={12} />
                    <span className="uppercase">Duration</span>
                  </div>
                  <p className="text-sm text-white font-mono">
                    {Math.round(attempt.duration_ms / 1000)}s
                  </p>
                </div>

                <div className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="uppercase">Grade</span>
                  </div>
                  <p className={`text-sm font-bold ${attempt.rating >= 3 ? 'text-emerald-400' :
                      attempt.rating === 2 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                    {['Again', 'Hard', 'Good', 'Easy'][attempt.rating - 1]}
                  </p>
                </div>

                <div className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Star size={12} />
                    <span className="uppercase">Difficulty</span>
                  </div>
                  <p className="text-sm text-yellow-400 font-mono">
                    {attempt.metadata?.userDifficultyRating || '-'}/10
                  </p>
                </div>
              </div>

              {/* Solution */}
              {attempt.metadata?.text && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Solution</label>
                  <div className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                    <MarkdownRenderer content={attempt.metadata.text} />
                  </div>
                </div>
              )}

              {/* Error Tags */}
              {attempt.metadata?.errorTags && attempt.metadata.errorTags.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                    <Tag size={14} /> Error Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {attempt.metadata.errorTags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Log */}
              {attempt.metadata?.errorLog && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={14} /> Error Analysis
                  </label>
                  <div className="p-4 bg-[#1a1b26] border border-red-900/30 rounded-lg">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {attempt.metadata.errorLog}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-center py-12">Attempt not found</div>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-[#2f334d]/50 bg-[#16161e]/90 flex items-center justify-end px-8 shrink-0">
          <StyledButton variant="primary" size="md" onClick={onClose}>
            CLOSE
          </StyledButton>
        </div>
      </div>
    </ModalWrapper>
  );

  return createPortal(modal, document.body);
}
