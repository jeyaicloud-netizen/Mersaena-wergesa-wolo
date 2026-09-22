import { Users, Settings as SettingsIcon, History, HelpCircle, X } from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContacts: () => void;
  onOpenSettings: () => void;
  onClearCallHistory: () => void;
  onOpenHelp: () => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  onOpenContacts,
  onOpenSettings,
  onClearCallHistory,
  onOpenHelp,
}: NavigationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" />

      {/* Drawer Card - Screenshot 10 */}
      <div
        className="relative w-72 max-w-[80%] h-full bg-[#F4F3F8] shadow-2xl flex flex-col py-6 px-4 z-10 animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 px-2">
          <h2 className="text-[24px] font-medium text-[#1D1B20]">Phone</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#49454F] hover:text-[#1D1B20] rounded-full active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {/* Contacts */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenContacts();
            }}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-[#E9E6F0] active:bg-[#DFDBE8] text-[#1D1B20] font-normal text-[15px] transition-colors"
          >
            <Users className="w-5 h-5 text-[#49454F]" />
            <span>Contacts</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-[#E9E6F0] active:bg-[#DFDBE8] text-[#1D1B20] font-normal text-[15px] transition-colors"
          >
            <SettingsIcon className="w-5 h-5 text-[#49454F]" />
            <span>Settings</span>
          </button>

          {/* Clear Call History */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onClearCallHistory();
            }}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-[#E9E6F0] active:bg-[#DFDBE8] text-[#1D1B20] font-normal text-[15px] transition-colors"
          >
            <History className="w-5 h-5 text-[#49454F]" />
            <span>Clear call history</span>
          </button>

          {/* Help and feedback */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenHelp();
            }}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-[#E9E6F0] active:bg-[#DFDBE8] text-[#1D1B20] font-normal text-[15px] transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-[#49454F]" />
            <span>Help and feedback</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-auto px-2 pt-6 border-t border-[#E3DFEC] text-xs text-[#79747E] space-y-1">
          <p className="font-medium text-[#49454F]">Android WebView & Web</p>
          <p>Dual SIM Phone Dialer</p>
        </div>
      </div>
    </div>
  );
}
