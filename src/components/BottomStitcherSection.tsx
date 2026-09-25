import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Package,
  Layers,
  FileText,
  FileCode,
  Upload,
  Loader2,
  CheckCircle2,
  Music,
  Sparkles,
  Type,
  Sliders,
  Copy,
  Check,
  Subtitles,
  Palette,
  X,
} from 'lucide-react';
import { Scene, StudioConfig, TransitionEffect, SubtitleConfig } from '../types';
import { stitchAllReadyVideos, downloadProjectBatchZip } from '../services/videoGenerator';
import {
  downloadSrtFile,
  generateSrtContent,
  DEFAULT_SUBTITLE_CONFIG,
  SUBTITLE_FONTS,
  SUBTITLE_COLORS,
  SUBTITLE_BG_STYLES,
} from '../services/subtitleService';

interface BottomStitcherSectionProps {
  scenes: Scene[];
  projectTitle: string;
  projectSummary: string;
  characterProfile: any;
  aspectRatio: string;
  idea?: string;
  characterSeed?: string;
  config?: StudioConfig;
  onImportProject?: (projectData: any) => void;
}

export const BottomStitcherSection: React.FC<BottomStitcherSectionProps> = ({
  scenes,
  projectTitle,
  projectSummary,
  characterProfile,
  aspectRatio,
  idea,
  characterSeed,
  config,
  onImportProject,
}) => {
  const readyScenes = scenes.filter((s) => s.videoUrl || s.imageUrl);
  const totalCount = scenes.length;

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [isStitching, setIsStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [masterVideoUrl, setMasterVideoUrl] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [transitionEffect, setTransitionEffect] = useState<TransitionEffect>('crossfade');
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>(DEFAULT_SUBTITLE_CONFIG);
  const [showSrtModal, setShowSrtModal] = useState<boolean>(false);
  const [copiedSrt, setCopiedSrt] = useState<boolean>(false);

  const transitionOptions: {
    id: TransitionEffect;
    label: string;
    desc: string;
    icon: string;
  }[] = [
    {
      id: 'crossfade',
      label: 'Hòa tan (Crossfade)',
      desc: 'Chuyển cảnh mượt mà, tự nhiên',
      icon: '✨',
    },
    {
      id: 'fade_black',
      label: 'Mờ đen (Fade Black)',
      desc: 'Phong cách điện ảnh sâu lắng',
      icon: '🎬',
    },
    {
      id: 'wipe_left',
      label: 'Trượt ngang (Slide Wipe)',
      desc: 'Dứt khoát, hiện đại',
      icon: '➡️',
    },
    {
      id: 'zoom_push',
      label: 'Đẩy cảnh (Push Zoom)',
      desc: 'Thu phóng khung hình kịch tính',
      icon: '🔍',
    },
    {
      id: 'flash_white',
      label: 'Lóe sáng (Flash White)',
      desc: 'Hào quang lóe sáng ấn tượng',
      icon: '⚡',
    },
    {
      id: 'none',
      label: 'Cắt trực tiếp (Cut)',
      desc: 'Không sử dụng hiệu ứng',
      icon: '✂️',
    },
  ];

  const videoRef = useRef<HTMLVideoElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const activeScene = readyScenes[currentSceneIndex] || scenes[0];

  // Auto-advance continuous player
  useEffect(() => {
    if (!isPlayingSequence) {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
      return;
    }

    // Play synced background music if configured
    if (config?.bgMusicUrl) {
      if (!bgAudioRef.current) {
        bgAudioRef.current = new Audio(config.bgMusicUrl);
        bgAudioRef.current.loop = true;
      } else if (bgAudioRef.current.src !== config.bgMusicUrl) {
        bgAudioRef.current.src = config.bgMusicUrl;
      }
      bgAudioRef.current.volume = config.bgMusicVolume ?? 0.35;
      bgAudioRef.current.play().catch(() => {});
    }

    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      if (currentSceneIndex < readyScenes.length - 1) {
        setCurrentSceneIndex((prev) => prev + 1);
      } else {
        // finished sequence
        setIsPlayingSequence(false);
        setCurrentSceneIndex(0);
        if (bgAudioRef.current) {
          bgAudioRef.current.pause();
        }
      }
    };

    v.addEventListener('ended', handleEnded);
    v.play().catch(() => {});
    return () => {
      v.removeEventListener('ended', handleEnded);
    };
  }, [isPlayingSequence, currentSceneIndex, readyScenes.length, config?.bgMusicUrl, config?.bgMusicVolume]);

  const toggleSequencePlay = () => {
    if (readyScenes.length === 0) return;
    if (isPlayingSequence) {
      videoRef.current?.pause();
      setIsPlayingSequence(false);
    } else {
      setIsPlayingSequence(true);
      videoRef.current?.play().catch(() => {});
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < readyScenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1);
    }
  };

  // Stitch all ready scenes into single master video
  const handleStitchAllVideos = async () => {
    if (readyScenes.length === 0) return;
    try {
      setIsStitching(true);
      setStitchProgress({ current: 0, total: readyScenes.length });

      const combinedBlob = await stitchAllReadyVideos(
        scenes,
        aspectRatio,
        (curr, tot) => {
          setStitchProgress({ current: curr, total: tot });
        },
        config?.bgMusicUrl
          ? {
              url: config.bgMusicUrl,
              volume: config.bgMusicVolume ?? 0.35,
            }
          : undefined,
        transitionEffect,
        subtitleConfig
      );

      const url = URL.createObjectURL(combinedBlob);
      setMasterVideoUrl(url);

      // Trigger auto download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(projectTitle || 'Master_Video').replace(/\s+/g, '_')}_Ghep_Hoan_Chinh.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Lỗi khi ghép video:', err);
      alert('Lỗi ghép video: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setIsStitching(false);
      setStitchProgress(null);
    }
  };

  // Export full ZIP
  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      await downloadProjectBatchZip(
        projectTitle || 'Du_An_Video_AI',
        scenes,
        projectSummary,
        characterProfile
      );
    } catch (err: any) {
      console.error('Lỗi đóng gói zip:', err);
      alert('Lỗi xuất ZIP: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setIsExportingZip(false);
    }
  };

  // Export full JSON project & config
  const handleExportProjectJson = () => {
    const exportData = {
      version: '1.0',
      app: 'AutoVideo Batch Studio',
      exportedAt: new Date().toISOString(),
      projectTitle: projectTitle || 'Du_An_Video_AI',
      projectSummary: projectSummary || '',
      idea: idea || '',
      characterSeed: characterSeed || '',
      config: config || {
        aspectRatio,
        sceneCount: scenes.length,
      },
      characterProfile,
      totalScenes: scenes.length,
      scenes,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Kich_Ban_${(projectTitle || 'Du_An_Video').replace(/\s+/g, '_')}_Config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Import JSON project file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        onImportProject?.(parsed);
      } catch (err: any) {
        alert('Tệp JSON không hợp lệ: ' + (err.message || 'Lỗi đọc tệp'));
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  // Export text script
  const handleExportScriptTxt = () => {
    let doc = `=== ${projectTitle.toUpperCase()} ===\n`;
    doc += `Tóm tắt: ${projectSummary}\n`;
    doc += `Nhân vật chính: ${characterProfile?.name} - ${characterProfile?.appearance} | ${characterProfile?.clothing}\n\n`;
    scenes.forEach((s) => {
      doc += `--- CẢNH ${s.sceneNumber}: ${s.title} (${s.duration}) ---\n`;
      doc += `Lời thoại: ${s.dialogue || '(Không có)'}\n`;
      doc += `Prompt Ảnh: ${s.imagePrompt}\n`;
      doc += `Prompt Video: ${s.videoPrompt}\n`;
      doc += `Góc máy: ${s.cameraMovement || 'N/A'}\n\n`;
    });

    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Kich_Ban_${(projectTitle || 'Video').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-[#0f1f16]/90 border border-[#1e3d2b] rounded-2xl p-5 shadow-2xl mt-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1b3827]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-lime-600 flex items-center justify-center shadow-lg">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-2">
              Khung Lưu Các Video Tạo Ra & Ghép Lại Để Tải Xuống
            </h3>
            <p className="text-xs text-emerald-400/80">
              Trình phát chuỗi liền mạch • Ghép {readyScenes.length}/{totalCount} cảnh thành 1 video Master duy nhất
            </p>
            {config?.bgMusicUrl && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-lime-300 font-medium">
                <Music className="w-3 h-3 text-lime-400 shrink-0" />
                <span>
                  Nhạc nền lồng ghép:{' '}
                  <strong className="text-white">{config.bgMusicName || 'Đã chọn'}</strong> (Âm lượng:{' '}
                  {Math.round((config.bgMusicVolume ?? 0.35) * 100)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Nút Ghép Toàn Bộ Video */}
          <button
            type="button"
            disabled={readyScenes.length === 0 || isStitching}
            onClick={handleStitchAllVideos}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-40"
            title="Ghép toàn bộ các cảnh đã tạo thành 1 video hoàn chỉnh dài và tải về"
          >
            {isStitching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Đang Ghép ({stitchProgress?.current}/{stitchProgress?.total})...
                </span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>GHÉP TOÀN BỘ VIDEO & TẢI XUỐNG</span>
              </>
            )}
          </button>

          {/* Nút Tải Toàn Bộ Gói (ZIP) */}
          <button
            type="button"
            disabled={readyScenes.length === 0 || isExportingZip}
            onClick={handleExportZip}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14291e] hover:bg-[#1e3c2c] border border-[#234b34] text-emerald-200 hover:text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-40"
            title="Đóng gói toàn bộ file ảnh, video, kịch bản JSON/TXT vào file ZIP"
          >
            {isExportingZip ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Package className="w-4 h-4 text-lime-400" />
            )}
            <span>TẢI TẤT CẢ (ZIP)</span>
          </button>

          {/* Nút Xuất Toàn Bộ Dự Án & Cấu Hình JSON */}
          <button
            type="button"
            disabled={scenes.length === 0}
            onClick={handleExportProjectJson}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-lime-950/80 hover:bg-lime-900 border border-lime-700/70 text-lime-200 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-sm"
            title="Xuất toàn bộ kịch bản và cấu hình dự án ra tệp JSON để lưu trữ hoặc tái sử dụng"
          >
            <FileCode className="w-4 h-4 text-lime-400" />
            <span>XUẤT DỰ ÁN (JSON)</span>
          </button>

          {/* Nút Nhập Lại Dự Án JSON */}
          <div>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#14291e] hover:bg-[#1e3c2c] border border-[#234b34] text-emerald-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              title="Tải tệp JSON dự án đã lưu lên để khôi phục và tái sử dụng"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>NHẬP DỰ ÁN (JSON)</span>
            </button>
          </div>

          {/* Nút Xuất Kịch Bản TXT */}
          <button
            type="button"
            disabled={scenes.length === 0}
            onClick={handleExportScriptTxt}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#14291e]/80 hover:bg-[#1e3c2c] border border-[#234b34] text-emerald-300 hover:text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-40"
            title="Tải văn bản kịch bản phân cảnh"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Kịch Bản TXT</span>
          </button>

          {/* Nút Tải Phụ Đề Chuẩn SRT */}
          <button
            type="button"
            disabled={scenes.length === 0}
            onClick={() => downloadSrtFile(scenes, projectTitle)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-100 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-sm"
            title="Tải file phụ đề chuẩn .SRT tự động tính khớp timeline từng cảnh"
          >
            <Subtitles className="w-4 h-4 text-lime-400" />
            <span>TẢI PHỤ ĐỀ (.SRT)</span>
          </button>

          {/* Nút Xem & Sao Chép SRT */}
          <button
            type="button"
            disabled={scenes.length === 0}
            onClick={() => setShowSrtModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#14291e]/80 hover:bg-[#1e3c2c] border border-[#234b34] text-emerald-300 hover:text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-40"
            title="Xem trước nội dung phụ đề .SRT và sao chép nhanh"
          >
            <Copy className="w-4 h-4 text-lime-400" />
            <span>Xem .SRT</span>
          </button>
        </div>
      </div>

      {readyScenes.length === 0 ? (
        <div className="py-12 text-center text-emerald-700">
          <Film className="w-12 h-12 stroke-[1.2] mx-auto text-[#1d3d2a] mb-2" />
          <p className="text-sm font-semibold text-emerald-300">Chưa có video hoặc ảnh nào sẵn sàng để ghép</p>
          <p className="text-xs text-emerald-600 mt-1">
            Hãy tạo các cảnh ở bảng phân cảnh phía trên để hiển thị timeline và tính năng ghép chuỗi tự động.
          </p>
        </div>
      ) : (
        <>
          {/* BỘ CHỌN HIỆU ỨNG CHUYỂN CẢNH (TRANSITIONS) */}
          <div className="mt-4 p-4 bg-[#09150e] border border-[#1b3b27] rounded-xl shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2 border-b border-[#142d1e]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
                  Hiệu Ứng Chuyển Cảnh Giữa Các Đoạn Video (Transition Effects)
                </span>
                <span className="text-[11px] text-emerald-400/80 hidden sm:inline">
                  • Áp dụng mượt mà khi ghép nối các phân cảnh thành video Master
                </span>
              </div>
              <span className="text-[11px] font-mono text-lime-300 font-bold px-2 py-0.5 rounded bg-lime-950/80 border border-lime-800/60">
                Đang chọn: {transitionOptions.find((t) => t.id === transitionEffect)?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {transitionOptions.map((opt) => {
                const isSelected = transitionEffect === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTransitionEffect(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-600/30 border-lime-400 text-white ring-1 ring-lime-400 shadow-md'
                        : 'bg-[#061009] hover:bg-[#102417] border-[#183623] text-emerald-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-base">{opt.icon}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-lime-400 shadow-sm"></span>
                      )}
                    </div>
                    <span className="text-xs font-bold truncate mb-0.5">{opt.label}</span>
                    <span className="text-[9px] text-emerald-400/80 line-clamp-1">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BỘ TÙY CHỈNH PHỤ ĐỀ VIDEO (SUBTITLE CUSTOMIZER & SRT) */}
          <div className="mt-3.5 p-4 bg-[#09150e] border border-[#1b3b27] rounded-xl shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-[#142d1e]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Subtitles className="w-4 h-4 text-lime-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
                    Tùy Chỉnh Phụ Đề Hiển Thị Trên Video & File .SRT
                  </span>
                  <p className="text-[11px] text-emerald-400/80">
                    Tự động đồng bộ với lời thoại phân cảnh • Tùy chỉnh font, vị trí, kích thước và màu sắc
                  </p>
                </div>
              </div>

              {/* Toggle Subtitles On/Off */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-300 font-medium">Bật phụ đề:</span>
                <button
                  type="button"
                  onClick={() => setSubtitleConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    subtitleConfig.enabled ? 'bg-emerald-600 justify-end' : 'bg-[#152e20] justify-start'
                  }`}
                  title={subtitleConfig.enabled ? 'Tắt phụ đề' : 'Bật phụ đề'}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {subtitleConfig.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Vị Trí Phụ Đề */}
                <div className="bg-[#050d08] p-3 rounded-xl border border-[#142d1e]">
                  <label className="text-[11px] font-bold text-emerald-300 mb-2 block flex items-center gap-1">
                    <span>📍 Vị Trí Hiển Thị</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'bottom', label: 'Dưới Cùng' },
                        { id: 'center', label: 'Ở Giữa' },
                        { id: 'top', label: 'Trên Cùng' },
                      ] as const
                    ).map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setSubtitleConfig((prev) => ({ ...prev, position: pos.id }))}
                        className={`py-1.5 px-1 rounded-lg text-center font-medium transition-all cursor-pointer border text-[11px] ${
                          subtitleConfig.position === pos.id
                            ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                            : 'bg-[#0a1810] text-emerald-400 border-[#183623] hover:text-white'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Font Chữ & Cỡ Chữ */}
                <div className="bg-[#050d08] p-3 rounded-xl border border-[#142d1e]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <span>🔤 Font & Cỡ Chữ</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[18, 24, 30].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSubtitleConfig((prev) => ({ ...prev, fontSize: size }))}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                            subtitleConfig.fontSize === size
                              ? 'bg-lime-950 text-lime-300 border-lime-500 font-bold'
                              : 'bg-[#08120c] text-emerald-500 border-[#1a3826]'
                          }`}
                          title={`Kích thước ${size}px`}
                        >
                          {size === 18 ? 'Nhỏ' : size === 24 ? 'Vừa' : 'Lớn'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <select
                    value={subtitleConfig.fontFamily}
                    onChange={(e) => setSubtitleConfig((prev) => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-full bg-[#0a1810] border border-[#1c3f2b] rounded-lg px-2.5 py-1.5 text-emerald-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {SUBTITLE_FONTS.map((f) => (
                      <option key={f.id} value={f.id} className="bg-[#0a1810] text-emerald-200">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Màu Sắc Chữ */}
                <div className="bg-[#050d08] p-3 rounded-xl border border-[#142d1e]">
                  <label className="text-[11px] font-bold text-emerald-300 mb-2 block flex items-center gap-1">
                    <span>🎨 Màu Sắc Chữ</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {SUBTITLE_COLORS.map((c) => {
                      const isSelected = subtitleConfig.textColor === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setSubtitleConfig((prev) => ({ ...prev, textColor: c.hex }))}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                            isSelected ? 'scale-125 border-white ring-2 ring-emerald-400' : 'border-black/50 hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 4. Kiểu Hộp Nền */}
                <div className="bg-[#050d08] p-3 rounded-xl border border-[#142d1e]">
                  <label className="text-[11px] font-bold text-emerald-300 mb-1.5 block flex items-center gap-1">
                    <span>📦 Kiểu Hộp Nền</span>
                  </label>
                  <select
                    value={subtitleConfig.bgColor}
                    onChange={(e) => setSubtitleConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                    className="w-full bg-[#0a1810] border border-[#1c3f2b] rounded-lg px-2.5 py-1.5 text-emerald-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {SUBTITLE_BG_STYLES.map((b) => (
                      <option key={b.val} value={b.val} className="bg-[#0a1810] text-emerald-200">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          {/* Left: Seamless Sequencer Player (Col 7) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#08120c] border border-[#1e3d2b] rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-100">
                  Trình Chiếu Nối Tiếp: Cảnh {activeScene?.sceneNumber || 1} / {readyScenes.length}
                </span>
              </div>
              <span className="text-xs text-lime-300 font-mono">
                {activeScene?.title || ''}
              </span>
            </div>

            {/* Video Player Display */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[#1c3827] flex items-center justify-center group shadow-2xl">
              {activeScene?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={activeScene.videoUrl}
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : activeScene?.imageUrl ? (
                <img
                  src={activeScene.imageUrl}
                  alt={activeScene.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-emerald-700 text-xs">Cảnh chưa có dữ liệu</div>
              )}

              {/* Subtitle bar with live customization */}
              {subtitleConfig.enabled && activeScene?.dialogue && (
                <div
                  style={{
                    fontFamily: subtitleConfig.fontFamily,
                    fontSize: `${Math.max(12, Math.round(subtitleConfig.fontSize * 0.65))}px`,
                    color: subtitleConfig.textColor,
                    backgroundColor: subtitleConfig.bgColor,
                    textShadow:
                      subtitleConfig.bgColor === 'rgba(0, 0, 0, 0)'
                        ? '0 0 5px #000, 0 0 3px #000, 1px 1px 2px #000'
                        : undefined,
                  }}
                  className={`absolute inset-x-4 rounded-lg p-2 text-center font-bold shadow-2xl transition-all duration-150 ${
                    subtitleConfig.position === 'top'
                      ? 'top-3'
                      : subtitleConfig.position === 'center'
                      ? 'top-1/2 -translate-y-1/2'
                      : 'bottom-3'
                  }`}
                >
                  {activeScene.dialogue}
                </div>
              )}
            </div>

            {/* Playback Controls Bar */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#183623]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevScene}
                  disabled={currentSceneIndex === 0}
                  className="p-2 rounded-lg bg-[#14291e] hover:bg-[#1e3c2c] text-emerald-300 disabled:opacity-40 cursor-pointer"
                  title="Cảnh trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleSequencePlay}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  {isPlayingSequence ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-0.5" />
                      <span>Phát toàn bộ chuỗi</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNextScene}
                  disabled={currentSceneIndex >= readyScenes.length - 1}
                  className="p-2 rounded-lg bg-[#14291e] hover:bg-[#1e3c2c] text-emerald-300 disabled:opacity-40 cursor-pointer"
                  title="Cảnh tiếp theo"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {masterVideoUrl && (
                <a
                  href={masterVideoUrl}
                  download={`${(projectTitle || 'Master_Video').replace(/\s+/g, '_')}_Combined.webm`}
                  className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1 hover:underline font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải lại video đã ghép</span>
                </a>
              )}
            </div>
          </div>

          {/* Right: Timeline Strip of All Scenes (Col 5) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#08120c] border border-[#1e3d2b] rounded-xl p-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Timeline Phân Cảnh ({readyScenes.length}/{scenes.length})
                </span>
                <span className="text-[11px] text-emerald-500">Nhấp vào để chọn cảnh</span>
              </div>

              {/* Scrollable Timeline Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {scenes.map((scene) => {
                  const isReady = !!(scene.videoUrl || scene.imageUrl);
                  const isCurrent = readyScenes[currentSceneIndex]?.id === scene.id;

                  return (
                    <div
                      key={scene.id}
                      onClick={() => {
                        const targetIdx = readyScenes.findIndex((s) => s.id === scene.id);
                        if (targetIdx !== -1) {
                          setCurrentSceneIndex(targetIdx);
                        }
                      }}
                      className={`relative rounded-lg overflow-hidden border p-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-950/60 ring-2 ring-emerald-500/50 shadow-md'
                          : isReady
                          ? 'border-[#20452f] bg-[#0e1f15] hover:border-emerald-600'
                          : 'border-[#173022] bg-[#070e0a] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="aspect-video rounded bg-black overflow-hidden relative mb-1.5">
                        {scene.imageUrl ? (
                          <img
                            src={scene.imageUrl}
                            alt={scene.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-800 text-[10px]">
                            Chưa có ảnh
                          </div>
                        )}

                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] font-bold">
                          #{scene.sceneNumber}
                        </span>

                        {scene.videoUrl && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-bold">
                            VID
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-semibold text-emerald-200 truncate">
                        {scene.title}
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center justify-between mt-0.5">
                        <span>{scene.duration}</span>
                        {isReady ? (
                          <span className="text-lime-400 text-[10px] flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[10px]">Chờ tạo</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Character Sync Overview pill at bottom */}
            <div className="mt-4 pt-3 border-t border-[#183623] text-[11px] text-emerald-300 bg-[#0e2217] p-2.5 rounded-lg border border-[#1f452f] flex items-center justify-between">
              <span className="truncate">
                🎭 <strong>Nhân vật:</strong> {characterProfile?.name || 'Đồng Bộ'} • {characterProfile?.clothing || 'Chuẩn'}
              </span>
              <span className="shrink-0 text-lime-400 font-semibold ml-2">✓ Nhất quán 100%</span>
            </div>
          </div>
        </div>
      </>
    )}

      {/* SRT Preview & Copy Modal */}
      {showSrtModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1710] border border-[#1f452f] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 bg-[#102419] border-b border-[#1b3d29] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/30 text-lime-400 border border-emerald-500/40">
                  <Subtitles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Nội Dung Phụ Đề Chuẩn .SRT
                  </h3>
                  <p className="text-xs text-emerald-400">
                    Đồng bộ chính xác timestamp từng giây theo kịch bản {scenes.length} phân cảnh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSrtModal(false)}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#1a3826] transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: SRT Text Display */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-lime-200 bg-[#050c07] leading-relaxed whitespace-pre select-all">
              {generateSrtContent(scenes)}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-[#102419] border-t border-[#1b3d29] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-emerald-400/80">
                Chuẩn UTF-8 tương thích CapCut, Premiere, DaVinci, YouTube
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generateSrtContent(scenes));
                    setCopiedSrt(true);
                    setTimeout(() => setCopiedSrt(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#173322] hover:bg-[#20452f] text-emerald-200 text-xs font-semibold border border-[#275338] transition-all cursor-pointer"
                >
                  {copiedSrt ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSrt ? 'Đã Sao Chép!' : 'Sao Chép'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadSrtFile(scenes, projectTitle);
                    setShowSrtModal(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Tệp .SRT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
