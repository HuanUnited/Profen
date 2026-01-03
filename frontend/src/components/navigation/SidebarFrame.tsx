import { useState, useEffect, ReactNode } from "react";
import clsx from "clsx";
import { SidebarState } from "../../lib/store";
import { motion } from "framer-motion";

interface SidebarFrameProps {
  header: ReactNode;
  toolbar?: ReactNode;
  pinned?: ReactNode;
  children: ReactNode;
  resizable?: boolean;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  footer?: ReactNode; // <--- Add this
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
  footer }: SidebarFrameProps) {
  const [width, setWidth] = useState(SidebarState.lastWidth);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    // If we are resizable (Library), we might want to restore the last user-set width for Library?
    // For now, let's implement the specific request: Resize TO the dashboard sidebar size.

    if (resizable) {
      // If it's the library, maybe we default to the specific initialWidth (280) or the last resized width.
      // Let's just animate to this component's preferred initialWidth.
      requestAnimationFrame(() => setWidth(initialWidth));
    } else {
      // Dashboard (Fixed): Animate to its fixed size
      requestAnimationFrame(() => setWidth(initialWidth));
    }
  }, [initialWidth, resizable]);

  // 3. Update global state when width changes (so the NEXT page knows where we ended)
  useEffect(() => {
    if (!isResizing) {
      SidebarState.lastWidth = width;
    }
  }, [width, isResizing]);

  // Resize Logic
  useEffect(() => {
    if (!resizable) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setWidth(newWidth);
      SidebarState.lastWidth = newWidth; // Track it live
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none"; // Disable selection
    } else {
      document.body.style.cursor = "default";
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "";
    };
  }, [isResizing, resizable, minWidth, maxWidth]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx(
        "flex flex-col h-full w-72 backdrop-blur-xl bg-[#16161e]/90 border-r border-[#2f334d]/60 shadow-2xl shrink-0 relative select-none",
        !isResizing && "transition-[width] duration-300 ease-in-out"
      )}
      style={{
        width,
        background: "rgba(22, 22, 30, 0.95)", // Semi-transparent dark
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}
    >
      {/* Header Slot */}
      <div className="h-14 flex items-center px-4 border-b border-[#2f334d] bg-[#16161e] shrink-0">
        {header}
      </div>

      {/* Toolbar Slot */}
      {toolbar && (
        <div className="p-3 border-b border-[#2f334d] flex justify-between items-center bg-[#16161e] shrink-0">
          {toolbar}
        </div>
      )}

      {/* Pinned Content */}
      {pinned && (
        <div className="shrink-0 border-b border-[#2f334d] bg-[#1f2335]">
          {pinned}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="p-3 border-t border-[#2f334d] bg-[#16161e]">
          {footer}
        </div>
      )}

      {/* Drag Handle */}
      {resizable && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#89b4fa]/50 transition-colors z-50 opacity-0 hover:opacity-100 active:opacity-100 active:bg-[#89b4fa]"
        />
      )}
    </motion.div>
  );
}
