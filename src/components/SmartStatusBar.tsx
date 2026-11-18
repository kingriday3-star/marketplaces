import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, SignalHigh } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali';

interface SmartStatusBarProps {
  className?: string;
  theme?: 'dark' | 'light';
}

export const SmartStatusBar: React.FC<SmartStatusBarProps> = ({
  className = '',
  theme = 'dark'
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const isPM = hours >= 12;
      hours = hours % 12 || 12;
      setTimeStr(`${toBengaliNumber(hours)}:${toBengaliNumber(minutes)} ${isPM ? 'PM' : 'AM'}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const textColor = theme === 'dark' ? 'text-slate-900' : 'text-white';
  const dynamicIslandBg = theme === 'dark' ? 'bg-black' : 'bg-slate-900';

  return (
    <div
      className={`w-full px-5 pt-3 pb-1.5 flex items-center justify-between text-[11px] font-semibold select-none z-30 transition-colors ${textColor} ${className}`}
    >
      {/* Time */}
      <div className="flex items-center gap-1 font-bold tracking-tight w-24">
        <span>{timeStr || '৯:৪১ AM'}</span>
      </div>

      {/* Dynamic Island / Smart Camera Punch Hole */}
      <div className="flex items-center justify-center">
        <div
          className={`${dynamicIslandBg} text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-inner border border-slate-800/80 transition-all duration-300 hover:scale-105`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-sky-500/80 animate-pulse" />
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="সুরক্ষিত সিস্টেম অ্যাক্টিভ" />
          <span className="text-[10px] font-medium tracking-wide text-slate-300">Market places</span>
        </div>
      </div>

      {/* System Icons: 5G, Wi-Fi, Battery */}
      <div className="flex items-center justify-end gap-1.5 w-24">
        <span className="text-[10px] font-bold tracking-wider text-slate-700">5G</span>
        <SignalHigh className="w-3.5 h-3.5 opacity-90" />
        <Wifi className="w-3.5 h-3.5 opacity-90" />
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-2.5 rounded-[3px] border border-current p-0.5 flex items-center">
            <div className="w-3.5 h-1.5 bg-emerald-500 rounded-[1px]" />
          </div>
          <div className="w-0.5 h-1 bg-current rounded-r-xs" />
        </div>
      </div>
    </div>
  );
};
