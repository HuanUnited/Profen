import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import { FileText, Plus } from "lucide-react"; // Added Plus

// Import Sub-Views
import RootView from "../views/RootView";
import ContainerView from "../views/ContainerView";
import LeafView from "../views/LeafView";

// Custom Components
import { useState, useEffect } from "react"; // Add useEffect
import StyledSearch from "../atomic/Search";
import StyledButton from "../atomic/StylizedButton";

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const nodeId = searchParams.get('nodeId');
  const [searchQuery, setSearchQuery] = useState(""); // Add search state

  // Add search param sync
  useEffect(() => {
    if (searchQuery) {
      const params = new URLSearchParams(searchParams);
      if (nodeId) params.set('nodeId', nodeId);
      params.set('search', searchQuery);
      setSearchParams(params);
    } else {
      const params = new URLSearchParams(searchParams);
      if (nodeId) params.set('nodeId', nodeId);
      else params.delete('nodeId');
      params.delete('search');
      setSearchParams(params);
    }
  }, [searchQuery, nodeId, setSearchParams]);

  const { data: node, isLoading, error } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => GetNode(nodeId!),
    enabled: !!nodeId,
    retry: false
  });

  // Header with Search + Buttons (ADD THIS)
  const renderHeader = () => (
    <div className="sticky top-0 z-10 p-6 border-b border-[#2f334d]/50 bg-[#16161e]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-linear-to-r from-white via-gray-200 to-transparent bg-clip-text text-transparent">
            Knowledge Library
          </h1>
          {node && (
            <div className="text-sm text-gray-500 font-mono bg-[#1a1b26]/50 px-3 py-1 rounded-full">
              {node?.type?.toUpperCase() || 'NODE'} • {nodeId?.slice(0, 8) || 'N/A'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <StyledSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search nodes..."
            className="w-80"
          />
          <StyledButton
            variant="primary"
            size="md"
            icon={<Plus size={18} />}
            onClick={() => {
              // Open NodeModal for new child
              // Your modal logic here
            }}
          >
            New Node
          </StyledButton>
        </div>
      </div>
    </div>
  );

  if (!nodeId) return (
    <>
      {renderHeader()}
      <RootView />
    </>
  );

  if (isLoading) return (
    <>
      {renderHeader()}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#89b4fa]/20 border-t-[#89b4fa] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-mono">Loading Knowledge Graph...</p>
        </div>
      </div>
    </>
  );

  if (error || !node) return (
    <>
      {renderHeader()}
      <div className="h-full flex flex-col items-center justify-center text-red-400 p-12">
        <FileText size={48} className="mb-4 opacity-50" />
        <p className="text-xl font-mono">Node not found or access denied.</p>
        <StyledButton
          variant="ghost"
          size="md"
          onClick={() => setSearchParams({})}
          className="mt-4"
        >
          Back to Root
        </StyledButton>
      </div>
    </>
  );

  // Render appropriate view with header
  const renderView = () => {
    if (node?.type === 'subject' || node?.type === 'topic') {
      return <ContainerView node={node} />;
    }
    if (node?.type === 'problem' || node?.type === 'theory' || node?.type === 'term') {
      return <LeafView node={node} />;
    }
    return <div>Unknown Node Type: {node.type}</div>;
  };

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
}
