import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { GetSubjects, GetChildren } from '../../wailsjs/go/app/App';
import { ChevronRight, ChevronDown, Folder, FileText, Hash, Book } from 'lucide-react';
import clsx from 'clsx';
import { ent } from '../../wailsjs/go/models';

export default function SubjectList() {
  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects,
    retry: false,
  });

  if (isLoading) return <div className="p-4 text-xs text-gray-500 animate-pulse">Loading hierarchy...</div>;

  if (error) {
    console.error("GetSubjects Error:", error);
    return (
      <div className="p-4 text-xs text-red-400 border border-red-900 bg-red-950/30 rounded m-2">
        <p className="font-bold mb-1">Error Loading Subjects:</p>
        <p className="font-mono break-all">{String(error)}</p>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) return <div className="p-4 text-xs text-gray-500">No subjects found.</div>;

  return (
    <div className="space-y-1">
      {subjects.map((sub) => (
        <TreeNode key={String(sub.id)} node={sub} />
      ))}
    </div>
  );
}

function TreeNode({ node }: { node: ent.Node }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const selectedId = searchParams.get('nodeId');
  const nodeIdStr = String(node.id).replace(/"/g, '');
  const isSelected = selectedId === nodeIdStr;

  const { data: children, isLoading } = useQuery({
    queryKey: ['children', nodeIdStr],
    queryFn: () => GetChildren(nodeIdStr),
    enabled: isOpen,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'subject' || node.type === 'topic') {
      setIsOpen(!isOpen);
    }
    setSearchParams({ nodeId: nodeIdStr });
  };

  let Icon = FileText;
  if (node.type === 'subject') Icon = Book;
  if (node.type === 'topic') Icon = Folder;
  if (node.type === 'problem') Icon = Hash;

  return (
    <div className="pl-2">
      <div
        onClick={handleToggle}
        className={clsx(
          "flex items-center py-1.5 px-2 rounded cursor-pointer transition-colors text-sm select-none",
          isSelected
            ? "bg-[#89b4fa] text-black font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <span className="mr-1 opacity-50 w-4 flex justify-center">
          {(node.type === 'subject' || node.type === 'topic') && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>
        <Icon size={14} className="mr-2 shrink-0" />
        <span className="truncate">{node.title || "Untitled"}</span>
      </div>

      {isOpen && (
        <div className="border-l border-gray-800 ml-3">
          {isLoading ? (
            <div className="pl-6 py-1 text-xs text-gray-600">Loading...</div>
          ) : (
            children?.map((child) => (
              <TreeNode key={String(child.id)} node={child} />
            ))
          )}
          {children?.length === 0 && (
            <div className="pl-6 py-1 text-xs text-gray-700 italic">Empty</div>
          )}
        </div>
      )}
    </div>
  );
}
