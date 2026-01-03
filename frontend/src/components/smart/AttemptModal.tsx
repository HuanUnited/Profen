import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Timer } from "lucide-react";
import { ent } from "../../wailsjs/go/models";
import StyledButton from "../atomic/StylizedButton";
import MarkdownRenderer from "../atomic/MarkdownRenderer";

interface AttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: ent.Node;
}

export default function AttemptModal({ isOpen, onClose, node }: AttemptModalProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = async () => {
    const duration = Date.now() - startTime;
    // TODO: Call ReviewCard API
    console.log("Submitted:", { answer, duration });
    setIsSubmitted(true);
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center animate-in fade-in">
      <div className="w-[90vw] max-w-4xl h-[85vh] bg-[#16161e] border-2 border-[#2f334d] rounded-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="h-16 px-6 border-b border-[#2f334d] flex items-center justify-between bg-[#1a1b26]">
          <div className="flex items-center gap-3">
            <Timer size={20} className="text-[#89b4fa]" />
            <h2 className="text-xl font-bold text-white">{node.title}</h2>
          </div>
          <StyledButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
        </div>

        {/* Problem Statement */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            <MarkdownRenderer content={node.body || ""} />
          </div>
        </div>

        {/* Answer Section */}
        <div className="p-6 border-t border-[#2f334d] bg-[#1a1b26] space-y-4">
          <label className="text-sm font-bold text-gray-400 uppercase">Your Solution</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-32 bg-[#16161e] border border-[#2f334d] rounded-lg p-4 text-white resize-none focus:border-[#89b4fa] outline-none"
            disabled={isSubmitted}
          />
          <div className="flex justify-end gap-3">
            <StyledButton variant="ghost" onClick={onClose}>SKIP</StyledButton>
            <StyledButton
              variant="primary"
              icon={<Check size={16} />}
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitted}
            >
              SUBMIT
            </StyledButton>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
