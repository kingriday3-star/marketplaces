import React from 'react';
import { FrameMode, DeviceColor } from './SmartFrameHeader';
import { SmartStatusBar } from './SmartStatusBar';

interface SmartDeviceFrameWrapperProps {
  children: React.ReactNode;
  frameMode: FrameMode;
  deviceColor: DeviceColor;
  bottomNav?: React.ReactNode;
  theme?: 'light' | 'dark';
  brightness?: number;
}

export const SmartDeviceFrameWrapper: React.FC<SmartDeviceFrameWrapperProps> = ({
  children,
  frameMode,
  deviceColor,
  bottomNav,
  theme = 'light',
  brightness = 100
}) => {
  const isDark = theme === 'dark';
  const screenBrightnessStyle = brightness !== 100 ? { filter: `brightness(${brightness}%)` } : undefined;

  if (frameMode === 'desktop') {
    // Desktop Fullscreen view
    return (
      <div
        className={`w-full min-h-screen flex flex-col relative transition-colors duration-200 ${
          isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-[#F8F9FA] text-slate-900'
        }`}
        style={screenBrightnessStyle}
      >
        <div className="flex-1 w-full">
          {children}
        </div>
        {bottomNav}
      </div>
    );
  }

  // Color schemes for the phone chassis
  const colorStyles = {
    obsidian: {
      chassis: 'border-slate-900 bg-slate-950 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)]',
      accent: 'border-slate-800'
    },
    titanium: {
      chassis: 'border-slate-600 bg-slate-700 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.2)]',
      accent: 'border-slate-500'
    },
    midnight: {
      chassis: 'border-slate-900 bg-[#0a192f] shadow-[0_30px_70px_-20px_rgba(2,132,199,0.35),0_0_0_1px_rgba(56,189,248,0.2)]',
      accent: 'border-sky-900'
    }
  }[deviceColor];

  const isPhone = frameMode === 'phone';
  const maxWidthClass = isPhone ? 'max-w-[450px]' : 'max-w-[820px]';

  return (
    <div className={`w-full min-h-[calc(100vh-56px)] py-4 sm:py-8 px-2 sm:px-4 flex items-center justify-center transition-colors duration-200 ${
      isDark ? 'bg-slate-950' : 'bg-radial from-slate-800 via-slate-900 to-slate-950'
    }`}>
      
      {/* Outer Phone Shell with simulated hardware buttons */}
      <div className={`relative w-full ${maxWidthClass} transition-all duration-300`}>
        
        {/* Left Hardware Buttons (Volume Up & Down) */}
        {isPhone && (
          <div className="hidden sm:block absolute -left-3.5 top-28 space-y-3 z-0">
            <div className="w-1.5 h-10 bg-slate-700 rounded-l-md shadow-xs border-l border-slate-600" />
            <div className="w-1.5 h-10 bg-slate-700 rounded-l-md shadow-xs border-l border-slate-600" />
          </div>
        )}

        {/* Right Hardware Button (Power / Lock) */}
        {isPhone && (
          <div className="hidden sm:block absolute -right-3.5 top-32 z-0">
            <div className="w-1.5 h-14 bg-slate-700 rounded-r-md shadow-xs border-r border-slate-600" />
          </div>
        )}

        {/* The Smart Smartphone/Tablet Frame */}
        <div
          className={`relative z-10 w-full ${
            isDark ? 'dark bg-slate-950' : 'bg-white'
          } ${
            isPhone ? 'rounded-[46px] border-[10px] sm:border-[12px]' : 'rounded-[32px] border-[8px] sm:border-[10px]'
          } ${colorStyles.chassis} overflow-hidden flex flex-col h-[88vh] max-h-[920px] min-h-[640px]`}
          style={screenBrightnessStyle}
        >
          {/* Smart Status Bar */}
          <div className={`backdrop-blur-md border-b shrink-0 ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-100 text-slate-900'
          }`}>
            <SmartStatusBar theme={isDark ? 'light' : 'dark'} />
          </div>

          {/* Main Scrollable App Screen */}
          <div
            id="app-screen-scroll-container"
            className={`flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-thin transition-colors ${
              isDark ? 'bg-slate-950 text-slate-100 scrollbar-thumb-slate-700' : 'bg-[#F8F9FA] text-slate-900 scrollbar-thumb-slate-300'
            }`}
          >
            {children}
          </div>

          {/* Dedicated Smart Bottom Navigation Bar */}
          {bottomNav}
        </div>

        {/* Device reflection / shadow highlight */}
        <div className="hidden sm:block text-center mt-3">
          <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Market places · লাইভ স্মার্ট অ্যাপ ফ্রেম ({isDark ? 'ডার্ক মোড' : 'হোয়াইট মোড'})</span>
          </p>
        </div>

      </div>
    </div>
  );
};
