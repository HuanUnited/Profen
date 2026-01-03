// frontend/src/components/views/TopicView.tsx
import { useQuery } from "@tanstack/react-query";
import { GetChildren } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { ent } from "../../wailsjs/go/models";
import { Hash, Beaker, FolderOpen } from "lucide-react";
import NodeModal from "../smart/NodeModal"; // Re-use for Edit
import { useState } from "react";
import { Pencil } from "lucide-react";

export default function TopicView({ node }: { node: ent.Node }) {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: children } = useQuery({
    queryKey: ["children", String(node.id)],
    queryFn: () => GetChildren(String(node.id)),
  });

  const problems = children?.filter(c => c.type === "problem") || [];
  const theories = children?.filter(c => c.type === "theory") || [];

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in">
      <div className="mb-8 border-b border-[#2f334d] pb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 font-mono uppercase tracking-wider">
            <FolderOpen size={12} />
            <span>Topic Container</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{node.title}</h1>
        </div>
        <button
          onClick={() => setIsEditOpen(true)}
          className="p-2 hover:bg-[#2f334d] rounded text-gray-500 hover:text-white transition-colors"
        >
          <Pencil size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Theories Column */}
        <div>
          <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-purple-900/30 pb-2">
            <Beaker size={14} /> Theories
          </h2>
          <div className="space-y-2">
            {theories.map(t => (
              <div
                key={t.id?.toString()}
                onClick={() => navigate(`/library?nodeId=${t.id}`)}
                className="p-4 bg-[#1a1b26] border-l-2 border-purple-900 hover:border-purple-500 hover:bg-[#1f2335] cursor-pointer transition-all rounded-r-lg group"
              >
                <h3 className="font-medium text-gray-300 group-hover:text-white">{t.title}</h3>
              </div>
            ))}
            {theories.length === 0 && <div className="text-xs text-gray-600 italic">No theories yet.</div>}
          </div>
        </div>

        {/* Problems Column */}
        <div>
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-2">
            <Hash size={14} /> Problems
          </h2>
          <div className="space-y-2">
            {problems.map(p => (
              <div
                key={p.id?.toString()}
                onClick={() => navigate(`/library?nodeId=${p.id}`)}
                className="p-4 bg-[#1a1b26] border-l-2 border-blue-900 hover:border-blue-500 hover:bg-[#1f2335] cursor-pointer transition-all rounded-r-lg group"
              >
                <h3 className="font-medium text-gray-300 group-hover:text-white">{p.title}</h3>
              </div>
            ))}
            {problems.length === 0 && <div className="text-xs text-gray-600 italic">No problems yet.</div>}
          </div>
        </div>
      </div>

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />
    </div>
  );
}
