import React from 'react';
import { Film, Sparkles, CheckCircle2, HardDrive, Database, Crown, User, Key, Mail } from 'lucide-react';
import { UserAccount } from '../types';

interface HeaderProps {
  onSelectSampleIdea: (idea: string) => void;
  lastSavedTime?: string | null;
  isAutoSaved?: boolean;
  onOpenStorageManager?: () => void;
  currentUser?: UserAccount;
  onOpenSubscriptionModal?: () => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSampleIdea,
  lastSavedTime,
  isAutoSaved = true,
  onOpenStorageManager,
  currentUser,
  onOpenSubscriptionModal,
  onOpenAuthModal,
}) => {
  const sampleIdeas = [
    {
      label: '🌱 Phi hành gia nhí',
      text: 'Một cậu bé 10 tuổi tên Leo mặc bộ đồ phi hành gia công nghệ cao màu xanh rêu phát sáng neon, đeo ba lô phản lực, khám phá hành tinh thực vật phát sáng kỳ bí có các sinh vật pha lê bay lượn.',
    },
    {
      label: '🐉 Huyền sử Lạc Long Quân',
      text: 'Lạc Long Quân với dáng vẻ anh minh, phong thái thần vương uy nghi, tay cầm linh kiếm chống lại quái vật biển Đông và bảo vệ ngư dân ven biển bình yên.',
    },
    {
      label: '☕ Tiệm cà phê phố cổ Hà Nội',
      text: 'Một cô gái Việt Nam duyên dáng mặc áo dài cách tân màu kem hoa sen, làm việc pha cà phê phin bên khung cửa sổ mùa thu Hà Nội, ngắm phố lá vàng rơi.',
    },
  ];

  return (
    <header className="bg-[#0b1710]/95 border-b border-[#1b3826] text-white shadow-xl sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-green-600 to-lime-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-100 via-green-200 to-lime-300 bg-clip-text text-transparent">
                AutoVideo Batch Studio
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Veo 3.1 & Omni
              </span>
            </div>
            <p className="text-xs text-emerald-400/80 hidden sm:block">
              Tạo Video & Hình Ảnh Tự Động Hàng Loạt • Đồng Bộ Nhân Vật Nhất Quán 100 Phân Cảnh
            </p>
          </div>
        </div>

        {/* Right Section: Auto-save status & Quick Sample Presets */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Auto-save indicator & Storage Manager badge */}
          {isAutoSaved && (
            <button
              type="button"
              onClick={onOpenStorageManager}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12261b] hover:bg-[#1a3827] border border-emerald-500/30 hover:border-emerald-500/70 text-emerald-300 text-[11px] font-mono shadow-inner transition-all cursor-pointer group"
              title="Nhấp để xem chi tiết bộ nhớ LocalStorage và Dọn dẹp cache (Clear Cache)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <HardDrive className="w-3 h-3 text-emerald-400 ml-0.5 group-hover:scale-110 transition-transform" />
              <span>Tự động lưu:</span>
              <span className="text-lime-300 font-semibold">
                {lastSavedTime || 'Đã lưu'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 group-hover:bg-emerald-800 transition-colors">
                Bộ nhớ ⚙️
              </span>
            </button>
          )}

          {/* Gmail Account & API Key Button */}
          {currentUser && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm group ${
                currentUser.apiKey
                  ? 'bg-emerald-950/90 border-emerald-500/70 hover:border-lime-400 text-lime-200'
                  : 'bg-[#152416] border-amber-500/50 hover:border-amber-400 text-amber-200'
              }`}
              title="Đăng nhập Gmail & Cấu hình Gemini API Key tự động"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-600 to-lime-500 flex items-center justify-center font-bold text-[10px] text-white">
                <Mail className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-mono hidden md:inline truncate max-w-[130px]">
                {currentUser.email}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                  currentUser.apiKey
                    ? 'bg-emerald-900/90 text-lime-300 border border-emerald-500/50'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                }`}
              >
                <Key className="w-2.5 h-2.5" />
                {currentUser.apiKey ? 'API Riêng' : 'API Mặc Định'}
              </span>
            </button>
          )}

          {/* User Subscription Tier Badge */}
          {currentUser && (
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#13281c] hover:bg-[#1c3a2a] border border-[#234d33] hover:border-lime-500/60 transition-all cursor-pointer shadow-sm group"
              title="Nhấp để xem thông tin tài khoản và nâng cấp gói đăng ký (Free, Pro, VIP)"
            >
              {/* Avatar circle */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-600 to-lime-500 flex items-center justify-center font-bold text-[10px] text-white">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'N'}
              </div>

              {/* Tier badge (similar to Google Flow PRO badge) */}
              <span
                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider shadow-sm ${
                  currentUser.subscription.tier === 'vip'
                    ? 'bg-gradient-to-r from-amber-500 to-lime-400 text-black font-black'
                    : currentUser.subscription.tier === 'pro'
                    ? 'bg-emerald-500 text-black font-black'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {currentUser.subscription.tier.toUpperCase()}
              </span>

              <span className="text-xs text-emerald-200 font-medium hidden sm:inline group-hover:text-white transition-colors">
                {currentUser.displayName}
              </span>
            </button>
          )}

          {/* Quick Sample Presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-emerald-400/90 hidden lg:inline flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
              Mẫu ý tưởng:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sampleIdeas.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSampleIdea(sample.text)}
                  className="px-2.5 py-1 rounded-lg bg-[#12261b] hover:bg-[#1a3827] border border-[#1e402b] hover:border-emerald-500/60 text-emerald-200 hover:text-white transition-all duration-150 cursor-pointer text-xs"
                  title="Nhấp để điền ý tưởng mẫu này"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
