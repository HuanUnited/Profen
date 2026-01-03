import { ChevronRight } from 'lucide-react';
import StyledButton from '../../atomic/StylizedButton';

interface AnsweringStepProps {
  answer: string;
  onAnswerChange: (value: string) => void;
  onReveal: () => void;
}

export default function AnsweringStep({ answer, onAnswerChange, onReveal }: AnsweringStepProps) {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-4 animate-in slide-in-from-right-4">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
        <ChevronRight size={14} /> Your Solution
      </div>
      <textarea
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Type your solution notes here (optional)..."
        className="flex-1 bg-[#16161e] border border-[#2f334d] rounded-xl p-4 text-white resize-none focus:border-[#89b4fa] outline-none font-mono text-sm leading-relaxed"
        autoFocus
      />
      <StyledButton
        variant="primary"
        size="lg"
        onClick={onReveal}
        className="w-full"
        rightElement={<ChevronRight size={16} />}
      >
        REVEAL & GRADE
      </StyledButton>
    </div>
  );
}
