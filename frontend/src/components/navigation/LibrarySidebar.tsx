// frontend/src/components/navigation/LibrarySidebar.tsx
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
  const currentNodeId = searchParams.get("nodeId");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { goBack, goForward, canGoForward } = useNavigationHistory();

  const { data: currentNode } = useQuery({
    queryKey: ["node", currentNodeId],
    queryFn: () => GetNode(currentNodeId!),
    enabled: !!currentNodeId,
  });

  const handleUp = () => {
    if (!currentNodeId) return;
    if (currentNode?.parent_id) {
      navigate(`/library?nodeId=${currentNode.parent_id}`);
    } else {
      navigate("/library");
    }
  };

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

  // Build breadcrumb path ~/subject/topic/node
  const buildCurrentPath = (): string => {
    if (!currentNode) return "~/";

    const crumbs: string[] = [];
    let current = currentNode;
    let depth = 0;
    const maxDepth = 10;

    while (current && depth < maxDepth) {
      crumbs.unshift(current.title || "Untitled");

      if (current.edges?.parent) {
        current = current.edges.parent;
      } else {
        break;
      }
      depth++;
    }

    return "~/" + crumbs.join("/");
  };

  return (
    <>
      <SidebarFrame
        resizable={true}
        initialWidth={280}
        header={
          <div className="flex items-center gap-2 w-full">
            {/* Back like browser */}
            <button
              onClick={goBack}
              className="flex items-center text-gray-500 hover:text-white transition-colors group pointer-events-auto"
              title="Back (Alt+←)"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Forward only when possible */}
            {canGoForward && (
              <button
                onClick={goForward}
                className="flex items-center text-gray-500 hover:text-white transition-colors group pointer-events-auto"
                title="Forward (Alt+→)"
              >
                <ArrowRight size={16} />
              </button>
            )}

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
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              Navigation
            </span>
            {currentNode && (
              <div className="text-[9px] font-mono text-gray-500 truncate" title={buildCurrentPath()}>
                {buildCurrentPath()}
              </div>
            )}
          </div>
        }
        footer={
          <div className="flex flex-col gap-2">
            <StyledButton
              variant="primary"
              size="md"
              icon={<Plus size={14} />}
              onClick={() => setIsModalOpen(true)}
              className="w-full"
            >
              NEW NODE
            </StyledButton>
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
