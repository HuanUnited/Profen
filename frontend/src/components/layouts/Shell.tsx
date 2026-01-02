import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from 'sonner';
import clsx from "clsx";

export default function Shell({ sidebar }: { sidebar: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  // Simple effect to trigger animation on mount
  useEffect(() => {
    setSidebarVisible(true);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-(--tui-bg) text-(--tui-fg) font-mono overflow-hidden">

      {/* 
          Sidebar Container 
          CHANGED: Removed 'w-64', 'border-r', and 'bg-...' 
          The {sidebar} component (SidebarFrame) controls its own width and styling.
          We only handle the Entry Animation here.
      */}
      <aside
        className={clsx(
          "h-full shrink-0 flex transition-all duration-300 ease-in-out transform",
          isSidebarVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}
      >
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-(--tui-bg)">
        <div
          key={location.pathname}
          className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <Outlet />
        </div>
      </main>

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: { background: '#16161e', border: '1px solid #313244', color: '#cdd6f4' }
        }}
      />
    </div>
  );
}
