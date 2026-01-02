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

      {/* Sidebar with Slide/Fade Transition */}
      <aside
        className={clsx(
          "w-64 border-r border-(--tui-border) bg-(--tui-sidebar) shrink-0 transition-all duration-300 ease-in-out transform",
          isSidebarVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}
      >
        {sidebar}
      </aside>

      {/* Main Content with Fade Transition keying on Path */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-(--tui-bg)">
        <div
          key={location.pathname} // Forces re-render animation on route change
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
