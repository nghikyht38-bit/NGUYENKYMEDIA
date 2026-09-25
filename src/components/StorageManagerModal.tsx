import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Database,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { Scene } from '../types';
import {
  getStorageUsage,
  clearStorageMediaCache,
  clearProjectLocalStorage,
  StorageUsageInfo,
} from '../services/storageService';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  onStorageCleared?: () => void;
  onNotification?: (msg: string) => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({
  isOpen,
  onClose,
  scenes,
  onStorageCleared,
  onNotification,
}) => {
  const [usage, setUsage] = useState<StorageUsageInfo>(getStorageUsage());
  const [cleaningStatus, setCleaningStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsage(getStorageUsage());
      setCleaningStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setUsage(getStorageUsage());
  };

  // Option 1: Clean Cache (Optimizes LocalStorage, removes heavy media strings, keeps 100% text/prompts)
  const handleCleanCache = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = clearStorageMediaCache(scenes, true);
      setUsage(result.updatedUsage);
      setIsProcessing(false);

      if (result.success) {
        const msg = `Đã dọn dẹp bộ đệm thành công! Giải phóng ${result.freedFormatted} bộ nhớ. Toàn bộ kịch bản và cấu hình 100 cảnh vẫn an toàn.`;
        setCleaningStatus(msg);
        onNotification?.(msg);
      } else {
        setCleaningStatus('Bộ đệm hiện tại đã rất nhẹ và tối ưu sẵn.');
      }
    }, 350);
  };

  // Option 2: Full reset of LocalStorage
  const handleFullReset = () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ bản lưu LocalStorage? Toàn bộ kịch bản trên máy sẽ bị đặt lại về ban đầu.'
      )
    ) {
      return;
    }

    clearProjectLocalStorage();
    setUsage(getStorageUsage());
    setCleaningStatus('Đã xóa sạch toàn bộ bản lưu trong trình duyệt.');
    onStorageCleared?.();
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'from-rose-500 to-red-600';
    if (percent >= 50) return 'from-amber-400 to-orange-500';
    return 'from-emerald-400 to-lime-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0a180f] border border-[#1e442d] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1b3b27] bg-[#0d2215] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-100 flex items-center gap-2">
                Quản Lý Bộ Nhớ & Dọn Dẹp Cache (LocalStorage)
              </h2>
              <p className="text-xs text-emerald-400/80">
                Tối ưu hóa dung lượng trình duyệt cho dự án quy mô lớn (50 - 100 phân cảnh)
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Storage Meter Card */}
          <div className="p-4 rounded-xl bg-[#0e2116] border border-[#1f472e] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Dung lượng LocalStorage đã dùng:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lime-300 text-sm">
                  {usage.usedFormatted}
                </span>
                <span className="text-emerald-500">/ ~5.0 MB ({usage.percentUsed}%)</span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-1 rounded hover:bg-[#183a25] text-emerald-400"
                  title="Cập nhật lại dung lượng"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 bg-[#07130c] rounded-full overflow-hidden border border-[#163823] p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                  usage.percentUsed
                )} transition-all duration-500`}
                style={{ width: `${Math.max(3, usage.percentUsed)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-emerald-400/80 pt-1">
              <span>Quy mô hiện tại: {scenes.length} phân cảnh</span>
              <span>Dung lượng dữ liệu dự án: {usage.projectSizeFormatted}</span>
            </div>

            {usage.hasHighUsageWarning && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/50 text-amber-200 text-xs mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Bộ nhớ trình duyệt đang vượt mức 70%. Bạn nên bấm <strong>Dọn dẹp bộ đệm</strong> bên dưới để tránh lỗi <code>QuotaExceededError</code> khi thêm ảnh/video.
                </span>
              </div>
            )}
          </div>

          {/* Explanation Callout */}
          <div className="p-3.5 rounded-xl bg-[#0b1b11] border border-[#1b3d27] text-xs text-emerald-300/90 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              <span>Cơ chế bảo vệ dữ liệu thông minh:</span>
            </div>
            <p className="leading-relaxed">
              Trình duyệt giới hạn mỗi trang web tối đa khoảng <strong>5MB</strong> lưu trữ nhanh. Khi làm kịch bản dài 50 - 100 cảnh, các chuỗi ảnh Base64 hoặc tệp tạm thời có thể làm đầy giới hạn này.
            </p>
            <p className="leading-relaxed text-emerald-300">
              Khi bạn bấm <strong>"Dọn dẹp bộ đệm"</strong>, hệ thống sẽ:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-emerald-400">
              <li>Xóa sạch các chuỗi dữ liệu ảnh Base64 cồng kềnh trong LocalStorage.</li>
              <li>Thu hồi các liên kết Blob video tạm thời để giải phóng RAM trình duyệt.</li>
              <li>
                <strong className="text-lime-300">
                  GIỮ NGUYÊN 100% kịch bản, lời thoại tiếng Việt, prompt ảnh/video, chuyển động máy quay và hồ sơ nhân vật.
                </strong>
              </li>
            </ul>
          </div>

          {/* Feedback banner */}
          {cleaningStatus && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cleaningStatus}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCleanCache}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/80 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-lime-200" />
              <span>
                {isProcessing ? 'Đang Tối Ưu Hóa & Dọn Dẹp...' : 'DỌN DẸP BỘ ĐỆM (TỐI ƯU HÓA NGAY)'}
              </span>
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-[#183824]">
              <span className="text-xs text-emerald-500">Cần làm mới hoàn toàn dự án?</span>
              <button
                type="button"
                onClick={handleFullReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950 border border-red-800/40 hover:border-red-600 text-red-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Xóa trắng toàn bộ LocalStorage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1b3b27] bg-[#0c1f13] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#142d1e] hover:bg-[#1a3827] border border-[#214930] text-emerald-200 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
