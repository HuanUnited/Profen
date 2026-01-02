import { useState, useEffect, ReactNode } from "react";
import clsx from "clsx";

interface SidebarFrameProps {
  header: ReactNode;         // Top bar (Logo or Back button)
  toolbar?: ReactNode;       // Action bar (Add button, Label)
  pinned?: ReactNode;        // Content fixed below toolbar (e.g., Creation Input)
  children: ReactNode;       // Scrollable content (The List)
  resizable?: boolean;       // Enable drag resizing?
  initialWidth?: number;     // Starting width
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export default function SidebarFrame({
  header,
  toolbar,
  pinned,
  children,
  resizable = false,
  initialWidth = 280,
  minWidth = 240,
  maxWidth = 600,
  className
}: SidebarFrameProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  // Resize Logic
  useEffect(() => {
    if (!resizable) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize"; // Visual feedback
    } else {
      document.body.style.cursor = "default";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isResizing, resizable, minWidth, maxWidth]);

  return (
    <div
      style={{ width: resizable ? width : initialWidth }}
      className={clsx(
        "flex flex-col h-full bg-[#16161e] border-r border-[#2f334d] shrink-0 relative select-none transition-all",
        className
      )}
    >
      {/* 1. Header Slot */}
      <div className="h-14 flex items-center px-4 border-b border-[#2f334d] bg-[#16161e] shrink-0">
        {header}
      </div>

      {/* 2. Toolbar Slot (Optional) */}
      {toolbar && (
        <div className="p-3 border-b border-[#2f334d] flex justify-between items-center bg-[#16161e] shrink-0">
          {toolbar}
        </div>
      )}

      {/* 3. Pinned Content (Optional - e.g. Inputs) */}
      {pinned && (
        <div className="shrink-0 border-b border-[#2f334d] bg-[#1f2335]">
          {pinned}
        </div>
      )}

      {/* 4. Scrollable Content */}
      <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
        {children}
      </div>

      {/* 5. Drag Handle (Conditional) */}
      {resizable && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#89b4fa] transition-colors z-50 opacity-0 hover:opacity-100 active:opacity-100 active:bg-[#89b4fa]"
        />
      )}
    </div>
  );
}
