import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Zap,
  Sparkles,
  ShieldCheck,
  X,
  User,
  Mail,
  Flame,
  Check,
} from 'lucide-react';
import { MembershipTier, UserAccount } from '../types';
import { TIER_CONFIGS } from '../services/authService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSelectTier: (tier: MembershipTier) => void;
  onUpdateProfile: (email: string, displayName: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectTier,
  onUpdateProfile,
}) => {
  const [email, setEmail] = useState(currentUser.email);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(email, displayName);
    setIsEditingProfile(false);
    setSuccessToast('Đã cập nhật thông tin tài khoản thành công!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleChooseTier = (tier: MembershipTier) => {
    onSelectTier(tier);
    setSuccessToast(`Đã chuyển đổi sang ${TIER_CONFIGS[tier].tierName} thành công!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const plans = [
    {
      id: 'free' as MembershipTier,
      name: 'GÓI FREE',
      subtext: 'Trải nghiệm cá nhân',
      price: '0 VNĐ',
      period: 'mãi mãi',
      badge: null,
      maxScenes: '10 phân cảnh',
      resolution: '720p HD',
      dailyLimit: '20 lượt tạo/ngày',
      watermark: 'Có đóng dấu watermark',
      priority: 'Bình thường',
      color: 'border-[#1b3d28] bg-[#0c1a11]',
      btnClass: 'bg-[#152e1f] hover:bg-[#1e422c] text-emerald-300 border border-[#27563a]',
    },
    {
      id: 'pro' as MembershipTier,
      name: 'GÓI PRO',
      subtext: 'Nhà sáng tạo nội dung',
      price: '299.000đ',
      period: '/ tháng',
      badge: 'Phổ biến nhất',
      maxScenes: '40 phân cảnh',
      resolution: '1080p Full HD',
      dailyLimit: '300 lượt tạo/ngày',
      watermark: 'Không watermark',
      priority: 'Ưu tiên cao',
      color: 'border-emerald-500/70 bg-[#0d2617] ring-1 ring-emerald-500/40',
      btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950',
    },
    {
      id: 'vip' as MembershipTier,
      name: 'GÓI VIP STUDIO',
      subtext: 'Dành cho Studio làm 100 cảnh',
      price: '699.000đ',
      period: '/ tháng',
      badge: 'Tối thượng 100 cảnh',
      maxScenes: '100 phân cảnh trọn vẹn',
      resolution: '4K Ultra Cinema',
      dailyLimit: 'Không giới hạn lượt tạo',
      watermark: 'Không watermark + Bản quyền riêng',
      priority: 'Hàng đợi siêu tốc (VIP Priority)',
      color: 'border-lime-500/80 bg-[#122815] ring-2 ring-lime-400/50 shadow-xl shadow-lime-950/40',
      btnClass: 'bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400 text-white font-extrabold shadow-lg',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#09150e] border border-[#1e442d] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1b3b27] bg-[#0c1f13] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-lime-500 text-white shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-emerald-100">
                  Quản Lý Tài Khoản & Gói Đăng Ký Hội Viên
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-500/40 uppercase">
                  {currentUser.subscription.tier.toUpperCase()} MEMBER
                </span>
              </div>
              <p className="text-xs text-emerald-400/80">
                Tài khoản: <strong className="text-lime-200">{currentUser.email}</strong> • Cho phép làm dự án phim lên đến 100 phân cảnh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400/70 hover:text-white hover:bg-[#163622] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-moss-scrollbar">
          {/* Notification Toast */}
          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* User Profile Mini Bar */}
          <div className="p-4 rounded-xl bg-[#0d2215] border border-[#1f472e] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700/60 border border-emerald-500/50 flex items-center justify-center font-bold text-sm text-lime-200 uppercase">
                {currentUser.displayName.slice(0, 2) || 'US'}
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  {currentUser.displayName}
                </p>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-emerald-500" />
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-3 py-1.5 rounded-lg bg-[#142d1e] hover:bg-[#1d422c] border border-[#234d32] text-xs text-emerald-200 cursor-pointer"
              >
                {isEditingProfile ? 'Hủy sửa' : 'Đổi thông tin'}
              </button>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditingProfile && (
            <form onSubmit={handleSaveProfile} className="p-4 rounded-xl bg-[#08150d] border border-[#1b3d27] space-y-3">
              <h4 className="text-xs font-bold text-emerald-300">Cập nhật thông tin tài khoản:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-emerald-400 mb-1">Tên hiển thị:</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#0d2215] border border-[#1f472e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400 mb-1">Email đăng nhập:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0d2215] border border-[#1f472e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* Pricing Tier Grid */}
          <div>
            <h3 className="text-sm font-bold text-emerald-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              Chọn gói đăng ký hội viên phù hợp với nhu cầu:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isCurrent = currentUser.subscription.tier === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 ${plan.color}`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 text-black text-[10px] font-extrabold uppercase shadow-md tracking-wider">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-black text-emerald-100 tracking-wide">
                          {plan.name}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 text-[10px] font-bold border border-lime-500/50">
                            Đang dùng
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-400 mb-4">{plan.subtext}</p>

                      <div className="mb-4">
                        <span className="text-2xl font-black text-white">{plan.price}</span>
                        <span className="text-xs text-emerald-400/80 ml-1">{plan.period}</span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 text-xs text-emerald-200/90 border-t border-[#183a25] pt-3 mb-6">
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                          <span className="font-semibold text-white">{plan.maxScenes}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                          <span>Độ phân giải: <strong>{plan.resolution}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                          <span>{plan.dailyLimit}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                          <span>{plan.watermark}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                          <span>{plan.priority}</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleChooseTier(plan.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default flex items-center justify-center gap-1.5 ${plan.btnClass}`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-lime-300" />
                          <span>Gói Hiện Tại</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Kích Hoạt Gói Này</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1b3b27] bg-[#0c1f13] flex items-center justify-between text-xs text-emerald-400">
          <span>Hỗ trợ thanh toán tự động qua Momo, Chuyển khoản ngân hàng & Thẻ Quốc tế.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#142d1e] hover:bg-[#1a3827] border border-[#214930] text-emerald-200 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
