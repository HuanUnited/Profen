import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SubjectList from "../layouts/SubjectList";

export default function LibrarySidebar() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-(--tui-sidebar)">
      {/* Back Header */}
      <div className="h-14 flex items-center px-4 border-b border-(--tui-border) bg-(--tui-sidebar)">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-xs uppercase tracking-wider">Dashboard</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-3 border-b border-(--tui-border) flex justify-between items-center bg-(--tui-sidebar)">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Explorer</span>
        <button className="p-1.5 hover:bg-white/10 rounded text-(--tui-primary) transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
        <SubjectList />
      </div>
    </div>
  );
}
