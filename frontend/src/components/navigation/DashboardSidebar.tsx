import { LayoutDashboard, Library, Terminal, Settings, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarFrame from "./SidebarFrame";
import StyledButton from "../atomic/StylizedButton";
import SettingsModal from "../smart/SettingsModal";

export default function DashboardSidebar() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <>
      <SidebarFrame
        resizable={false}
        initialWidth={256}
        header={
          <div className="flex items-center">
            <Terminal className="w-5 h-5 text-[#89b4fa] mr-3" />
            <span className="font-bold tracking-tight text-lg text-white">PROFEN_OS</span>
          </div>
        }
      >
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
        </nav>

        <div className="mt-auto pt-4 border-t border-[#2f334d] absolute bottom-4 left-0 right-0 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-mono">v0.1.0-alpha</span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-[#1a1b26] border border-[#2f334d] hover:border-[#89b4fa] transition-all"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Moon size={14} className="text-gray-400" /> : <Sun size={14} className="text-orange-400" />}
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg bg-[#1a1b26] border border-[#2f334d] hover:border-[#89b4fa] transition-all"
                title="Settings"
              >
                <Settings size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </SidebarFrame>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
