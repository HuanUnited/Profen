// frontend/src/components/views/SubjectView.tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetChildren, DeleteNode } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { ent } from "../../wailsjs/go/models";
import { Folder, Book, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import StyledSearch from "../atomic/Search";
import NodeModal from "../smart/NodeModal";
import StyledButton from "../atomic/StylizedButton";
import ConfirmDialog from "../smart/ConfirmDialogue";

export default function SubjectView({ node }: { node: ent.Node }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: children } = useQuery({
    queryKey: ["children", String(node.id)],
    queryFn: () => GetChildren(String(node.id)),
  });

  const topics = children?.filter(c => c.type === "topic") || [];
  const filteredTopics = topics.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              className="group relative p-5 bg-[#1a1b26] border border-[#2f334d] rounded-xl hover:border-[#89b4fa] transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({ id: String(topic.id), title: topic.title || "Untitled" });
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-900/20 border border-red-900/30 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/40 z-10"
                title="Delete topic"
              >
                <X size={12} className="text-red-400" />
              </button>

              {/* Clickable Card Content */}
              <div
                onClick={() => navigate(`/library?nodeId=${topic.id}`)}
                className="cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <Folder className="text-[#89b4fa] opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
                </div>
                <h3 className="font-bold text-gray-200 group-hover:text-white truncate">{topic.title}</h3>
                <p className="text-xs text-gray-500 mt-1 font-mono">0/0 Mastered</p>
              </div>
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
