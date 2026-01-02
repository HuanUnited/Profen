import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateNode } from "../../wailsjs/go/app/App";
import { Save, Eye, Code, ArrowRight } from "lucide-react";
import { ent } from "../../wailsjs/go/models";
import NodeEditor from "../smart/NodeEditor";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import clsx from "clsx";
import { toast } from "sonner";

interface LeafViewProps {
  node: ent.Node;
}

type ViewMode = 'edit' | 'preview';

export default function LeafView({ node }: LeafViewProps) {
  const queryClient = useQueryClient();

  // Local State
  const [body, setBody] = useState(node.body || "");
  const [viewMode, setViewMode] = useState<ViewMode>('preview'); // Default to Preview for leaves
  const [isDirty, setIsDirty] = useState(false);

  // Sync state if node changes
  useEffect(() => {
    setBody(node.body || "");
    setIsDirty(false);
    setViewMode('preview'); // Reset to preview on nav
  }, [node]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Pass Title and Body
      return UpdateNode(String(node.id), node.title || "", body);
    },
    onSuccess: (updated) => {
      setIsDirty(false);
      queryClient.setQueryData(['node', String(node.id)], updated);
      toast.success("Changes saved");
    }
  });

  const handleBodyChange = (val: string) => {
    setBody(val);
    if (val !== node.body) setIsDirty(true);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in slide-in-from-bottom-2">

      {/* 1. Header (Leaf Specific) */}
      <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx(
              "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
              node.type === 'problem' ? "bg-blue-900/20 text-blue-400" : "bg-purple-900/20 text-purple-400"
            )}>
              {node.type}
            </span>
            <span className="text-xs text-gray-600 font-mono">UUID::{String(node.id).split('-')[0]}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{node.title}</h1>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-3">
          {/* Attempt Button (Placeholder) */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b26] border border-[#2f334d] rounded text-xs font-bold text-[#89b4fa] hover:bg-[#89b4fa] hover:text-black transition-all">
            Attempt <ArrowRight size={14} />
          </button>

          <div className="w-px h-6 bg-[#2f334d] mx-2" />

          {/* View Toggles */}
          <div className="flex bg-[#16161e] p-1 rounded border border-[#2f334d]">
            <button
              onClick={() => setViewMode('edit')}
              className={clsx("p-1.5 rounded", viewMode === 'edit' ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white")}
            >
              <Code size={16} />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={clsx("p-1.5 rounded", viewMode === 'preview' ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white")}
            >
              <Eye size={16} />
            </button>
          </div>

          {/* Save */}
          {isDirty && (
            <button
              onClick={() => saveMutation.mutate()}
              className="p-2 bg-[#89b4fa] text-black rounded hover:bg-[#b4befe] animate-in zoom-in"
              title="Save Changes"
            >
              <Save size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 min-h-0 relative border border-[#2f334d] rounded-lg overflow-hidden bg-[#16161e] shadow-inner">
        {viewMode === 'preview' ? (
          <div className="absolute inset-0 overflow-auto p-8 custom-markdown">
            <MarkdownRenderer content={body} />
          </div>
        ) : (
          <NodeEditor initialContent={body} onChange={handleBodyChange} />
        )}
      </div>
    </div>
  );
}
