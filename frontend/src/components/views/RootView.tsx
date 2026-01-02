import { useQuery } from "@tanstack/react-query";
import { GetSubjects } from "../../wailsjs/go/app/App";
import { useNavigate } from "react-router-dom";
import { Book } from "lucide-react"; // Removed CheckCircle2
// Removed clsx

export default function RootView() {
  const navigate = useNavigate();
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects
  });

  if (isLoading) return null;

  return (
    <div className="p-8 h-full overflow-y-auto animate-in fade-in duration-500">
      <header className="mb-8 border-b border-[#2f334d] pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Knowledge Base</h1>
        <p className="text-gray-500 font-mono text-sm">Select a subject to begin.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects?.map((sub) => (
          <div
            key={String(sub.id)} // <--- FIXED: Explicit String conversion
            onClick={() => navigate(`/library?nodeId=${sub.id}`)}
            className="group relative bg-[#1a1b26] border border-[#2f334d] p-6 rounded-lg cursor-pointer hover:border-[#89b4fa] transition-all hover:shadow-lg hover:-translate-y-1"
          >
            {/* Context Icon */}
            <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 group-hover:text-[#89b4fa] transition-all">
              <Book size={24} />
            </div>

            <h3 className="text-xl font-bold text-gray-200 group-hover:text-white mb-2">
              {sub.title || "Untitled Subject"}
            </h3>

            {/* Fake Mastery Bar */}
            <div className="w-full bg-[#16161e] h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[#2f334d] w-0 group-hover:w-1/3 transition-all duration-1000" />
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
              <span>{String(sub.id).split('-')[0]}</span>
              <span className="group-hover:text-[#89b4fa]">Open Subject &rarr;</span>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {subjects?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[#2f334d] rounded-lg">
            <p className="text-gray-500">No subjects found. Use the sidebar (+) to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
