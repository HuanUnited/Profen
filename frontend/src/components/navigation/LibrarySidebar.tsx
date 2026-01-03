import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import SidebarFrame from "./SidebarFrame";
import SubjectList from "../layouts/SubjectList";
import NodeModal from "../smart/NodeModal";
import StyledButton from "../atomic/StylizedButton";

export default function LibrarySidebar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentNodeId = searchParams.get('nodeId');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch current node to determine "Up" destination
  const { data: currentNode } = useQuery({
    queryKey: ['node', currentNodeId],
    queryFn: () => GetNode(currentNodeId!),
    enabled: !!currentNodeId
  });

  const handleUp = () => {
    if (!currentNodeId) return; // Already at root

    if (currentNode?.parent_id) {
      // Go to parent
      navigate(`/library?nodeId=${currentNode.parent_id}`);
    } else {
      // No parent (Subject) -> Go to Root
      navigate('/library');
    }
  };

  return (
    <>
      <SidebarFrame
        resizable={true}
        initialWidth={280}

        // 1. Header (Thinner + Up Button)
        header={
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-500 hover:text-white transition-colors group pointer-events-auto"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>

            <button
              onClick={handleUp}
              disabled={!currentNodeId}
              className="flex items-center text-gray-500 hover:text-white transition-colors disabled:opacity-30 pointer-events-auto disabled:cursor-not-allowed"
              title="Up One Level"
            >
              <ArrowUp size={16} />
            </button>

            <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-gray-600 select-none">
              LIBRARY
            </span>
          </div>
        }

        // 2. Toolbar (Now thinner/simpler or removed if empty?)
        // User said "move create button... from next to explorer header".
        // If we remove the create button, the toolbar might just be the "Explorer" text.
        toolbar={
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              Subjects
            </span>
          </div>
        }

        // 3. Footer (New Home for Create Button)
        footer={
          <StyledButton
            variant="primary"
            size="md"
            icon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
            className="w-full"
          >
            NEW NODE
          </StyledButton>
        }
      >
        <SubjectList />
      </SidebarFrame>

      <NodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create"
      // TODO: If we are currently inside a node, maybe pre-fill it?
      // initialParentId={currentNodeId || undefined} 
      // ^ Users might expect "New Node" to create a child of current. 
      // For now, let's keep it generic/root unless user explicitly wants context.
      />
    </>
  );
}
