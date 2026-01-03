import { Lock } from 'lucide-react';
import { ent } from '../../../../wailsjs/go/models';

interface NodeHierarchySelectorProps {
  mode: "create" | "edit";
  selectedType: string;
  selectedSubjectId: string;
  selectedTopicId: string;
  subjects?: ent.Node[];
  topics?: ent.Node[];
  onSubjectChange: (id: string) => void;
  onTopicChange: (id: string) => void;
}

export default function NodeHierarchySelector({
  mode,
  selectedType,
  selectedSubjectId,
  selectedTopicId,
  subjects,
  topics,
  onSubjectChange,
  onTopicChange
}: NodeHierarchySelectorProps) {
  if (mode !== "create" || selectedType === "subject") return null;

  return (
    <div className="space-y-4 pt-4 border-t border-gray-800/50">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Lock size={12} /> Hierarchy
      </label>
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500">Parent Subject</span>
        <select
          value={selectedSubjectId}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full bg-[#1a1b26] border border-gray-700 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#e81cff]"
        >
          <option value="">-- Select --</option>
          {subjects?.map((s) => (
            <option key={String(s.id)} value={String(s.id)}>
              {s.title || "Untitled"}
            </option>
          ))}
        </select>
      </div>
      {(selectedType === "problem" || selectedType === "theory") && (
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500">Parent Topic</span>
          <select
            value={selectedTopicId}
            onChange={(e) => onTopicChange(e.target.value)}
            className="w-full bg-[#1a1b26] border border-gray-700 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#e81cff]"
            disabled={!selectedSubjectId}
          >
            <option value="">-- Select --</option>
            {topics?.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.title || "Untitled"}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}