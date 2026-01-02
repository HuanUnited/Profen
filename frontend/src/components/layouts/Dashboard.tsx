import { useQuery } from '@tanstack/react-query';
import { GetDueCards } from '../../wailsjs/go/app/App';
import clsx from 'clsx';

export default function Dashboard() {
  // 1. Use React Query instead of useEffect
  // This handles loading, error, and caching automatically
  const { data: dueNodes, isLoading, isError } = useQuery({
    queryKey: ['dueCards'],
    queryFn: () => GetDueCards(10),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading your session...</div>;
  if (isError) return <div className="p-8 text-center text-red-400">Failed to load cards.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Review Dashboard
        </h1>
        <span className="text-sm text-gray-400">
          {dueNodes?.length || 0} cards due
        </span>
      </header>

      {(!dueNodes || dueNodes.length === 0) ? (
        <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-gray-300">No cards due right now.</p>
          <button className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-medium transition-colors">
            Explore Topics
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {dueNodes.map((node) => (
            <div
              key={JSON.stringify(node.id)}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-slate-100">{node.body}</h3>
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full mt-2 inline-block font-mono",
                    node.type === 'problem' ? "bg-blue-900/50 text-blue-300" : "bg-purple-900/50 text-purple-300"
                  )}>
                    {node.type}
                  </span>
                </div>
                <button className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 rounded hover:bg-emerald-600 hover:text-white transition-colors text-sm font-medium">
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
