import { Wifi, Signal, BatteryMedium } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StatusBarProps {
  onToggleSettings?: () => void;
}

export default function StatusBar({ onToggleSettings }: StatusBarProps) {
  const [time, setTime] = useState('6:27');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      hours = hours % 12 || 12;
      const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setTime(`${hours}:${minStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="w-full flex items-center justify-between px-6 py-2 text-xs font-medium text-[#49454F] select-none safe-top cursor-pointer"
      onClick={onToggleSettings}
      title="Tap to toggle status bar / settings"
    >
      {/* Left icons: time and subtle notifications */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-[#1D1B20]">{time}</span>
        <div className="w-2 h-2 rounded-full bg-[#3871E0]/80 ml-1" />
        <svg className="w-3.5 h-3.5 text-[#49454F]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/>
        </svg>
      </div>

      {/* Right icons: network, SIM signals, battery */}
      <div className="flex items-center gap-1.5 text-[#49454F]">
        <span className="text-[10px] font-bold tracking-tighter">4G</span>
        <div className="flex items-center -space-x-1">
          <Signal className="w-3.5 h-3.5" />
          <Signal className="w-3.5 h-3.5 opacity-80" />
        </div>
        <Wifi className="w-3.5 h-3.5" />
        <BatteryMedium className="w-4 h-4 text-[#1D1B20]" />
      </div>
    </div>
  );
}
