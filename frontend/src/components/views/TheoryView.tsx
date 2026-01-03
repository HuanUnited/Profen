// frontend/src/components/views/TheoryView.tsx
import { useState } from "react";
import { ent } from "../../wailsjs/go/models";
import { Pencil, BookOpen, Link } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";

export default function TheoryView({ node }: { node: ent.Node }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-900/20 text-purple-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-purple-900/30">
              Theory
            </span>
            <span className="text-xs text-gray-600 font-mono">ID:{String(node.id).split("-")[0]}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{node.title}</h1>
        </div>

        <button
          onClick={() => setIsEditOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b26] border border-[#2f334d] rounded text-xs font-bold text-gray-400 hover:text-white hover:border-[#e81cff] transition-all"
        >
          <Pencil size={14} /> Edit
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Content (Read Only) */}
        <div className="flex-1 border border-[#2f334d] rounded-xl bg-[#16161e] overflow-hidden flex flex-col">
          <div className="bg-[#1a1b26] border-b border-[#2f334d] px-4 py-2 flex items-center gap-2">
            <BookOpen size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Concept Material</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-markdown">
            <MarkdownRenderer content={node.body || "_No content provided._"} />
          </div>
        </div>

        {/* Sidebar: Linked Problems (To be implemented later with relations) */}
        <div className="w-64 hidden xl:block border-l border-[#2f334d] pl-6">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Link size={12} /> Connected Nodes
          </div>
          <div className="text-xs text-gray-600 italic">
            Relationships will appear here.
          </div>
        </div>
      </div>

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />
    </div>
  );
}
