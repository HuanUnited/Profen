import { useState, useEffect } from "react";
import { X, Check, Lock } from "lucide-react"; // Removed unused Chevron imports
import clsx from "clsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetSubjects, GetChildren, CreateNode, UpdateNode } from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialNode?: ent.Node;
  initialParentId?: string;
}

const NODE_TYPES = ['subject', 'topic', 'problem', 'theory'];

export default function NodeModal({ isOpen, onClose, mode, initialNode, initialParentId }: NodeModalProps) {
  const queryClient = useQueryClient();

  // Explicitly type state to avoid inference issues
  const [title, setTitle] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("subject");
  const [parentId, setParentId] = useState<string>(initialParentId || "");

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialNode) {
        // Ensure we never pass undefined to the setter
        setTitle(initialNode.title || "");
        setSelectedType(initialNode.type || "subject");
        setParentId(String(initialNode.parent_id || "")); // Convert number/uuid to string if needed
      } else {
        setTitle("");
        // Reset other fields if creating
        setSelectedType("subject");
        setSelectedSubjectId("");
        setSelectedTopicId("");
      }
    }
  }, [isOpen, mode, initialNode, initialParentId]);

  // ... (Queries remain the same) ...
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects,
    enabled: isOpen && selectedType !== 'subject'
  });

  const { data: topics } = useQuery({
    queryKey: ['children', selectedSubjectId],
    queryFn: () => GetChildren(selectedSubjectId),
    enabled: !!selectedSubjectId && (selectedType === 'problem' || selectedType === 'theory')
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let finalParent = "";
      if (selectedType === 'topic') finalParent = selectedSubjectId;
      if (selectedType === 'problem' || selectedType === 'theory') finalParent = selectedTopicId;
      if (!finalParent && initialParentId) finalParent = initialParentId;

      // Updated Signature: type, parent, title
      return CreateNode(selectedType, finalParent, title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (parentId) queryClient.invalidateQueries({ queryKey: ['children', parentId] });
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!initialNode) return;
      // Updated Signature: id, title, body
      // We preserve the existing body since this modal only edits properties
      return UpdateNode(String(initialNode.id), title, initialNode.body || "");
    },
    onSuccess: () => {
      if (initialNode) queryClient.invalidateQueries({ queryKey: ['node', String(initialNode.id)] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onClose();
    }
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (mode === 'create') createMutation.mutate();
    else updateMutation.mutate();
  };

  if (!isOpen) return null;

  // ... (Render matches previous, just ensure imports like Chevron are removed if unused) ...
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* ... UI Code same as before ... */}
      <div className="w-[600px] bg-[#1a1b26] border border-[#2f334d] shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-[#2f334d] bg-[#16161e]">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {mode === 'create' ? "Create New Node" : "Edit Node Properties"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

          {/* 1. Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Node Type</label>
            <div className="flex gap-2">
              {NODE_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => mode === 'create' && setSelectedType(t)}
                  disabled={mode === 'edit'} // Lock type on edit
                  className={clsx(
                    "px-4 py-2 rounded text-sm font-bold capitalize transition-all border",
                    selectedType === t
                      ? "bg-[#89b4fa] text-black border-[#89b4fa]"
                      : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500",
                    mode === 'edit' && selectedType !== t && "opacity-25 cursor-not-allowed"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Parent Drill Down (Only for Create Mode & Dependent Types) */}
          {mode === 'create' && selectedType !== 'subject' && (
            <div className="space-y-4 p-4 bg-[#1f2335] rounded border border-[#2f334d]">
              <div className="flex items-center gap-2 text-xs text-[#89b4fa] font-mono mb-2">
                <Lock size={12} />
                <span>HIERARCHY REQUIRED</span>
              </div>

              {/* Subject Selector */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Parent Subject</label>
                <select
                  className="w-full bg-[#16161e] border border-gray-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-[#89b4fa]"
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedTopicId(""); // Reset child
                  }}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.title || s.body?.substring(0, 20)}</option>
                  ))}
                </select>
              </div>

              {/* Topic Selector (If needed) */}
              {(selectedType === 'problem' || selectedType === 'theory') && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs text-gray-500">Parent Topic</label>
                  <select
                    className="w-full bg-[#16161e] border border-gray-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-[#89b4fa]"
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    disabled={!selectedSubjectId}
                  >
                    <option value="">-- Select Topic --</option>
                    {topics?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title || t.body?.substring(0, 20)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 3. Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Node Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className="w-full bg-[#16161e] border border-gray-700 text-white text-lg rounded px-4 py-3 outline-none focus:border-[#89b4fa] placeholder-gray-700 font-bold"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2f334d] bg-[#1a1b26] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 bg-[#89b4fa] text-black text-sm font-bold rounded hover:bg-[#b4befe] transition-colors flex items-center gap-2"
          >
            {createMutation.isPending || updateMutation.isPending ? "SAVING..." : (
              <>
                <Check size={16} />
                {mode === 'create' ? "CREATE NODE" : "SAVE CHANGES"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
