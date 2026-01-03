import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GetAttemptHistory, GetNodeAssociations, DeleteNode } from '../../wailsjs/go/app/App';
import { ent } from '../../wailsjs/go/models';
import { Pencil, BookOpen, Hash, Activity } from 'lucide-react';
import MarkdownRenderer from '../atomic/MarkdownRenderer';
import NodeModal from '../smart/NodeModal';
import AttemptModal from '../smart/AttemptModal';
import StyledButton from '../atomic/StylizedButton';
import ContextMenu from '../smart/ContextMenu';
import ConnectionsPanel from './panels/ConnectionsPanel';
import AttemptDetailModal from '../smart/AttemptDetailModal';
import FsrsStatusPanel from './panels/FsrsStatusPanel';
import { useNavigationHistory } from '../../utils/hooks/useNavigationHistory';
import { toast } from 'sonner';

export default function ProblemView({ node }: { node: ent.Node }) {
  useNavigationHistory(); // Restore Alt+Left/Right

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAttemptOpen, setIsAttemptOpen] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // Fetch Attempts
  const { data: attempts, isLoading: isAttemptsLoading } = useQuery({
    queryKey: ['attempts', String(node.id)],
    queryFn: () => GetAttemptHistory(String(node.id)),
  });

  // Fetch Associations
  const { data: associations } = useQuery({
    queryKey: ["associations", String(node.id)],
    queryFn: () => GetNodeAssociations(String(node.id)),
  });

  // Fetch FSRS State
  // const { data: cardState } = useQuery({
  //   queryKey: ['cardState', String(node.id)],
  //   queryFn: () => GetNodeWithCard(String(node.id)),
  // });

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDelete = async () => {
    try {
      await DeleteNode(String(node.id));
      await queryClient.invalidateQueries({ queryKey: ["children", String(node.parent_id)] });
      toast.success("Problem deleted");
      navigate(-1);
    } catch (e) {
      toast.error("Failed to delete problem");
    }
  };

  const connectionGroups = [
    {
      key: "theories",
      label: "Related Theories",
      color: "text-purple-400",
      icon: <BookOpen size={12} />,
      filter: (a: ent.NodeAssociation, nodeId: string) =>
        a.rel_type === "tests" && String(a.source_id) === nodeId
    },
    {
      key: "similar",
      label: "Similar Problems",
      color: "text-blue-400",
      icon: <Hash size={12} />,
      filter: (a: ent.NodeAssociation, nodeId: string) =>
        a.rel_type === "similar_to" && (String(a.source_id) === nodeId || String(a.target_id) === nodeId)
    }
  ];

  // Calculate stats
  const totalAttempts = attempts?.length || 0;

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in focus:outline-none" onContextMenu={handleBackgroundContextMenu}>

      <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-900/20 text-blue-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-blue-900/30">
              Problem
            </span>
            <span className="text-xs text-gray-600 font-mono">ID:{String(node.id).split("-")[0]}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{node.title}</h1>
        </div>
        <div className="flex gap-2">
          <StyledButton variant="primary" size="sm" icon={<Activity size={14} />} onClick={() => setIsAttemptOpen(true)}>
            Attempt
          </StyledButton>
          <StyledButton variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setIsEditOpen(true)}>
            Edit
          </StyledButton>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left: Problem Statement */}
        <div className="flex-1 border border-[#2f334d] rounded-xl bg-[#16161e] overflow-hidden flex flex-col shadow-inner">
          <div className="bg-[#1a1b26] border-b border-[#2f334d] px-4 py-2 flex items-center gap-2">
            <BookOpen size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Problem Statement</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-markdown">
            <MarkdownRenderer content={node.body || "_No content provided._"} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

          {/* FSRS Status */}
          <FsrsStatusPanel nodeId={String(node.id)} />

          {/* Attempt History */}
          <div className="flex-1 bg-[#1a1b26] border border-[#2f334d] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-[#2f334d] flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">History</span>
              <span className="text-xs text-gray-500 font-mono">{totalAttempts} attempts</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {isAttemptsLoading ? (
                <div className="text-gray-500 text-xs animate-pulse">Loading...</div>
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
                        <div className={`w-1.5 h-1.5 rounded-full ${attempt.rating >= 3 ? 'bg-emerald-500' : attempt.rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                        <span className="text-gray-300">
                          {['Again', 'Hard', 'Good', 'Easy'][attempt.rating - 1]}
                        </span>
                      </div>
                      <span className="text-gray-500 font-mono">{Math.round(attempt.duration_ms / 1000)}s</span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(attempt.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connections */}
          <ConnectionsPanel nodeId={String(node.id)} associations={associations} groups={connectionGroups} />
        </div>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onEdit={() => setIsEditOpen(true)} onDelete={handleDelete} onClose={() => setContextMenu(null)} />
      )}

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />
      <AttemptModal isOpen={isAttemptOpen} onClose={() => setIsAttemptOpen(false)} node={node} />
      <AttemptDetailModal attemptId={selectedAttemptId} onClose={() => setSelectedAttemptId(null)} isOpen={false} />
    </div>
  );
}
