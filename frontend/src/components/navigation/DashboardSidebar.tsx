import { LayoutDashboard, Library, BookOpen, Terminal, Wrench } from "lucide-react";
import SidebarFrame from "./SidebarFrame";
import ThemeToggle from "../atomic/ThemeToggle";
import { useNavigate } from "react-router-dom";
import StyledButton from "../atomic/StylizedButton";
import { useState } from "react";


export default function DashboardSidebar() {

  const navigate = useNavigate();
  const [setupOpen, setSetupOpen] = useState(false);

  return (
    <SidebarFrame
      resizable={false} // Fixed width
      initialWidth={256} // w-64
      // Slot 1: Header
      header={
        <div className="flex items-center">
          <Terminal className="w-5 h-5 text-[#89b4fa] mr-3" />
          <span className="font-bold tracking-tight text-lg text-white">PROFEN_OS</span>
        </div>
      }
    >
      {/* Slot 4: Content (Nav Links) */}
      <nav className="space-y-1 mt-2">
        <StyledButton
          variant="ghost"
          size="md"
          className="justify-start w-full px-4 py-3"
          icon={<LayoutDashboard size={18} />}
          onClick={() => navigate('/')}
        >
          Dashboard
        </StyledButton>
        <StyledButton
          variant="ghost"
          size="md"
          className="justify-start w-full px-4 py-3"
          icon={<Library size={18} />}
          onClick={() => navigate('/library')}
        >
          Library
        </StyledButton>
        <StyledButton
          variant="ghost"
          size="md"
          className="justify-start w-full px-4 py-3"
          icon={<BookOpen size={18} />}
          onClick={() => navigate('/review')}
        >
          Study Session
        </StyledButton>
      </nav>



      <div className="mt-auto pt-4 border-t border-2f334d absolute bottom-4 left-0 right-0 px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 font-mono">v0.1.0-alpha</span>
          {/* ThemeToggle moved to bottom-right */}
          <ThemeToggle />
          <StyledButton
            variant="ghost"
            size="sm"
            icon={<Wrench size={16} />}
            onClick={() => setSetupOpen(!setupOpen)}
          >
            Setup
          </StyledButton>
        </div>
      </div>

    </SidebarFrame>
  );
}