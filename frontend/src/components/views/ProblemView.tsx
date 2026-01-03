// frontend/src/components/views/ProblemView.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetAttemptHistory } from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import { ArrowRight, Pencil, History, Hash } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";

export default function ProblemView({ node }: { node: ent.Node }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch Attempt History
  const { data: attempts } = useQuery({
    queryKey: ["attempts", String(node.id)],
    queryFn: () => GetAttemptHistory(String(node.id)),
  });

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-900/20 text-blue-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-blue-900/30">
              Problem
            </span>
            <span className="text-xs text-gray-600 font-mono">ID:{String(node.id).split("-")[0]}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{node.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b26] border border-[#2f334d] rounded text-xs font-bold text-gray-400 hover:text-white hover:border-[#89b4fa] transition-all"
          >
            <Pencil size={14} /> Edit
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#89b4fa] text-black rounded font-bold text-sm hover:bg-[#b4befe] shadow-lg shadow-blue-900/20 transition-all">
            Attempt Problem <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Content (Read Only) */}
        <div className="flex-1 border border-[#2f334d] rounded-xl bg-[#16161e] overflow-hidden flex flex-col">
          <div className="bg-[#1a1b26] border-b border-[#2f334d] px-4 py-2 flex items-center gap-2">
            <Hash size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Problem Statement</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-markdown">
            <MarkdownRenderer content={node.body || "_No content provided._"} />
          </div>
        </div>

        {/* Sidebar: Stats & History */}
        <div className="w-80 space-y-6 overflow-y-auto pr-2">
          {/* Attempt History */}
          <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={14} /> Attempt History
            </h3>

            <div className="space-y-3">
              {attempts?.map((attempt: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-[#2f334d]/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-gray-500">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-bold ${attempt.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                      {attempt.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <span className="font-mono text-gray-600 text-xs">
                    {Math.round(attempt.duration_ms / 1000)}s
                  </span>
                </div>
              ))}
              {(!attempts || attempts.length === 0) && (
                <div className="text-center py-4 text-gray-600 text-xs">
                  No attempts yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />
    </div>
  );
}
