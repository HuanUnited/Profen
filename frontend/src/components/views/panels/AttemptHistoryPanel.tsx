import { useQuery } from '@tanstack/react-query';
import { GetAttemptHistory } from '../../../wailsjs/go/app/App';
import { History } from 'lucide-react';
import { useState } from 'react';
import AttemptDetailModal from '../../smart/AttemptDetailModal';

interface AttemptHistoryPanelProps {
  nodeId: string;
}

export default function AttemptHistoryPanel({ nodeId }: AttemptHistoryPanelProps) {
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['attempts', nodeId],
    queryFn: () => GetAttemptHistory(nodeId),
  });

  const totalAttempts = attempts?.length || 0;

  return (
    <>
      <div className="bg-[#1a1b26] border border-[#2f334d] rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-[#2f334d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">History</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">{totalAttempts} attempts</span>
        </div>

        <div className="max-h-80 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-gray-500 text-xs animate-pulse text-center py-4">Loading...</div>
          ) : (!attempts || attempts.length === 0) ? (
            <div className="text-gray-600 text-xs text-center py-8">No attempts yet</div>
          ) : (
            attempts.map((attempt: any) => (
              <div
                key={attempt.id}
                onClick={() => setSelectedAttemptId(attempt.id)}
                className="p-2 bg-[#16161e] border border-[#2f334d] rounded hover:border-blue-500/50 cursor-pointer transition-colors group text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${attempt.rating >= 3 ? 'bg-emerald-500' :
                      attempt.rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`} />
                    <span className="text-gray-300">
                      {['Again', 'Hard', 'Good', 'Easy'][attempt.rating - 1]}
                    </span>
                  </div>
                  <span className="text-gray-500 font-mono">
                    {Math.round(attempt.duration_ms / 1000)}s
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  {new Date(attempt.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <AttemptDetailModal
        attemptId={selectedAttemptId}
        onClose={() => setSelectedAttemptId(null)} isOpen={false} />
    </>
  );
}
