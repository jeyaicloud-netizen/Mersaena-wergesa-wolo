import { useState } from 'react';
import { X, Volume2, Smartphone, Layers, RotateCcw, Check } from 'lucide-react';
import { SimConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showStatusBar: boolean;
  onToggleStatusBar: (val: boolean) => void;
  soundEnabled: boolean;
  onToggleSound: (val: boolean) => void;
  vibrationEnabled: boolean;
  onToggleVibration: (val: boolean) => void;
  sims: SimConfig[];
  onUpdateSims: (sims: SimConfig[]) => void;
  onResetData: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  showStatusBar,
  onToggleStatusBar,
  soundEnabled,
  onToggleSound,
  vibrationEnabled,
  onToggleVibration,
  sims,
  onUpdateSims,
  onResetData,
}: SettingsModalProps) {
  const [sim1Name, setSim1Name] = useState(sims[0]?.name || 'Ethio telecom');
  const [sim2Name, setSim2Name] = useState(sims[1]?.name || 'Ethio telecom');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSims = () => {
    const updated = [
      { ...sims[0], name: sim1Name.trim() || 'Ethio telecom' },
      { ...sims[1], name: sim2Name.trim() || 'Ethio telecom' },
    ];
    onUpdateSims(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#F4F3F8] rounded-[28px] p-6 shadow-2xl border border-[#E0DFE8] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium text-[#1D1B20]">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#49454F] hover:text-[#1D1B20] rounded-full active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* WebView Status Bar Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#49454F]" />
              <div>
                <div className="text-sm font-medium text-[#1D1B20]">Mock Status Bar</div>
                <div className="text-xs text-[#79747E]">
                  Turn off if Android native bar is visible
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showStatusBar}
              onChange={(e) => onToggleStatusBar(e.target.checked)}
              className="w-5 h-5 accent-[#3949AB] cursor-pointer"
            />
          </div>

          {/* Sound Tones Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-[#49454F]" />
              <div>
                <div className="text-sm font-medium text-[#1D1B20]">Dialpad Tones</div>
                <div className="text-xs text-[#79747E]">Web Audio DTMF sounds</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => onToggleSound(e.target.checked)}
              className="w-5 h-5 accent-[#3949AB] cursor-pointer"
            />
          </div>

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#49454F]" />
              <div>
                <div className="text-sm font-medium text-[#1D1B20]">Haptic Feedback</div>
                <div className="text-xs text-[#79747E]">Vibrate on keypad press</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={vibrationEnabled}
              onChange={(e) => onToggleVibration(e.target.checked)}
              className="w-5 h-5 accent-[#3949AB] cursor-pointer"
            />
          </div>

          {/* Dual SIM Configuration */}
          <div className="pt-2 border-t border-[#E0DFE8] space-y-2.5">
            <div className="text-xs font-semibold text-[#49454F]">Carrier / SIM Names</div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#00897B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <input
                  type="text"
                  value={sim1Name}
                  onChange={(e) => setSim1Name(e.target.value)}
                  placeholder="SIM 1 Name"
                  className="flex-1 bg-white border border-[#E0DFE8] rounded-xl px-3 py-1.5 text-xs text-[#1D1B20] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#3949AB] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <input
                  type="text"
                  value={sim2Name}
                  onChange={(e) => setSim2Name(e.target.value)}
                  placeholder="SIM 2 Name"
                  className="flex-1 bg-white border border-[#E0DFE8] rounded-xl px-3 py-1.5 text-xs text-[#1D1B20] outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveSims}
                  className="px-3 py-1 text-xs font-medium text-[#1E192B] bg-[#E2DEFE] hover:bg-[#D5D0F8] rounded-lg transition-colors flex items-center gap-1"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5 text-green-700" /> : null}
                  <span>{savedSuccess ? 'Saved' : 'Update SIMs'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-[#E0DFE8]">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset to initial call logs and contacts?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-[#B3261E] hover:bg-red-50 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset demo logs & contacts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
