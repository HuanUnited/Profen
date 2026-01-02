import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import ContainerNodeView from "./library/ContainerNodeView";
import LeafNodeView from "./library/LeafNodeView";
import { FileText } from "lucide-react";

export default function Library() {
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get('nodeId');

  const { data: node, isLoading } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => GetNode(nodeId!), // This will now succeed
    enabled: !!nodeId,
    retry: false
  });

  if (!nodeId) return <EmptyState />;
  if (isLoading) return <div className="p-8 text-gray-500 font-mono animate-pulse">{">"} Fetching node signal...</div>;
  if (!node) return <div className="p-8 text-red-400 font-mono">Error: Signal lost.</div>;

  // CONTEXT SWITCHER LOGIC
  if (node.type === 'subject' || node.type === 'topic') {
    return <ContainerNodeView node={node} />;
  } else {
    return <LeafNodeView node={node} />;
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4 animate-in fade-in">
      <div className="p-6 bg-(--tui-sidebar) rounded-full">
        <FileText size={48} className="opacity-50 text-(--tui-primary)" />
      </div>
      <p className="font-mono text-sm tracking-wide">Select a node to view contents.</p>
    </div>
  )
}
