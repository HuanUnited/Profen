// frontend/src/components/layouts/SubjectList.tsx
import { useQuery } from "@tanstack/react-query";
import { GetSubjects } from "../../wailsjs/go/app/App";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Book, ChevronRight } from "lucide-react";

export default function SubjectList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentNodeId = searchParams.get('nodeId');

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: GetSubjects,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-xs text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {subjects?.map((sub: any) => {
        const isActive = currentNodeId === String(sub.id);

        return (
          <button
            key={sub.id}
            onClick={() => navigate(`/library?nodeId=${sub.id}`)}
            className={`
              group flex items-center gap-2 px-3 py-2 text-left text-sm
              transition-colors border-l-2
              ${isActive
                ? 'bg-[#2f334d]/50 border-[#89b4fa] text-white'
                : 'border-transparent text-gray-400 hover:bg-[#2f334d]/30 hover:text-gray-200'
              }
            `}
          >
            <Book size={14} className={isActive ? 'text-[#89b4fa]' : 'text-gray-600 group-hover:text-gray-400'} />
            <span className="flex-1 truncate font-medium">{sub.title || "Untitled Subject"}</span>
            <ChevronRight size={12} className={`${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'} transition-opacity`} />
          </button>
        );
      })}

      {subjects?.length === 0 && (
        <div className="px-3 py-8 text-center">
          <p className="text-xs text-gray-600 italic">No subjects yet.</p>
          <p className="text-xs text-gray-700 mt-2">Create one below.</p>
        </div>
      )}
    </div>
  );
}
