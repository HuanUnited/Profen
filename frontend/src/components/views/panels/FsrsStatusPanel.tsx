import { useQuery } from '@tanstack/react-query';
import { GetNodeWithCard } from '../../../wailsjs/go/app/App';
import { Activity } from 'lucide-react';

interface FsrsStatusPanelProps {
  nodeId: string;
}

export default function FsrsStatusPanel({ nodeId }: FsrsStatusPanelProps) {
  const { data: cardState } = useQuery({
    queryKey: ['cardState', nodeId],
    queryFn: () => GetNodeWithCard(nodeId),
  });

  const getStateLabel = (state: number) => {
    switch (state) {
      case 0: return 'New';
      case 1: return 'Learning';
      case 2: return 'Review';
      case 3: return 'Relearning';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-[#1a1b26] border border-[#2f334d] rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-[#2f334d] flex items-center gap-2">
        <Activity size={14} className="text-gray-500" />
        <span className="text-xs font-bold text-gray-400 uppercase">FSRS Status</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase mb-1">State</p>
          <p className="text-sm font-mono text-blue-400">
            {cardState ? getStateLabel(cardState.card_state) : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase mb-1">Stability</p>
          <p className="text-sm font-mono text-emerald-400">
            {cardState?.stability ? Number(cardState.stability).toFixed(2) : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase mb-1">Difficulty</p>
          <p className="text-sm font-mono text-orange-400">
            {cardState?.difficulty ? Number(cardState.difficulty).toFixed(2) : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase mb-1">Next Review</p>
          <p className="text-xs font-mono text-gray-300">
            {cardState?.next_review ? new Date(cardState.next_review).toLocaleDateString() : 'Now'}
          </p>
        </div>
      </div>
    </div>
  );
}
