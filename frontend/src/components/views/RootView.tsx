import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetSubjects } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { Book, Search, Library as LibraryIcon, Plus } from "lucide-react";
import NodeModal from "../smart/NodeModal"; // We can allow creating a Subject from here too

export default function RootView() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects
  });

  // Filter Logic
  const filteredSubjects = subjects?.filter(s =>
    s.title?.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">

      {/* 1. Hero Header */}
      <div className="bg-[#16161e] border-b border-[#2f334d] p-8 shrink-0 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <LibraryIcon size={200} />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-2 mb-4 text-xs font-mono text-[#89b4fa] uppercase tracking-widest">
            <span>System Root</span>
            <span>::</span>
            <span>Active</span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4">Knowledge Base</h1>
          <p className="text-gray-400 max-w-xl text-lg mb-8 leading-relaxed">
            Select a subject domain to begin your mastery journey.
          </p>

          {/* Search & Actions */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search subjects..."
                className="w-full bg-[#1a1b26] border border-[#2f334d] rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:border-[#89b4fa] outline-none transition-colors shadow-lg"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-[#1a1b26] border border-[#2f334d] text-gray-300 hover:text-white hover:border-[#89b4fa] rounded-lg font-bold text-sm transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              NEW SUBJECT
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 font-mono animate-pulse">Loading Index...</div>
        ) : filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubjects.map((sub) => (
              <div
                key={String(sub.id)}
                onClick={() => navigate(`/library?nodeId=${sub.id}`)}
                className="group relative bg-[#1a1b26] border border-[#2f334d] p-6 rounded-xl cursor-pointer hover:border-[#89b4fa] transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col h-48"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[#16161e] rounded-lg text-gray-400 group-hover:text-[#89b4fa] transition-colors">
                      <Book size={20} />
                    </div>
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      {String(sub.id).split('-')[0]}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 group-hover:text-white leading-tight">
                    {sub.title || "Untitled Subject"}
                  </h3>
                </div>

                {/* Footer Info */}
                <div className="mt-4 border-t border-[#2f334d] pt-4 flex justify-between items-center">
                  {/* Fake Stats */}
                  <span className="text-xs text-gray-500 font-mono">0 Topics</span>

                  {/* Mastery Bar */}
                  <div className="w-16 bg-[#16161e] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2f334d] w-0 group-hover:w-full transition-all duration-1000 ease-out" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-[#2f334d] rounded-xl">
            <p className="mb-4">No subjects match your search.</p>
            <button onClick={() => setFilter("")} className="text-[#89b4fa] hover:underline">Clear Filter</button>
          </div>
        )}
      </div>

      {/* Modal for creating a subject directly from here */}
      <NodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create"
      // Defaulting to Subject type logic is handled inside NodeModal 
      />
    </div>
  );
}
