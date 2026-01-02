import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import { Book, Edit3 } from "lucide-react";

export default function Library() {
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get('nodeId');

  // 1. Fetch Node Data
  const { data: node, isLoading } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => GetNode(nodeId!),
    enabled: !!nodeId, // Only run if ID exists
  });

  if (!nodeId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4 animate-in fade-in">
        <div className="p-6 bg-[#1a1b26] rounded-full">
          <Book size={48} className="opacity-50 text-(--tui-primary)" />
        </div>
        <p className="font-mono text-sm">Select a topic from the sidebar to view content.</p>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-gray-500 font-mono">Loading node data...</div>;
  if (!node) return <div className="p-8 text-red-400 font-mono">Node not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-gray-700 rounded text-gray-500 bg-[#1a1b26]">
            {node.type}
          </span>
          <span className="text-xs font-mono text-gray-600">{String(node.id).substring(0, 8)}...</span>
        </div>

        <div className="flex justify-between items-start">
          <h1 className="text-4xl font-bold text-(--tui-fg) tracking-tight">
            {node.body}
          </h1>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-(--tui-primary) border border-(--tui-primary) rounded hover:bg-(--tui-primary) hover:text-black transition-colors">
            <Edit3 size={14} />
            EDIT
          </button>
        </div>
      </header>

      {/* Content Body (Later: CodeMirror) */}
      <div className="prose prose-invert prose-emerald max-w-none text-gray-300 font-sans">
        <p>
          Here is where the Markdown content for <strong>{node.body}</strong> will appear.
          In Phase 5.2, we will replace this text block with the <code>CodeMirror</code> editor.
        </p>
        <div className="bg-[#16161e] p-4 rounded-lg border border-gray-800 font-mono text-sm text-blue-300 mt-6">
          {/* Metadata Dump */}
          <p className="text-gray-500 mb-2">// Metadata</p>
          {JSON.stringify(node.metadata || {}, null, 2)}
        </div>
      </div>
    </div>
  );
}
