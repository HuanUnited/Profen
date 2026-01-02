import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateNode } from "../../../wailsjs/go/app/App";
import { Save, Eye, Code } from "lucide-react";
import NodeEditor from "../../smart/NodeEditor";
import MarkdownRenderer from "../../atomic/MarkdownRenderer";
import clsx from "clsx";
import { toast } from "sonner";
import { ent } from "../../../wailsjs/go/models";

type ViewMode = 'edit' | 'preview';

export default function LeafNodeView({ node }: { node: ent.Node }) {
  const queryClient = useQueryClient();

  // Local State
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isDirty, setIsDirty] = useState(false);

  // Sync state when node changes
  useEffect(() => {
    if (node) {
      const fullBody = node.body || "";
      setBody(fullBody);
      // Extract first line as title, or use a default
      const firstLine = fullBody.split('\n')[0].replace(/^#\s*/, ''); // Remove Markdown header char
      setTitle(firstLine || "Untitled Node");
      setIsDirty(false);
    }
  }, [node]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Reconstruct body: Ensure Title is the first line if we want that convention
      // For now, we just save the 'body' state directly to keep it simple.
      // If you want strict Title separation, we'd Prepend 'title' to body here.
      return UpdateNode(node.id as any, body);
    },
    onSuccess: (updated) => {
      setIsDirty(false);
      queryClient.setQueryData(['node', String(node.id)], updated); // Ensure string ID for key
      toast.success("Changes saved to disk");
    }
  });

  const handleBodyChange = (val: string) => {
    setBody(val);
    if (val !== node.body) setIsDirty(true);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) saveMutation.mutate();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setViewMode(prev => prev === 'edit' ? 'preview' : 'edit');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, saveMutation]);

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in">

      {/* Header */}
      <div className="mb-6 flex justify-between items-center border-b border-(--tui-border) pb-4">
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

          {/* Editable Title (Updates local state only, needs logic to write back to Body if that's the convention) */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-3xl font-bold text-white tracking-tight w-full outline-none border-b border-transparent focus:border-(--tui-primary) transition-colors placeholder-gray-700"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex bg-[#16161e] p-1 rounded-lg border border-gray-700 w-32 h-10">
            <div
              className={clsx(
                "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-(--tui-primary) transition-all duration-300 ease-out",
                viewMode === 'edit' ? "left-1" : "left-[calc(50%+2px)]"
              )}
            />
            <button
              onClick={() => setViewMode('edit')}
              className={clsx("flex-1 z-10 flex items-center justify-center gap-2 text-xs font-bold transition-colors", viewMode === 'edit' ? "text-black" : "text-gray-500 hover:text-white")}
            >
              <Code size={14} /> EDIT
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={clsx("flex-1 z-10 flex items-center justify-center gap-2 text-xs font-bold transition-colors", viewMode === 'preview' ? "text-black" : "text-gray-500 hover:text-white")}
            >
              <Eye size={14} /> VIEW
            </button>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
            className={clsx(
              "flex items-center gap-2 px-5 h-10 text-xs font-bold rounded-lg transition-all border",
              isDirty
                ? "bg-(--tui-primary) text-black border-(--tui-primary) hover:bg-white hover:border-white shadow-[0_0_15px_rgba(137,180,250,0.3)]"
                : "bg-transparent text-gray-600 border-gray-800 cursor-not-allowed"
            )}
            title="Ctrl+S"
          >
            <Save size={16} />
            {saveMutation.isPending ? "..." : "SAVE"}
          </button>
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 min-h-0 relative border border-(--tui-border) rounded-md overflow-hidden bg-[#1e1e2e]">
        {viewMode === 'edit' ? (
          <NodeEditor initialContent={body} onChange={handleBodyChange} />
        ) : (
          <div className="h-full overflow-auto p-8 bg-[#1e1e2e]">
            <MarkdownRenderer content={body} />
          </div>
        )}
      </div>
    </div>
  );
}
