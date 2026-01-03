import { useEffect } from 'react';
import StyledButton from '../atomic/StylizedButton';

interface StudyGradingProps {
  onGrade: (grade: number) => void;
  intervals?: { [key: number]: string }; // e.g., {1: "1m", 3: "4d"}
  disabled?: boolean;
}

export default function StudyGrading({ onGrade, intervals, disabled }: StudyGradingProps) {
  
  // Keyboard shortcuts (1-4)
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        onGrade(parseInt(e.key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGrade, disabled]);

  const grades = [
    { value: 1, label: 'Again', color: 'bg-red-500/10 text-red-400 border-red-900 hover:bg-red-500/20' },
    { value: 2, label: 'Hard', color: 'bg-orange-500/10 text-orange-400 border-orange-900 hover:bg-orange-500/20' },
    { value: 3, label: 'Good', color: 'bg-green-500/10 text-green-400 border-green-900 hover:bg-green-500/20' },
    { value: 4, label: 'Easy', color: 'bg-blue-500/10 text-blue-400 border-blue-900 hover:bg-blue-500/20' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 p-4 border-t border-[#2f334d] bg-[#1a1b26] animate-in slide-in-from-bottom-4 fade-in duration-300">
      {grades.map((g) => (
        <button
          key={g.value}
          onClick={() => onGrade(g.value)}
          disabled={disabled}
          className={`
            h-20 flex flex-col items-center justify-center gap-1
            border rounded-lg transition-all transform active:scale-95
            ${g.color}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-lg font-bold">{g.label}</span>
          <span className="text-xs opacity-70 font-mono">
            {intervals?.[g.value] || '-'}
          </span>
          <span className="text-[10px] opacity-40 absolute top-2 right-2 border border-current px-1 rounded">
            {g.value}
          </span>
        </button>
      ))}
    </div>
  );
}