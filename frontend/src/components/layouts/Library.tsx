// frontend/src/components/layouts/Library.tsx
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetNode } from "../../wailsjs/go/app/App";
import { FileText } from "lucide-react";

// Specialized Views
import RootView from "../views/RootView";
import SubjectView from "../views/SubjectView";
import TopicView from "../views/TopicView";
import ProblemView from "../views/ProblemView";
import TheoryView from "../views/TheoryView";

export default function Library() {
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get("nodeId");

  const { data: node, isLoading, error } = useQuery({
    queryKey: ["node", nodeId],
    queryFn: () => GetNode(nodeId!),
    enabled: !!nodeId,
    retry: false,
  });

  if (!nodeId) return <RootView />;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 font-mono animate-pulse">
        Loading Node...
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>Node not found.</p>
      </div>
    );
  }

  // Strict Routing
  switch (node.type) {
    case "subject": return <SubjectView node={node} />;
    case "topic": return <TopicView node={node} />;
    case "problem": return <ProblemView node={node} />;
    case "theory": return <TheoryView node={node} />;
    default: return <div className="p-8">Unknown node type: {node.type}</div>;
  }
}
