import { SimConfig } from '../types';

interface SimSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSim: (simId: number) => void;
  sims: SimConfig[];
  targetNumber: string;
  targetName?: string;
}

export default function SimSelectionDialog({
  isOpen,
  onClose,
  onSelectSim,
  sims,
  targetNumber,
  targetName,
}: SimSelectionDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-[#EFEBFA] rounded-[28px] p-6 shadow-2xl border border-[#E0DFE8] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-[20px] font-medium text-[#1D1B20]">
            Choose SIM for this call
          </h3>
          {(targetName || targetNumber) && (
            <p className="text-xs text-[#49454F] mt-1 truncate">
              {targetName ? `${targetName} (${targetNumber})` : targetNumber}
            </p>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          {sims.map((sim) => (
            <button
              key={sim.id}
              type="button"
              onClick={() => onSelectSim(sim.id)}
              className="w-full flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-white/60 active:bg-white/80 active:scale-98 transition-all text-left"
            >
              {/* Colored SIM number badge */}
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm text-white shadow-xs shrink-0"
                style={{ backgroundColor: sim.badgeBg }}
              >
                {sim.id}
              </div>

              {/* Carrier Name */}
              <span className="text-[16px] text-[#1D1B20] font-normal">
                {sim.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
