import { NavLink } from "react-router-dom";
import { LayoutDashboard, Library, BookOpen, Terminal } from "lucide-react";
import clsx from "clsx";
import SidebarFrame from "./SidebarFrame";

export default function DashboardSidebar() {
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
        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <NavItem to="/library" icon={<Library size={18} />} label="Library" />
        <NavItem to="/review" icon={<BookOpen size={18} />} label="Study Session" />
      </nav>

      <div className="mt-auto pt-4 border-t border-[#2f334d] absolute bottom-4 left-0 right-0 px-4">
        <div className="text-xs text-gray-600 font-mono text-center">v0.1.0-alpha</div>
      </div>
    </SidebarFrame>
  );
}

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      clsx(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group",
        isActive
          ? "bg-[#89b4fa]/10 text-[#89b4fa] border-l-2 border-[#89b4fa]"
          : "text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
      )
    }
  >
    <span className="mr-3 opacity-70 group-hover:opacity-100">{icon}</span>
    {label}
  </NavLink>
);
