import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetNode, UpdateNode } from "../../wailsjs/go/app/App";
import { Save, Eye, Code, FileText } from "lucide-react";
import NodeEditor from "../smart/NodeEditor";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import clsx from "clsx";
import { toast } from "sonner"; // Assuming you installed sonner, else use console

type ViewMode = 'edit' | 'preview';

export default function Library() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get('nodeId');

  // Fetch
  const { data: node, isLoading } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => GetNode(nodeId!),
    enabled: !!nodeId,
  });

  // Local State
  const [body, setBody] = useState("");
  // const [title, setTitle] = useState(""); // We treat the first line or a specific field as title later?
  // For now, let's assume 'body' contains everything.
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isDirty, setIsDirty] = useState(false);

  const safeBody = node?.body || "";

  // Sync
  useEffect(() => {
    if (node) {
      setBody(node.body || "");
      setIsDirty(false);
    }
  }, [node]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nodeId) throw new Error("No node");
      return UpdateNode(nodeId, body);
    },
    onSuccess: (updated) => {
      setIsDirty(false);
      queryClient.setQueryData(['node', nodeId], updated);
      toast.success("Changes saved to disk"); // <--- Wired up!
    }
  });

  const handleBodyChange = (val: string) => {
    setBody(val);
    if (node && val !== node.body) setIsDirty(true);
  };

  if (!nodeId) return <EmptyState />;
  if (isLoading) return <div className="p-8 text-gray-500 font-mono">Loading...</div>;
  if (!node) return <div>Error</div>;

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in">

      {/* 1. Meta Header (Always Visible) */}
      <div className="mb-6 flex justify-between items-start border-b border-(--tui-border) pb-4">
        <div className="flex-1 mr-8">
          <div className="flex items-center gap-3 mb-2">
            <span className={clsx(
              "text-[10px] font-mono uppercase px-2 py-0.5 border rounded bg-opacity-10",
              node.type === 'problem' ? "border-blue-500 text-blue-400" : "border-purple-500 text-purple-400"
            )}>
              {node.type}
            </span>
            <span className="text-xs font-mono text-gray-600">ID: {String(node.id).split('-')[0]}</span>
          </div>

          {/* Title Input (Visual only for now, maps to nothing in DB unless we split body) */}
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {safeBody.split('\n')[0] || "Untitled Node"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="flex bg-[#16161e] p-1 rounded border border-gray-700 mr-4">
            <button
              onClick={() => setViewMode('edit')}
              className={clsx("p-1.5 rounded transition-all", viewMode === 'edit' ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white")}
              title="Edit Code"
            >
              <Code size={16} className="bg-transparent" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={clsx("p-1.5 rounded transition-all", viewMode === 'preview' ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white")}
              title="Preview"
            >
              <Eye size={16} className="bg-transparent" />
            </button>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all",
              isDirty ? "bg-(--tui-primary) text-black" : "bg-gray-800 text-gray-500 opacity-50"
            )}
          >
            <Save size={14} className="bg-transparent" />
            {saveMutation.isPending ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>

      {/* 2. Editor / Preview Area */}
      <div className="flex-1 min-h-0 relative border border-(--tui-border) rounded-md overflow-hidden bg-[#1e1e2e]">
        {viewMode === 'edit' ? (
          <NodeEditor
            initialContent={body}
            onChange={handleBodyChange}
          />
        ) : (
          <div className="h-full overflow-auto p-8 bg-[#1e1e2e]">
            <MarkdownRenderer content={body} />
          </div>
        )}
      </div>

      {/* 3. Footer */}
      <div className="mt-2 text-[10px] text-gray-500 font-mono flex justify-between">
        <span>{viewMode === 'edit' ? "INSERT MODE" : "READ MODE"}</span>
        <span>{body.length} chars</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4">
      <div className="p-6 bg-(--tui-sidebar) rounded-full">
        <FileText size={48} className="opacity-50 text-(--tui-primary)" />
      </div>
      <p>Select a node to edit.</p>
    </div>
  )
}
