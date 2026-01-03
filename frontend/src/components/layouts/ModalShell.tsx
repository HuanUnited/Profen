import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { X } from 'lucide-react';
import StyledButton from '../atomic/StylizedButton';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: { label: string; variant: 'create' | 'edit' | 'session' | 'settings' };
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '5xl';
  className?: string;
}

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;

  /* Panel background pattern (canvas) */
  background-image: 
    linear-gradient(to right, rgba(47, 51, 77, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(47, 51, 77, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;

  .modal-container {
    background: linear-gradient(#16161e, #16161e) padding-box,
                linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
    border: 2px solid transparent;
    animation: gradient 5s ease infinite;
    background-size: 200% 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #2f334d; border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #40c9ff; }
`;

const maxWidthMap = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  '5xl': 'max-w-7xl'
};

const badgeStyles = {
  create: "bg-[#89b4fa]/20 text-[#89b4fa] border-[#89b4fa]/30",
  edit: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  session: "bg-green-500/20 text-green-400 border-green-500/30",
  settings: "bg-purple-500/20 text-purple-400 border-purple-500/30"
};

export default function ModalShell({
  isOpen,
  onClose,
  title,
  badge,
  children,
  footer,
  maxWidth = 'xl',
  className = ''
}: ModalShellProps) {
  if (!isOpen) return null;

  const modal = (
    <ModalWrapper className="animate-in fade-in duration-200">
      <div className={`modal-container w-[95vw] ${maxWidthMap[maxWidth]} h-[90vh] rounded-2xl overflow-hidden flex flex-col ${className}`}>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-[#2f334d]/50 bg-[#16161e]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            {badge && (
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${badgeStyles[badge.variant]}`}>
                {badge.label}
              </span>
            )}
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          </div>
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="h-20 border-t border-[#2f334d]/50 bg-[#16161e]/90 backdrop-blur-sm flex items-center justify-between px-8 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </ModalWrapper>
  );

  return createPortal(modal, document.body);
}
