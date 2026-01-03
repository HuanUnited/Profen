// frontend/src/components/views/TheoryView.tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@antml:react-query";
import { useNavigate } from "react-router-dom";
import { GetNodeAssociations, DeleteNode } from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import { Pencil, BookOpen, Hash } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";
import StyledButton from "../atomic/StylizedButton";
import ContextMenu from "../smart/ContextMenu";
import ConnectionsPanel from "./panels/ConnectionsPanel";
import ResizablePanel from "./panels/ResizablePanel";
import { useNavigationHistory } from "../../utils/hooks/useNavigationHistory";
import { toast } from 'sonner';

export default function TheoryView({ node }: { node: ent.Node }) {
  useNavigationHistory();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
      toast.success("Theory deleted");
      navigate(-1);
    } catch (e) {
      toast.error("Failed to delete theory");
    }
  };

  const connectionGroups = [
    {
      key: "problems",
      label: "Practice Problems",
      color: "text-blue-400",
      icon: <Hash size={12} />,
      filter: (a: ent.NodeAssociation, nodeId: string) =>
        a.rel_type === "tests" && String(a.target_id) === nodeId
    },
    {
      key: "theories",
      label: "Related Theories",
      color: "text-purple-400",
      icon: <BookOpen size={12} />,
      filter: (a: ent.NodeAssociation, nodeId: string) =>
        (a.rel_type === "variant_of" || a.rel_type === "similar_to") &&
        (String(a.source_id) === nodeId || String(a.target_id) === nodeId)
    }
  ];

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in focus:outline-none" onContextMenu={handleBackgroundContextMenu}>
      <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-900/20 text-purple-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-purple-900/30">
              Theory
            </span>
            <span className="text-xs text-gray-600 font-mono">ID:{String(node.id).split("-")[0]}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{node.title}</h1>
        </div>
        <StyledButton variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setIsEditOpen(true)}>
          Edit
        </StyledButton>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 border border-[#2f334d] rounded-xl bg-[#16161e] overflow-hidden flex flex-col shadow-inner">
          <div className="bg-[#1a1b26] border-b border-[#2f334d] px-4 py-2 flex items-center gap-2">
            <BookOpen size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Concept Material</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-markdown">
            <MarkdownRenderer content={node.body || "_No content provided._"} />
          </div>
        </div>

        {/* Sidebar with Resizable Connections Panel */}
        <div className="w-80 flex flex-col overflow-hidden">
          <ResizablePanel defaultHeight={400} minHeight={200} maxHeight={700}>
            <ConnectionsPanel nodeId={String(node.id)} associations={associations} groups={connectionGroups} />
          </ResizablePanel>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onEdit={() => setIsEditOpen(true)} onDelete={handleDelete} onClose={() => setContextMenu(null)} />
      )}

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />
    </div>
  );
}
