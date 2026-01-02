import { useQuery } from '@tanstack/react-query';
import { GetDueCards } from '../../wailsjs/go/app/App'; // Verify this path!
import { Clock, Activity, Book } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const { data: dueNodes, isLoading } = useQuery({
    queryKey: ['dueCards'],
    queryFn: () => GetDueCards(10),
  });

  if (isLoading) return <div className="p-8 font-mono text-gray-500 animate-pulse">{'>'} Initializing session...</div>;

  // Mock stats for the TUI vibe
  const stats = [
    { label: "Due", value: dueNodes?.length || 0, icon: <Clock size={16} />, color: "text-red-400" },
    { label: "Streak", value: "12 Days", icon: <Activity size={16} />, color: "text-emerald-400" },
    { label: "Mastered", value: "842", icon: <Book size={16} />, color: "text-blue-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 1. Header Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#1a1b26] border border-[#2f334d] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={clsx("text-2xl font-bold font-mono", stat.color)}>{stat.value}</p>
            </div>
            <div className={clsx("p-2 bg-opacity-10 rounded", stat.color.replace('text', 'bg'))}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Due Cards List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
          <span className="w-2 h-2 bg-red-500 mr-2 animate-pulse"></span>
          Critical Items
        </h2>

        {(!dueNodes || dueNodes.length === 0) ? (
          <div className="p-12 border-2 border-dashed border-[#2f334d] text-center text-gray-500">
            All clear. No urgent tasks pending.
          </div>
        ) : (
          <div className="grid gap-3">
            {dueNodes.map((node) => (
              <div
                key={JSON.stringify(node.id)}
                className="group flex items-center justify-between p-4 bg-[#1a1b26] border-l-2 border-transparent hover:border-[var(--tui-primary)] hover:bg-[#20212e] transition-all cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={clsx(
                      "text-[10px] px-1.5 py-0.5 border rounded uppercase font-bold",
                      node.type === 'problem' ? "border-blue-800 text-blue-400" : "border-purple-800 text-purple-400"
                    )}>
                      {node.type}
                    </span>
                    <span className="text-xs text-gray-600 font-mono">ID: {String(node.id).substring(0, 8)}</span>
                  </div>
                  <h3 className="text-gray-200 group-hover:text-white transition-colors">{node.body}</h3>
                </div>

                <button className="opacity-0 group-hover:opacity-100 px-4 py-2 text-xs font-bold bg-[var(--tui-primary)] text-black hover:bg-white transition-all">
                  START_REVIEW
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
