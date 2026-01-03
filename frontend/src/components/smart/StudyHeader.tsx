import { XIcon } from 'lucide-react';
import StyledButton from '../atomic/StylizedButton';

interface StudyHeaderProps {
  progress: number;
  total: number;
  onExit: () => void;
}

export default function StudyHeader({ progress, total, onExit }: StudyHeaderProps) {
  const percentage = Math.round((progress / total) * 100) || 0;

  return (
    <div className="h-14 border-b border-[#2f334d] bg-[#1a1b26] flex items-center justify-between px-4 select-none">
      {/* Left: Progress Info */}
      <div className="flex items-center gap-4 flex-1">
        <span className="font-mono text-sm text-gray-400 font-bold">
          SESSION_ACTIVE
        </span>
        <div className="h-2 w-32 bg-[#2f334d] rounded-full overflow-hidden">
          <div
            className="h-full bg-(--tui-primary) transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {progress} / {total}
        </span>
      </div>

      {/* Center: Timer (Placeholder for now) */}
      <div className="text-gray-600 font-mono text-xs tracking-widest">
        FSRS_V5::OPTIMIZED
      </div>

      {/* Right: Exit */}
      <div className="flex-1 flex justify-end">
        <StyledButton
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-gray-400 hover:text-white"
          icon={<XIcon size={18} />}
        >
          EXIT
        </StyledButton>
      </div>
    </div>
  );
}