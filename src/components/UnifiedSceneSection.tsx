import React, { useRef, useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Film,
  ZoomIn,
  RefreshCw,
  Upload,
  Download,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Camera,
  MessageSquare,
  Play,
  Pause,
  Layers,
  Mic,
  Sliders,
  Maximize2,
  Minimize2,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  X,
  Undo2,
  Redo2,
  History,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { Scene } from '../types';
import { SceneDataGrid } from './SceneDataGrid';

export type SceneFilterType = 'all' | 'ready' | 'pending' | 'error';

interface UnifiedSceneSectionProps {
  scenes: Scene[];
  onUpdateImagePrompt: (sceneId: string, newPrompt: string) => void;
  onUpdateVideoPrompt: (sceneId: string, newPrompt: string) => void;
  onUpdateDialogue: (sceneId: string, newDialogue: string) => void;
  onUpdateVoiceToneNote?: (sceneId: string, newTone: string) => void;
  onGenerateSingleImage: (scene: Scene) => void;
  onGenerateSingleVideo: (scene: Scene) => void;
  onUploadCustomImage: (sceneId: string, file: File) => void;
  onUploadCustomVideo: (sceneId: string, file: File) => void;
  onOpenZoomModal: (imageUrl: string, title: string, prompt: string) => void;
  onOpenVideoModal: (videoUrl: string, title: string, prompt: string, dialogue?: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  pastCount?: number;
  futureCount?: number;
  historyNotice?: string | null;
}

export const UnifiedSceneSection: React.FC<UnifiedSceneSectionProps> = ({
  scenes,
  onUpdateImagePrompt,
  onUpdateVideoPrompt,
  onUpdateDialogue,
  onUpdateVoiceToneNote,
  onGenerateSingleImage,
  onGenerateSingleVideo,
  onUploadCustomImage,
  onUploadCustomVideo,
  onOpenZoomModal,
  onOpenVideoModal,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  pastCount = 0,
  futureCount = 0,
  historyNotice,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeScrollerIndex, setActiveScrollerIndex] = useState<number>(1);
  const [isExpandedFull, setIsExpandedFull] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [filterStatus, setFilterStatus] = useState<SceneFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const uploadImgRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const uploadVidRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const scenesContainerRef = useRef<HTMLDivElement | null>(null);
  const sceneRowRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = (imageUrl: string, sceneNumber: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `Canh_${String(sceneNumber).padStart(2, '0')}_HinhAnh.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadVideo = (videoUrl: string, sceneNumber: number) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `Canh_${String(sceneNumber).padStart(2, '0')}_Video.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlay = (id: string) => {
    const el = videoRefs.current[id];
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlayingId(id);
    } else {
      el.pause();
      setPlayingId(null);
    }
  };

  // Status categorization helpers
  const isSceneError = (s: Scene) =>
    s.imageStatus === 'error' || s.videoStatus === 'error' || Boolean(s.imageError) || Boolean(s.videoError);

  const isSceneReady = (s: Scene) =>
    !isSceneError(s) && Boolean(s.imageUrl || s.videoUrl || s.imageStatus === 'ready' || s.videoStatus === 'ready');

  const isScenePending = (s: Scene) =>
    !isSceneError(s) &&
    (s.imageStatus === 'generating' ||
      s.videoStatus === 'generating' ||
      (!s.imageUrl && s.imageStatus === 'idle') ||
      (!s.videoUrl && s.videoStatus === 'idle'));

  // Filter counts
  const totalCount = scenes.length;
  const errorCount = scenes.filter(isSceneError).length;
  const readyCount = scenes.filter(isSceneReady).length;
  const pendingCount = scenes.filter(isScenePending).length;

  // Filtered scenes list
  const filteredScenes = scenes.filter((scene) => {
    // 1. Status Filter
    if (filterStatus === 'ready' && !isSceneReady(scene)) return false;
    if (filterStatus === 'pending' && !isScenePending(scene)) return false;
    if (filterStatus === 'error' && !isSceneError(scene)) return false;

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber =
        `cảnh ${scene.sceneNumber}`.includes(q) ||
        `#${scene.sceneNumber}`.includes(q) ||
        String(scene.sceneNumber) === q;
      const matchTitle = scene.title?.toLowerCase().includes(q);
      const matchDialogue = scene.dialogue?.toLowerCase().includes(q);
      const matchPrompt =
        scene.imagePrompt?.toLowerCase().includes(q) ||
        scene.videoPrompt?.toLowerCase().includes(q) ||
        scene.imagePromptVi?.toLowerCase().includes(q) ||
        scene.videoPromptVi?.toLowerCase().includes(q);

      if (!matchNumber && !matchTitle && !matchDialogue && !matchPrompt) {
        return false;
      }
    }

    return true;
  });

  // Smooth scroll to scene when user drags the quick scene slider
  const handleSliderChange = (newSceneNumber: number) => {
    setActiveScrollerIndex(newSceneNumber);
    const targetEl = sceneRowRefs.current[newSceneNumber];
    if (targetEl && scenesContainerRef.current) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const readyImages = scenes.filter((s) => s.imageUrl).length;
  const readyVideos = scenes.filter((s) => s.videoUrl).length;

  return (
    <div className="bg-[#0f1f16]/90 border border-[#1e3d2b] rounded-2xl p-5 shadow-2xl mb-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1b3827] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-2">
              BẢNG ĐỐI SOÁT PHÂN CẢNH THEO HÀNG NGANG ({scenes.length} PHÂN CẢNH)
            </h3>
            <p className="text-xs text-emerald-400/80">
              Mỗi phân cảnh nằm trên 1 hàng ngang đồng bộ: Prompt Ảnh ➜ Hình Ảnh ➜ Prompt Video & Lời Thoại ➜ Video
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          {/* NÚT HOÀN TÁC (UNDO) & LÀM LẠI (REDO) */}
          {onUndo && onRedo && (
            <div className="flex items-center bg-[#09150e] border border-[#1e3d2b] rounded-lg p-0.5 shadow-inner">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  canUndo
                    ? 'bg-[#14281c] hover:bg-[#1e402c] text-emerald-200 hover:text-white border border-[#234b34] active:scale-95'
                    : 'text-emerald-800 border border-transparent cursor-not-allowed opacity-40'
                }`}
                title="Hoàn tác chỉnh sửa (Phím tắt: Ctrl + Z hoặc Cmd + Z)"
              >
                <Undo2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hoàn tác</span>
                {pastCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    {pastCount}
                  </span>
                )}
              </button>

              <div className="w-[1px] h-4 bg-[#1e3d2b] mx-0.5" />

              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  canRedo
                    ? 'bg-[#14281c] hover:bg-[#1e402c] text-lime-200 hover:text-white border border-[#234b34] active:scale-95'
                    : 'text-emerald-800 border border-transparent cursor-not-allowed opacity-40'
                }`}
                title="Làm lại thao tác vừa hoàn tác (Phím tắt: Ctrl + Y hoặc Ctrl + Shift + Z)"
              >
                <Redo2 className="w-3.5 h-3.5 text-lime-400" />
                <span>Làm lại</span>
                {futureCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-lime-950 text-lime-300 border border-lime-800 font-mono">
                    {futureCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ XEM: CARD vs DATA GRID */}
          <div className="flex items-center bg-[#09150e] border border-[#1e3d2b] rounded-lg p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-sm border border-emerald-500'
                  : 'text-emerald-400 hover:text-white hover:bg-[#14291e]'
              }`}
              title="Xem theo dạng các thẻ phân cảnh hàng ngang"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm border border-emerald-500'
                  : 'text-emerald-400 hover:text-white hover:bg-[#14291e]'
              }`}
              title="Xem dạng Bảng dữ liệu (Data Grid) tối ưu quản lý 100 cảnh"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng Bảng (Data Grid)</span>
            </button>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-[#14291e] text-emerald-300 border border-[#234b34]">
            🖼️ Ảnh: {readyImages}/{scenes.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#14291e] text-lime-300 border border-[#234b34]">
            🎬 Video: {readyVideos}/{scenes.length}
          </span>
          <button
            type="button"
            onClick={() => setIsExpandedFull(!isExpandedFull)}
            className="px-2.5 py-1 rounded-lg bg-[#14291e] hover:bg-[#1f3f2e] text-emerald-200 border border-[#234b34] flex items-center gap-1 transition-colors cursor-pointer"
            title={isExpandedFull ? 'Thu gọn khung trượt' : 'Mở rộng toàn màn hình'}
          >
            {isExpandedFull ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-lime-400" />
                <span>Khung trượt gọn</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Xem toàn bộ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Undo/Redo notification toast */}
      {historyNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-[#091f13]/95 border border-emerald-500/60 text-emerald-100 rounded-xl shadow-2xl backdrop-blur text-xs font-bold flex items-center gap-2 animate-bounce">
          <History className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{historyNotice}</span>
        </div>
      )}

      {scenes.length > 0 && (
        <>
          {/* BỘ LỌC DANH SÁCH PHÂN CẢNH (Thành công, Chờ xử lý, Có lỗi, Tìm kiếm) */}
          <div className="bg-[#112419] border border-[#1e3d2b] rounded-xl p-3 mb-3 shadow-inner flex flex-wrap items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-300 mr-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lọc phân cảnh:</span>
              </div>

              {/* Tab: Tất cả */}
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50'
                    : 'bg-[#09150e] hover:bg-[#142d1e] text-emerald-300 border-[#1d422c]'
                }`}
              >
                <span>Tất cả</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    filterStatus === 'all'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#14291e] text-emerald-400'
                  }`}
                >
                  {totalCount}
                </span>
              </button>

              {/* Tab: Đã tạo thành công */}
              <button
                type="button"
                onClick={() => setFilterStatus('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'ready'
                    ? 'bg-lime-700 text-white border-lime-500 shadow-md shadow-lime-950/50'
                    : 'bg-[#09150e] hover:bg-[#142d1e] text-lime-300 border-[#1d422c]'
                }`}
                title="Các phân cảnh đã tạo thành công ảnh hoặc video"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                <span>Đã tạo thành công</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    filterStatus === 'ready'
                      ? 'bg-lime-900 text-white'
                      : 'bg-[#14291e] text-lime-400'
                  }`}
                >
                  {readyCount}
                </span>
              </button>

              {/* Tab: Đang chờ xử lý */}
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'pending'
                    ? 'bg-amber-700 text-white border-amber-500 shadow-md shadow-amber-950/50'
                    : 'bg-[#09150e] hover:bg-[#142d1e] text-amber-300 border-[#1d422c]'
                }`}
                title="Các phân cảnh chưa tạo ảnh/video hoặc đang trong tiến trình xử lý"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Đang chờ xử lý</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    filterStatus === 'pending'
                      ? 'bg-amber-900 text-white'
                      : 'bg-[#14291e] text-amber-400'
                  }`}
                >
                  {pendingCount}
                </span>
              </button>

              {/* Tab: Có lỗi */}
              <button
                type="button"
                onClick={() => setFilterStatus('error')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'error'
                    ? 'bg-rose-700 text-white border-rose-500 shadow-md shadow-rose-950/50'
                    : errorCount > 0
                    ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800/60 animate-pulse'
                    : 'bg-[#09150e] hover:bg-[#142d1e] text-rose-300/70 border-[#1d422c]'
                }`}
                title="Các phân cảnh gặp lỗi cần thử lại hoặc kiểm tra prompt"
              >
                <AlertCircle
                  className={`w-3.5 h-3.5 ${
                    errorCount > 0 ? 'text-rose-400' : 'text-rose-400/70'
                  }`}
                />
                <span>Có lỗi</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    filterStatus === 'error'
                      ? 'bg-rose-900 text-white'
                      : errorCount > 0
                      ? 'bg-rose-900/80 text-rose-200'
                      : 'bg-[#14291e] text-rose-400/70'
                  }`}
                >
                  {errorCount}
                </span>
              </button>
            </div>

            {/* Search Input Box */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[200px]">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo cảnh (#1, lời thoại, tiêu đề)..."
                  className="w-full bg-[#08120c] border border-[#1e3c2a] rounded-lg pl-8 pr-7 py-1 text-xs text-emerald-100 placeholder-emerald-600 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {(filterStatus !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-emerald-400 hover:text-white px-2 py-1 rounded bg-[#14281c] hover:bg-[#1a3827] border border-[#1f452e] cursor-pointer whitespace-nowrap transition-colors"
                  title="Xóa bộ lọc để hiển thị toàn bộ phân cảnh"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>

          {/* THANH TRƯỢT ĐIỀU HƯỚNG NHANH PHÂN CẢNH (Dành cho danh sách lên đến 100 cảnh) */}
          <div className="bg-[#112419] border border-[#1e3d2b] rounded-xl p-3 mb-4 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-bold text-emerald-200">
                  Thanh trượt chuyển nhanh phân cảnh:
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 font-mono">
                  {filterStatus !== 'all' || searchQuery ? (
                    <>
                      Hiển thị {filteredScenes.length} / {scenes.length} cảnh
                    </>
                  ) : (
                    <>
                      Cảnh {activeScrollerIndex} / {scenes.length}
                    </>
                  )}
                </span>
              </div>

              {/* Quick Scene Jumper Shortcuts */}
              {filteredScenes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-emerald-400">Nhảy đến:</span>
                  {(filteredScenes.length <= 15
                    ? filteredScenes.map((s) => s.sceneNumber)
                    : [1, 5, 10, 25, 50, 75, 100].filter((num) =>
                        filteredScenes.some((s) => s.sceneNumber === num)
                      )
                  ).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSliderChange(num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer border transition-colors ${
                        activeScrollerIndex === num
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-[#08120c] text-emerald-300 border-[#1e3c2a] hover:border-emerald-600'
                      }`}
                    >
                      #{num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredScenes.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-emerald-500">
                  Cảnh {filteredScenes[0]?.sceneNumber || 1}
                </span>
                <input
                  type="range"
                  min={1}
                  max={scenes.length}
                  step={1}
                  value={activeScrollerIndex}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full h-2 bg-[#08120c] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[11px] font-mono text-emerald-500">
                  Cảnh {filteredScenes[filteredScenes.length - 1]?.sceneNumber || scenes.length}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {scenes.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center text-emerald-600/80 px-4">
          <Layers className="w-14 h-14 stroke-[1.2] text-[#224732] mb-3" />
          <p className="text-sm font-semibold text-emerald-300">Chưa có phân cảnh nào</p>
          <p className="text-xs text-emerald-500/80 max-w-md mt-1">
            Vui lòng nhập ý tưởng và nhấn nút <strong>"PHÂN TÍCH TẠO KỊCH BẢN"</strong> ở trên để hệ thống tự động sinh các hàng phân cảnh hoàn chỉnh.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <SceneDataGrid
          scenes={filteredScenes}
          onUpdateImagePrompt={onUpdateImagePrompt}
          onUpdateVideoPrompt={onUpdateVideoPrompt}
          onUpdateDialogue={onUpdateDialogue}
          onUpdateVoiceToneNote={onUpdateVoiceToneNote || (() => {})}
          onGenerateSingleImage={onGenerateSingleImage}
          onGenerateSingleVideo={onGenerateSingleVideo}
          onUploadCustomImage={onUploadCustomImage}
          onUploadCustomVideo={onUploadCustomVideo}
          onOpenZoomModal={onOpenZoomModal}
          onOpenVideoModal={onOpenVideoModal}
          onCopy={handleCopy}
          copiedId={copiedId}
          onDownloadImage={handleDownloadImage}
          isExpandedFull={isExpandedFull}
        />
      ) : (
        <div>
          {/* Table Header Row (Desktop) */}
          <div className="hidden xl:grid grid-cols-12 gap-4 px-3 py-2 bg-[#12261b] rounded-xl border border-[#1e3d2b] text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-3">
            <div className="col-span-3 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Prompt Tạo Hình Ảnh</span>
            </div>
            <div className="col-span-3 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Hình Ảnh Tạo Ra</span>
            </div>
            <div className="col-span-3 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-lime-400" />
              <span>3. Prompt Video & Lời Thoại (Ghi chú đọc)</span>
            </div>
            <div className="col-span-3 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-lime-400" />
              <span>4. Video Tạo Ra</span>
            </div>
          </div>

          {/* KHUNG TRƯỢT PHÂN CẢNH: Hạn chế chiều dài khi chọn tới 100 cảnh */}
          <div
            ref={scenesContainerRef}
            className={`space-y-4 pr-1.5 custom-moss-scrollbar transition-all ${
              isExpandedFull
                ? 'max-h-none'
                : 'max-h-[660px] xl:max-h-[740px] overflow-y-auto'
            }`}
          >
            {filteredScenes.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center px-4 bg-[#0b1710] rounded-2xl border border-[#1c3827]">
                <Filter className="w-10 h-10 text-emerald-500/60 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-emerald-200">
                  Không tìm thấy phân cảnh nào phù hợp với bộ lọc hiện tại
                </p>
                <p className="text-xs text-emerald-500 mt-1">
                  {filterStatus === 'error' && 'Tuyệt vời! Hiện tại không có phân cảnh nào bị lỗi.'}
                  {filterStatus === 'ready' && 'Chưa có phân cảnh nào hoàn thành tạo ảnh hoặc video.'}
                  {filterStatus === 'pending' && 'Tất cả các phân cảnh đã được tạo xong!'}
                  {searchQuery && ` Không có kết quả cho từ khóa "${searchQuery}".`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Xem lại toàn bộ {scenes.length} phân cảnh
                </button>
              </div>
            ) : filteredScenes.map((scene) => (
                <div
                  key={scene.id}
                ref={(el) => {
                  sceneRowRefs.current[scene.sceneNumber] = el;
                }}
                className="bg-[#0b1710]/95 hover:bg-[#0d1b13] border border-[#1c3827] hover:border-[#2d5a3e] rounded-2xl p-4 shadow-lg transition-all duration-150"
              >
                {/* Scene Row Title Bar */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#162e20]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center justify-center font-mono">
                      {scene.sceneNumber}
                    </span>
                    <span className="text-sm font-bold text-emerald-100">
                      Phân cảnh {scene.sceneNumber}: {scene.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#13281c] text-emerald-300 border border-[#21432f]">
                      Thời lượng: {scene.duration}
                    </span>
                  </div>
                </div>

                {/* 4 Columns in 1 Horizontal Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-stretch">
                  {/* CỘT 1: PROMPT TẠO HÌNH ẢNH (Col 3) */}
                  <div className="xl:col-span-3 bg-[#112419] border border-[#1e3d2b] rounded-xl p-3 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          Prompt Tạo Ảnh
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(`img-${scene.id}`, scene.imagePrompt)}
                            className="p-1 rounded hover:bg-[#1a3525] text-emerald-400 hover:text-emerald-200 transition-colors cursor-pointer"
                            title="Sao chép prompt ảnh"
                          >
                            {copiedId === `img-${scene.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={scene.imageStatus === 'generating'}
                            onClick={() => onGenerateSingleImage(scene)}
                            className="px-2 py-0.5 rounded bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {scene.imageStatus === 'generating' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                            )}
                            <span>{scene.imageUrl ? 'Tạo lại' : 'Tạo ảnh'}</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={5}
                        value={scene.imagePrompt}
                        onChange={(e) => onUpdateImagePrompt(scene.id, e.target.value)}
                        className="w-full bg-[#08120c] border border-[#1e3c2a] rounded-lg p-2.5 text-xs text-emerald-100 placeholder-emerald-700 focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
                        placeholder="Prompt chi tiết cho hình ảnh này..."
                      />
                    </div>

                    {scene.imagePromptVi && (
                      <div className="text-[11px] text-emerald-400/80 mt-2 bg-[#09140e] p-2 rounded border border-[#173021] italic">
                        💡 {scene.imagePromptVi}
                      </div>
                    )}
                  </div>

                  {/* CỘT 2: HÌNH ẢNH TẠO RA (Col 3) */}
                  <div className="xl:col-span-3 bg-[#112419] border border-[#1e3d2b] rounded-xl p-3 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          Hình Ảnh Render
                        </span>
                        {scene.imageUrl && (
                          <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 bg-emerald-950/60 rounded border border-emerald-800">
                            ✓ Đã sẵn sàng
                          </span>
                        )}
                      </div>

                      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#070e0a] border border-[#1c3827] flex items-center justify-center group shadow-inner">
                        {scene.imageStatus === 'generating' ? (
                          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                            <span className="text-xs text-emerald-300 font-medium">
                              Đang render ảnh...
                            </span>
                          </div>
                        ) : scene.imageUrl ? (
                          <>
                            <img
                              src={scene.imageUrl}
                              alt={scene.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenZoomModal(scene.imageUrl!, scene.title, scene.imagePrompt)
                                }
                                className="p-2 rounded-full bg-[#1b3a27] text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                                title="Phóng to xem ảnh"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadImage(scene.imageUrl!, scene.sceneNumber)
                                }
                                className="p-2 rounded-full bg-[#1b3a27] text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                                title="Tải ảnh PNG"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 text-center text-emerald-800">
                            <ImageIcon className="w-8 h-8 mb-1.5 opacity-40 text-emerald-700" />
                            <span className="text-xs text-emerald-600 font-medium">
                              Chưa tạo ảnh
                            </span>
                            <span className="text-[10px] text-emerald-700 mt-0.5">
                              Bấm "Tạo ảnh" ở cột 1
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Controls toolbar */}
                    <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-[#183523]">
                      <button
                        type="button"
                        disabled={!scene.imageUrl}
                        onClick={() =>
                          scene.imageUrl &&
                          onOpenZoomModal(scene.imageUrl, scene.title, scene.imagePrompt)
                        }
                        className="py-1 px-1 rounded bg-[#0a160f] hover:bg-[#152e1f] border border-[#1e3c29] text-emerald-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <ZoomIn className="w-3 h-3" />
                        <span>Phóng to</span>
                      </button>

                      <button
                        type="button"
                        disabled={scene.imageStatus === 'generating'}
                        onClick={() => onGenerateSingleImage(scene)}
                        className="py-1 px-1 rounded bg-[#0a160f] hover:bg-emerald-950 border border-[#1e3c29] text-emerald-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-400" />
                        <span>Tạo lại</span>
                      </button>

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => {
                            uploadImgRefs.current[scene.id] = el;
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadCustomImage(scene.id, file);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => uploadImgRefs.current[scene.id]?.click()}
                          className="w-full py-1 px-1 rounded bg-[#0a160f] hover:bg-[#152e1f] border border-[#1e3c29] text-emerald-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Tải lên ảnh có sẵn"
                        >
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>Tải lên</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!scene.imageUrl}
                        onClick={() =>
                          scene.imageUrl &&
                          handleDownloadImage(scene.imageUrl, scene.sceneNumber)
                        }
                        className="py-1 px-1 rounded bg-[#0a160f] hover:bg-emerald-950 border border-[#1e3c29] text-emerald-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>Tải về</span>
                      </button>
                    </div>
                  </div>

                  {/* CỘT 3: PROMPT TẠO VIDEO & LỜI THOẠI + GHI CHÚ GIỌNG ĐỌC (Col 3) */}
                  <div className="xl:col-span-3 bg-[#112419] border border-[#1e3d2b] rounded-xl p-3 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-lime-300 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-lime-400" />
                          Prompt Video
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(`vid-${scene.id}`, scene.videoPrompt)}
                            className="p-1 rounded hover:bg-[#1a3525] text-lime-400 hover:text-lime-200 transition-colors cursor-pointer"
                            title="Sao chép prompt video"
                          >
                            {copiedId === `vid-${scene.id}` ? (
                              <Check className="w-3.5 h-3.5 text-lime-300" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={scene.videoStatus === 'generating'}
                            onClick={() => onGenerateSingleVideo(scene)}
                            className="px-2 py-0.5 rounded bg-lime-600/25 hover:bg-lime-600/40 border border-lime-500/40 text-lime-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {scene.videoStatus === 'generating' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-lime-400" />
                            )}
                            <span>{scene.videoUrl ? 'Tạo lại' : 'Tạo video'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Camera movement badge */}
                      {scene.cameraMovement && (
                        <div className="flex items-center gap-1 text-[10px] text-lime-300 bg-lime-950/40 px-2 py-0.5 rounded border border-lime-900/60 mb-2 w-fit">
                          <Camera className="w-3 h-3" />
                          <span>{scene.cameraMovement}</span>
                        </div>
                      )}

                      <textarea
                        rows={2}
                        value={scene.videoPrompt}
                        onChange={(e) => onUpdateVideoPrompt(scene.id, e.target.value)}
                        className="w-full bg-[#08120c] border border-[#1e3c2a] rounded-lg p-2 text-xs text-lime-100 placeholder-lime-700 focus:outline-none focus:border-lime-500 resize-none font-sans leading-relaxed"
                        placeholder="Mô tả chuyển động máy quay và hành động nhân vật..."
                      />
                    </div>

                    {/* Dialogue & Voice Tone Note Section */}
                    <div className="mt-2 pt-2 border-t border-[#183523]">
                      {/* Dialogue text */}
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 mb-1">
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>Lời thoại / Thuyết minh cảnh này:</span>
                      </div>
                      <input
                        type="text"
                        value={scene.dialogue || ''}
                        onChange={(e) => onUpdateDialogue(scene.id, e.target.value)}
                        placeholder="Nhập câu thoại hoặc thuyết minh..."
                        className="w-full bg-[#08120c] border border-[#1e3c2a] rounded px-2.5 py-1 text-xs text-emerald-200 placeholder-emerald-700 focus:outline-none focus:border-emerald-500"
                      />

                      {/* Ghi chú giọng đọc (Đọc nhẹ, nhanh, giọng trầm ấm) */}
                      <div className="mt-2 pt-1.5 border-t border-[#183523]/70">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-lime-300">
                            <Mic className="w-3 h-3 text-lime-400" />
                            <span>Ghi chú sắc thái đọc (Voice Tone):</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={
                            scene.voiceToneNote || 'đọc nhẹ, nhanh, giọng trầm ấm'
                          }
                          onChange={(e) =>
                            onUpdateVoiceToneNote?.(scene.id, e.target.value)
                          }
                          placeholder="VD: đọc nhẹ, nhanh, giọng trầm ấm..."
                          className="w-full bg-[#08120c] border border-[#1e3c2a] rounded px-2 py-1 text-[11px] text-lime-200 placeholder-emerald-700 focus:outline-none focus:border-lime-500"
                        />
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {[
                            'đọc nhẹ, nhanh, giọng trầm ấm',
                            'trầm ấm, truyền cảm',
                            'đọc nhẹ nhàng',
                            'nhanh, kịch tính',
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                onUpdateVoiceToneNote?.(scene.id, preset)
                              }
                              className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors cursor-pointer ${
                                (scene.voiceToneNote ||
                                  'đọc nhẹ, nhanh, giọng trầm ấm') === preset
                                  ? 'bg-emerald-600/40 text-emerald-200 border-emerald-500 font-bold'
                                  : 'bg-[#09150e] hover:bg-[#152e1f] text-emerald-400 border-[#183523]'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CỘT 4: VIDEO TẠO RA (Col 3) */}
                  <div className="xl:col-span-3 bg-[#112419] border border-[#1e3d2b] rounded-xl p-3 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-lime-300 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-lime-400" />
                          Video Render
                        </span>
                        {scene.videoUrl && (
                          <span className="text-[10px] text-lime-400 font-semibold px-1.5 py-0.5 bg-lime-950/60 rounded border border-lime-800">
                            ✓ Đã sẵn sàng
                          </span>
                        )}
                      </div>

                      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#070e0a] border border-[#1c3827] flex items-center justify-center group shadow-inner">
                        {scene.videoStatus === 'generating' ? (
                          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
                            <span className="text-xs text-lime-300 font-medium">
                              Đang render video...
                            </span>
                          </div>
                        ) : scene.videoUrl ? (
                          <>
                            <video
                              ref={(el) => {
                                videoRefs.current[scene.id] = el;
                              }}
                              src={scene.videoUrl}
                              loop
                              playsInline
                              className="w-full h-full object-cover"
                              onEnded={() => setPlayingId(null)}
                            />

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                              <button
                                type="button"
                                onClick={() => togglePlay(scene.id)}
                                className="p-3 rounded-full bg-emerald-600/90 text-white hover:bg-emerald-500 transition-colors shadow cursor-pointer"
                                title={playingId === scene.id ? 'Tạm dừng' : 'Phát video'}
                              >
                                {playingId === scene.id ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenVideoModal(
                                    scene.videoUrl!,
                                    scene.title,
                                    scene.videoPrompt,
                                    scene.dialogue
                                  )
                                }
                                className="p-2.5 rounded-full bg-[#1b3a27] text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                                title="Phóng to"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadVideo(
                                    scene.videoUrl!,
                                    scene.sceneNumber
                                  )
                                }
                                className="p-2.5 rounded-full bg-[#1b3a27] text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                                title="Tải video MP4"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : scene.imageUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={scene.imageUrl}
                              alt={scene.title}
                              className="w-full h-full object-cover opacity-60 filter blur-[1px]"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/50">
                              <Film className="w-6 h-6 text-lime-400 mb-1" />
                              <span className="text-xs text-lime-200 font-medium">
                                Ảnh đã xong
                              </span>
                              <span className="text-[10px] text-lime-400/80 mt-0.5">
                                Bấm "Tạo video" ở cột 3
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 text-center text-lime-900">
                            <Film className="w-8 h-8 mb-1.5 opacity-40 text-lime-800" />
                            <span className="text-xs text-lime-700 font-medium">
                              Chưa tạo video
                            </span>
                            <span className="text-[10px] text-lime-800 mt-0.5">
                              Tạo ảnh trước rồi tạo video
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Subtitle tag */}
                      {scene.dialogue && (
                        <div className="text-[10px] text-lime-200 mt-1.5 px-2 py-1 bg-lime-950/40 border border-lime-900/40 rounded truncate">
                          💬 {scene.dialogue}
                        </div>
                      )}
                    </div>

                    {/* Video Controls toolbar */}
                    <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-[#183523]">
                      <button
                        type="button"
                        disabled={!scene.videoUrl}
                        onClick={() =>
                          scene.videoUrl &&
                          onOpenVideoModal(
                            scene.videoUrl,
                            scene.title,
                            scene.videoPrompt,
                            scene.dialogue
                          )
                        }
                        className="py-1 px-1 rounded bg-[#0a160f] hover:bg-[#152e1f] border border-[#1e3c29] text-lime-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <ZoomIn className="w-3 h-3" />
                        <span>Phóng to</span>
                      </button>

                      <button
                        type="button"
                        disabled={scene.videoStatus === 'generating'}
                        onClick={() => onGenerateSingleVideo(scene)}
                        className="py-1 px-1 rounded bg-[#0a160f] hover:bg-lime-950 border border-[#1e3c29] text-lime-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw className="w-3 h-3 text-lime-400" />
                        <span>Tạo lại</span>
                      </button>

                      <div>
                        <input
                          type="file"
                          accept="video/*"
                          ref={(el) => {
                            uploadVidRefs.current[scene.id] = el;
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadCustomVideo(scene.id, file);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => uploadVidRefs.current[scene.id]?.click()}
                          className="w-full py-1 px-1 rounded bg-[#0a160f] hover:bg-[#152e1f] border border-[#1e3c29] text-lime-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Tải lên video có sẵn"
                        >
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>Tải lên</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!scene.videoUrl}
                        onClick={() =>
                          scene.videoUrl &&
                          handleDownloadVideo(scene.videoUrl, scene.sceneNumber)
                        }
                        className="py-1 px-1 rounded bg-[#0a160f] hover:bg-emerald-950 border border-[#1e3c29] text-lime-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Download className="w-3 h-3 text-lime-400" />
                        <span>Tải về</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
