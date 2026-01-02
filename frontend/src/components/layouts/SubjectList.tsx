import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { GetSubjects, GetChildren } from '../../wailsjs/go/app/App';
import { ChevronRight, ChevronDown, Folder, FileText, Hash, Book } from 'lucide-react';
import clsx from 'clsx';
import { ent } from '../../wailsjs/go/models';

export default function SubjectList() {
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects,
  });

  if (!subjects) return <div className="p-4 text-xs text-gray-500">Loading hierarchy...</div>;

  return (
    <div className="space-y-1">
      {subjects.map(sub => (
        <TreeNode
          key={JSON.stringify(sub.id)}
          node={sub}
        />
      ))}
    </div>
  );
}

// --- Recursive Node ---
function TreeNode({ node }: { node: ent.Node }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Check if selected via URL
  const selectedId = searchParams.get('nodeId');
  const nodeIdStr = JSON.stringify(node.id);
  const isSelected = selectedId === nodeIdStr;

  // Fetch children on expand
  const { data: children, isLoading } = useQuery({
    queryKey: ['children', nodeIdStr],
    queryFn: () => GetChildren(nodeIdStr),
    enabled: isOpen,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If it's a folder (Subject/Topic), toggle expansion
    if (node.type === 'subject' || node.type === 'topic') {
      setIsOpen(!isOpen);
    }

    // Update URL selection
    setSearchParams({ nodeId: nodeIdStr });
  };

  const Icon = node.type === 'subject' ? Book :
    node.type === 'topic' ? Folder :
      node.type === 'problem' ? Hash : FileText;

  return (
    <div className="pl-2">
      <div
        onClick={handleToggle}
        className={clsx(
          "flex items-center py-1.5 px-2 rounded cursor-pointer transition-colors text-sm select-none",
          isSelected ? "bg-(--tui-primary) text-black font-bold" : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <span className="mr-1 opacity-50 w-4 flex justify-center">
          {(node.type === 'subject' || node.type === 'topic') && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>
        <Icon size={14} className="mr-2 shrink-0" />
        <span className="truncate">{node.body}</span>
      </div>

      {isOpen && (
        <div className="border-l border-gray-800 ml-3">
          {isLoading && <div className="pl-6 py-1 text-xs text-gray-600">Loading...</div>}
          {children?.map(child => (
            <TreeNode
              key={JSON.stringify(child.id)}
              node={child}
            />
          ))}
          {children?.length === 0 && <div className="pl-6 py-1 text-xs text-gray-700 italic">Empty</div>}
        </div>
      )}
    </div>
  );
}
