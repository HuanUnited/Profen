import { Trash2, Pencil } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onDelete?: () => void;
  onEdit?: () => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, onDelete, onEdit, onClose }: ContextMenuProps) {
  return (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className="fixed z-50 bg-[#1a1b26] border border-[#2f334d] rounded-md shadow-2xl py-1 min-w-[140px]"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-[#2f334d]/50 flex items-center gap-2 transition-colors"
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </>
  );
}
