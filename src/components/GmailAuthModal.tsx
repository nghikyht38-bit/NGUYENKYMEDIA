import React, { useState } from 'react';
import {
  X,
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  RefreshCw,
  Sparkles,
  Zap,
  Trash2,
  Users,
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  getAllSavedAccounts,
  switchOrLoginGmail,
  updateGmailApiKey,
  toggleUsePersonalApiKey,
  validateApiKeyWithServer,
} from '../services/authService';

interface GmailAuthModalProps {
  currentUser: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: UserAccount) => void;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  if (!isOpen) return null;

  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(currentUser.apiKey || '');
  const [showKeyText, setShowKeyText] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    valid: boolean;
    message?: string;
  }>({
    tested: !!currentUser.apiKeyTestedAt,
    valid: currentUser.apiKeyStatus === 'valid',
    message: currentUser.apiKeyStatus === 'valid' ? 'API Key đã được xác thực hoạt động tốt.' : undefined,
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const savedAccounts = getAllSavedAccounts();
  const accountList = Object.values(savedAccounts);

  // Switch or login new Gmail
  const handleLoginOrSwitch = (emailToLogin: string, nameToLogin?: string) => {
    if (!emailToLogin.trim()) return;
    const switchedUser = switchOrLoginGmail(emailToLogin, nameToLogin);
    onUserUpdated(switchedUser);
    setApiKeyInput(switchedUser.apiKey || '');
    setTestResult({
      tested: !!switchedUser.apiKeyTestedAt,
      valid: switchedUser.apiKeyStatus === 'valid',
      message: switchedUser.apiKeyStatus === 'valid' ? 'API Key đã được liên kết với Gmail này.' : undefined,
    });
    setSaveSuccessMsg(`Đã chuyển sang tài khoản Gmail: ${switchedUser.email}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Test the entered API key
  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ tested: true, valid: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' });
      return;
    }
    setIsTesting(true);
    setTestResult({ tested: false, valid: false });

    const res = await validateApiKeyWithServer(apiKeyInput.trim());
    setIsTesting(false);
    if (res.valid) {
      setTestResult({ tested: true, valid: true, message: res.message });
      // Auto save verified key
      const updated = updateGmailApiKey(currentUser.email, apiKeyInput.trim(), 'valid');
      onUserUpdated(updated);
      setSaveSuccessMsg(`Đã tự động liên kết API Key hợp lệ cho ${currentUser.email}!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } else {
      setTestResult({ tested: true, valid: false, message: res.error });
    }
  };

  // Save the API key
  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) {
      // Clear key
      const updated = updateGmailApiKey(currentUser.email, '', 'untested');
      onUserUpdated(updated);
      setTestResult({ tested: false, valid: false });
      setSaveSuccessMsg('Đã xóa API Key cá nhân. Đang sử dụng API mặc định của hệ thống.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return;
    }

    const updated = updateGmailApiKey(
      currentUser.email,
      apiKeyInput.trim(),
      testResult.valid ? 'valid' : 'untested'
    );
    onUserUpdated(updated);
    setSaveSuccessMsg(`Đã lưu API Key riêng cho Gmail: ${currentUser.email}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const hasPersonalKey = !!currentUser.apiKey && currentUser.apiKey.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1710] border border-[#1b3d29] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#102419] border-b border-[#1b3d29] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-lime-500 flex items-center justify-center text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Đăng Nhập Gmail & Tự Động Nhớ API Key
              </h3>
              <p className="text-xs text-emerald-400">
                Tự động nạp API Key riêng theo từng tài khoản Gmail khi đăng nhập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#1a3826] transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-500/50 flex items-center gap-2 text-xs text-lime-300 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-emerald-100">
          {/* Card 1: Gmail Account Status & Switcher */}
          <div className="p-4 rounded-xl bg-[#07130b] border border-[#173623] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#142e1f]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center text-black font-extrabold text-sm shadow-md">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'G'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{currentUser.displayName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-lime-300 font-semibold uppercase">
                      Đang Hoạt Động
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">{currentUser.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-300">
                  Gói: <strong>{currentUser.subscription.tierName}</strong>
                </span>
              </div>
            </div>

            {/* Quick Switch among saved Gmails */}
            {accountList.length > 1 && (
              <div className="mt-3 pt-2">
                <span className="text-[11px] text-emerald-400 font-semibold block mb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-lime-400" />
                  Chuyển nhanh tài khoản Gmail đã lưu trên máy:
                </span>
                <div className="flex flex-wrap gap-2">
                  {accountList.map((acc) => {
                    const isCurrent = acc.email.toLowerCase() === currentUser.email.toLowerCase();
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleLoginOrSwitch(acc.email, acc.displayName)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                            : 'bg-[#0d2215] text-emerald-300 border-[#1f4a2f] hover:bg-[#153621] hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-lime-400"></span>
                        <span className="font-mono">{acc.email}</span>
                        {acc.apiKey ? (
                          <span className="text-[9px] px-1 rounded bg-emerald-950 text-lime-300 border border-emerald-700">
                            Có Key
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add or Login with New Gmail */}
            <div className="mt-3 pt-3 border-t border-[#132d1e]">
              <span className="text-[11px] text-emerald-300 font-semibold block mb-2 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                Đăng nhập hoặc thêm Gmail mới:
              </span>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="Nhập địa chỉ Gmail (ví dụ: khachhang@gmail.com)..."
                  className="flex-1 bg-[#050c07] border border-[#1b3f2a] rounded-lg px-3 py-2 text-xs text-white placeholder-emerald-700 focus:outline-none focus:border-emerald-400"
                />
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Tên đại diện (tùy chọn)..."
                  className="w-full sm:w-44 bg-[#050c07] border border-[#1b3f2a] rounded-lg px-3 py-2 text-xs text-white placeholder-emerald-700 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  disabled={!inputEmail.trim()}
                  onClick={() => {
                    handleLoginOrSwitch(inputEmail, inputName);
                    setInputEmail('');
                    setInputName('');
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  Đăng Nhập
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Personal Gemini API Key Config for Current Gmail */}
          <div className="p-4 rounded-xl bg-[#07130b] border border-[#173623] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Key className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                    Liên Kết Gemini API Key Riêng
                  </h4>
                  <p className="text-[11px] text-emerald-400">
                    Gán API Key này cho tài khoản: <strong className="text-lime-300 font-mono">{currentUser.email}</strong>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                {hasPersonalKey ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/60 text-lime-300 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-lime-400" />
                    Đã Gán API Riêng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#182717] border border-amber-500/40 text-amber-300 text-[10px] font-semibold">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Dùng API Hệ Thống
                  </span>
                )}
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-emerald-300 flex items-center justify-between">
                <span>Khóa API Google AI Studio (Gemini API Key):</span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lime-400 hover:text-lime-300 flex items-center gap-1 text-[11px] font-bold underline"
                >
                  <span>Lấy API Key Miễn Phí (Google AI Studio)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input
                  type={showKeyText ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setTestResult({ tested: false, valid: false });
                  }}
                  placeholder="Dán mã API Key bắt đầu bằng AIzaSy..."
                  className="w-full bg-[#050c07] border border-[#1b3f2a] rounded-xl px-3 py-2.5 pr-20 text-xs text-lime-200 font-mono focus:outline-none focus:border-emerald-400 shadow-inner"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="p-1.5 text-emerald-400 hover:text-white rounded transition-colors cursor-pointer"
                    title={showKeyText ? 'Ẩn ký tự' : 'Hiện ký tự'}
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {apiKeyInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setApiKeyInput('');
                        setTestResult({ tested: false, valid: false });
                      }}
                      className="p-1.5 text-emerald-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                      title="Xóa ô nhập"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Test Result Message */}
              {testResult.tested && (
                <div
                  className={`p-2.5 rounded-lg border flex items-start gap-2 text-[11px] ${
                    testResult.valid
                      ? 'bg-emerald-950/80 border-emerald-500 text-lime-200'
                      : 'bg-red-950/80 border-red-500 text-red-200'
                  }`}
                >
                  {testResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-tight">
                    <strong>{testResult.valid ? 'Thành công: ' : 'Lỗi kết nối: '}</strong>
                    {testResult.message}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTesting || !apiKeyInput.trim()}
                    onClick={handleTestKey}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#142f1f] hover:bg-[#1c3e29] border border-[#235034] text-emerald-200 hover:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-lime-400' : ''}`} />
                    <span>{isTesting ? 'Đang Kiểm Tra...' : 'Kiểm Tra Kết Nối (Test Key)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveKey}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lưu Cho Gmail Này</span>
                  </button>
                </div>

                {hasPersonalKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyInput('');
                      handleSaveKey();
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                  >
                    Gỡ bỏ API Key
                  </button>
                )}
              </div>
            </div>

            {/* Toggle Personal vs System Key */}
            {hasPersonalKey && (
              <div className="mt-3.5 pt-3 border-t border-[#142e1f] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-200 block">
                    Ưu tiên dùng API cá nhân của Gmail này
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    Khi tắt, hệ thống sẽ chuyển sang dùng API dùng chung.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = currentUser.usePersonalApiKey === false ? true : false;
                    const updated = toggleUsePersonalApiKey(currentUser.email, nextVal);
                    onUserUpdated(updated);
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    currentUser.usePersonalApiKey !== false ? 'bg-emerald-600 justify-end' : 'bg-[#152e20] justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Card 3: 3-Step Guide to get free API Key */}
          <div className="p-3.5 rounded-xl bg-[#06120b] border border-[#163321] text-[11px] text-emerald-300/90 leading-relaxed">
            <span className="font-bold text-white uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
              Hướng Dẫn 3 Bước Lấy API Key Miễn Phí (Google AI Studio):
            </span>
            <ol className="list-decimal list-inside space-y-1 text-emerald-400">
              <li>
                Truy cập <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-lime-300 font-bold underline">aistudio.google.com/apikey</a> và đăng nhập Gmail của bạn.
              </li>
              <li>
                Bấm nút màu xanh <strong>"Create API key"</strong> (Tạo khóa API).
              </li>
              <li>
                Sao chép mã bắt đầu bằng <code className="bg-emerald-950 px-1 py-0.5 rounded text-lime-300 font-mono">AIzaSy...</code> và dán vào ô bên trên rồi bấm <strong>"Lưu Cho Gmail Này"</strong>.
              </li>
            </ol>
            <p className="mt-2 text-[10px] text-emerald-500 italic">
              * Khóa API được lưu trữ cục bộ an toàn trên trình duyệt của bạn (LocalStorage) và gắn liền với tài khoản Gmail bạn chọn.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#102419] border-t border-[#1b3d29] flex items-center justify-between">
          <span className="text-[11px] text-emerald-400 font-mono">
            {hasPersonalKey
              ? `✅ Đang dùng API cá nhân (${currentUser.email})`
              : '⚡ Đang dùng API hệ thống AutoVideo'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#173824] hover:bg-[#204a31] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
