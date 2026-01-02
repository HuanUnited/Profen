import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import { FileText } from "lucide-react"; // Removed Layers, BookOpen

// Import Sub-Views
import RootView from "../views/RootView";
import ContainerView from "../views/ContainerView";
import LeafView from "../views/LeafView";

export default function Library() {
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get('nodeId');

  // ... (rest of logic same as previous response) ...
  const { data: node, isLoading, error } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => GetNode(nodeId!),
    enabled: !!nodeId,
    retry: false
  });

  if (!nodeId) return <RootView />;

  if (isLoading) return <div className="p-8 text-gray-500 font-mono animate-pulse">Loading Knowledge Graph...</div>;
  if (error || !node) return (
    <div className="h-full flex flex-col items-center justify-center text-red-400">
      <FileText size={48} className="mb-4 opacity-50" />
      <p>Node not found or access denied.</p>
    </div>
  );

  if (node.type === 'subject' || node.type === 'topic') {
    return <ContainerView node={node} />;
  }

  if (node.type === 'problem' || node.type === 'theory' || node.type === 'term') {
    return <LeafView node={node} />;
  }

  return <div>Unknown Node Type: {node.type}</div>;
}
