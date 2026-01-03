import { useEffect } from 'react';
import MarkdownRenderer from '../atomic/MarkdownRenderer';
import StylizedButton from '../atomic/StylizedButton';
import { Eye, EyeOff } from 'lucide-react';

interface StudyContentProps {
  node: any; // Ideally this should be a proper Node type
  onShowAnswer: () => void;
  isAnswerShown: boolean;
}

export default function StudyContent({ node, onShowAnswer, isAnswerShown }: StudyContentProps) {
  // Use spacebar to toggle answer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isAnswerShown) {
        e.preventDefault(); // Prevent scrolling
        onShowAnswer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerShown, onShowAnswer]);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-8 custom-scrollbar">

      {/* Question / Front Side */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border border-blue-900 text-blue-400 bg-blue-900/10">
            {node.type}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            UUID::{String(node.id).split('-')[0]}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-100">
          {node.title}
        </h2>

        {/* For PROBLEMS: The body is the question */}
        <div className="prose prose-invert prose-sm max-w-none border-l-2 border-blue-500/50 pl-4 py-2">
          <MarkdownRenderer content={node.body} />
        </div>
      </div>

      {/* Answer / Back Side */}
      {isAnswerShown ? (
        <div className="animate-in slide-in-from-bottom-8 fade-in duration-500 pt-8 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Solution / Details
            </span>
          </div>

          <div className="bg-[#1a1b26] p-6 rounded-lg border border-[#2f334d]">
            {/* 
              TODO: In the future, we might separate Question vs Answer fields.
              For now, we assume the user mentally answers and checks against full content 
              or we could have a specific 'answer' field in metadata if added later.
            */}
            <p className="text-gray-400 italic mb-2">
              (Self-Verification Mode: Compare your mental answer with the content below)
            </p>
            <MarkdownRenderer content={node.body} />
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-12">
          <StylizedButton
            onClick={onShowAnswer}
            className="px-12 py-4 text-lg font-bold animate-pulse"
            variant="primary"
            icon={<EyeOff size={20} />}
          >
            SHOW ANSWER (SPACE)
          </StylizedButton>
        </div>
      )}
    </div>
  );
}