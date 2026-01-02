import { useState, useEffect } from "react";
import { X, Check, Lock, Trash2, Link as LinkIcon, Search, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetSubjects,
  GetChildren,
  CreateNode,
  UpdateNode,
  CreateAssociation,
  SearchNodes,
} from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import { createPortal } from "react-dom";
import NodeEditor from "../smart/NodeEditor";


// Define Debounce Hook inline or import it
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
  const [selectedTargetNode, setSelectedTargetNode] = useState<{ id: string; title: string } | null>(
    null
  );

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

  // Search Query for Relations
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[90vw] max-w-6xl h-[85vh] bg-[#1a1b26] border border-[#2f334d] shadow-2xl rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-[#2f334d] bg-[#16161e]">
          <div className="flex items-center gap-4">
            <span
              className={clsx(
                "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                mode === "create"
                  ? "bg-[#89b4fa]/20 text-[#89b4fa]"
                  : "bg-orange-500/20 text-orange-400"
              )}
            >
              {mode === "create" ? "CREATE" : "EDIT"}
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {mode === "create" ? "New Knowledge Node" : "Edit Properties"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL */}
          <div className="w-80 bg-[#16161e] border-r border-[#2f334d] p-6 space-y-8 overflow-y-auto">
            {/* Type Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Node Type
              </label>
              <div className="grid gap-2">
                {NODE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => mode === "create" && setSelectedType(t)}
                    disabled={mode === "edit"}
                    className={clsx(
                      "px-4 py-3 rounded text-left text-sm font-bold capitalize transition-all border cursor-pointer flex justify-between items-center",
                      selectedType === t
                        ? "bg-[#89b4fa]/10 text-[#89b4fa] border-[#89b4fa]"
                        : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-600 hover:bg-white/5",
                      mode === "edit" &&
                      selectedType !== t &&
                      "opacity-30 cursor-not-allowed"
                    )}
                  >
                    {t}
                    {selectedType === t && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Hierarchy */}
            {mode === "create" && selectedType !== "subject" && (
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
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
                    className="w-full bg-[#1a1b26] border border-gray-700 rounded px-2 py-2 text-sm text-white outline-none"
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
                  <div className="space-y-1 animate-in fade-in">
                    <span className="text-[10px] text-gray-500">Parent Topic</span>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full bg-[#1a1b26] border border-gray-700 rounded px-2 py-2 text-sm text-white outline-none"
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

          {/* RIGHT PANEL */}
          <div className="flex-1 p-8 bg-[#1a1b26] overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-12">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter node title..."
                  className="w-full bg-transparent border-b-2 border-gray-700 text-4xl font-bold text-white py-4 outline-none focus:border-[#89b4fa] placeholder-gray-700 transition-colors"
                  autoFocus
                />
              </div>

              {/* Description/Body */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Description
                </label>
                <div className="border border-[#2f334d] rounded-lg overflow-hidden bg-[#16161e] shadow-inner">
                  <NodeEditor
                    initialContent={body}
                    onChange={setBody}
                    readOnly={false}
                  />
                </div>
              </div>


              {/* Relationships */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2f334d] pb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <LinkIcon size={14} /> Connections
                  </label>
                </div>

                {/* Adder Row */}
                <div className="flex gap-4 p-4 bg-[#1f2335] rounded-lg border border-[#2f334d] items-start relative z-20">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase">
                      Relation Type
                    </label>
                    <select
                      value={newRelType}
                      onChange={(e) => setNewRelType(e.target.value)}
                      className="w-full bg-[#16161e] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#89b4fa]"
                    >
                      {REL_TYPES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Target */}
                  <div className="flex-2 space-y-1 relative">
                    <label className="text-[10px] text-gray-400 uppercase">
                      Target Node
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        size={14}
                      />
                      <input
                        value={targetSearchQuery}
                        onChange={(e) => {
                          setTargetSearchQuery(e.target.value);
                          setSelectedTargetNode(null);
                        }}
                        placeholder={
                          selectedTargetNode ? selectedTargetNode.title : "Search node..."
                        }
                        className={clsx(
                          "w-full bg-[#16161e] border rounded pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-[#89b4fa]",
                          selectedTargetNode ? "border-[#89b4fa]" : "border-gray-700"
                        )}
                      />
                    </div>

                    {targetSearchQuery.length > 2 && !selectedTargetNode && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1b26] border border-[#2f334d] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                        {searchResults?.map((res: any) => (
                          <button
                            key={res.id}
                            onClick={() => {
                              setSelectedTargetNode({
                                id: String(res.id),
                                title: res.title,
                              });
                              setTargetSearchQuery(res.title);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#89b4fa]/10 text-sm text-gray-300 hover:text-white border-b border-gray-800 last:border-0 flex justify-between"
                          >
                            <span>{res.title}</span>
                            <span className="text-[10px] bg-gray-800 px-1 rounded uppercase">
                              {res.type}
                            </span>
                          </button>
                        ))}
                        {searchResults?.length === 0 && (
                          <div className="px-4 py-2 text-xs text-gray-500">
                            No nodes found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAddRelation}
                    disabled={!selectedTargetNode}
                    className="mt-6 px-4 py-2 bg-[#89b4fa] text-black text-xs font-bold rounded hover:bg-[#b4befe] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    LINK
                  </button>
                </div>

                {/* Relations List */}
                <div className="space-y-2">
                  {relations.map((rel, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[#16161e] border border-[#2f334d] rounded animate-in fade-in slide-in-from-top-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 bg-[#2f334d] rounded text-[10px] font-mono text-[#89b4fa] uppercase">
                          {rel.relType}
                        </div>
                        <ChevronRight size={14} className="text-gray-600" />
                        <span className="text-gray-300 text-sm font-medium">
                          {rel.targetTitle}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveRelation(idx)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-[#2f334d] bg-[#16161e] flex items-center justify-between px-8">
          <span className="text-gray-500 text-xs font-mono">
            {mode === "create"
              ? "Drill down to select parent."
              : `Editing UUID: ${String(initialNode?.id).split("-")[0]}`}
          </span>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-[#89b4fa] text-black text-sm font-bold rounded hover:bg-[#b4befe] transition-colors flex items-center gap-2 cursor-pointer"
            >
              {mode === "create" ? "CREATE NODE" : "SAVE CHANGES"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
