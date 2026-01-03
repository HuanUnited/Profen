import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GetAttemptHistory, GetNodeWithCard } from '../../wailsjs/go/app/App'; // Use GetNodeWithCard for fresh state
import StylizedButton from '../atomic/StylizedButton';
import MarkdownRenderer from '../atomic/MarkdownRenderer';
import AttemptDetailModal from '../smart/AttemptDetailModal';
import { Clock, CheckCircle, RotateCcw, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface ProblemViewProps {
  node: any;
}

export default function ProblemView({ node }: ProblemViewProps) {
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const navigate = useNavigate(); // Hook for navigation

  // Fetch Attempt History
  const { data: attempts, isLoading: isAttemptsLoading } = useQuery({
    queryKey: ['attempts', node.id],
    queryFn: () => GetAttemptHistory(node.id),
  });

  // Fetch FSRS State (Next Review, Stability, etc.)
  const { data: cardState } = useQuery({
    queryKey: ['cardState', node.id],
    queryFn: () => GetNodeWithCard(node.id), // New function!
  });

  // Calculate stats
  const totalAttempts = attempts?.length || 0;
  const bestStreak = 0; // Placeholder until backend supports streaks
  const lastAttempt = attempts?.[0]; // Assuming sorted by date DESC

  // Handle Review Click - Navigate to Study Session
  const handleReview = () => {
    // Navigate to /study with a queue of just this one node
    // returnTo ensures we come back to the library view of this node
    const returnPath = `/library?nodeId=${node.id}`;
    navigate(`/study?queue=${node.id}&returnTo=${encodeURIComponent(returnPath)}`);
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border border-blue-900 text-blue-400 bg-blue-900/10">
              {node.type}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              UUID::{String(node.id).split('-')[0]}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-100">{node.title}</h1>
        </div>

        <div className="flex gap-3">
          {/* Review Button */}
          <StyledButton 
            onClick={handleReview}
            variant="primary"
            icon={<BookOpen size={18} />}
            className="animate-in fade-in zoom-in duration-300"
          >
            REVIEW NOW
          </StyledButton>
        </div>
      </div>

      {/* 2. Problem Statement */}
      <div className="prose prose-invert prose-sm max-w-none bg-[#1a1b26] p-6 rounded-lg border border-[#2f334d] shadow-sm">
        <MarkdownRenderer content={node.body} />
      </div>

      {/* 3. FSRS Status (New Section) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1b26] p-4 rounded-lg border border-[#2f334d] flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">State</span>
            <span className="text-xl font-mono text-blue-400">
                {cardState?.card_state === 2 ? 'Review' : 
                 cardState?.card_state === 1 ? 'Learning' : 
                 cardState?.card_state === 3 ? 'Relearning' : 'New'}
            </span>
        </div>
        <div className="bg-[#1a1b26] p-4 rounded-lg border border-[#2f334d] flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Stability</span>
            <span className="text-xl font-mono text-emerald-400">
                {cardState?.stability ? Number(cardState.stability).toFixed(2) : '-'}
            </span>
        </div>
        <div className="bg-[#1a1b26] p-4 rounded-lg border border-[#2f334d] flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Difficulty</span>
            <span className="text-xl font-mono text-orange-400">
                 {cardState?.difficulty ? Number(cardState.difficulty).toFixed(2) : '-'}
            </span>
        </div>
        <div className="bg-[#1a1b26] p-4 rounded-lg border border-[#2f334d] flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Next Review</span>
            <span className="text-sm font-mono text-gray-300">
                {cardState?.next_review ? new Date(cardState.next_review).toLocaleDateString() : 'Now'}
            </span>
        </div>
      </div>

      {/* 4. Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1b26] p-4 rounded-lg border border-[#2f334d] flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><RotateCcw size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Attempts</p>
            <p className="text-2xl font-bold">{totalAttempts}</p>
          </div>
        </div>
        <div className="bg-[#1a1b26] p-4 rounded-lg border border-[#2f334d] flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Best Streak</p>
            <p className="text-2xl font-bold">{bestStreak}</p>
          </div>
        </div>
        <div className="bg-[#1a1b26] p-4 rounded-lg border border-[#2f334d] flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Last Rating</p>
            <p className="text-2xl font-bold">{lastAttempt?.rating || '-'}</p>
          </div>
        </div>
      </div>

      {/* 5. Attempt History */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          History Log
        </h3>
        
        {isAttemptsLoading ? (
           <div className="text-gray-500 font-mono text-sm animate-pulse">Loading history...</div>
        ) : (!attempts || attempts.length === 0) ? (
          <div className="p-8 text-center border-2 border-dashed border-[#2f334d] rounded-lg text-gray-500">
            No attempts recorded yet. Start reviewing!
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((attempt: any) => (
              <div 
                key={attempt.id}
                onClick={() => setSelectedAttemptId(attempt.id)}
                className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded hover:border-blue-500/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    w-2 h-2 rounded-full 
                    ${attempt.rating >= 3 ? 'bg-emerald-500' : attempt.rating === 2 ? 'bg-orange-500' : 'bg-red-500'}
                  `} />
                  <div>
                    <p className="text-sm font-bold text-gray-300">
                      Rated: {['Again', 'Hard', 'Good', 'Easy'][attempt.rating - 1]}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {new Date(attempt.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="text-xs font-mono">{Math.round(attempt.duration_ms / 1000)}s</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AttemptDetailModal 
        attemptId={selectedAttemptId} 
        onClose={() => setSelectedAttemptId(null)} 
      />
    </div>
  );
}