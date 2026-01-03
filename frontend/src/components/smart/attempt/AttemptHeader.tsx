import { Timer, BookOpen } from 'lucide-react';

interface AttemptHeaderProps {
  elapsed: number;
  cardState: string;
  currentStep: number;
  title: string;
}

export default function AttemptHeader({ elapsed, cardState, currentStep, title }: AttemptHeaderProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const getBadgeColor = (state: string) => {
    switch (state.toLowerCase()) {
      case "new": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "learning": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "review": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "relearning": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Timer */}
      <div className="flex items-center gap-2 px-3 py-1 bg-[#89b4fa]/10 border border-[#89b4fa]/20 rounded-lg text-[#89b4fa]">
        <Timer size={16} />
        <span className="font-mono font-bold text-lg tabular-nums">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* State Badge */}
      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${getBadgeColor(cardState)}`}>
        <BookOpen size={14} />
        <span>{cardState}</span>
        {cardState.toLowerCase() === "learning" && (
          <span className="opacity-70 ml-1 border-l border-white/20 pl-2">
            Step {currentStep + 1}
          </span>
        )}
      </div>

      <h2 className="text-xl font-bold text-white truncate max-w-xl border-l border-[#2f334d] pl-4 ml-2">
        {title}
      </h2>
    </div>
  );
}
