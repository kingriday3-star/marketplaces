import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  ShieldCheck,
  Download,
  Palette,
  Sun,
  Moon,
  Globe,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';
import { SupportedLanguage, LANGUAGES, t } from '../utils/i18n';
import { GooglePlayIcon } from './GooglePlayBadge';

export type FrameMode = 'phone' | 'tablet' | 'desktop';
export type DeviceColor = 'obsidian' | 'titanium' | 'midnight';

interface SmartFrameHeaderProps {
  frameMode: FrameMode;
  onFrameModeChange: (mode: FrameMode) => void;
  deviceColor: DeviceColor;
  onDeviceColorChange: (color: DeviceColor) => void;
  currentUser: User | null;
  onAdminClick: () => void;
  onDownloadClick: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  brightness: number;
  onBrightnessChange: (val: number) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const SmartFrameHeader: React.FC<SmartFrameHeaderProps> = ({
  frameMode,
  onFrameModeChange,
  deviceColor,
  onDeviceColorChange,
  currentUser,
  onAdminClick,
  onDownloadClick,
  theme,
  onThemeToggle,
  brightness,
  onBrightnessChange,
  language,
  onLanguageChange
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isBrightnessOpen, setIsBrightnessOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <header className="w-full bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2.5 flex-wrap">
        
        {/* Left: Branding & Frame Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#fb7701] to-[#ff5000] flex items-center justify-center text-white shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Market places</span>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-400/30">
                তিমু মোড
              </span>
            </div>
          </div>
        </div>

        {/* Center: Frame Switcher (Phone / Tablet / Desktop) */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
          <button
            onClick={() => onFrameModeChange('phone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              frameMode === 'phone'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="মোবাইল ফোন ফ্রেম"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">মোবাইল</span>
          </button>

          <button
            onClick={() => onFrameModeChange('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              frameMode === 'tablet'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="ট্যাবলেট ফ্রেম"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ট্যাবলেট</span>
          </button>

          <button
            onClick={() => onFrameModeChange('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              frameMode === 'desktop'
                ? 'bg-[#fb7701] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="ফুলস্ক্রিন ডেস্কটপ"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ফুলস্ক্রিন</span>
          </button>
        </div>

        {/* Right Controls: Language + Theme + Brightness + Download */}
        <div className="flex items-center gap-2">
          
          {/* Multi-Country Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangMenuOpen(!isLangMenuOpen);
                setIsBrightnessOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg transition-colors text-slate-200"
              title="ভাষা পরিবর্তন করুন"
            >
              <span className="text-sm">{currentLang.flag}</span>
              <span className="hidden md:inline">{currentLang.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  দেশ ও ভাষা নির্বাচন করুন
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700 transition-colors ${
                        language === lang.code ? 'text-sky-400 font-bold bg-slate-750' : 'text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher: White / Dark Mode */}
          <button
            onClick={onThemeToggle}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'bg-amber-950/60 border-amber-600/50 text-amber-300 hover:bg-amber-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={theme === 'dark' ? 'হোয়াইট (সাদা) মোডে পরিবর্তন করুন' : 'ডার্ক (কালো) মোডে পরিবর্তন করুন'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">সাদা মোড</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">ডার্ক মোড</span>
              </>
            )}
          </button>

          {/* Brightness Control Button & Slider */}
          <div className="relative">
            <button
              onClick={() => {
                setIsBrightnessOpen(!isBrightnessOpen);
                setIsLangMenuOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors"
              title="স্ক্রিনের উজ্জ্বলতা অ্যাডজাস্ট করুন"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">{brightness}%</span>
            </button>

            {isBrightnessOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>উজ্জ্বলতা (Brightness)</span>
                  </span>
                  <span className="text-amber-400 font-mono">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="140"
                  step="5"
                  value={brightness}
                  onChange={(e) => onBrightnessChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                  <button
                    onClick={() => onBrightnessChange(75)}
                    className="hover:text-white px-1.5 py-0.5 rounded bg-slate-700/60"
                  >
                    কম (৭৫%)
                  </button>
                  <button
                    onClick={() => onBrightnessChange(100)}
                    className="hover:text-white px-1.5 py-0.5 rounded bg-slate-700/60 font-bold text-sky-400"
                  >
                    স্বাভাবিক (১০০%)
                  </button>
                  <button
                    onClick={() => onBrightnessChange(125)}
                    className="hover:text-white px-1.5 py-0.5 rounded bg-slate-700/60"
                  >
                    বেশি (১২৫%)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Install Action with Google Play branding */}
          <button
            onClick={onDownloadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/60 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="গুগল প্লে স্টোর ও সরাসরি APK ডাউনলোড"
          >
            <GooglePlayIcon className="w-3.5 h-3.5 shrink-0" />
            <span>প্লে স্টোর ডাউনলোড</span>
          </button>

          {/* Admin shortcut */}
          {isAdmin && (
            <button
              onClick={onAdminClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">এডমিন</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
