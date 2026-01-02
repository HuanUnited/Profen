import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetAttemptHistory } from "../../wailsjs/go/app/App";
import { ArrowRight, Pencil } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";
import clsx from "clsx";
import { ent } from "../../wailsjs/go/models";

interface LeafViewProps {
  node: ent.Node;
}

export default function LeafView({ node }: LeafViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: attempts } = useQuery({
    queryKey: ['attempts', String(node.id)],
    queryFn: () => GetAttemptHistory(String(node.id)),
    enabled: node.type === 'problem'
  });

  return (
    <>
      <div className="h-full flex flex-col p-6 animate-in fade-in slide-in-from-bottom-2">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={clsx(
                  "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                  node.type === "problem"
                    ? "bg-blue-900/20 text-blue-400"
                    : "bg-purple-900/20 text-purple-400"
                )}
              >
                {node.type}
              </span>
              <span className="text-xs text-gray-600 font-mono">
                UUID::{String(node.id).split("-")[0]}
              </span>
              {/* MOVED HERE: Always visible for problems */}
              {node.type === 'problem' && (
                <div className="flex items-center gap-1 text-xs text-gray-400 bg-[#1a1b26] px-2 py-0.5 rounded-full border border-[#2f334d]">
                  <span>{attempts?.length || 0}</span>
                  <span className="font-mono text-[10px]">attempts</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {node.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Attempt Button (Problem only) */}
            {node.type === 'problem' && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b26] border border-[#2f334d] rounded text-xs font-bold text-[#89b4fa] hover:bg-[#89b4fa] hover:text-black transition-all">
                Attempt <ArrowRight size={14} />
              </button>
            )}

            {/* Edit Button (ALL node types) */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b26] border border-[#2f334d] rounded text-xs font-bold text-gray-300 hover:text-white hover:border-[#89b4fa] transition-all"
              title="Edit node properties (Ctrl+E)"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>
        </div>

        {/* Content area - SIMPLIFIED: Always Markdown Preview */}
        <div className="flex-1 min-h-0 relative border border-[#2f334d] rounded-lg overflow-hidden bg-[#16161e] shadow-inner p-8 custom-markdown">
          <MarkdownRenderer content={node.body || ""} />
        </div>

        {/* Header badge (safe)*/}
        {node.type === 'problem' && (
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-[#1a1b26] px-2 py-0.5 rounded-full border border-[#2f334d]">
            <span>{attempts?.length ?? 0}</span> {/* ← Safe */}
            <span className="font-mono text-[10px]">attempts</span>
          </div>
        )}


        {/* Attempt History Panel (Problem only) */}
        {node.type === 'problem' && attempts && attempts.length > 0 && ( // ← Safe
          <div className="mt-6 p-4 bg-[#16161e] border border-[#2f334d] rounded-lg max-h-48 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-4">
              Recent Attempts
            </h3>
            <div className="space-y-2">
              {attempts.slice(0, 8).map((attempt: any, idx: number) => ( // ← Safe
                <div key={idx} className="flex items-center justify-between text-xs text-gray-500 p-2 bg-[#1a1b26] rounded">
                  <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                  <span className="font-mono text-[10px] bg-[#2f334d] px-2 py-0.5 rounded">
                    {String(attempt.card_id).split('-')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      <NodeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        initialNode={node}
      />
    </>
  );
}
