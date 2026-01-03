import { useState } from 'react';
import { Link as LinkIcon, Search, ChevronRight, Trash2 } from 'lucide-react';
import StyledButton from '../../atomic/StylizedButton';
import clsx from 'clsx';
import { ent } from '../../../../wailsjs/go/models';

interface PendingRelation {
  targetId: string;
  relType: string;
  targetTitle: string;
}

interface NodeRelationsEditorProps {
  relations: PendingRelation[];
  newRelType: string;
  targetSearchQuery: string;
  selectedTargetNode: { id: string; title: string } | null;
  searchResults?: ent.Node[];
  onRelTypeChange: (type: string) => void;
  onSearchQueryChange: (query: string) => void;
  onTargetSelect: (node: { id: string; title: string } | null) => void;
  onAddRelation: () => void;
  onRemoveRelation: (index: number) => void;
}

const REL_TYPES = ["similar_to", "comes_before", "comes_after", "tests", "defines", "variant_of"];

export default function NodeRelationsEditor({
  relations,
  newRelType,
  targetSearchQuery,
  selectedTargetNode,
  searchResults,
  onRelTypeChange,
  onSearchQueryChange,
  onTargetSelect,
  onAddRelation,
  onRemoveRelation
}: NodeRelationsEditorProps) {
  return (
    <div className="pt-8 border-t border-[#2f334d]/50 space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
        <LinkIcon size={16} /> Relationships
      </div>

      <div className="flex gap-3 p-4 bg-[#1a1b26]/50 border border-[#2f334d]/50 rounded-xl items-end">
        <div className="w-48 space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Type</label>
          <select
            value={newRelType}
            onChange={(e) => onRelTypeChange(e.target.value)}
            className="w-full h-10 bg-[#1a1b26] border border-gray-700 rounded-lg px-3 text-sm text-white outline-none focus:border-[#e81cff]"
          >
            {REL_TYPES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
          </select>
        </div>

        <div className="flex-1 space-y-2 relative">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Target Node</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              value={targetSearchQuery}
              onChange={(e) => { onSearchQueryChange(e.target.value); onTargetSelect(null); }}
              placeholder="Search for nodes to link..."
              className={clsx(
                "w-full h-10 bg-[#1a1b26] border rounded-lg pl-10 pr-3 text-sm text-white outline-none focus:border-[#89b4fa]",
                selectedTargetNode ? "border-[#89b4fa]" : "border-gray-700"
              )}
            />
          </div>
          {targetSearchQuery.length > 2 && !selectedTargetNode && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1b26]/95 border border-[#2f334d] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
              {searchResults.map((res) => (
                <button
                  key={String(res.id)}
                  onClick={() => { 
                    onTargetSelect({ id: String(res.id), title: String(res.title) }); 
                    onSearchQueryChange(String(res.title)); 
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#89b4fa]/10 text-sm border-b border-gray-800/50 flex justify-between items-center"
                >
                  <span className="truncate">{res.title}</span>
                  <span className="text-xs bg-gray-800/50 px-2 py-0.5 rounded-full">{res.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <StyledButton
            variant="primary"
            size="sm"
            onClick={onAddRelation}
            disabled={!selectedTargetNode}
            className="h-10"
          >
            LINK
          </StyledButton>
        </div>
      </div>

      {relations.length > 0 && (
        <div className="space-y-2">
          {relations.map((rel, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-[#1a1b26]/50 border border-[#2f334d]/50 rounded-lg group hover:bg-[#2f334d]/50 transition-all">
              <div className="flex items-center gap-3 flex-1">
                <div className="px-2.5 py-1 bg-[#89b4fa]/20 border border-[#89b4fa]/30 rounded-md text-xs font-mono text-[#89b4fa]">
                  {rel.relType.replace(/_/g, ' ').toUpperCase()}
                </div>
                <ChevronRight size={14} className="text-gray-500" />
                <span className="text-gray-300 text-sm font-medium">{rel.targetTitle}</span>
              </div>
              <StyledButton variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => onRemoveRelation(idx)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}