import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import { FileText } from "lucide-react";

// Import Sub-Views
import RootView from "../views/RootView";
import ContainerView from "../views/ContainerView"; // Subjects & Topics
import LeafView from "../views/LeafView"; // Problems & Theories

export default function Library() {
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get("nodeId");

  const { data: node, isLoading, error } = useQuery({
    queryKey: ["node", nodeId],
    queryFn: () => GetNode(nodeId!),
    enabled: !!nodeId,
    retry: false,
  });

  // CASE 0: No Node Selected -> Root View (Subject Grid)
  if (!nodeId) {
    return <RootView />;
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 font-mono animate-pulse">
        Loading...
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>Node not found or access denied.</p>
      </div>
    );
  }

  // CASE 1: Container Nodes (Subject, Topic)
  if (node.type === "subject" || node.type === "topic") {
    return <ContainerView node={node} />;
  }

  // CASE 2: Leaf Nodes (Problem, Theory, Term)
  if (node.type === "problem" || node.type === "theory" || node.type === "term") {
    return <LeafView node={node} />;
  }

  return <div>Unknown Node Type: {node.type}</div>;
}
