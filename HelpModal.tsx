import { X, Globe, Smartphone, Github, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#F4F3F8] rounded-[28px] p-6 shadow-2xl border border-[#E0DFE8] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium text-[#1D1B20]">Help & Info</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#49454F] hover:text-[#1D1B20] rounded-full active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#49454F] leading-relaxed">
          <div className="p-3 bg-white rounded-2xl border border-[#E0DFE8] space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-[#1D1B20] text-sm">
              <Github className="w-4 h-4 text-[#1D1B20]" />
              <span>GitHub & Vercel Ready</span>
            </div>
            <p>
              This app is organized directly in the root directory. You can commit and push directly to GitHub and deploy to Vercel with zero configuration.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-[#E0DFE8] space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-[#1D1B20] text-sm">
              <Smartphone className="w-4 h-4 text-[#00897B]" />
              <span>Android Java WebView Compatibility</span>
            </div>
            <p>
              Optimized for Android WebView: 100% full viewport height, touch-action manipulation, safe-area inset adaptation, and no unwanted pointer or zoom delays.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-[#E0DFE8] space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-[#1D1B20] text-sm">
              <Globe className="w-4 h-4 text-[#3949AB]" />
              <span>Dual SIM & Audio Synthesizer</span>
            </div>
            <p>
              Includes real Web Audio DTMF dial tones, Ethio telecom Dual SIM selection dialog, call timer, and in-call recording simulator.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-[#1D1B20] hover:bg-black rounded-full transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
}
