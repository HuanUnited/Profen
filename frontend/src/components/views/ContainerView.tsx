import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetChildren } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { ent } from "../../wailsjs/go/models";
import { Folder, Hash, Beaker, Search } from "lucide-react";

interface ContainerViewProps {
  node: ent.Node;
}

export default function ContainerView({ node }: ContainerViewProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");

  const { data: children } = useQuery({
    queryKey: ['children', String(node.id)],
    queryFn: () => GetChildren(String(node.id))
  });

  // Filtering Logic
  const filteredChildren = children?.filter(c =>
    (c.title?.toLowerCase().includes(filter.toLowerCase())) ||
    (c.body?.toLowerCase().includes(filter.toLowerCase()))
  ) || [];

  const topics = filteredChildren.filter(c => c.type === 'topic');
  const problems = filteredChildren.filter(c => c.type === 'problem');
  const theories = filteredChildren.filter(c => c.type === 'theory');

  return (
    <div className="h-full flex flex-col animate-in fade-in">

      {/* 1. Enhanced Header */}
      <div className="bg-[#16161e] border-b border-[#2f334d] p-8 shrink-0">
        <div className="flex items-center gap-2 mb-4 text-xs font-mono text-gray-500 uppercase tracking-widest">
          <span className="text-[#89b4fa]">{node.type}</span>
          <span>/</span>
          <span>{String(node.id).split('-')[0]}</span>
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-6">{node.title || "Untitled"}</h1>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Search in ${node.title}...`}
            className="w-full bg-[#1a1b26] border border-[#2f334d] rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:border-[#89b4fa] outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">

        {/* TOPICS GRID */}
        {topics.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-[#2f334d] pb-2">
              <Folder className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-200">Topics</h2>
              <span className="text-xs bg-[#2f334d] text-gray-400 px-2 py-0.5 rounded-full">{topics.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map(topic => (
                <div
                  key={String(topic.id)}
                  onClick={() => navigate(`/library?nodeId=${topic.id}`)}
                  className="group p-5 bg-[#1a1b26] border border-[#2f334d] rounded-lg hover:border-[#89b4fa] cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <h3 className="font-bold text-lg text-gray-200 group-hover:text-white mb-1">{topic.title}</h3>
                  <div className="w-full bg-[#16161e] h-1 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-700 w-1/4" /> {/* Fake progress */}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CONTENT SPLIT (Theories & Problems) */}
        {(theories.length > 0 || problems.length > 0) && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">

            {/* Theories Column */}
            <section>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2f334d] pb-2">
                <Beaker className="text-purple-400" size={20} />
                <h2 className="text-lg font-bold text-gray-200">Theories</h2>
                <span className="text-xs bg-[#2f334d] text-gray-400 px-2 py-0.5 rounded-full">{theories.length}</span>
              </div>
              <div className="space-y-3">
                {theories.map(t => (
                  <div
                    key={String(t.id)}
                    onClick={() => navigate(`/library?nodeId=${t.id}`)}
                    className="flex items-center justify-between p-4 bg-[#1a1b26] border-l-4 border-purple-900 rounded-r hover:bg-[#1f2335] cursor-pointer transition-colors group"
                  >
                    <div>
                      <h3 className="font-bold text-gray-300 group-hover:text-white">{t.title}</h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{t.body?.substring(0, 60)}...</p>
                    </div>
                    <div className="flex gap-1">
                      {/* 3 Mastery Notches */}
                      {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-4 rounded-sm bg-[#2f334d]" />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Problems Column */}
            <section>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2f334d] pb-2">
                <Hash className="text-blue-400" size={20} />
                <h2 className="text-lg font-bold text-gray-200">Problems</h2>
                <span className="text-xs bg-[#2f334d] text-gray-400 px-2 py-0.5 rounded-full">{problems.length}</span>
              </div>
              <div className="space-y-3">
                {problems.map(p => (
                  <div
                    key={String(p.id)}
                    onClick={() => navigate(`/library?nodeId=${p.id}`)}
                    className="flex items-center justify-between p-4 bg-[#1a1b26] border-l-4 border-blue-900 rounded-r hover:bg-[#1f2335] cursor-pointer transition-colors group"
                  >
                    <div>
                      <h3 className="font-bold text-gray-300 group-hover:text-white">{p.title}</h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{p.body?.substring(0, 60)}...</p>
                    </div>
                    <div className="flex gap-1">
                      {/* 3 Mastery Notches */}
                      {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-4 rounded-sm bg-[#2f334d]" />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
