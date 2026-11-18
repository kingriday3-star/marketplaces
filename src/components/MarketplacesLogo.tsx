import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  inverted?: boolean;
}

export const MarketplacesLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  inverted = false,
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', text: 'text-lg', sub: 'text-[9px]' },
    md: { img: 'w-9 h-9', text: 'text-xl sm:text-2xl', sub: 'text-[10px]' },
    lg: { img: 'w-14 h-14', text: 'text-3xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Visual Logo Mark */}
      <div className={`relative ${currentSize.img} rounded-xl overflow-hidden bg-[#0f1829] shadow-xs border border-slate-200/30 dark:border-slate-700 flex items-center justify-center shrink-0`}>
        <img
          src="/logo.png"
          alt="Market places Logo"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight ${currentSize.text} flex items-center gap-1 font-sans ${
            inverted ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}>
            <span>Market</span>
            <span className={inverted ? 'text-amber-200' : 'text-[#fb7701]'}>places</span>
          </div>
          <span className={`${currentSize.sub} font-semibold tracking-wide ${
            inverted ? 'text-white/80' : 'text-slate-400 dark:text-slate-400'
          }`}>
            Online Marketplace
          </span>
        </div>
      )}
    </div>
  );
};
