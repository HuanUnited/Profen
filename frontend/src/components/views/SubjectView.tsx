// frontend/src/components/views/SubjectView.tsx
import { useQuery } from "@tanstack/react-query";
import { GetChildren } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { ent } from "../../wailsjs/go/models";
import { Folder, Search, Book } from "lucide-react";

export default function SubjectView({ node }: { node: ent.Node }) {
  const navigate = useNavigate();
  const { data: children } = useQuery({
    queryKey: ["children", String(node.id)],
    queryFn: () => GetChildren(String(node.id)),
  });

  const topics = children?.filter(c => c.type === "topic") || [];

  return (
    <div className="h-full flex flex-col p-8 animate-in fade-in">
      {/* Subject Header */}
      <div className="mb-8 border-b border-[#2f334d] pb-6">
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 font-mono uppercase tracking-wider">
          <Book size={12} />
          <span>Root Subject</span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">{node.title}</h1>

        {/* Search Bar Placeholder */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            placeholder="Filter topics..."
            className="w-full bg-[#16161e] border border-[#2f334d] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:border-[#89b4fa] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Topics Grid */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Folder size={14} /> Topics ({topics.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {topics.map(topic => (
            <div
              key={topic.id?.toString()}
              onClick={() => navigate(`/library?nodeId=${topic.id}`)}
              className="group p-5 bg-[#1a1b26] border border-[#2f334d] rounded-xl hover:border-[#89b4fa] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <Folder className="text-[#89b4fa] opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
              </div>
              <h3 className="font-bold text-gray-200 group-hover:text-white truncate">{topic.title}</h3>
              <p className="text-xs text-gray-500 mt-1 font-mono">0/0 Mastered</p>
            </div>
          ))}
          {/* Add Topic Ghost Card */}
          <div className="border-2 border-dashed border-[#2f334d] rounded-xl flex items-center justify-center p-5 opacity-50 hover:opacity-100 hover:border-gray-500 cursor-pointer transition-all">
            <span className="text-xs font-bold text-gray-500 uppercase">+ Add Topic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
