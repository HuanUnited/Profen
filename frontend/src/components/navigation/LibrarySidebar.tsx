import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateNode } from "../../wailsjs/go/app/App";
import clsx from "clsx";

import SidebarFrame from "./SidebarFrame";
import SubjectList from "../layouts/SubjectList";

export default function LibrarySidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Logic State
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");

  const handleCreate = async () => {
    if (!newNodeTitle.trim()) return;
    try {
      await CreateNode("subject", "", newNodeTitle);
      await queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsCreating(false);
      setNewNodeTitle("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
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
            onClick={() => setIsCreating(!isCreating)}
            className={clsx(
              "p-1.5 rounded-md transition-colors",
              isCreating ? "text-red-400 hover:bg-white/5" : "text-[#89b4fa] hover:bg-white/5"
            )}
          >
            {isCreating ? <X size={16} /> : <Plus size={16} />}
          </button>
        </>
      }
      // Slot 3: Pinned Input
      pinned={isCreating ? (
        <div className="p-3 animate-in slide-in-from-top-2">
          <div className="flex gap-2 mb-2">
            <input
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              placeholder="Subject Name..."
              className="flex-1 bg-[#16161e] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-white focus:border-[#89b4fa] outline-none placeholder-gray-600 font-mono"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="p-1.5 bg-[#89b4fa] text-black rounded-md hover:bg-[#b4befe] transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : null}
    >
      {/* Slot 4: Content */}
      <SubjectList />
    </SidebarFrame>
  );
}
