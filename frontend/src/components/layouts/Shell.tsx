import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from 'sonner';
import clsx from "clsx";
import LatticeCanvas from "../atomic/LatticeCanvas";

export default function Shell({ sidebar }: { sidebar: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  // Simple effect to trigger animation on mount
  useEffect(() => {
    setSidebarVisible(true);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-[#0f0f14] text-white overflow-hidden relative">

      {/* 1. Background Layer */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <LatticeCanvas
          options={{
            spacing: 80,
            mouseRepel: true,
            mouseDistance: 200,
            mouseStrength: 2,
            mouseZ: 100,
            moveStrength: 0.5,
            accStrength: 0.1,
            xSpeed: 50,
            ySpeed: 30,
            drawColored: true,
            mouseGradient: 'outward' as const
          }}
        />
      </div>

      <aside
        className={clsx(
          "h-full shrink-0 flex transform",
          isSidebarVisible ? "translate-x-0 opacity-100 transition-all duration-300 ease-out" : "-translate-x-full opacity-0"
        )}
      >
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-transparent">
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
