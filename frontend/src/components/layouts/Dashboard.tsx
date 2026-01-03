import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GetDueCards, GetDashboardStats } from '../../wailsjs/go/app/App';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StyledButton from '../atomic/StylizedButton';
import NodeModal from '../smart/NodeModal';
import AttemptModal from '../smart/AttemptModal';
import StatsPanel from './dashboard/StatsPanel';
import DueQueuePanel from './dashboard/DueQueuePanel';
import ActivityHeatmapPanel from './dashboard/ActivityHeatmapPanel';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const { data: dueNodes, isLoading: loadingDue } = useQuery({
    queryKey: ['dueCards'],
    queryFn: () => GetDueCards(10),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: GetDashboardStats,
  });

  const isLoading = loadingDue || loadingStats;

  if (isLoading) {
    return (
      <div className="p-8 font-mono text-gray-500 animate-pulse">
        {'>'} Initializing system metrics...
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto p-8 space-y-6 animate-in fade-in duration-500 overflow-y-auto h-full hide-scrollbar">

        {/* Header */}
        <div className="flex justify-between items-start animate-in slide-in-from-bottom-3 duration-700">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">System Status</h1>
            <p className="text-gray-500 font-mono text-sm">Welcome back. Your knowledge base is active.</p>
          </div>
          <div className="flex gap-3">
            <StyledButton variant="secondary" size="md" icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
              CREATE NODE
            </StyledButton>
            <StyledButton variant="ghost" size="md" onClick={() => navigate('/library')}>
              LIBRARY
            </StyledButton>
          </div>
        </div>

        {/* Main Content Grid: Left Sidebar (Heatmap + Stats) + Center (Due Queue) */}
        <div className="grid grid-cols-[400px_1fr] gap-6">

          {/* Left Column: Heatmap & Stats */}
          <div className="space-y-6">
            <ActivityHeatmapPanel />
            <StatsPanel stats={stats} />
          </div>

          {/* Center Column: Due Queue */}
          <div>
            <DueQueuePanel
              dueNodes={dueNodes || []}
              onNodeClick={setSelectedNode}
            />
          </div>
        </div>
      </div>

      <NodeModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} mode="create" defaultType="subject" />
      {selectedNode && <AttemptModal isOpen={!!selectedNode} onClose={() => setSelectedNode(null)} node={selectedNode} />}
    </>
  );
}
