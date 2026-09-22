import { Home, Grid3X3 } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: 'home' | 'keypad';
  onTabChange: (tab: 'home' | 'keypad') => void;
}

export default function BottomNavBar({ currentTab, onTabChange }: BottomNavBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#F2F1F8]/95 backdrop-blur-md border-t border-[#E5E3EB] flex flex-col items-center pt-2 pb-1.5 safe-bottom select-none">
      <div className="w-full max-w-sm flex items-center justify-around px-8">
        {/* Home Tab */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
        >
          <div
            className={`w-16 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'home'
                ? 'bg-[#E2DEFE] text-[#1E192B]'
                : 'text-[#49454F] hover:bg-[#EAE8F2]'
            }`}
          >
            <Home className="w-5 h-5 fill-current" />
          </div>
          <span
            className={`text-xs ${
              currentTab === 'home'
                ? 'font-bold text-[#1D1B20]'
                : 'font-medium text-[#49454F]'
            }`}
          >
            Home
          </span>
        </button>

        {/* Keypad Tab */}
        <button
          type="button"
          onClick={() => onTabChange('keypad')}
          className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
        >
          <div
            className={`w-16 h-8 rounded-full flex items-center justify-center transition-all ${
              currentTab === 'keypad'
                ? 'bg-[#E2DEFE] text-[#1E192B]'
                : 'text-[#49454F] hover:bg-[#EAE8F2]'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </div>
          <span
            className={`text-xs ${
              currentTab === 'keypad'
                ? 'font-bold text-[#1D1B20]'
                : 'font-medium text-[#49454F]'
            }`}
          >
            Keypad
          </span>
        </button>
      </div>

      {/* Android System Gesture Bar line */}
      <div className="w-28 h-1 bg-[#1D1B20]/40 rounded-full mt-2" />
    </div>
  );
}
