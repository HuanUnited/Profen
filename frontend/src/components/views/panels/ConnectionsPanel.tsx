// frontend/src/components/views/panels/ConnectionsPanel.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Link, Info } from "lucide-react";
import { ent } from "../../../wailsjs/go/models";

interface Connection {
  node: ent.Node;
  relType: string;
  direction: "source" | "target"; // Is current node the source or target?
}

interface ConnectionGroup {
  label: string;
  color: string;
  icon: React.ReactNode;
  connections: Connection[];
}

interface ConnectionsPanelProps {
  nodeId: string;
  associations?: ent.NodeAssociation[];
  groups: {
    key: string;
    label: string;
    color: string;
    icon: React.ReactNode;
    filter: (assoc: ent.NodeAssociation, nodeId: string) => boolean;
  }[];
}

export default function ConnectionsPanel({ nodeId, associations, groups }: ConnectionsPanelProps) {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map(g => [g.key, true]))
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const processedGroups: ConnectionGroup[] = groups.map(group => {
    const filtered = associations?.filter(a => group.filter(a, nodeId)) || [];
    const connections: Connection[] = filtered.map(assoc => {
      const isSource = String(assoc.source_id) === nodeId;
      const node = isSource ? assoc.edges?.target : assoc.edges?.source;
      return {
        node: node!,
        relType: assoc.rel_type || "unknown",
        direction: (isSource ? "source" : "target") as "source" | "target" // FIX: Explicit type assertion
      };
    }).filter(c => c.node); // Remove null nodes

    return {
      label: group.label,
      color: group.color,
      icon: group.icon,
      connections
    };
  });

  const buildBreadcrumbs = (node: ent.Node): string => {
    // Traverse up the hierarchy using parent edges
    const crumbs: string[] = [];
    let current = node;
    let depth = 0;
    const maxDepth = 5;

    while (current && depth < maxDepth) {
      crumbs.unshift(current.title || "Untitled");

      // Check if parent exists in edges
      if (current.edges?.parent) {
        current = current.edges.parent;
      } else {
        break;
      }
      depth++;
    }

    return crumbs.join(" › ");
  };

  return (
    <div className="bg-[#1a1b26] border border-[#2f334d] rounded-xl overflow-hidden">
      <div className="border-b border-[#2f334d] px-4 py-2.5 flex items-center gap-2">
        <Link size={12} className="text-gray-500" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connections</span>
      </div>

      {processedGroups.map((group, idx) => (
        <div key={idx} className={idx < processedGroups.length - 1 ? "border-b border-[#2f334d]/50" : ""}>
          <button
            onClick={() => toggleGroup(groups[idx].key)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#2f334d]/30 transition-colors text-left"
          >
            <span className={`text-xs font-medium ${group.color} flex items-center gap-2`}>
              {group.icon}
              {group.label} ({group.connections.length})
            </span>
            {expandedGroups[groups[idx].key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {expandedGroups[groups[idx].key] && (
            <div className="px-4 pb-3 space-y-1">
              {group.connections.map((conn) => (
                <div
                  key={String(conn.node.id)}
                  onMouseEnter={() => setHoveredNode(String(conn.node.id))}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="relative group"
                >
                  <div
                    onClick={() => navigate(`/library?nodeId=${conn.node.id}`)}
                    className="flex items-center justify-between text-xs text-gray-400 hover:text-white hover:bg-[#2f334d]/50 cursor-pointer py-2 px-2 rounded transition-colors"
                  >
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="truncate group-hover:text-inherit">{conn.node.title}</span>
                      <span className="text-[9px] font-mono text-gray-600 shrink-0">
                        {String(conn.node.id).split("-")[0]}
                      </span>
                    </div>
                    <Info size={10} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  {/* Hover Tooltip */}
                  {hoveredNode === String(conn.node.id) && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-[#16161e] border border-[#2f334d] rounded-lg p-3 shadow-2xl min-w-62.5 max-w-87.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate">{conn.node.title}</span>
                          <span className="text-[9px] bg-gray-800/50 px-1.5 py-0.5 rounded font-mono text-gray-500 shrink-0">
                            {conn.node.type}
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-500 font-mono border-t border-gray-800 pt-2">
                          ID: {String(conn.node.id)}
                        </div>

                        <div className="text-[10px] text-gray-400 leading-relaxed border-t border-gray-800 pt-2">
                          <span className="text-gray-600">Path:</span><br />
                          <span className="font-mono">{buildBreadcrumbs(conn.node)}</span>
                        </div>

                        <div className="text-[9px] text-purple-400 border-t border-gray-800 pt-2">
                          Relation: <span className="font-mono bg-purple-900/20 px-1 py-0.5 rounded">
                            {conn.relType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-600 ml-1">
                            ({conn.direction === "source" ? "outgoing" : "incoming"})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {group.connections.length === 0 && (
                <div className="text-[10px] text-gray-600 italic py-1 px-2">None linked</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
