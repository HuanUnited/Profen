import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GetSubjects } from '../../wailsjs/go/app/App';
import { ent } from '../../wailsjs/go/models';
import { BookOpen, Plus } from 'lucide-react';
import StyledButton from '../atomic/StylizedButton';
import { useState } from 'react';
import NodeModal from '../smart/NodeModal';

export default function LibrarySidebar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedNodeId = searchParams.get('nodeId');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects,
  });

  const handleSubjectClick = (nodeId: string) => {
    navigate(`/library?nodeId=${nodeId}`);
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1b26] border-r border-[#2f334d]">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#2f334d] shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold text-white">Library</h2>
        </div>
        <StyledButton
          variant="ghost"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        />
      </div>

      {/* Subjects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="text-gray-500 text-sm text-center py-8">Loading...</div>
        ) : !subjects || subjects.length === 0 ? (
          <div className="text-gray-600 text-sm text-center py-8">
            No subjects yet. Create one to get started.
          </div>
        ) : (
          subjects.map((subject: ent.Node) => (
            <button
              key={String(subject.id)}
              onClick={() => handleSubjectClick(String(subject.id))}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedNodeId === String(subject.id)
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-300 hover:bg-[#2f334d]/50 border border-transparent'
                }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={16} className="shrink-0" />
                <span className="font-medium truncate">{subject.title}</span>
              </div>
            </button>
          ))
        )}
      </div>

      <NodeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        defaultType="subject"
      />
    </div>
  );
}
