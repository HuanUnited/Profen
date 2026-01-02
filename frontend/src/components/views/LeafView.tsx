import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetAttemptHistory, GetChildren } from "../../wailsjs/go/app/App";
import { ArrowRight, Pencil, History, Layers } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";
import clsx from "clsx";
import { ent } from "../../wailsjs/go/models";
// Import your new Button component if you want to use it here immediately
// import StyledButton from "../atomic/Button"; 

interface LeafViewProps {
  node: ent.Node;
}

export default function LeafView({ node }: LeafViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: attempts } = useQuery({
    queryKey: ['attempts', String(node.id)],
    queryFn: () => GetAttemptHistory(String(node.id)),
    enabled: node.type === 'problem' || node.type === 'theory'
  });

  const { data: childrenCount } = useQuery({
    queryKey: ['children', String(node.id)],
    queryFn: () => GetChildren(String(node.id)),
    enabled: node.type === 'subject' || node.type === 'topic'
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setIsEditModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="h-full flex flex-col p-8 animate-in fade-in slide-in-from-bottom-2 gap-6">
        {/* UNIFIED HEADER (Same for all types) */}
        <div className="flex justify-between items-start border-b border-[#2f334d]/50 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={clsx(
                "text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider border",
                node.type === "problem" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  node.type === "theory" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                    "bg-green-500/10 text-green-400 border-green-500/20"
              )}>
                {node.type}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {String(node.id).split("-")[0]}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              {node.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Attempt Button */}
            {(node.type === 'problem' || node.type === 'theory') && (
              <button className="flex items-center gap-2 px-4 py-2 bg-[#89b4fa]/10 border border-[#89b4fa]/20 rounded-lg text-xs font-bold text-[#89b4fa] hover:bg-[#89b4fa] hover:text-black transition-all">
                Attempt <ArrowRight size={14} />
              </button>
            )}

            {/* Edit Button (Visible for ALL types) */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1b26] border border-[#2f334d] rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT: Content + Side Panel */}
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Left: Content (Takes more space) */}
          <div className="flex-3 relative border border-[#2f334d]/50 rounded-xl overflow-hidden bg-[#16161e]/50 shadow-inner">
            <div className="absolute inset-0 overflow-auto p-8 custom-markdown scrollbar-hide">
              <MarkdownRenderer content={node.body || ""} />
            </div>
          </div>

          {/* Right: Meta Panel (History / Children) */}
          <div className="flex-1 flex flex-col gap-4 min-w-62.5">

            {/* 1. Children Stats (Subject/Topic) */}
            {(node.type === 'subject' || node.type === 'topic') && (
              <div className="p-4 rounded-xl border border-[#2f334d]/50 bg-[#16161e]/50">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Layers size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Structure</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {childrenCount?.length || 0} <span className="text-sm text-gray-500 font-normal">items</span>
                </div>
              </div>
            )}

            {/* 2. Attempt History (Problem/Theory) */}
            {(node.type === 'problem' || node.type === 'theory') && (
              <div className="flex-1 flex flex-col rounded-xl border border-[#2f334d]/50 bg-[#16161e]/50 overflow-hidden">
                <div className="p-4 border-b border-[#2f334d]/30 bg-[#1a1b26]/50 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <History size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">History</span>
                  </div>
                  <span className="text-xs font-mono text-[#89b4fa]">{attempts?.length || 0} runs</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {attempts?.map((attempt: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#1a1b26] hover:bg-[#2f334d] transition-colors cursor-pointer group border border-transparent hover:border-[#89b4fa]/30">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-300 font-mono">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </span>
                        {/* Status Dot */}
                        <div className={clsx("w-1.5 h-1.5 rounded-full", attempt.is_correct ? "bg-green-500" : "bg-red-500")} />
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">
                        ID: {String(attempt.id).split('-')[0]}
                      </div>
                    </div>
                  ))}
                  {(!attempts || attempts.length === 0) && (
                    <div className="p-8 text-center text-xs text-gray-600 italic">
                      No attempts recorded yet.
                    </div>
                  )}
                </div>

                <button className="p-3 text-xs font-bold text-center text-[#89b4fa] hover:bg-[#89b4fa]/10 transition-colors border-t border-[#2f334d]/30">
                  VIEW ANALYTICS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <NodeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        initialNode={node}
      />
    </>
  );
}
