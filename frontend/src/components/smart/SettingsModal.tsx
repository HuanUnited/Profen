import { useState } from 'react';
import { Settings, Palette, Keyboard, Info } from 'lucide-react';
import ModalShell from '../layouts/ModalShell';
import StyledButton from '../atomic/StylizedButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'shortcuts' | 'about';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs = [
    { id: 'general' as const, label: 'General', icon: <Settings size={16} /> },
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'shortcuts' as const, label: 'Shortcuts', icon: <Keyboard size={16} /> },
    { id: 'about' as const, label: 'About', icon: <Info size={16} /> }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-white">Database Path</p>
                    <p className="text-xs text-gray-500 mt-1">Location of your knowledge database</p>
                  </div>
                  <StyledButton variant="secondary" size="sm">Browse</StyledButton>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-white">Auto-save</p>
                    <p className="text-xs text-gray-500 mt-1">Automatically save changes</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-white">Daily Goal</p>
                    <p className="text-xs text-gray-500 mt-1">Target number of reviews per day</p>
                  </div>
                  <input
                    type="number"
                    defaultValue={20}
                    className="w-20 px-3 py-1 bg-[#16161e] border border-[#2f334d] rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Appearance Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-white">Theme</p>
                    <p className="text-xs text-gray-500 mt-1">Color scheme for the application</p>
                  </div>
                  <select className="px-3 py-1 bg-[#16161e] border border-[#2f334d] rounded text-white text-sm">
                    <option>Dark (Default)</option>
                    <option>Light</option>
                    <option>System</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-white">Font Size</p>
                    <p className="text-xs text-gray-500 mt-1">Editor and content font size</p>
                  </div>
                  <select className="px-3 py-1 bg-[#16161e] border border-[#2f334d] rounded text-white text-sm">
                    <option>Small</option>
                    <option>Medium (Default)</option>
                    <option>Large</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-white">Animations</p>
                    <p className="text-xs text-gray-500 mt-1">Enable UI animations</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2">
                {[
                  { action: 'Navigate Back', keys: 'Alt + ←' },
                  { action: 'Navigate Forward', keys: 'Alt + →' },
                  { action: 'Create Node', keys: 'Ctrl + N' },
                  { action: 'Edit Node', keys: 'Ctrl + E' },
                  { action: 'Search', keys: 'Ctrl + K' },
                  { action: 'Settings', keys: 'Ctrl + ,' }
                ].map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#1a1b26] border border-[#2f334d] rounded-lg"
                  >
                    <span className="text-sm text-gray-300">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-[#16161e] border border-[#2f334d] rounded text-xs font-mono text-blue-400">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block text-5xl font-black bg-linear-to-r from-[#e81cff] to-[#40c9ff] bg-clip-text text-transparent mb-4">
                PROFEN
              </div>
              <p className="text-gray-400 text-sm mb-2">Mastery Learning System</p>
              <p className="text-gray-600 text-xs font-mono">Version 2.0.0</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-[#2f334d]">
              <div className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Technology Stack</p>
                <div className="flex flex-wrap gap-2">
                  {['Wails', 'Go', 'React', 'TypeScript', 'FSRS'].map(tech => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-[#16161e] border border-[#2f334d] rounded text-xs text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">License</p>
                <p className="text-xs text-gray-500">MIT License © 2026</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const footer = (
    <>
      <span className="text-xs text-gray-500 font-mono">
        Settings are saved automatically
      </span>
      <StyledButton variant="primary" size="md" onClick={onClose}>
        CLOSE
      </StyledButton>
    </>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      badge={{ label: 'SETTINGS', variant: 'settings' }}
      maxWidth="lg"
      footer={footer}
    >
      <div className="flex h-full">
        {/* Sidebar Tabs */}
        <div className="w-48 bg-[#1a1b26]/50 border-r border-[#2f334d]/50 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeTab === tab.id
                ? 'bg-[#89b4fa]/20 text-[#89b4fa] border border-[#89b4fa]/30'
                : 'text-gray-400 hover:bg-[#2f334d]/30'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </ModalShell>
  );
}
