import { useState, useEffect } from "react";
import { X, Check, Lock, Trash2, Link as LinkIcon, Search, ChevronRight } from "lucide-react";
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
} from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import NodeEditor from "./NodeEditor";
import StyledFormContainer from "../atomic/StyledFormContainer";
import StyledFormGroup from "../atomic/StylizedFormGroup";
import StyledButton from "../atomic/StylizedButton";

// Enhanced Modal Wrapper with StyledForm gradient
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

  /* Hide Scrollbars */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// Define Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialNode?: ent.Node;
  initialParentId?: string;
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
}: NodeModalProps) {
  const queryClient = useQueryClient();

  // Core Form State
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<string>("subject");
  const [parentId, setParentId] = useState<string>(initialParentId || "");

  // Drill Down State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Relation State
  const [relations, setRelations] = useState<PendingRelation[]>([]);
  const [newRelType, setNewRelType] = useState("similar_to");
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [selectedTargetNode, setSelectedTargetNode] = useState<{ id: string; title: string } | null>(null);

  const [body, setBody] = useState("");

  // Debounce search
  const debouncedSearch = useDebounce(targetSearchQuery, 500);

  // Queries
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: GetSubjects,
    enabled: isOpen,
  });

  const { data: topics } = useQuery({
    queryKey: ["children", selectedSubjectId],
    queryFn: () => GetChildren(selectedSubjectId),
    enabled: !!selectedSubjectId,
  });

  const { data: searchResults } = useQuery({
    queryKey: ["search", debouncedSearch],
    queryFn: () => SearchNodes(debouncedSearch),
    enabled: debouncedSearch.length > 2,
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialNode) {
        setTitle(initialNode.title || "");
        setBody(initialNode.body || "");
        setSelectedType(initialNode.type || "subject");
        setParentId(String(initialNode.parent_id || ""));
        setRelations([]);
      } else {
        setTitle("");
        setBody("");
        setSelectedType("subject");
        setRelations([]);
        setSelectedSubjectId("");
        setSelectedTopicId("");
      }
    }
  }, [isOpen, mode, initialNode]);

  const handleAddRelation = () => {
    if (!selectedTargetNode) return;
    setRelations((prev) => [
      ...prev,
      {
        targetId: selectedTargetNode.id,
        relType: newRelType,
        targetTitle: selectedTargetNode.title,
      },
    ]);
    setTargetSearchQuery("");
    setSelectedTargetNode(null);
  };

  const handleRemoveRelation = (index: number) => {
    setRelations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
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
        const updated = await UpdateNode(
          String(initialNode.id),
          title,
          body,
        );
        nodeId = String(updated.id);
      }

      if (relations.length > 0) {
        await Promise.all(
          relations.map((rel) => CreateAssociation(nodeId, rel.targetId, rel.relType))
        );
      }

      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      if (parentId) queryClient.invalidateQueries({ queryKey: ["children", parentId] });
      if (initialNode)
        queryClient.invalidateQueries({ queryKey: ["node", String(initialNode.id)] });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <ModalWrapper className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="modal-container w-[90vw] max-w-6xl h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-[#2f334d]/50 bg-[#16161e]/90 backdrop-blur-sm">
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
          <StyledButton
            variant="ghost"
            size="sm"
            icon={<X size={20} />}
            onClick={onClose}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Node Type & Hierarchy */}
          <div className="w-80 bg-[#1a1b26]/80 border-r border-[#2f334d]/50 p-8 space-y-8 overflow-y-auto no-scrollbar">
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
                    size="lg"
                    className={clsx(
                      "justify-start w-full! text-left px-4 py-3",
                      mode === "edit" && selectedType !== t && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => mode === "create" && setSelectedType(t)}
                    disabled={mode === "edit"}
                  >
                    {t.toUpperCase()}
                    {selectedType === t && <Check size={16} />}
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

                {/* Subject */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500">Parent Subject</span>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicId("");
                    }}
                    className="w-full bg-[#1a1b26] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#e81cff]"
                  >
                    <option value="">-- Select --</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic */}
                {(selectedType === "problem" || selectedType === "theory") && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500">Parent Topic</span>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full bg-[#1a1b26] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#e81cff]"
                      disabled={!selectedSubjectId}
                    >
                      <option value="">-- Select --</option>
                      {topics?.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: StyledFormContainer */}
          <div className="flex-1 p-8 bg-transparent overflow-hidden flex flex-col">

            {/* Main Form */}
            <StyledFormContainer className="flex-1 max-w-2xl mx-auto">

              {/* Title */}
              <StyledFormGroup>
                <label>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter node title..."
                  autoFocus
                  className="text-3xl! font-bold! py-3!"
                />
              </StyledFormGroup>

              {/* Content */}
              <StyledFormGroup>
                <label>Content</label>
                <div className="h-80 border border-[#414141] rounded-lg overflow-hidden bg-[#1a1b26]/80">
                  <NodeEditor
                    initialContent={body}
                    onChange={setBody}
                    readOnly={false}
                  />
                </div>
              </StyledFormGroup>

            </StyledFormContainer>

            {/* Relations Section */}
            <div className="mt-8 pt-8 border-t border-[#2f334d]/50 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                <LinkIcon size={16} />
                Relationships
              </div>

              {/* Add Relation Row */}
              <div className="flex gap-3 p-4 bg-[#1a1b26]/50 border border-[#2f334d]/50 rounded-xl items-start">
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Type</label>
                  <select
                    value={newRelType}
                    onChange={(e) => setNewRelType(e.target.value)}
                    className="w-full bg-[#1a1b26] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#e81cff]"
                  >
                    {REL_TYPES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 space-y-2 relative">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Target</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      value={targetSearchQuery}
                      onChange={(e) => {
                        setTargetSearchQuery(e.target.value);
                        setSelectedTargetNode(null);
                      }}
                      placeholder="Search nodes..."
                      className={clsx(
                        "w-full bg-[#1a1b26] border rounded-lg pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#89b4fa]",
                        selectedTargetNode ? "border-[#89b4fa]" : "border-gray-700"
                      )}
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {targetSearchQuery.length > 2 && !selectedTargetNode && searchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1b26]/95 border border-[#2f334d] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 no-scrollbar">
                      {searchResults.map((res: any) => (
                        <button
                          key={res.id}
                          onClick={() => {
                            setSelectedTargetNode({ id: String(res.id), title: res.title });
                            setTargetSearchQuery(res.title);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[#89b4fa]/10 text-sm border-b border-gray-800/50 last:border-b-0 flex justify-between items-center transition-colors"
                        >
                          <span className="truncate">{res.title}</span>
                          <span className="text-xs bg-gray-800/50 px-2 py-0.5 rounded-full">
                            {res.type}
                          </span>
                        </button>
                      ))}
                      {searchResults.length === 0 && (
                        <div className="px-4 py-3 text-xs text-gray-500 text-center">
                          No nodes found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <StyledButton
                  variant="primary"
                  size="sm"
                  onClick={handleAddRelation}
                  disabled={!selectedTargetNode}
                >
                  LINK
                </StyledButton>
              </div>

              {/* Relations List */}
              {relations.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                  {relations.map((rel, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#1a1b26]/50 border border-[#2f334d]/50 rounded-lg group hover:bg-[#2f334d]/50 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="px-2.5 py-1 bg-[#89b4fa]/20 border border-[#89b4fa]/30 rounded-md text-xs font-mono text-[#89b4fa]">
                          {rel.relType.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <ChevronRight size={14} className="text-gray-500" />
                        <span className="text-gray-300 text-sm font-medium truncate">
                          {rel.targetTitle}
                        </span>
                      </div>
                      <StyledButton
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleRemoveRelation(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-[#2f334d]/50 bg-[#16161e]/90 backdrop-blur-sm flex items-center justify-between px-8">
          <span className="text-gray-500 text-xs font-mono">
            {mode === "create"
              ? "Drill down to select parent hierarchy."
              : `Editing ${String(initialNode?.id || '').split("-")[0]}...`}
          </span>
          <div className="flex gap-3">
            <StyledButton
              variant="ghost"
              size="md"
              onClick={onClose}
            >
              CANCEL
            </StyledButton>
            <StyledButton
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              {mode === "create" ? "CREATE NODE" : "SAVE CHANGES"}
            </StyledButton>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );

  return createPortal(modal, document.body);
}
