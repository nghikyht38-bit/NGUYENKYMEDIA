import React, { useRef, useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  Film,
  Image as ImageIcon,
  Loader2,
  StopCircle,
  FileCode,
  Upload,
  HardDrive,
  Calculator,
  X,
} from 'lucide-react';
import { Scene, StudioConfig } from '../types';
import { estimateProjectCost } from '../services/costEstimatorService';
import { CostEstimatorCard } from './CostEstimatorCard';

interface ActionControlsProps {
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onReset: () => void;
  scenes: Scene[];
  isBatchGeneratingImages: boolean;
  isBatchGeneratingVideos: boolean;
  onBatchGenerateImages: () => void;
  onBatchGenerateVideos: () => void;
  onStopBatch: () => void;
  batchProgressText?: string;
  onExportJson?: () => void;
  onImportJson?: (projectData: any) => void;
  onOpenStorageManager?: () => void;
  config?: StudioConfig;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  isAnalyzing,
  onAnalyze,
  onReset,
  scenes,
  isBatchGeneratingImages,
  isBatchGeneratingVideos,
  onBatchGenerateImages,
  onBatchGenerateVideos,
  onStopBatch,
  batchProgressText,
  onExportJson,
  onImportJson,
  onOpenStorageManager,
  config,
}) => {
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const readyImagesCount = scenes.filter((s) => s.imageUrl).length;
  const readyVideosCount = scenes.filter((s) => s.videoUrl).length;
  const totalCount = scenes.length;

  const isAnyBatchRunning = isBatchGeneratingImages || isBatchGeneratingVideos;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cost = config ? estimateProjectCost(config) : null;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.scenes && !parsed.config && !parsed.idea) {
          alert('Tệp JSON không đúng định dạng dự án AutoVideo Studio!');
          return;
        }
        onImportJson?.(parsed);
      } catch (err: any) {
        alert('Tệp JSON không hợp lệ: ' + (err.message || 'Lỗi đọc tệp'));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-[#0f1f16]/90 border border-[#1e3d2b] rounded-2xl p-4 shadow-xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Main Action Buttons: Phân Tích & Làm Mới */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* NÚT PHÂN TÍCH TẠO KỊCH BẢN */}
          <button
            type="button"
            disabled={isAnalyzing || isAnyBatchRunning}
            onClick={onAnalyze}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/60 hover:shadow-emerald-900/80 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang Phân Tích Kịch Bản & Đồng Bộ Nhân Vật...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-lime-200" />
                <span>PHÂN TÍCH TẠO KỊCH BẢN</span>
              </>
            )}
          </button>

          {/* NÚT LÀM MỚI NHẬP LẠI */}
          <button
            type="button"
            disabled={isAnalyzing || isAnyBatchRunning}
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#13281c] hover:bg-[#1a3827] border border-[#214530] hover:border-emerald-600 text-emerald-200 hover:text-white font-medium text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>LÀM MỚI NHẬP LẠI</span>
          </button>

          {/* NÚT XUẤT JSON DỰ ÁN */}
          {totalCount > 0 && onExportJson && (
            <button
              type="button"
              onClick={onExportJson}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-lime-950/80 hover:bg-lime-900 border border-lime-700/60 text-lime-200 hover:text-white font-bold text-xs shadow transition-all cursor-pointer"
              title="Xuất toàn bộ kịch bản và cấu hình ra file JSON để lưu trữ hoặc tái sử dụng"
            >
              <FileCode className="w-4 h-4 text-lime-400" />
              <span>XUẤT JSON</span>
            </button>
          )}

          {/* NÚT NHẬP JSON DỰ ÁN */}
          {onImportJson && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#13281c] hover:bg-[#1a3827] border border-[#214530] text-emerald-300 hover:text-white font-medium text-xs transition-all cursor-pointer"
                title="Tải lên tệp JSON dự án đã lưu để khôi phục kịch bản và cấu hình"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>NHẬP JSON</span>
              </button>
            </div>
          )}

          {/* NÚT DỌN DẸP BỘ NHỚ (CLEAR CACHE) */}
          {onOpenStorageManager && (
            <button
              type="button"
              onClick={onOpenStorageManager}
              className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-[#0f281a] hover:bg-[#163a26] border border-emerald-600/40 hover:border-emerald-500 text-emerald-200 hover:text-white font-semibold text-xs shadow transition-all cursor-pointer"
              title="Mở bảng quản lý bộ nhớ, dọn dẹp cache LocalStorage & giải phóng RAM khi làm dự án 100 cảnh"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>DỌN BỘ NHỚ</span>
            </button>
          )}
        </div>

        {/* Batch Generation Shortcuts */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Generate all images button */}
            <button
              type="button"
              disabled={isAnalyzing || isAnyBatchRunning}
              onClick={onBatchGenerateImages}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142e1f] hover:bg-[#1c3f2b] border border-[#27563a] text-emerald-200 hover:text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
              title="Tự động tạo hàng loạt ảnh cho tất cả phân cảnh theo kịch bản"
            >
              {isBatchGeneratingImages ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              )}
              <span>TẠO TẤT CẢ ẢNH ({readyImagesCount}/{totalCount})</span>
            </button>

            {/* Generate all videos button */}
            <button
              type="button"
              disabled={isAnalyzing || isAnyBatchRunning}
              onClick={onBatchGenerateVideos}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#173322] hover:bg-[#20452f] border border-[#2c5f40] text-lime-200 hover:text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
              title="Tự động tạo hàng loạt video cho tất cả phân cảnh theo kịch bản"
            >
              {isBatchGeneratingVideos ? (
                <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
              ) : (
                <Film className="w-4 h-4 text-lime-400" />
              )}
              <span>TẠO TẤT CẢ VIDEO ({readyVideosCount}/{totalCount})</span>
            </button>

            {/* Nút Xem Ước Tính API Dự Kiến */}
            {cost && (
              <button
                type="button"
                onClick={() => setIsCostModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 hover:border-amber-400 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Bấm để xem chi tiết ước tính Tokens, Credits và chi phí trước khi tạo hàng loạt"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>ƯỚC TÍNH CHI PHÍ (~{cost.totalCredits} Credits)</span>
              </button>
            )}

            {/* Stop batch button */}
            {isAnyBatchRunning && (
              <button
                type="button"
                onClick={onStopBatch}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/70 text-red-200 text-xs font-bold transition-all cursor-pointer"
              >
                <StopCircle className="w-4 h-4 text-red-400" />
                <span>DỪNG CHẠY BATCH</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Realtime Batch Progress Tracker Banner */}
      {Boolean(batchProgressText && (isAnalyzing || isAnyBatchRunning)) && (
        <div className="mt-3.5 pt-3 border-t border-[#183623] flex items-center justify-between text-xs text-emerald-300 bg-[#0c1a12] px-3 py-2 rounded-lg border border-[#1b3d27]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
            <span className="font-medium text-emerald-200">{batchProgressText}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-500">
            Hệ thống đang tự sắp xếp lượt chạy batch tối ưu
          </span>
        </div>
      )}

      {/* Modal Bảng Ước Tính Chi Phí API Chi Tiết */}
      {isCostModalOpen && config && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsCostModalOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-emerald-900 border border-emerald-500 text-emerald-200 hover:text-white flex items-center justify-center shadow-lg cursor-pointer"
              title="Đóng bảng ước tính"
            >
              <X className="w-4 h-4" />
            </button>
            <CostEstimatorCard config={config} />
          </div>
        </div>
      )}
    </div>
  );
};
