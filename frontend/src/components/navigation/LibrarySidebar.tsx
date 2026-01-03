import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUp, Plus, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import SidebarFrame from "./SidebarFrame";
import SubjectList from "../layouts/SubjectList";
import NodeModal from "../smart/NodeModal";
import StyledButton from "../atomic/StylizedButton";
import { useNavigationHistory } from "../../utils/hooks/useNavigationHistory";

export default function LibrarySidebar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentNodeId = searchParams.get('nodeId');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { goBack, goForward } = useNavigationHistory();

  // Fetch current node to determine context and "Up" destination
  const { data: currentNode } = useQuery({
    queryKey: ['node', currentNodeId],
    queryFn: () => GetNode(currentNodeId!),
    enabled: !!currentNodeId
  });

  const handleUp = () => {
    if (!currentNodeId) return;

    if (currentNode?.parent_id) {
      navigate(`/library?nodeId=${currentNode.parent_id}`);
    } else {
      navigate('/library');
    }
  };

  // Determine default type based on current context
  const getDefaultType = () => {
    if (!currentNode) return "subject";

    switch (currentNode.type) {
      case "subject":
        return "topic";
      case "topic":
        return "problem";
      default:
        return "subject";
    }
  };

  return (
    <>
      <SidebarFrame
        resizable={true}
        initialWidth={280}
        header={
          <div className="flex items-center gap-2 w-full">
            {/* Browser-style Back/Forward */}
            <button
              onClick={goBack}
              className="flex items-center text-gray-500 hover:text-white transition-colors group pointer-events-auto"
              title="Back (Alt+←)"
            >
              <ArrowLeft size={16} />
            </button>

            <button
              onClick={goForward}
              className="flex items-center text-gray-500 hover:text-white transition-colors group pointer-events-auto"
              title="Forward (Alt+→)"
            >
              <ArrowRight size={16} />
            </button>

            {/* Up One Level */}
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
        toolbar={
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              Subjects
            </span>
          </div>
        }
        footer={
          <div className="flex flex-col gap-2">
            {/* Create Node Button */}
            <StyledButton
              variant="primary"
              size="md"
              icon={<Plus size={14} />}
              onClick={() => setIsModalOpen(true)}
              className="w-full"
            >
              NEW NODE
            </StyledButton>

            {/* Dashboard Button */}
            <StyledButton
              variant="ghost"
              size="md"
              icon={<Home size={14} />}
              onClick={() => navigate("/")}
              className="w-full"
            >
              DASHBOARD
            </StyledButton>
          </div>
        }
      >
        <SubjectList />
      </SidebarFrame>

      <NodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create"
        contextNode={currentNode}
        defaultType={getDefaultType()}
      />
    </>
  );
}
