import { useQuery } from "@tanstack/react-query";
import { GetChildren } from "../../../wailsjs/go/app/App";
import { Folder, Hash, FileText, Activity } from "lucide-react";
import clsx from "clsx";
import { ent } from "../../../wailsjs/go/models";

export default function ContainerNodeView({ node }: { node: ent.Node }) {
  const nodeIdStr = String(node.id); // Ensure clean string

  const { data: children, isLoading } = useQuery({
    queryKey: ['children', nodeIdStr], // Fix key
    queryFn: () => GetChildren(nodeIdStr), // Fix call
  });


  if (isLoading) return <div className="p-8 text-gray-500 font-mono">Loading contents...</div>;

  return (
    <div className="h-full overflow-auto p-8 animate-in fade-in">
      <header className="mb-8 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-gray-700 rounded text-gray-500">
            {node.type}
          </span>
          <span className="text-xs font-mono text-gray-600">ID: {String(node.id).split('-')[0]}</span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{node.body}</h1>
        <p className="text-gray-500 text-sm font-mono">
          {children?.length || 0} items inside
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children?.map(child => (
          <div
            key={String(child.id)}
            className="bg-[#16161e] border border-gray-800 p-5 rounded-lg hover:border-(--tui-primary) transition-all group cursor-pointer hover:bg-[#1a1b26] shadow-sm"
          // Add onClick to navigate if needed (e.g., using setSearchParams)
          >
            <div className="flex justify-between items-start mb-3">
              <span className={clsx(
                "p-2 rounded bg-opacity-10",
                child.type === 'topic' ? "bg-blue-500 text-blue-400" :
                  child.type === 'problem' ? "bg-red-500 text-red-400" : "bg-purple-500 text-purple-400"
              )}>
                {child.type === 'topic' ? <Folder size={18} /> :
                  child.type === 'problem' ? <Hash size={18} /> : <FileText size={18} />}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono uppercase">
                <Activity size={10} />
                <span>0%</span>
              </div>
            </div>

            <h3 className="font-bold text-gray-200 group-hover:text-white truncate mb-1 text-lg">
              {child.body || "Untitled"}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {String(child.id).split('-')[0]}
            </p>

            {/* Mastery Bar */}
            <div className="mt-4 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-(--tui-primary) w-[10%]" /> {/* Mock Data */}
            </div>
          </div>
        ))}
      </div>

      {!children?.length && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-lg text-gray-600">
          <Folder size={48} className="opacity-20 mb-4" />
          <p className="font-mono">Empty Container</p>
          <button className="mt-4 text-xs text-(--tui-primary) hover:underline">
            + Add Child Node
          </button>
        </div>
      )}
    </div>
  );
}
