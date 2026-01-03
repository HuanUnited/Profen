// frontend/src/components/views/ProblemView.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GetAttemptHistory, GetNodeAssociations } from "../../wailsjs/go/app/App";
import { ent } from "../../wailsjs/go/models";
import { ArrowRight, Pencil, History, Hash, ChevronDown, ChevronRight, Link, BookOpen } from "lucide-react";
import MarkdownRenderer from "../atomic/MarkdownRenderer";
import NodeModal from "../smart/NodeModal";
import StyledButton from "../atomic/StylizedButton";
import ContextMenu from "../smart/ContextMenu";

export default function ProblemView({ node }: { node: ent.Node }) {
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showSimilarProblems, setShowSimilarProblems] = useState(true);
  const [showLinkedTheories, setShowLinkedTheories] = useState(true);

  const { data: attempts } = useQuery({
    queryKey: ["attempts", String(node.id)],
    queryFn: () => GetAttemptHistory(String(node.id)),
  });

  const { data: associations } = useQuery({
    queryKey: ["associations", String(node.id)],
    queryFn: () => GetNodeAssociations(String(node.id)),
  });

  // Filter by relationship type with proper typing
  const similarProblems = associations
    ?.filter((a: ent.NodeAssociation) =>
      a.rel_type === "similar_to" && String(a.source_id) === String(node.id)
    )
    .map((a: ent.NodeAssociation) => a.edges?.target)
    .filter((t): t is ent.Node => t !== undefined && t !== null) || [];

  const linkedTheories = associations
    ?.filter((a: ent.NodeAssociation) =>
      a.rel_type === "tests" && String(a.source_id) === String(node.id)
    )
    .map((a: ent.NodeAssociation) => a.edges?.target)
    .filter((t): t is ent.Node => t !== undefined && t !== null) || [];

  const handleNavigateToNode = (nodeId: string) => {
    navigate(`/library?nodeId=${nodeId}`);
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="h-full flex flex-col p-8 animate-in fade-in"
      onContextMenu={handleBackgroundContextMenu}
    >
      {/* Header */}
      <div className="mb-6 flex justify-between items-start border-b border-[#2f334d] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-900/20 text-blue-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-blue-900/30">
              Problem
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
            Attempt Problem
          </StyledButton>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Content (Read Only) */}
        <div className="flex-1 border border-[#2f334d] rounded-xl bg-[#16161e] overflow-hidden flex flex-col">
          <div className="bg-[#1a1b26] border-b border-[#2f334d] px-4 py-2 flex items-center gap-2">
            <Hash size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Problem Statement</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-markdown">
            <MarkdownRenderer content={node.body || "_No content provided._"} />
          </div>
        </div>

        {/* Sidebar: Stats & History */}
        <div className="w-80 space-y-6 overflow-y-auto pr-2">
          {/* Attempt History */}
          <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={14} /> Attempt History
            </h3>

            <div className="space-y-3">
              {attempts?.slice(0, 5).map((attempt: ent.Attempt, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-[#2f334d]/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-gray-500">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-bold ${attempt.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                      {attempt.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <span className="font-mono text-gray-600 text-xs">
                    {Math.round((attempt?.duration_ms ?? 0) / 1000)}s
                  </span>
                </div>
              ))}
              {(!attempts || attempts.length === 0) && (
                <div className="text-center py-4 text-gray-600 text-xs">
                  No attempts yet.
                </div>
              )}
            </div>
          </div>

          {/* Relations Container */}
          <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl overflow-hidden">
            <div className="border-b border-[#2f334d] px-4 py-2.5 flex items-center gap-2">
              <Link size={12} className="text-gray-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connections</span>
            </div>

            {/* Similar Problems */}
            <div className="border-b border-[#2f334d]/50">
              <button
                onClick={() => setShowSimilarProblems(!showSimilarProblems)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#2f334d]/30 transition-colors text-left"
              >
                <span className="text-xs font-medium text-blue-400 flex items-center gap-2">
                  <Hash size={12} /> Similar Problems
                </span>
                {showSimilarProblems ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showSimilarProblems && (
                <div className="px-4 pb-3 space-y-1">
                  {similarProblems.map((p: ent.Node) => (
                    <div
                      key={p.id?.toString()}
                      onClick={() => handleNavigateToNode(String(p.id))}
                      className="flex items-center justify-between text-xs text-gray-400 hover:text-white hover:bg-[#2f334d]/50 cursor-pointer py-2 px-2 rounded transition-colors group"
                    >
                      <span className="truncate flex-1 group-hover:text-blue-300">{p.title}</span>
                      <span className="text-[10px] font-mono text-gray-600 ml-2 shrink-0">
                        {String(p.id).split("-")[0]}
                      </span>
                    </div>
                  ))}
                  {similarProblems.length === 0 && (
                    <div className="text-[10px] text-gray-600 italic py-1">None linked</div>
                  )}
                </div>
              )}
            </div>

            {/* Linked Theories */}
            <div>
              <button
                onClick={() => setShowLinkedTheories(!showLinkedTheories)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#2f334d]/30 transition-colors text-left"
              >
                <span className="text-xs font-medium text-purple-400 flex items-center gap-2">
                  <BookOpen size={12} /> Linked Theories
                </span>
                {showLinkedTheories ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {showLinkedTheories && (
                <div className="px-4 pb-3 space-y-1">
                  {linkedTheories.map((t: ent.Node) => (
                    <div
                      key={t.id?.toString()}
                      onClick={() => handleNavigateToNode(String(t.id))}
                      className="flex items-center justify-between text-xs text-gray-400 hover:text-white hover:bg-[#2f334d]/50 cursor-pointer py-2 px-2 rounded transition-colors group"
                    >
                      <span className="truncate flex-1 group-hover:text-purple-300">{t.title}</span>
                      <span className="text-[10px] font-mono text-gray-600 ml-2 shrink-0">
                        {String(t.id).split("-")[0]}
                      </span>
                    </div>
                  ))}
                  {linkedTheories.length === 0 && (
                    <div className="text-[10px] text-gray-600 italic py-1">None linked</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => setIsEditOpen(true)}
          onClose={() => setContextMenu(null)}
        />
      )}

      <NodeModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        mode="edit"
        initialNode={node}
      />
    </div>
  );
}
