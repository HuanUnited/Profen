import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GetSubjects } from '../../wailsjs/go/app/App';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, FolderOpen } from 'lucide-react';
import StyledButton from '../atomic/StylizedButton';
import NodeModal from '../smart/NodeModal';

export default function RootView() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: GetSubjects,
  });

  return (
    <>
      <div className="h-full flex flex-col p-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="mb-8 flex justify-between items-start animate-in slide-in-from-bottom-3 duration-700">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Knowledge Library</h1>
            <p className="text-gray-500 text-sm">Browse and organize your learning materials</p>
          </div>
          <StyledButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            NEW SUBJECT
          </StyledButton>
        </div>

        {/* Subjects Grid */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 font-mono animate-pulse">
            Loading subjects...
          </div>
        ) : !subjects || subjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500 delay-200">
            <FolderOpen size={64} className="text-gray-700 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No subjects yet</p>
            <p className="text-gray-600 text-sm mb-6">Create your first subject to get started</p>
            <StyledButton
              variant="primary"
              size="lg"
              icon={<Plus size={16} />}
              onClick={() => setIsCreateOpen(true)}
            >
              CREATE SUBJECT
            </StyledButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            {subjects.map((subject, idx) => (
              <div
                key={String(subject.id)}
                onClick={() => navigate(`/library?nodeId=${subject.id}`)}
                className="group p-6 bg-[#1a1b26] border border-[#2f334d] rounded-xl hover:border-[#89b4fa] hover:bg-[#20212e] transition-all cursor-pointer shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${200 + idx * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <BookOpen size={24} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-[#89b4fa] transition-colors">
                      {subject.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {String(subject.id).split('-')[0]}
                    </p>
                  </div>
                </div>
                {subject.body && (
                  <p className="mt-4 text-sm text-gray-400 line-clamp-2">
                    {subject.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <NodeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        defaultType="subject"
      />
    </>
  );
}
