import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";

import SidebarFrame from "./SidebarFrame";
import SubjectList from "../layouts/SubjectList";
import NodeModal from "../smart/NodeModal";

export default function LibrarySidebar() {
  const navigate = useNavigate();

  // Replaced inline creation state with Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SidebarFrame
        resizable={true}
        initialWidth={280}
        // Slot 1: Header
        header={
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-xs uppercase tracking-wider">Dashboard</span>
          </button>
        }
        // Slot 2: Toolbar
        toolbar={
          <>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Explorer</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-md transition-colors text-[#89b4fa] hover:bg-white/5"
              title="Create New Node"
            >
              <Plus size={16} />
            </button>
          </>
        }
        // Slot 3: Pinned Input (REMOVED - We use Modal now)
        pinned={null}
      >
        {/* Slot 4: Content */}
        <SubjectList />
      </SidebarFrame>

      {/* The Unified Node Editor Modal */}
      <NodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create"
      // No initial parent passed here, so user must drill down from Subject
      />
    </>
  );
}
