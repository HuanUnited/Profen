// frontend/src/components/smart/NodeModal.tsx
import { useState, useEffect } from "react";
import { X, Lock, Trash2, Link as LinkIcon, Search, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import styled from "styled-components";
import {
  GetSubjects,
  GetChildren,
  CreateNode,
  UpdateNode,
  CreateAssociation,
  SearchNodes,
  GetNodeAssociations,
  DeleteNode,
} from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import NodeEditor from "./NodeEditor";
import StyledFormContainer from "../atomic/StyledFormContainer";
import StyledFormGroup from "../atomic/StylizedFormGroup";
import StyledButton from "../atomic/StylizedButton";
import ConfirmDialog from "../smart/ConfirmDialogue";
import { toast } from 'sonner';

// Enhanced Modal Wrapper
const ModalWrapper = styled.div`
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  .modal-container {
    background: linear-gradient(#16161e, #16161e) padding-box,
                linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
    border: 2px solid transparent;
    animation: gradient 5s ease infinite;
    background-size: 200% 100%;
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Custom Scrollbar for Right Panel */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #2f334d; border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #40c9ff; }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
`;

// Define Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialNode?: ent.Node;
  initialParentId?: string;
  // NEW: Context information
  contextNode?: ent.Node;  // The node currently being viewed
  defaultType?: string;    // Suggested type based on context
}

const NODE_TYPES = ["subject", "topic", "problem", "theory", "term"];
const REL_TYPES = ["similar_to", "comes_before", "comes_after", "tests", "defines", "variant_of"];

interface PendingRelation {
  targetId: string;
  relType: string;
  targetTitle: string;
}

export default function NodeModal({
  isOpen,
  onClose,
  mode,
  initialNode,
  initialParentId,
  contextNode,
  defaultType,
}: NodeModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<string>("subject");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [relations, setRelations] = useState<PendingRelation[]>([]);
  const [newRelType, setNewRelType] = useState("similar_to");
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [selectedTargetNode, setSelectedTargetNode] = useState<{ id: string; title: string } | null>(null);
  const [body, setBody] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const debouncedSearch = useDebounce(targetSearchQuery, 500);

  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: GetSubjects, enabled: isOpen });
  const { data: topics } = useQuery({ queryKey: ["children", selectedSubjectId], queryFn: () => GetChildren(selectedSubjectId), enabled: !!selectedSubjectId });
  const { data: searchResults } = useQuery({ queryKey: ["search", debouncedSearch], queryFn: () => SearchNodes(debouncedSearch), enabled: debouncedSearch.length > 2 });

  const { data: existingAssociations } = useQuery({
    queryKey: ["associations", String(initialNode?.id)],
    queryFn: () => GetNodeAssociations(String(initialNode?.id)),
    enabled: isOpen && mode === "edit" && !!initialNode,
  });

  useEffect(() => {
    if (isOpen && mode === "create") {
      // Determine smart defaults based on context
      if (contextNode) {
        const nodeType = contextNode.type;

        if (nodeType === "subject") {
          // In Subject view -> default to creating Topic
          setSelectedType("topic");
          setSelectedSubjectId(String(contextNode.id));
        } else if (nodeType === "topic") {
          // In Topic view -> default to creating Problem
          setSelectedType(defaultType || "problem");
          setSelectedTopicId(String(contextNode.id));
          // Also need to find and set the parent subject
          if (contextNode.parent_id) {
            setSelectedSubjectId(String(contextNode.parent_id));
          }
        } else {
          // For Problem/Theory views, use default or subject
          setSelectedType(defaultType || "subject");
        }
      } else if (defaultType) {
        setSelectedType(defaultType);
      } else {
        setSelectedType("subject");
      }

      setTitle("");
      setBody("");
      setRelations([]);
      setSelectedTargetNode(null);
      setTargetSearchQuery("");
    } else if (isOpen && mode === "edit" && initialNode) {
      setTitle(initialNode.title || "");
      setBody(initialNode.body || "");
      setSelectedType(initialNode.type || "subject");

      // Load existing relations with proper type safety
      if (existingAssociations && existingAssociations.length > 0) {
        const existingRels: PendingRelation[] = existingAssociations
          .filter((assoc: ent.NodeAssociation) =>
            assoc.rel_type !== undefined &&
            assoc.edges?.target?.title !== undefined
          )
          .map((assoc: ent.NodeAssociation) => ({
            targetId: String(assoc.target_id),
            relType: assoc.rel_type!,
            targetTitle: assoc.edges?.target?.title || "Unknown",
          }));
        setRelations(existingRels);
      } else {
        setRelations([]);
      }
    } else {
      setTitle("");
      setBody("");
      setSelectedType("subject");
      setRelations([]);
      setSelectedSubjectId("");
      setSelectedTopicId("");
    }
  }, [isOpen, mode, initialNode, existingAssociations]);

  const handleAddRelation = () => {
    if (!selectedTargetNode) return;
    setRelations((prev) => [...prev, { targetId: selectedTargetNode.id, relType: newRelType, targetTitle: selectedTargetNode.title }]);
    setTargetSearchQuery("");
    setSelectedTargetNode(null);
  };

  const handleRemoveRelation = (index: number) => {
    setRelations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!initialNode) return;
    const loadingToast = toast.loading('Deleting node...');

    try {
      await DeleteNode(String(initialNode.id));

      // Refresh parent view
      const parentToUpdate = String(initialNode.parent_id);
      if (parentToUpdate && parentToUpdate !== "00000000-0000-0000-0000-000000000000") {
        await queryClient.refetchQueries({
          queryKey: ["children", parentToUpdate],
          type: 'active'
        });
      }
      await queryClient.refetchQueries({
        queryKey: ["subjects"],
        type: 'active',
        exact: true
      });

      toast.dismiss(loadingToast);
      toast.success(`"${title}" deleted successfully`);
      onClose();
    } catch (e: any) {
      toast.dismiss(loadingToast);
      console.error("Delete failed:", e);
      toast.error(e?.message || "Failed to delete node. It may have dependencies.");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    const loadingToast = toast.loading(mode === "create" ? "Creating node..." : "Saving changes...");

    try {
      let nodeId = "";
      if (mode === "create") {
        let finalParent = "";
        if (selectedType === "topic") finalParent = selectedSubjectId;
        if (selectedType === "problem" || selectedType === "theory") finalParent = selectedTopicId;
        if (!finalParent && initialParentId) finalParent = initialParentId;
        const newNode = await CreateNode(selectedType, finalParent, title);
        nodeId = String(newNode.id);
      } else {
        if (!initialNode) return;
        const updated = await UpdateNode(String(initialNode.id), title, body);
        nodeId = String(updated.id);
      }

      // **FIX: Only create NEW relations that don't already exist**
      const existingRelIds = new Set(
        existingAssociations?.map((a: ent.NodeAssociation) =>
          `${a.target_id}-${a.rel_type}` // Composite key
        ) || []
      );

      const newRelations = relations.filter(rel =>
        !existingRelIds.has(`${rel.targetId}-${rel.relType}`)
      );

      if (newRelations.length > 0) {
        const results = await Promise.allSettled(
          newRelations.map((rel) => CreateAssociation(nodeId, rel.targetId, rel.relType))
        );

        // Log failures but don't block
        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            console.warn(`Failed to create relation ${newRelations[idx].relType}:`, result.reason);
          }
        });
      }

      // **FIX: Invalidate all affected queries including reverse relationships**
      await queryClient.refetchQueries({ queryKey: ["subjects"], type: 'active', exact: true });

      // Invalidate current node and its associations
      await queryClient.invalidateQueries({ queryKey: ["node", nodeId] });
      await queryClient.invalidateQueries({ queryKey: ["associations", nodeId] });

      // **FIX: Invalidate associations for ALL linked nodes (bidirectional update)**
      const allLinkedNodeIds = new Set([
        ...relations.map(r => r.targetId),
        ...(existingAssociations?.map((a: ent.NodeAssociation) => String(a.target_id)) || [])
      ]);

      await Promise.all(
        Array.from(allLinkedNodeIds).map(linkedId =>
          queryClient.invalidateQueries({ queryKey: ["associations", linkedId] })
        )
      );

      // Invalidate parent's children list
      let parentToUpdate = "";
      if (mode === "create") {
        if (selectedType === "topic") parentToUpdate = selectedSubjectId;
        else if (selectedType === "problem" || selectedType === "theory") parentToUpdate = selectedTopicId;
        else if (initialParentId) parentToUpdate = initialParentId;
      } else if (mode === "edit" && initialNode) {
        parentToUpdate = String(initialNode.parent_id);
      }

      if (parentToUpdate && parentToUpdate !== "00000000-0000-0000-0000-000000000000") {
        await queryClient.refetchQueries({ queryKey: ["children", String(parentToUpdate)], type: 'active' });
      }

      toast.dismiss(loadingToast);
      toast.success(mode === "create" ? `"${title}" created successfully` : "Changes saved successfully");
      onClose();
    } catch (e: any) {
      toast.dismiss(loadingToast);
      console.error(e);
      toast.error(e?.message || "Failed to save node. Check console for details.");
    }
  };

  if (!isOpen) return null;

  const modal = (
    <ModalWrapper className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="modal-container w-[95vw] max-w-7xl h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-[#2f334d]/50 bg-[#16161e]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <span className={clsx(
              "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border",
              mode === "create" ? "bg-[#89b4fa]/20 text-[#89b4fa] border-[#89b4fa]/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"
            )}>
              {mode === "create" ? "CREATE" : "EDIT"}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {mode === "create" ? "New Knowledge Node" : "Edit Properties"}
            </h2>
          </div>
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL */}
          <div className="w-64 bg-[#1a1b26]/80 border-r border-[#2f334d]/50 p-6 space-y-8 overflow-y-auto no-scrollbar shrink-0">
            {/* Type Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                Node Type
              </label>
              <div className="grid gap-2">
                {NODE_TYPES.map((t) => (
                  <StyledButton
                    key={t}
                    variant={selectedType === t ? "primary" : "secondary"}
                    size="sm"
                    className={clsx(
                      "justify-center w-full text-center py-2",
                      mode === "edit" && selectedType !== t && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => mode === "create" && setSelectedType(t)}
                    disabled={mode === "edit"}
                  >
                    {t.toUpperCase()}
                  </StyledButton>
                ))}
              </div>
            </div>

            {/* Hierarchy */}
            {mode === "create" && selectedType !== "subject" && (
              <div className="space-y-4 pt-4 border-t border-gray-800/50">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Lock size={12} /> Hierarchy
                </label>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500">Parent Subject</span>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedTopicId(""); }}
                    className="w-full bg-[#1a1b26] border border-gray-700 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#e81cff]"
                  >
                    <option value="">-- Select --</option>
                    {subjects?.map((s: ent.Node) => (
                      <option key={String(s.id)} value={String(s.id)}>
                        {s.title || "Untitled"}
                      </option>
                    ))}
                  </select>
                </div>
                {(selectedType === "problem" || selectedType === "theory") && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500">Parent Topic</span>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full bg-[#1a1b26] border border-gray-700 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#e81cff]"
                      disabled={!selectedSubjectId}
                    >
                      <option value="">-- Select --</option>
                      {topics?.map((t: ent.Node) => (
                        <option key={String(t.id)} value={String(t.id)}>
                          {t.title || "Untitled"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 bg-transparent overflow-y-auto custom-scrollbar flex flex-col p-8">
            <StyledFormContainer className="w-full max-w-4xl mx-auto space-y-8">

              {/* Title */}
              <StyledFormGroup>
                <label className="text-gray-400 font-bold uppercase tracking-wider text-xs">Node Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter node title..."
                  autoFocus
                  className="text-4xl font-bold py-4 px-0 bg-transparent border-b-2 border-gray-800 focus:border-[#40c9ff] rounded-none"
                />
              </StyledFormGroup>

              {/* Content */}
              <StyledFormGroup className="flex-1 flex flex-col">
                <label className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2">Content Body</label>
                <div className="min-h-100 border border-[#414141] rounded-lg overflow-hidden bg-[#1a1b26]/80 flex flex-col">
                  <NodeEditor
                    initialContent={body}
                    onChange={setBody}
                    readOnly={false}
                  />
                </div>
              </StyledFormGroup>

              {/* Relations Section */}
              <div className="pt-8 border-t border-[#2f334d]/50 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                  <LinkIcon size={16} /> Relationships
                </div>

                <div className="flex gap-3 p-4 bg-[#1a1b26]/50 border border-[#2f334d]/50 rounded-xl items-end">
                  <div className="w-48 space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Type</label>
                    <select
                      value={newRelType}
                      onChange={(e) => setNewRelType(e.target.value)}
                      className="w-full h-10 bg-[#1a1b26] border border-gray-700 rounded-lg px-3 text-sm text-white outline-none focus:border-[#e81cff]"
                    >
                      {REL_TYPES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div className="flex-1 space-y-2 relative">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Target Node</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        value={targetSearchQuery}
                        onChange={(e) => { setTargetSearchQuery(e.target.value); setSelectedTargetNode(null); }}
                        placeholder="Search for nodes to link..."
                        className={clsx(
                          "w-full h-10 bg-[#1a1b26] border rounded-lg pl-10 pr-3 text-sm text-white outline-none focus:border-[#89b4fa]",
                          selectedTargetNode ? "border-[#89b4fa]" : "border-gray-700"
                        )}
                      />
                    </div>
                    {targetSearchQuery.length > 2 && !selectedTargetNode && searchResults && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1b26]/95 border border-[#2f334d] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                        {searchResults.map((res: ent.Node) => (
                          <button
                            key={String(res.id)}
                            onClick={() => { setSelectedTargetNode({ id: String(res.id), title: String(res.title) }); setTargetSearchQuery(String(res.title)); }}
                            className="w-full text-left px-4 py-3 hover:bg-[#89b4fa]/10 text-sm border-b border-gray-800/50 flex justify-between items-center"
                          >
                            <span className="truncate">{res.title}</span>
                            <span className="text-xs bg-gray-800/50 px-2 py-0.5 rounded-full">{res.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <StyledButton
                      variant="primary"
                      size="sm"
                      onClick={handleAddRelation}
                      disabled={!selectedTargetNode}
                      className="h-10"
                    >
                      LINK
                    </StyledButton>
                  </div>
                </div>

                {relations.length > 0 && (
                  <div className="space-y-2">
                    {relations.map((rel, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-[#1a1b26]/50 border border-[#2f334d]/50 rounded-lg group hover:bg-[#2f334d]/50 transition-all">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="px-2.5 py-1 bg-[#89b4fa]/20 border border-[#89b4fa]/30 rounded-md text-xs font-mono text-[#89b4fa]">
                            {rel.relType.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <ChevronRight size={14} className="text-gray-500" />
                          <span className="text-gray-300 text-sm font-medium">{rel.targetTitle}</span>
                        </div>
                        <StyledButton variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleRemoveRelation(idx)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </StyledFormContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-[#2f334d]/50 bg-[#16161e]/90 backdrop-blur-sm flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-mono">
              {mode === "create" ? "Drill down to select parent." : `Editing ${String(initialNode?.id || '').split("-")[0]}`}
            </span>
            {mode === "edit" && (
              <StyledButton
                variant="ghost"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300"
              >
                Delete Node
              </StyledButton>
            )}
          </div>
          <div className="flex gap-3">
            <StyledButton variant="ghost" size="md" onClick={onClose}>CANCEL</StyledButton>
            <StyledButton
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={mode === "create" ? !title.trim() : false}
            >
              {mode === "create" ? "CREATE NODE" : "SAVE CHANGES"}
            </StyledButton>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Node"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone and may affect related nodes.`}
      />
    </ModalWrapper>
  );

  return createPortal(modal, document.body);
}
