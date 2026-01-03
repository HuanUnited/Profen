// frontend/src/components/views/SubjectView.tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetChildren, DeleteNode } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { ent } from "../../wailsjs/go/models";
import { Folder, Book, Pencil } from "lucide-react";
import { toast } from "sonner";
import StyledSearch from "../atomic/Search";
import NodeModal from "../smart/NodeModal";
import StyledButton from "../atomic/StylizedButton";
import ConfirmDialog from "../smart/ConfirmDialogue";
import ContextMenu from "../smart/ContextMenu";

export default function SubjectView({ node }: { node: ent.Node }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; topic: ent.Node } | null>(null);
  const [editTarget, setEditTarget] = useState<ent.Node | null>(null);
  const [createTarget, setCreateTarget] = useState<ent.Node | null>(null);

  const { data: children } = useQuery({
    queryKey: ["children", String(node.id)],
    queryFn: () => GetChildren(String(node.id)),
  });

  const topics = children?.filter(c => c.type === "topic") || [];
  const filteredTopics = topics.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContextMenu = (e: React.MouseEvent, topic: ent.Node) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, topic });
  };

  const handleDeleteTopic = async () => {
    if (!deleteTarget) return;

    const loadingToast = toast.loading('Deleting topic...');
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
      toast.error(e?.message || "Failed to delete topic");
    }
  };

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in">
      {/* Subject Header */}
      <div className="mb-8 border-b border-[#2f334d] pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono uppercase tracking-wider">
            <Book size={12} />
            <span>Root Subject</span>
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
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">{node.title}</h1>

        {/* Search Bar */}
        <StyledSearch
          placeholder="Filter topics by title..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-md"
        />
      </div>

      {/* Topics Grid */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Folder size={14} /> Topics ({filteredTopics.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTopics.map(topic => (
            <div
              key={topic.id?.toString()}
              onClick={() => navigate(`/library?nodeId=${topic.id}`)}
              onContextMenu={(e) => handleContextMenu(e, topic)}
              className="group p-5 bg-[#1a1b26] border border-[#2f334d] rounded-xl hover:border-[#89b4fa] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <Folder className="text-[#89b4fa] opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
              </div>
              <h3 className="font-bold text-gray-200 group-hover:text-white truncate">{topic.title}</h3>
              <p className="text-xs text-gray-500 mt-1 font-mono">0/0 Mastered</p>
            </div>
          ))}

          {filteredTopics.length === 0 && searchQuery && (
            <div className="col-span-full text-center py-12 text-gray-600">
              No topics match "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <NodeModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        mode="edit"
        initialNode={node}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onCreate={() => setCreateTarget(contextMenu.topic)}
          onEdit={() => setEditTarget(contextMenu.topic)}
          onDelete={() => setDeleteTarget({
            id: String(contextMenu.topic.id),
            title: contextMenu.topic.title || "Untitled"
          })}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Edit Modal from Context Menu */}
      {editTarget && (
        <NodeModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          mode="edit"
          initialNode={editTarget}
        />
      )}

      {/* Create Modal from Context Menu */}
      {createTarget && (
        <NodeModal
          isOpen={!!createTarget}
          onClose={() => setCreateTarget(null)}
          mode="create"
          contextNode={createTarget}
          defaultType="problem"
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTopic}
        title="Delete Topic"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All problems, theories, and practice data under this topic will be permanently deleted.`}
      />
    </div>
  );
}
