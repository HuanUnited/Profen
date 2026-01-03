import { useState, useEffect } from 'react';
import { Settings, Palette, Keyboard, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ModalShell from '../layouts/ModalShell';
import StyledButton from '../atomic/StylizedButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'canvas' | 'shortcuts' | 'about';

// Settings stored in localStorage
const SETTINGS_KEY = 'profen_settings';

interface AppSettings {
  autoSave: boolean;
  dailyGoal: number;
  theme: 'dark' | 'light' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  lattice: {
    spacing: number;
    mouseRepel: boolean;
    mouseDistance: number;
    mouseStrength: number;
    mouseZ: number;
    moveStrength: number;
    accStrength: number;
    xSpeed: number;
    ySpeed: number;
    drawColored: boolean;
    mouseGradient: 'inward' | 'outward' | 'none';
  };
}

const defaultSettings: AppSettings = {
  autoSave: true,
  dailyGoal: 20,
  theme: 'dark',
  fontSize: 'medium',
  animations: true,
  lattice: {
    spacing: 80,
    mouseRepel: true,
    mouseDistance: 200,
    mouseStrength: 2,
    mouseZ: 100,
    moveStrength: 0.5,
    accStrength: 0.1,
    xSpeed: 50,
    ySpeed: 30,
    drawColored: true,
    mouseGradient: 'outward'
  }
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, [isOpen]);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    toast.success('Settings saved');
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: <Settings size={16} /> },
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'canvas' as const, label: 'Canvas', icon: <Sparkles size={16} /> },
    { id: 'shortcuts' as const, label: 'Shortcuts', icon: <Keyboard size={16} /> },
    { id: 'about' as const, label: 'About', icon: <Info size={16} /> }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">General Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-save</p>
                  <p className="text-xs text-gray-500 mt-1">Automatically save changes</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => saveSettings({ ...settings, autoSave: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">Daily Goal</p>
                  <p className="text-xs text-gray-500 mt-1">Target number of reviews per day</p>
                </div>
                <input
                  type="number"
                  value={settings.dailyGoal}
                  onChange={(e) => saveSettings({ ...settings, dailyGoal: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-1 bg-[#16161e] border border-[#2f334d] rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Appearance Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">Theme</p>
                  <p className="text-xs text-gray-500 mt-1">Color scheme for the application</p>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => saveSettings({ ...settings, theme: e.target.value as any })}
                  className="px-3 py-1 bg-[#16161e] border border-[#2f334d] rounded text-white text-sm"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">Font Size</p>
                  <p className="text-xs text-gray-500 mt-1">Editor and content font size</p>
                </div>
                <select
                  value={settings.fontSize}
                  onChange={(e) => saveSettings({ ...settings, fontSize: e.target.value as any })}
                  className="px-3 py-1 bg-[#16161e] border border-[#2f334d] rounded text-white text-sm"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">Animations</p>
                  <p className="text-xs text-gray-500 mt-1">Enable UI animations</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(e) => saveSettings({ ...settings, animations: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>
        );

      case 'canvas':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Canvas Animation Settings</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {/* Mouse Interaction */}
              <div className="space-y-3 p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <p className="text-xs font-bold text-[#89b4fa] uppercase">Mouse Interaction</p>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-white">Repel Mode</label>
                  <input
                    type="checkbox"
                    checked={settings.lattice.mouseRepel}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, mouseRepel: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-white">Gradient</label>
                  <select
                    value={settings.lattice.mouseGradient}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, mouseGradient: e.target.value as any }
                    })}
                    className="px-2 py-1 bg-[#16161e] border border-[#2f334d] rounded text-white text-xs"
                  >
                    <option value="outward">Outward</option>
                    <option value="inward">Inward</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white">Distance: {settings.lattice.mouseDistance}</label>
                  <input
                    type="range"
                    min="50"
                    max="600"
                    value={settings.lattice.mouseDistance}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, mouseDistance: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-white">Strength: {settings.lattice.mouseStrength.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={settings.lattice.mouseStrength}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, mouseStrength: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Motion */}
              <div className="space-y-3 p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <p className="text-xs font-bold text-[#89b4fa] uppercase">Motion</p>

                <div>
                  <label className="text-sm text-white">X Speed: {settings.lattice.xSpeed}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.lattice.xSpeed}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, xSpeed: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-white">Y Speed: {settings.lattice.ySpeed}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.lattice.ySpeed}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, ySpeed: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-white">Spacing: {settings.lattice.spacing}</label>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={settings.lattice.spacing}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, spacing: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Visual */}
              <div className="space-y-3 p-4 bg-[#1a1b26] border border-[#2f334d] rounded-lg">
                <p className="text-xs font-bold text-[#89b4fa] uppercase">Visual</p>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-white">Colored Mode</label>
                  <input
                    type="checkbox"
                    checked={settings.lattice.drawColored}
                    onChange={(e) => saveSettings({
                      ...settings,
                      lattice: { ...settings.lattice, drawColored: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              <StyledButton
                variant="secondary"
                size="sm"
                onClick={() => saveSettings({ ...settings, lattice: defaultSettings.lattice })}
                className="w-full"
              >
                Reset to Defaults
              </StyledButton>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6">
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

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </ModalShell>
  );
}

// Export settings hook for other components to use
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  return settings;
}
