import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import ModalShell from "../layouts/ModalShell";
import NodeEditor from "./NodeEditor";
import NodeTypeSelector from "./node/NodeTypeSelector";
import NodeHierarchySelector from "./node/NodeHierarchySelector";
import NodeRelationshipManager from "./node/NodeRelationshipManager";
import StyledFormContainer from "../atomic/StyledFormContainer";
import StyledFormGroup from "../atomic/StylizedFormGroup";
import StyledButton from "../atomic/StylizedButton";
import ConfirmDialog from "../smart/ConfirmDialogue";
import { toast } from 'sonner';

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
  contextNode?: ent.Node;
  defaultType?: string;
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
  const [body, setBody] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: GetSubjects,
    enabled: isOpen
  });

  const { data: topics } = useQuery({
    queryKey: ["children", selectedSubjectId],
    queryFn: () => GetChildren(selectedSubjectId),
    enabled: !!selectedSubjectId
  });

  const { data: searchResults } = useQuery({
    queryKey: ["search", debouncedSearch],
    queryFn: () => SearchNodes(debouncedSearch),
    enabled: debouncedSearch.length > 2
  });

  const { data: existingAssociations } = useQuery({
    queryKey: ["associations", String(initialNode?.id)],
    queryFn: () => GetNodeAssociations(String(initialNode?.id)),
    enabled: isOpen && mode === "edit" && !!initialNode,
  });

  useEffect(() => {
    if (isOpen && mode === "create") {
      if (contextNode) {
        const nodeType = contextNode.type;
        if (nodeType === "subject") {
          setSelectedType("topic");
          setSelectedSubjectId(String(contextNode.id));
        } else if (nodeType === "topic") {
          setSelectedType(defaultType || "problem");
          setSelectedTopicId(String(contextNode.id));
          if (contextNode.parent_id) {
            setSelectedSubjectId(String(contextNode.parent_id));
          }
        } else {
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
    } else if (isOpen && mode === "edit" && initialNode) {
      setTitle(initialNode.title || "");
      setBody(initialNode.body || "");
      setSelectedType(initialNode.type || "subject");

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
  }, [isOpen, mode, initialNode, existingAssociations, contextNode, defaultType]);

  const handleAddRelation = (relation: PendingRelation) => {
    setRelations((prev) => [...prev, relation]);
  };

  const handleRemoveRelation = (index: number) => {
    setRelations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!initialNode) return;
    const loadingToast = toast.loading('Deleting node...');

    try {
      await DeleteNode(String(initialNode.id));

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

      const existingRelIds = new Set(
        existingAssociations?.map((a: ent.NodeAssociation) =>
          `${a.target_id}-${a.rel_type}`
        ) || []
      );

      const newRelations = relations.filter(rel =>
        !existingRelIds.has(`${rel.targetId}-${rel.relType}`)
      );

      if (newRelations.length > 0) {
        const results = await Promise.allSettled(
          newRelations.map((rel) => CreateAssociation(nodeId, rel.targetId, rel.relType))
        );

        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            console.warn(`Failed to create relation ${newRelations[idx].relType}:`, result.reason);
          }
        });
      }

      await queryClient.refetchQueries({ queryKey: ["subjects"], type: 'active', exact: true });
      await queryClient.invalidateQueries({ queryKey: ["node", nodeId] });
      await queryClient.invalidateQueries({ queryKey: ["associations", nodeId] });

      const allLinkedNodeIds = new Set([
        ...relations.map(r => r.targetId),
        ...(existingAssociations?.map((a: ent.NodeAssociation) => String(a.target_id)) || [])
      ]);

      await Promise.all(
        Array.from(allLinkedNodeIds).map(linkedId =>
          queryClient.invalidateQueries({ queryKey: ["associations", linkedId] })
        )
      );

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

  const footer = (
    <>
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
    </>
  );

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title={mode === "create" ? "New Knowledge Node" : "Edit Properties"}
        badge={{ label: mode === "create" ? "CREATE" : "EDIT", variant: mode }}
        maxWidth="5xl"
        footer={footer}
      >
        <div className="flex h-full overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div className="w-64 bg-[#1a1b26]/80 border-r border-[#2f334d]/50 p-6 space-y-8 overflow-y-auto custom-scrollbar shrink-0">
            <NodeTypeSelector
              selectedType={selectedType}
              nodeTypes={NODE_TYPES}
              mode={mode}
              onTypeSelect={setSelectedType}
            />

            {mode === "create" && (
              <NodeHierarchySelector
                selectedType={selectedType}
                selectedSubjectId={selectedSubjectId}
                selectedTopicId={selectedTopicId}
                subjects={subjects}
                topics={topics}
                onSubjectChange={setSelectedSubjectId}
                onTopicChange={setSelectedTopicId}
              />
            )}
          </div>

          {/* RIGHT CONTENT */}
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

              {/* Relationships */}
              <NodeRelationshipManager
                relations={relations}
                relTypes={REL_TYPES}
                searchResults={searchResults}
                onAddRelation={handleAddRelation}
                onRemoveRelation={handleRemoveRelation}
                onSearch={setSearchQuery}
              />

            </StyledFormContainer>
          </div>
        </div>
      </ModalShell>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Node"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone and may affect related nodes.`}
      />
    </>
  );
}
