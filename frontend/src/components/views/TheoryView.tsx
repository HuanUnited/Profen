// frontend/src/components/views/TheoryView.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetAttemptHistory } from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import { Pencil, BookOpen, ChevronDown, ChevronRight, Hash, History, Link, ArrowRight } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";
import StyledButton from "../atomic/StylizedButton";

export default function TheoryView({ node }: { node: ent.Node }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showLinkedProblems, setShowLinkedProblems] = useState(true);
  const [showRelatedTheories, setShowRelatedTheories] = useState(true);

  const { data: attempts } = useQuery({
    queryKey: ["attempts", String(node.id)],
    queryFn: () => GetAttemptHistory(String(node.id)),
  });

  // In ProblemView.tsx
  const { data: associations } = useQuery({
    queryKey: ["associations", String(node.id)],
    queryFn: () => GetNodeAssociations(String(node.id)),
  });

  // Filter by relationship type
  const similarProblems = associations
    ?.filter(a => a.rel_type === "similar_to" && String(a.source_id) === String(node.id))
    .map(a => a.edges?.target)
    .filter(Boolean) || [];

  const linkedTheories = associations
    ?.filter(a => a.rel_type === "tests" && String(a.source_id) === String(node.id))
    .map(a => a.edges?.target)
    .filter(Boolean) || [];

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-900/20 text-purple-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-purple-900/30">
              Theory
            </span>
            <span className="text-xs text-gray-600 font-mono">ID:{String(node.id).split("-")[0]}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{node.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <StyledButton
            variant="ghost"
            size="sm"
            icon={<Pencil size={14} />}
            onClick={() => setIsEditOpen(true)}
          >
            Edit
          </StyledButton>

          <StyledButton
            variant="primary"
            size="md"
            icon={<ArrowRight size={16} />}
            onClick={() => { /* Open Attempt Modal */ }}
          >
            Study Concept
          </StyledButton>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 border border-[#2f334d] rounded-xl bg-[#16161e] overflow-hidden flex flex-col">
          <div className="bg-[#1a1b26] border-b border-[#2f334d] px-4 py-2 flex items-center gap-2">
            <BookOpen size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Concept Material</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-markdown">
            <MarkdownRenderer content={node.body || "_No content provided._"} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4 overflow-y-auto pr-2">

          {/* Attempt History */}
          <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={14} /> Practice History
            </h3>
            <div className="space-y-2">
              {attempts?.slice(0, 5).map((attempt: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-[#2f334d]/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-gray-500">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-bold ${attempt.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                      {attempt.is_correct ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                  <span className="font-mono text-gray-600 text-xs">
                    {Math.round(attempt.duration_ms / 1000)}s
                  </span>
                </div>
              ))}
              {(!attempts || attempts.length === 0) && (
                <div className="text-center py-4 text-gray-600 text-xs">No practice history.</div>
              )}
            </div>
          </div>

          {/* Relations Container */}
          <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl overflow-hidden">
            <div className="border-b border-[#2f334d] px-4 py-2.5 flex items-center gap-2">
              <Link size={12} className="text-gray-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connections</span>
            </div>

            {/* Linked Problems */}
            <div className="border-b border-[#2f334d]/50">
              <button
                onClick={() => setShowLinkedProblems(!showLinkedProblems)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#2f334d]/30 transition-colors text-left"
              >
                <span className="text-xs font-medium text-blue-400 flex items-center gap-2">
                  <Hash size={12} /> Linked Problems
                </span>
                {showLinkedProblems ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showLinkedProblems && (
                <div className="px-4 pb-3 space-y-1">
                  {linkedProblems.map((p: any) => (
                    <div key={p.id} className="text-xs text-gray-400 hover:text-white cursor-pointer py-1">
                      {p.title}
                    </div>
                  ))}
                  {linkedProblems.length === 0 && <div className="text-[10px] text-gray-600 italic py-1">None linked</div>}
                </div>
              )}
            </div>

            {/* Related Theories */}
            <div>
              <button
                onClick={() => setShowRelatedTheories(!showRelatedTheories)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#2f334d]/30 transition-colors text-left"
              >
                <span className="text-xs font-medium text-purple-400 flex items-center gap-2">
                  <BookOpen size={12} /> Related Theories
                </span>
                {showRelatedTheories ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showRelatedTheories && (
                <div className="px-4 pb-3 space-y-1">
                  {relatedTheories.map((t: any) => (
                    <div key={t.id} className="text-xs text-gray-400 hover:text-white cursor-pointer py-1">
                      {t.title}
                    </div>
                  ))}
                  {relatedTheories.length === 0 && <div className="text-[10px] text-gray-600 italic py-1">None linked</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NodeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} mode="edit" initialNode={node} />
    </div>
  );
}
