import { NavLink } from "react-router-dom";
import ThemeToggle from "../atomic/ThemeToggle";
import { LayoutDashboard, Library, BookOpen, Terminal } from "lucide-react";
import clsx from "clsx";

export default function DashboardSidebar() {
  return (
    <div className="flex flex-col h-full bg-(--tui-sidebar)">
      <div className="h-14 flex items-center px-4 border-b border-(--tui-border)">
        <Terminal className="w-5 h-5 text-(--tui-primary) mr-3" />
        <span className="font-bold tracking-tight text-lg text-white">PROFEN_OS</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <NavItem to="/library" icon={<Library size={18} />} label="Library" />
        <NavItem to="/review" icon={<BookOpen size={18} />} label="Study Session" />
      </nav>

      {/* Footer */}
      <div className="p-3 text-xs text-gray-500 border-t border-(--tui-border) flex justify-between items-center">
        <span>MAIN MENU</span>
        <ThemeToggle />
      </div>

    </div>

  );
}

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      clsx(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group",
        isActive
          ? "bg-(--tui-primary)/10 text-(--tui-primary) border-l-2 border-(--tui-primary)"
          : "text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
      )
    }
  >
    <span className="mr-3 opacity-70 group-hover:opacity-100">{icon}</span>
    {label}
  </NavLink>
);
