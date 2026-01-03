import { useState } from 'react';
import { Search, LinkIcon, ChevronRight, Trash2 } from 'lucide-react';
import { ent } from '../../../wailsjs/go/models';
import StyledButton from '../../atomic/StylizedButton';
import clsx from 'clsx';

interface PendingRelation {
  targetId: string;
  relType: string;
  targetTitle: string;
}

interface NodeRelationshipManagerProps {
  relations: PendingRelation[];
  relTypes: string[];
  searchResults?: ent.Node[];
  onAddRelation: (relation: PendingRelation) => void;
  onRemoveRelation: (index: number) => void;
  onSearch: (query: string) => void;
}

export default function NodeRelationshipManager({
  relations,
  relTypes,
  searchResults,
  onAddRelation,
  onRemoveRelation,
  onSearch
}: NodeRelationshipManagerProps) {
  const [newRelType, setNewRelType] = useState(relTypes[0] || "similar_to");
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [selectedTargetNode, setSelectedTargetNode] = useState<{ id: string; title: string } | null>(null);

  const handleAddClick = () => {
    if (!selectedTargetNode) return;
    onAddRelation({
      targetId: selectedTargetNode.id,
      relType: newRelType,
      targetTitle: selectedTargetNode.title
    });
    setTargetSearchQuery("");
    setSelectedTargetNode(null);
  };

  const handleSearchChange = (query: string) => {
    setTargetSearchQuery(query);
    setSelectedTargetNode(null);
    if (query.length > 2) {
      onSearch(query);
    }
  };

  const handleNodeSelect = (node: ent.Node) => {
    setSelectedTargetNode({ id: String(node.id), title: String(node.title) });
    setTargetSearchQuery(String(node.title));
  };

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
            onChange={(e) => setNewRelType(e.target.value)}
            className="w-full h-10 bg-[#1a1b26] border border-gray-700 rounded-lg px-3 text-sm text-white outline-none focus:border-[#e81cff]"
          >
            {relTypes.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2 relative">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Target Node</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              value={targetSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for nodes to link..."
              className={clsx(
                "w-full h-10 bg-[#1a1b26] border rounded-lg pl-10 pr-3 text-sm text-white outline-none focus:border-[#89b4fa]",
                selectedTargetNode ? "border-[#89b4fa]" : "border-gray-700"
              )}
            />
          </div>
          {targetSearchQuery.length > 2 && !selectedTargetNode && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1b26]/95 border border-[#2f334d] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
              ) : (
                searchResults.map((res: ent.Node) => (
                  <button
                    key={String(res.id)}
                    onClick={() => handleNodeSelect(res)}
                    className="w-full text-left px-4 py-3 hover:bg-[#89b4fa]/10 text-sm border-b border-gray-800/50 flex justify-between items-center"
                  >
                    <span className="truncate">{res.title}</span>
                    <span className="text-xs bg-gray-800/50 px-2 py-0.5 rounded-full">{res.type}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <StyledButton
            variant="primary"
            size="sm"
            onClick={handleAddClick}
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
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-[#1a1b26]/50 border border-[#2f334d]/50 rounded-lg group hover:bg-[#2f334d]/50 transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="px-2.5 py-1 bg-[#89b4fa]/20 border border-[#89b4fa]/30 rounded-md text-xs font-mono text-[#89b4fa]">
                  {rel.relType.replace(/_/g, ' ').toUpperCase()}
                </div>
                <ChevronRight size={14} className="text-gray-500" />
                <span className="text-gray-300 text-sm font-medium">{rel.targetTitle}</span>
              </div>
              <StyledButton
                variant="ghost"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => onRemoveRelation(idx)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
