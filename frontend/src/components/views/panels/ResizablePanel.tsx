// frontend/src/components/views/panels/ResizablePanel.tsx
import { useState, useRef, useEffect, ReactNode } from "react";
import { GripHorizontal } from "lucide-react";

interface ResizablePanelProps {
  children: ReactNode;
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
}

export default function ResizablePanel({
  children,
  minHeight = 150,
  maxHeight = 600,
  defaultHeight = 300
}: ResizablePanelProps) {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;

      // Clamp between min and max
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      setHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minHeight, maxHeight]);

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col overflow-hidden"
      style={{ height: `${height}px` }}
    >
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="h-2 flex items-center justify-center cursor-ns-resize hover:bg-[#2f334d]/50 transition-colors group border-t border-[#2f334d]"
      >
        <GripHorizontal
          size={16}
          className="text-gray-700 group-hover:text-gray-400 transition-colors"
        />
      </div>
    </div>
  );
}
