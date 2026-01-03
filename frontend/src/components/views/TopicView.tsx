// frontend/src/components/views/TopicView.tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetChildren, DeleteNode } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { ent } from "../../wailsjs/go/models";
import { Hash, Beaker, FolderOpen, Pencil } from "lucide-react";
import { toast } from "sonner";
import NodeModal from "../smart/NodeModal";
import StyledSearch from "../atomic/Search";
import StyledButton from "../atomic/StylizedButton";
import ConfirmDialog from "../smart/ConfirmDialogue";
import ContextMenu from "../smart/ContextMenu";

export default function TopicView({ node }: { node: ent.Node }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; type: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; title: string; type: string } | null>(null);

  const { data: children } = useQuery({
    queryKey: ["children", String(node.id)],
    queryFn: () => GetChildren(String(node.id)),
  });

  const problems = children?.filter(c => c.type === "problem") || [];
  const theories = children?.filter(c => c.type === "theory") || [];

  const filteredProblems = problems.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTheories = theories.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContextMenu = (e: React.MouseEvent, nodeId: string, title: string, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, title, type });
  };

  const handleDeleteChild = async () => {
    if (!deleteTarget) return;

    const loadingToast = toast.loading(`Deleting ${deleteTarget.type}...`);
    try {
      await DeleteNode(deleteTarget.id);
      await queryClient.refetchQueries({
        queryKey: ["children", String(node.id)],
        type: 'active'
      });
      toast.dismiss(loadingToast);
      toast.success(`"${deleteTarget.title}" deleted successfully`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.dismiss(loadingToast);
      console.error("Delete failed:", e);
      toast.error(e?.message || `Failed to delete ${deleteTarget.type}`);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in">
      <div className="mb-8 border-b border-[#2f334d] pb-6 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 font-mono uppercase tracking-wider">
            <FolderOpen size={12} />
            <span>Topic Container</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">{node.title}</h1>

          <StyledSearch
            placeholder="Filter problems & theories..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-md"
          />
        </div>

        <StyledButton
          variant="ghost"
          size="sm"
          icon={<Pencil size={14} />}
          onClick={() => setIsEditOpen(true)}
        >
          Edit
        </StyledButton>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Theories Column */}
        <div>
          <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-purple-900/30 pb-2">
            <Beaker size={14} /> Theories ({filteredTheories.length})
          </h2>
          <div className="space-y-2">
            {filteredTheories.map(t => (
              <div
                key={t.id?.toString()}
                onClick={() => navigate(`/library?nodeId=${t.id}`)}
                onContextMenu={(e) => handleContextMenu(e, String(t.id), t.title || "Untitled", "theory")}
                className="p-4 bg-[#1a1b26] border-l-2 border-purple-900 hover:border-purple-500 hover:bg-[#1f2335] cursor-pointer transition-all rounded-r-lg group"
              >
                <h3 className="font-medium text-gray-300 group-hover:text-white">{t.title}</h3>
              </div>
            ))}
            {filteredTheories.length === 0 && (
              <div className="text-xs text-gray-600 italic">
                {searchQuery ? "No matching theories" : "No theories yet."}
              </div>
            )}
          </div>
        </div>

        {/* Problems Column */}
        <div>
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-2">
            <Hash size={14} /> Problems ({filteredProblems.length})
          </h2>
          <div className="space-y-2">
            {filteredProblems.map(p => (
              <div
                key={p.id?.toString()}
                onClick={() => navigate(`/library?nodeId=${p.id}`)}
                onContextMenu={(e) => handleContextMenu(e, String(p.id), p.title || "Untitled", "problem")}
                className="p-4 bg-[#1a1b26] border-l-2 border-blue-900 hover:border-blue-500 hover:bg-[#1f2335] cursor-pointer transition-all rounded-r-lg group"
              >
                <h3 className="font-medium text-gray-300 group-hover:text-white">{p.title}</h3>
              </div>
            ))}
            {filteredProblems.length === 0 && (
              <div className="text-xs text-gray-600 italic">
                {searchQuery ? "No matching problems" : "No problems yet."}
              </div>
            )}
          </div>
        </div>
      </div>

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={() => setDeleteTarget({ id: contextMenu.nodeId, title: contextMenu.title, type: contextMenu.type })}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteChild}
        title={`Delete ${deleteTarget?.type || "Node"}`}
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All related practice data will be permanently deleted.`}
      />
    </div>
  );
}
