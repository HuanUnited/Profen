// frontend/src/components/views/ProblemView.tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GetAttemptHistory, GetNodeAssociations, DeleteNode } from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import { ArrowRight, Pencil, Hash } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";
import AttemptModal from "../smart/AttemptModal";
import StyledButton from "../atomic/StylizedButton";
import ContextMenu from "../smart/ContextMenu";
import ConnectionsPanel from "./panels/ConnectionsPanel";
import AttemptHistoryPanel from "./panels/AttemptHistoryPanel";
import ResizablePanel from "./panels/ResizablePanel";
import { useNavigationHistory } from "../../utils/hooks/useNavigationHistory";
import { toast } from 'sonner';
import { BookOpen, Hash as HashIcon } from "lucide-react";

export default function ProblemView({ node }: { node: ent.Node }) {
  useNavigationHistory();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAttemptOpen, setIsAttemptOpen] = useState(false);

  const { data: attempts } = useQuery({
    queryKey: ["attempts", String(node.id)],
    queryFn: () => GetAttemptHistory(String(node.id)),
  });

  const { data: associations } = useQuery({
    queryKey: ["associations", String(node.id)],
    queryFn: () => GetNodeAssociations(String(node.id)),
  });

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
      key: "similar",
      label: "Similar Problems",
      color: "text-blue-400",
      icon: <HashIcon size={12} />,
      filter: (a: ent.NodeAssociation, nodeId: string) =>
        a.rel_type === "similar_to" && (
          String(a.source_id) === nodeId || String(a.target_id) === nodeId
        )
    },
    {
      key: "theories",
      label: "Linked Theories",
      color: "text-purple-400",
      icon: <BookOpen size={12} />,
      filter: (a: ent.NodeAssociation, nodeId: string) =>
        a.rel_type === "tests" && String(a.source_id) === nodeId
    }
  ];

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in focus:outline-none" onContextMenu={handleBackgroundContextMenu}>
      {/* Header */}
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

        <div className="flex items-center gap-3">
          <StyledButton variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setIsEditOpen(true)}>
            Edit
          </StyledButton>
          <StyledButton variant="primary" size="md" icon={<ArrowRight size={16} />} onClick={() => setIsAttemptOpen(true)} className="shadow-lg shadow-blue-500/10">
            Attempt Problem
          </StyledButton>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 border border-[#2f334d] rounded-xl bg-[#16161e] overflow-hidden flex flex-col shadow-inner">
          <div className="bg-[#1a1b26] border-b border-[#2f334d] px-4 py-2 flex items-center gap-2">
            <Hash size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Problem Statement</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-markdown">
            <MarkdownRenderer content={node.body || "_No content provided._"} />
          </div>
        </div>

        {/* Sidebar with Resizable Panels */}
        <div className="w-80 flex flex-col gap-4 overflow-hidden">
          <ResizablePanel defaultHeight={250} minHeight={150} maxHeight={500}>
            <AttemptHistoryPanel attempts={attempts} />
          </ResizablePanel>

          <div className="flex-1 overflow-y-auto">
            <ConnectionsPanel nodeId={String(node.id)} associations={associations} groups={connectionGroups} />
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onEdit={() => setIsEditOpen(true)} onDelete={handleDelete} onClose={() => setContextMenu(null)} />
      )}

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />
      <AttemptModal isOpen={isAttemptOpen} onClose={() => setIsAttemptOpen(false)} node={node} />
    </div>
  );
}
