import { useQuery } from "@tanstack/react-query";
import { GetChildren } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { ent } from "../../wailsjs/go/models";
import { Folder, Hash, Beaker } from "lucide-react";
// Removed unused imports: FileText, clsx (unless you plan to use them later)

interface ContainerViewProps {
  node: ent.Node;
}

export default function ContainerView({ node }: ContainerViewProps) {
  const navigate = useNavigate();

  // Fetch Children
  const { data: children, isLoading } = useQuery({
    queryKey: ['children', String(node.id)],
    queryFn: () => GetChildren(String(node.id))
  });

  // Categorize Children
  const topics = children?.filter(c => c.type === 'topic') || [];
  const problems = children?.filter(c => c.type === 'problem') || [];
  const theories = children?.filter(c => c.type === 'theory') || [];

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-[#2f334d]">
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 font-mono uppercase">
          <span className="bg-[#2f334d] px-2 py-0.5 rounded text-white">{node.type}</span>
          <span>::</span>
          <span>{String(node.id).split('-')[0]}</span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">{node.title || "Untitled"}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8">

        {/* Section 1: Sub-Topics (Grid) */}
        {topics.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Folder size={14} /> Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topics.map(topic => (
                <div
                  key={String(topic.id)} // <--- FIXED: Explicit String conversion
                  onClick={() => navigate(`/library?nodeId=${topic.id}`)}
                  className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded hover:border-[#89b4fa] cursor-pointer transition-colors"
                >
                  <h3 className="font-bold text-gray-300">{topic.title}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Theories & Problems (Split View) */}
        {(theories.length > 0 || problems.length > 0) && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Theories List */}
            {theories.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Beaker size={14} /> Theories
                </h2>
                <div className="space-y-2">
                  {theories.map(t => (
                    <div
                      key={String(t.id)} // <--- FIXED
                      onClick={() => navigate(`/library?nodeId=${t.id}`)}
                      className="p-3 bg-[#1a1b26] border-l-2 border-purple-900 hover:border-purple-500 hover:bg-[#1f2335] cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <span className="text-gray-400 group-hover:text-white font-medium">{t.title}</span>
                      <span className="text-[10px] text-gray-600 font-mono">THEORY</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Problems List */}
            {problems.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Hash size={14} /> Problems
                </h2>
                <div className="space-y-2">
                  {problems.map(p => (
                    <div
                      key={String(p.id)} // <--- FIXED
                      onClick={() => navigate(`/library?nodeId=${p.id}`)}
                      className="p-3 bg-[#1a1b26] border-l-2 border-blue-900 hover:border-blue-500 hover:bg-[#1f2335] cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <span className="text-gray-400 group-hover:text-white font-medium">{p.title}</span>
                      <span className="text-[10px] text-gray-600 font-mono">PROBLEM</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {children?.length === 0 && !isLoading && (
          <div className="py-12 text-center text-gray-600 font-mono text-sm">
            This {node.type} is empty. Add content using the Sidebar (+).
          </div>
        )}
      </div>
    </div>
  );
}
