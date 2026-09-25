import React, { useState } from 'react';
import {
  Coins,
  Cpu,
  Clock,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Film,
  Image as ImageIcon,
  Mic,
  Calculator,
} from 'lucide-react';
import { StudioConfig } from '../types';
import { estimateProjectCost } from '../services/costEstimatorService';

interface CostEstimatorCardProps {
  config: StudioConfig;
  variant?: 'inline' | 'compact' | 'modal';
  onClose?: () => void;
}

export const CostEstimatorCard: React.FC<CostEstimatorCardProps> = ({
  config,
  variant = 'inline',
  onClose,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const cost = estimateProjectCost(config);

  return (
    <div className="bg-[#091710] border border-[#1b3d29] rounded-2xl p-4 shadow-xl text-emerald-100 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#142d1e]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-lime-500/20 border border-amber-500/40 text-amber-300 shadow-sm">
            <Calculator className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-2">
              Ước Tính Chi Phí API (Tokens & Credits Dự Kiến)
            </h4>
            <p className="text-[11px] text-emerald-400/80">
              Tự động tính toán theo số lượng cảnh ({cost.sceneCount} cảnh) và thời lượng ({cost.durationPerSceneSec}s/cảnh)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-lime-300 font-bold">
            Model: {cost.modelName} ({cost.modelEfficiencyTier})
          </span>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-[#102418] hover:bg-[#183624] px-2.5 py-1 rounded-lg border border-[#1d412b] transition-all cursor-pointer"
          >
            <span>{showDetails ? 'Thu Gọn' : 'Chi Tiết'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 4 Main Stat Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3.5">
        {/* Metric 1: Total Credits */}
        <div className="bg-[#050e09] border border-[#163322] rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide">Tổng Credits</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-amber-300">
            ~{cost.totalCredits}{' '}
            <span className="text-[10px] font-normal text-amber-400/80">Credits</span>
          </div>
          <div className="text-[10px] text-emerald-500 mt-1 truncate">
            {cost.imageCredits} ảnh • {cost.totalVideoCredits} video
          </div>
        </div>

        {/* Metric 2: LLM Tokens */}
        <div className="bg-[#050e09] border border-[#163322] rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide">LLM Tokens</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-cyan-300 truncate">
            {cost.formattedTokens}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1 truncate">
            Gemini 2.5 Flash / Pro kịch bản
          </div>
        </div>

        {/* Metric 3: Total Duration */}
        <div className="bg-[#050e09] border border-[#163322] rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-lime-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide">Thời Lượng Video</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-lime-300">
            {cost.formattedTotalDuration}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1 truncate">
            {cost.sceneCount} phân cảnh × {cost.durationPerSceneSec}s
          </div>
        </div>

        {/* Metric 4: Estimated USD & VND */}
        <div className="bg-[#050e09] border border-[#163322] rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide">Quy Đổi Chi Phí</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-300">
            ~{cost.formattedCostUsd}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono font-medium">
            ≈ {cost.formattedCostVnd}
          </div>
        </div>
      </div>

      {/* Expanded Breakdown Section */}
      {showDetails && (
        <div className="mt-3.5 pt-3 border-t border-[#142d1e] bg-[#06120b] p-3 rounded-xl border border-[#173824] animate-in fade-in duration-200">
          <h5 className="text-[11px] font-bold text-emerald-200 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            Chi Tiết Tiêu Thụ Từng Hạng Mục API Khi Tạo Hàng Loạt
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {/* 1. Prompt & Kịch Bản LLM */}
            <div className="p-2.5 rounded-lg bg-[#0a1b11] border border-[#183a25]">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Phân Tích Kịch Bản</span>
              </div>
              <p className="text-[11px] text-emerald-400">
                Input: ~{cost.llmInputTokens.toLocaleString()} tokens
              </p>
              <p className="text-[11px] text-emerald-400">
                Output: ~{cost.llmOutputTokens.toLocaleString()} tokens
              </p>
              <p className="text-[10px] text-emerald-500 mt-1">
                Tự động tối ưu hóa nhân vật & camera
              </p>
            </div>

            {/* 2. Hình Ảnh Keyframe */}
            <div className="p-2.5 rounded-lg bg-[#0a1b11] border border-[#183a25]">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ảnh Keyframe ({cost.sceneCount} ảnh)</span>
              </div>
              <p className="text-[11px] text-emerald-400">
                Mô hình: Imagen 3.0 High-Res
              </p>
              <p className="text-[11px] text-emerald-300 font-mono font-bold">
                Tiêu tốn: ~{cost.imageCredits} Credits
              </p>
              <p className="text-[10px] text-emerald-500 mt-1">
                Đồng bộ Seed nhân vật 100%
              </p>
            </div>

            {/* 3. Video Render (Veo) */}
            <div className="p-2.5 rounded-lg bg-[#0a1b11] border border-[#183a25]">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
                <Film className="w-3.5 h-3.5 text-lime-400" />
                <span>Video Render ({cost.sceneCount} cảnh)</span>
              </div>
              <p className="text-[11px] text-emerald-400">
                Mô hình: {cost.modelName}
              </p>
              <p className="text-[11px] text-lime-300 font-mono font-bold">
                Tiêu tốn: ~{cost.totalVideoCredits} Credits ({cost.videoCreditsPerScene}c/cảnh)
              </p>
              <p className="text-[10px] text-emerald-500 mt-1">
                Tổng cộng: {cost.formattedTotalDuration}
              </p>
            </div>

            {/* 4. Thời Gian Tạo & Giọng Nói */}
            <div className="p-2.5 rounded-lg bg-[#0a1b11] border border-[#183a25]">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tốc Độ & Thời Gian</span>
              </div>
              <p className="text-[11px] text-amber-300 font-mono font-bold">
                Ước tính: {cost.formattedTime}
              </p>
              <p className="text-[11px] text-emerald-400">
                Lời thoại AI: {cost.ttsCharacters > 0 ? `~${cost.ttsCharacters} ký tự` : 'Tắt'}
              </p>
              <p className="text-[10px] text-emerald-500 mt-1">
                Hỗ trợ chạy song song ngầm
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-400/90 bg-[#091a10] px-3 py-1.5 rounded-lg border border-[#143320]">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <span>
                <strong>Mẹo tối ưu:</strong> Bạn có thể tạo trước toàn bộ hình ảnh keyframe để duyệt nét mặt nhân vật trước khi chạy render toàn bộ video nhằm tiết kiệm tối đa credits.
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
