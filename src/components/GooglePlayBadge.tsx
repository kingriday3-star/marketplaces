import React from 'react';

export const GooglePlayIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.6 1.8c-.4.4-.6 1-.6 1.8v16.8c0 .8.2 1.4.6 1.8l.1.1 9.4-9.4v-.2L3.7 1.7l-.1.1z"
      fill="#00C3FF"
    />
    <path
      d="M16.2 15.3l-3.1-3.1v-.4l3.1-3.1.1.1 3.7 2.1c1 .6 1 1.5 0 2.1l-3.8 2.3v.1z"
      fill="#FFD200"
    />
    <path
      d="M16.3 15.2L13.1 12 3.6 21.5c.3.3.9.4 1.5 0l11.2-6.3"
      fill="#FF3333"
    />
    <path
      d="M16.3 8.8L5.1 2.5C4.5 2.1 3.9 2.2 3.6 2.5L13.1 12l3.2-3.2z"
      fill="#00E676"
    />
  </svg>
);

interface GooglePlayButtonProps {
  onClick?: () => void;
  subtitle?: string;
  title?: string;
  className?: string;
}

export const GooglePlayButton: React.FC<GooglePlayButtonProps> = ({
  onClick,
  subtitle = 'GET IT ON',
  title = 'Google Play',
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 px-4 py-2 bg-black hover:bg-slate-900 active:bg-slate-950 text-white rounded-xl border border-white/20 shadow-md transition-all group ${className}`}
    >
      <GooglePlayIcon className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform" />
      <div className="text-left leading-none">
        <span className="block text-[10px] tracking-wider text-slate-300 font-medium uppercase">
          {subtitle}
        </span>
        <span className="block text-sm font-bold text-white tracking-wide">
          {title}
        </span>
      </div>
    </button>
  );
};
