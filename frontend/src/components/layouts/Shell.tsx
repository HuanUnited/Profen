import { Outlet } from "react-router-dom";

export default function Shell({ sidebar }: { sidebar: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen bg-(--tui-bg) text-(--tui-fg) font-mono overflow-hidden">

      {/* Dynamic Sidebar Slot */}
      <aside className="w-64 border-r border-(--tui-border) bg-[#16161e] shrink-0">
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-(--tui-bg)">
        {/* We can keep a minimal header here if needed, or let pages handle it */}
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
