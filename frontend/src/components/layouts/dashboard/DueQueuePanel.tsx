import { Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import StyledButton from '../../atomic/StylizedButton';
import { ent } from '../../../wailsjs/go/models';

interface DueQueuePanelProps {
  dueNodes: ent.Node[];
  onNodeClick: (node: ent.Node) => void;
}

export default function DueQueuePanel({ dueNodes, onNodeClick }: DueQueuePanelProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-700 delay-200">
      <div className="flex justify-between items-end border-b border-gray-800 pb-2">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Action Queue
        </h2>
        <span className="text-xs text-gray-600 font-mono">{dueNodes.length} items</span>
      </div>

      {dueNodes.length === 0 ? (
        <div className="py-16 border-2 border-dashed border-[#2f334d] rounded-lg text-center">
          <div className="inline-block p-4 bg-emerald-500/10 rounded-full mb-4">
            <Target size={32} className="text-emerald-400" />
          </div>
          <p className="text-gray-500 font-mono mb-2">All systems nominal.</p>
          <p className="text-gray-600 text-sm mb-4">No pending reviews.</p>
          <StyledButton variant="secondary" size="md" onClick={() => navigate('/library')}>
            BROWSE LIBRARY
          </StyledButton>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {dueNodes.map((node, idx) => (
            <div
              key={JSON.stringify(node.id)}
              className="group flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg hover:border-[#89b4fa] hover:bg-[#20212e] transition-all cursor-pointer shadow-sm"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => onNodeClick(node)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className={clsx(
                    "text-[10px] px-1.5 py-0.5 border rounded uppercase font-bold tracking-wide",
                    node.type === 'problem' ? "border-blue-900 text-blue-400 bg-blue-900/10" : "border-purple-900 text-purple-400 bg-purple-900/10"
                  )}>
                    {node.type}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">
                    UUID::{String(node.id).split('-')[0]}
                  </span>
                </div>
                <h3 className="text-gray-200 font-medium group-hover:text-white transition-colors line-clamp-1">
                  {node.title}
                </h3>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <Zap size={14} className="text-[#89b4fa]" />
                <span className="text-[10px] text-[#89b4fa] font-mono uppercase">Review</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
