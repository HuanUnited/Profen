import { Clock, Book, TrendingUp } from 'lucide-react';
import { data } from '../../../wailsjs/go/models';

interface StatsPanelProps {
  stats?: data.DashboardStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const statCards = [
    {
      label: "Due",
      value: stats?.due_cards || 0,
      icon: <Clock size={14} />,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-400"
    },
    {
      label: "Nodes",
      value: stats?.total_nodes || 0,
      icon: <Book size={14} />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-400"
    },
    {
      label: "Reviews",
      value: stats?.total_attempts || 0,
      icon: <TrendingUp size={14} />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-400"
    }
  ];

  return (
    <div className="bg-[#1a1b26] border border-[#2f334d] rounded-lg p-5 animate-in slide-in-from-bottom-5 duration-700 delay-200">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Stats</h3>

      <div className="space-y-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between p-3 bg-[#16161e] border border-[#2f334d] rounded-lg hover:border-[#89b4fa] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 ${stat.bgColor} rounded-md border border-transparent group-hover:${stat.borderColor} transition-all`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
                {stat.label}
              </span>
            </div>
            <span className={`text-xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
