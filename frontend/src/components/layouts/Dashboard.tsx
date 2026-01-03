import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GetDueCards, GetDueCardsQueue } from '../../wailsjs/go/app/App';
import { Clock, Activity, Book, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import StyledButton from '../atomic/StylizedButton';
import NodeModal from '../smart/NodeModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: dueNodes, isLoading } = useQuery({
    queryKey: ['dueCards'],
    queryFn: () => GetDueCards(10),
  });

  const handleStartSession = async () => {
    try {
      const queueIds = await GetDueCardsQueue(20);
      navigate(`/study?queue=${queueIds.join(",")}&returnTo=/`);
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 font-mono text-gray-500 animate-pulse">
        {'>'} Initializing system metrics...
      </div>
    );
  }

  const stats = [
    { label: "Due Items", value: dueNodes?.length || 0, icon: <Clock size={16} />, color: "text-red-400" },
    { label: "Day Streak", value: "12", icon: <Activity size={16} />, color: "text-emerald-400" },
    { label: "Total Nodes", value: "842", icon: <Book size={16} />, color: "text-blue-400" },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="flex justify-between items-start animate-in slide-in-from-bottom-3 duration-700">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">System Status</h1>
            <p className="text-gray-500 font-mono text-sm">Welcome back, User. Your knowledge base is active.</p>
          </div>
          <div className="flex gap-3">
            <StyledButton
              variant="secondary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => setIsCreateOpen(true)}
            >
              CREATE NODE
            </StyledButton>
            <StyledButton
              variant="ghost"
              size="md"
              onClick={() => navigate('/library')}
            >
              LIBRARY
            </StyledButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="bg-[#1a1b26] border border-[#2f334d] p-5 flex items-center justify-between shadow-sm hover:border-[#89b4fa] transition-colors group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                <p className={clsx("text-3xl font-bold font-mono group-hover:scale-105 transition-transform origin-left", stat.color)}>
                  {stat.value}
                </p>
              </div>
              <div className={clsx("p-3 bg-opacity-5 rounded-lg border border-transparent group-hover:border-current transition-all", stat.color.replace('text', 'bg'))}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Priority Action Queue */}
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-700 delay-200">
          <div className="flex justify-between items-end border-b border-gray-800 pb-2">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Action Queue
            </h2>
            <StyledButton
              variant="primary"
              size="md"
              onClick={handleStartSession}
              rightElement={<ArrowRight size={12} />}
            >
              START SESSION
            </StyledButton>
          </div>

          {(!dueNodes || dueNodes.length === 0) ? (
            <div className="py-16 border-2 border-dashed border-[#2f334d] rounded-lg text-center animate-in fade-in duration-500 delay-300">
              <p className="text-gray-500 font-mono mb-4">All systems nominal. No pending reviews.</p>
              <StyledButton
                variant="secondary"
                size="md"
                onClick={() => navigate('/library')}
              >
                BROWSE LIBRARY
              </StyledButton>
            </div>
          ) : (
            <div className="grid gap-3">
              {dueNodes.map((node, idx) => (
                <div
                  key={JSON.stringify(node.id)}
                  className="group flex items-center justify-between p-4 bg-[#1a1b26] border-l-2 border-transparent hover:border-[#89b4fa] hover:bg-[#20212e] transition-all cursor-pointer shadow-sm animate-in slide-in-from-left-4 duration-500"
                  style={{ animationDelay: `${300 + idx * 50}ms` }}
                  onClick={() => navigate(`/study?queue=${node.id}&returnTo=/`)}
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
                    <h3 className="text-gray-200 font-medium group-hover:text-white transition-colors">{node.title}</h3>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span className="text-[10px] text-[#89b4fa] font-mono uppercase">Review</span>
                    <ArrowRight size={14} className="text-[#89b4fa]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NodeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        defaultType="subject"
      />
    </>
  );
}
