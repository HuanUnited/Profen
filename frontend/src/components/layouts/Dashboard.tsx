import { useQuery } from '@tanstack/react-query';
import { GetDueCards } from '../../wailsjs/go/app/App';
import { Clock, Activity, Book, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: dueNodes, isLoading } = useQuery({
    queryKey: ['dueCards'],
    queryFn: () => GetDueCards(10),
  });

  if (isLoading) return <div className="p-8 font-mono text-gray-500 animate-pulse">{'>'} Initializing system metrics...</div>;

  // Mock stats
  const stats = [
    { label: "Due Items", value: dueNodes?.length || 0, icon: <Clock size={16} />, color: "text-red-400" },
    { label: "Day Streak", value: "12", icon: <Activity size={16} />, color: "text-emerald-400" },
    { label: "Total Nodes", value: "842", icon: <Book size={16} />, color: "text-blue-400" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">

      {/* 1. Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">System Status</h1>
        <p className="text-gray-500 font-mono text-sm">Welcome back, User. Your knowledge base is active.</p>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#1a1b26] border border-[#2f334d] p-5 flex items-center justify-between shadow-sm hover:border-(--tui-primary) transition-colors group">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <p className={clsx("text-3xl font-bold font-mono group-hover:scale-105 transition-transform origin-left", stat.color)}>{stat.value}</p>
            </div>
            <div className={clsx("p-3 bg-opacity-5 rounded-lg border border-transparent group-hover:border-current transition-all", stat.color.replace('text', 'bg'))}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Priority Action Queue */}
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Action Queue
          </h2>
          <button
            onClick={() => navigate('/review')}
            className="text-xs text-(--tui-primary) hover:underline flex items-center"
          >
            START_SESSION <ArrowRight size={12} className="ml-1" />
          </button>
        </div>

        {(!dueNodes || dueNodes.length === 0) ? (
          <div className="py-16 border-2 border-dashed border-[#2f334d] rounded-lg text-center">
            <p className="text-gray-500 font-mono mb-4">All systems nominal. No pending reviews.</p>
            <button
              onClick={() => navigate('/library')}
              className="px-6 py-2 bg-[#2f334d] hover:bg-[#3b4060] text-white text-sm font-bold rounded transition-colors"
            >
              BROWSE LIBRARY
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {dueNodes.map((node) => (
              <div
                key={JSON.stringify(node.id)}
                className="group flex items-center justify-between p-4 bg-[#1a1b26] border-l-2 border-transparent hover:border-(--tui-primary) hover:bg-[#20212e] transition-all cursor-pointer shadow-sm"
                onClick={() => navigate('/review')} // Later: Go to specific review
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={clsx(
                      "text-[10px] px-1.5 py-0.5 border rounded uppercase font-bold tracking-wide",
                      node.type === 'problem' ? "border-blue-900 text-blue-400 bg-blue-900/10" : "border-purple-900 text-purple-400 bg-purple-900/10"
                    )}>
                      {node.type}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                      UUID::{String(node.id).split('-')[0]}
                    </span>
                  </div>
                  <h3 className="text-gray-200 font-medium group-hover:text-white transition-colors">{node.body}</h3>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <span className="text-[10px] text-(--tui-primary) font-mono uppercase">Review</span>
                  <ArrowRight size={14} className="text-(--tui-primary)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
