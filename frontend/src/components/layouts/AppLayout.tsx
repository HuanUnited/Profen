import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Library, BookOpen, Settings, Terminal } from "lucide-react";
import clsx from "clsx";

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen bg-(--tui-bg) text-(--tui-fg) font-mono overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-(--tui-border) flex flex-col bg-[#16161e]">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-(--tui-border)">
          <Terminal className="w-5 h-5 text-(--tui-primary) mr-3" />
          <span className="font-bold tracking-tight text-lg">PROFEN_OS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem to="/library" icon={<Library size={18} />} label="Library" />
          <NavItem to="/review" icon={<BookOpen size={18} />} label="Study Session" />

          <div className="pt-4 mt-4 border-t border-(--tui-border)">
            <div className="text-xs uppercase text-gray-500 font-semibold mb-2 px-3">System</div>
            <NavItem to="/settings" icon={<Settings size={18} />} label="Config" />
          </div>
        </nav>

        {/* Footer Status */}
        <div className="p-3 text-xs text-gray-500 border-t border-(--tui-border)">
          v0.1.0 • ONLINE
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Bar (Breadcrumbs / Status) */}
        <header className="h-14 border-b border-(--tui-border) flex items-center px-6 justify-between bg-(--tui-bg)">
          <div className="text-sm text-gray-400">root@profen:~/current_view</div>
          <div className="flex items-center gap-2">
            {/* Placeholder for connection status or sync */}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </header>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Helper Component for Links
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
