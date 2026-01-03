// frontend/src/components/views/RootView.tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetSubjects, DeleteNode } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { Book } from "lucide-react";
import { toast } from "sonner";
import { ent } from "../../wailsjs/go/models";
import ConfirmDialog from "../smart/ConfirmDialogue";
import ContextMenu from "../smart/ContextMenu";
import NodeModal from "../smart/NodeModal";

export default function RootView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; subject?: ent.Node } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [editTarget, setEditTarget] = useState<ent.Node | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: GetSubjects,
  });

  const handleItemContextMenu = (e: React.MouseEvent, subject: ent.Node) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, subject });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    // Only trigger if clicking on the background, not on a card
    if (e.target === e.currentTarget) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteTarget) return;

    const loadingToast = toast.loading('Deleting subject...');
    try {
      await DeleteNode(deleteTarget.id);
      await queryClient.refetchQueries({
        queryKey: ["subjects"],
        type: 'active',
        exact: true
      });
      toast.dismiss(loadingToast);
      toast.success(`"${deleteTarget.title}" deleted successfully`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.dismiss(loadingToast);
      console.error("Delete failed:", e);
      toast.error(e?.message || "Failed to delete subject");
    }
  };

  if (isLoading) return null;

  return (
    <div
      className="p-8 h-full overflow-y-auto animate-in fade-in duration-500"
      onContextMenu={handleBackgroundContextMenu}
    >
      <header className="mb-8 border-b border-[#2f334d] pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Knowledge Base
        </h1>
        <p className="text-gray-500 font-mono text-sm">
          Select a subject to begin. Right-click for options.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects?.map((sub: ent.Node) => (
          <div
            key={String(sub.id)}
            onClick={() => navigate(`/library?nodeId=${sub.id}`)}
            onContextMenu={(e) => handleItemContextMenu(e, sub)}
            className="group relative bg-[#1a1b26] border border-[#2f334d] p-6 rounded-lg cursor-pointer hover:border-[#89b4fa] transition-all hover:shadow-lg hover:-translate-y-1"
          >
            {/* Context Icon */}
            <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 group-hover:text-[#89b4fa] transition-all">
              <Book size={24} />
            </div>

            <h3 className="text-xl font-bold text-gray-200 group-hover:text-white mb-2">
              {sub.title || "Untitled Subject"}
            </h3>

            {/* Fake Mastery Bar */}
            <div className="w-full bg-[#16161e] h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[#2f334d] w-0 group-hover:w-1/3 transition-all duration-1000" />
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
              <span>{String(sub.id).split("-")[0]}</span>
              <span className="group-hover:text-[#89b4fa]">Open Subject &rarr;</span>
            </div>
          </div>
        ))}

        {subjects?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[#2f334d] rounded-lg">
            <p className="text-gray-500">No subjects found. Use the sidebar to create one.</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onCreate={contextMenu.subject ? () => setIsCreateOpen(true) : () => setIsCreateOpen(true)}
          onEdit={contextMenu.subject ? () => setEditTarget(contextMenu.subject!) : undefined}
          onDelete={contextMenu.subject ? () => setDeleteTarget({
            id: String(contextMenu.subject!.id),
            title: contextMenu.subject!.title || "Untitled"
          }) : undefined}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <NodeModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          mode="edit"
          initialNode={editTarget}
        />
      )}

      {/* Create Modal */}
      <NodeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        defaultType="subject"
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All topics, problems, theories, and practice data will be permanently deleted.`}
      />
    </div>
  );
}
