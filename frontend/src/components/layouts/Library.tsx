import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GetSubjects, GetChildren, GetNode } from '../../wailsjs/go/app/App'; // Verify path
import { ChevronRight, ChevronDown, Folder, FileText, Hash, Book } from 'lucide-react';
import clsx from 'clsx';
import { ent } from '../../wailsjs/go/models';

export default function Library() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      {/* LEFT: Tree Sidebar */}
      <div className="w-80 border-r border-[var(--tui-border)] bg-[#1a1b26] flex flex-col">
        <div className="p-3 border-b border-[var(--tui-border)] text-xs font-bold text-gray-500 uppercase tracking-wider">
          Explorer
        </div>
        <div className="flex-1 overflow-auto p-2">
          <SubjectList onSelect={setSelectedId} selectedId={selectedId} />
        </div>
      </div>

      {/* RIGHT: Content Area */}
      <div className="flex-1 bg-[var(--tui-bg)] p-8 overflow-auto">
        {selectedId ? (
          <NodeViewer nodeId={selectedId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4">
            <Book size={48} className="opacity-20" />
            <p>Select a node to view content</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Component: Subject List (Roots) ---
function SubjectList({ onSelect, selectedId }: { onSelect: (id: string) => void, selectedId: string | null }) {
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects,
  });

  if (!subjects) return null;

  return (
    <div className="space-y-1">
      {subjects.map(sub => (
        <TreeNode
          key={JSON.stringify(sub.id)} // UUID array -> string
          node={sub}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}

// --- Component: Recursive Tree Node ---
function TreeNode({ node, onSelect, selectedId }: { node: ent.Node, onSelect: (id: string) => void, selectedId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);

  // Only fetch children if expanded
  const { data: children, isLoading } = useQuery({
    queryKey: ['children', JSON.stringify(node.id)],
    queryFn: () => GetChildren(JSON.stringify(node.id)), // Send as String to Go
    enabled: isOpen, // Lazy Load!
  });

  const isSelected = JSON.stringify(node.id) === selectedId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    onSelect(JSON.stringify(node.id));
  };

  // Icons based on type
  const Icon = node.type === 'subject' ? Book :
    node.type === 'topic' ? Folder :
      node.type === 'problem' ? Hash : FileText;

  return (
    <div className="pl-2">
      <div
        onClick={handleToggle}
        className={clsx(
          "flex items-center py-1.5 px-2 rounded cursor-pointer transition-colors text-sm select-none",
          isSelected ? "bg-[var(--tui-primary)] text-black font-bold" : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <span className="mr-1 opacity-50">
          {/* Show arrow only if it might have children (Subject/Topic) */}
          {(node.type === 'subject' || node.type === 'topic') && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>
        <Icon size={14} className="mr-2" />
        <span className="truncate">{node.body}</span>
      </div>

      {/* Recursive Children */}
      {isOpen && (
        <div className="border-l border-gray-800 ml-3">
          {isLoading && <div className="pl-4 py-1 text-xs text-gray-600">Loading...</div>}
          {children?.map(child => (
            <TreeNode
              key={JSON.stringify(child.id)}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
          {children?.length === 0 && <div className="pl-4 py-1 text-xs text-gray-700 italic">Empty</div>}
        </div>
      )}
    </div>
  );
}

// --- Component: Simple Node Viewer (Placeholder) ---
function NodeViewer({ nodeId }: { nodeId: string }) {
  const { data: node, isLoading } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => GetNode(nodeId),
  });

  if (isLoading) return <div>Loading details...</div>;
  if (!node) return <div>Node not found</div>;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-xs font-mono uppercase px-2 py-1 border border-gray-700 rounded text-gray-500">
          {node.type}
        </span>
        <span className="text-xs font-mono text-gray-600">{nodeId}</span>
      </div>

      <h1 className="text-4xl font-bold text-[var(--tui-fg)] mb-8 tracking-tight border-b border-gray-800 pb-4">
        {node.body}
      </h1>

      {/* Content Placeholder */}
      <div className="prose prose-invert prose-emerald max-w-none text-gray-300">
        <p>Content editor will go here (CodeMirror integration).</p>
        <pre className="bg-[#16161e] p-4 rounded text-xs text-blue-300">
          {JSON.stringify(node.metadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
