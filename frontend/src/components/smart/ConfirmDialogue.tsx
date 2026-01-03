import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import StyledButton from "../atomic/StylizedButton";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const dialog = (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#1a1b26] border-2 border-red-900/50 rounded-xl w-[90vw] max-w-md p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-red-900/20 rounded-lg">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <StyledButton variant="ghost" size="md" onClick={onClose}>
            {cancelText}
          </StyledButton>
          <StyledButton
            variant="primary"
            size="md"
            onClick={handleConfirm}
            className="bg-red-600! hover:bg-red-700!"
          >
            {confirmText}
          </StyledButton>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
