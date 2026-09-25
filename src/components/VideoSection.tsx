import React, { useRef } from 'react';
import {
  Film,
  Play,
  Pause,
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
} from 'lucide-react';
import { Scene } from '../types';

interface VideoSectionProps {
  scenes: Scene[];
  onUpdateVideoPrompt: (sceneId: string, newPrompt: string) => void;
  onUpdateDialogue: (sceneId: string, newDialogue: string) => void;
  onGenerateSingleVideo: (scene: Scene) => void;
  onUploadCustomVideo: (sceneId: string, file: File) => void;
  onOpenVideoModal: (videoUrl: string, title: string, prompt: string, dialogue?: string) => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  scenes,
  onUpdateVideoPrompt,
  onUpdateDialogue,
  onGenerateSingleVideo,
  onUploadCustomVideo,
  onOpenVideoModal,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const uploadInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (videoUrl: string, sceneNumber: number) => {
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-6 bg-purple-500 rounded-full inline-block"></span>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            VIDEO ({scenes.length} Phân Cảnh)
          </h3>
        </div>
        <span className="text-xs text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-900">
          {scenes.filter((s) => s.videoUrl).length}/{scenes.length} Video Đã Tạo
        </span>
      </div>

      {scenes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 px-4">
          <Film className="w-12 h-12 stroke-[1.2] text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">Chưa có prompt video nào</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Sau khi bấm <strong>"PHÂN TÍCH TẠO KỊCH BẢN"</strong>, danh sách prompt chuyển động máy quay và kịch bản video sẽ xuất hiện đầy đủ tại đây.
          </p>
        </div>
      ) : (
        /* Two Sub-columns inside Video Section (As in diagram) */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
          {/* Sub-column Left: Toàn bộ prompt video phân tích (Col 6) */}
          <div className="md:col-span-6 flex flex-col">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-3 text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Toàn bộ prompt video phân tích từ Ý tưởng:
              </span>
              <span className="text-[11px] text-slate-500">Chỉnh sửa góc máy & hành động</span>
            </div>

            <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-xl p-3 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center justify-center font-mono">
                        {scene.sceneNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                        {scene.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(scene.id, scene.videoPrompt)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Sao chép prompt video"
                      >
                        {copiedId === scene.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={scene.videoStatus === 'generating'}
                        onClick={() => onGenerateSingleVideo(scene)}
                        className="px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Tạo riêng video cho phân cảnh này"
                      >
                        {scene.videoStatus === 'generating' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-purple-400" />
                        )}
                        <span>{scene.videoUrl ? 'Tạo lại' : 'Tạo video'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Camera movement badge */}
                  {scene.cameraMovement && (
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/60 mb-1.5 w-fit">
                      <Camera className="w-3 h-3" />
                      <span>{scene.cameraMovement}</span>
                    </div>
                  )}

                  {/* Editable Video Motion Prompt */}
                  <textarea
                    rows={2}
                    value={scene.videoPrompt}
                    onChange={(e) => onUpdateVideoPrompt(scene.id, e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-sans"
                    placeholder="Mô tả hành động và chuyển động camera video..."
                  />

                  {/* Dialogue or Voiceover Textarea */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                      <MessageSquare className="w-3 h-3 text-pink-400" />
                      <span>Lời thoại / Thuyết minh cảnh này:</span>
                    </div>
                    <input
                      type="text"
                      value={scene.dialogue || ''}
                      onChange={(e) => onUpdateDialogue(scene.id, e.target.value)}
                      placeholder="Nhập lời thoại hoặc câu thuyết minh tiếng Việt..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-column Right: Video Tạo Ra Tương Ứng (Col 6) */}
          <div className="md:col-span-6 flex flex-col">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-3 text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Video tạo ra tương ứng từng prompt:
              </span>
              <span className="text-[11px] text-slate-500">Phát xem • Phóng to • Tải lên/xuống</span>
            </div>

            <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 transition-colors shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      Cảnh {scene.sceneNumber}: {scene.title}
                    </span>
                    <span className="text-[11px] font-mono text-purple-300">
                      {scene.duration}
                    </span>
                  </div>

                  {/* Video Player Display */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group shadow-inner">
                    {scene.videoStatus === 'generating' ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        <span className="text-xs text-purple-300 font-medium">
                          Đang tổng hợp chuyển động video...
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

                        {/* Video Controls Overlay */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          {/* Play/Pause */}
                          <button
                            type="button"
                            onClick={() => togglePlay(scene.id)}
                            className="p-3 rounded-full bg-purple-600/90 text-white hover:bg-purple-500 transition-colors shadow-lg cursor-pointer"
                            title={playingId === scene.id ? 'Tạm dừng' : 'Phát video'}
                          >
                            {playingId === scene.id ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5 ml-0.5" />
                            )}
                          </button>

                          {/* Zoom Modal */}
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
                            className="p-2.5 rounded-full bg-slate-800/90 text-white hover:bg-purple-600 transition-colors shadow cursor-pointer"
                            title="Phóng to xem toàn màn hình"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>

                          {/* Download video */}
                          <button
                            type="button"
                            onClick={() => handleDownload(scene.videoUrl!, scene.sceneNumber)}
                            className="p-2.5 rounded-full bg-slate-800/90 text-white hover:bg-emerald-600 transition-colors shadow cursor-pointer"
                            title="Tải video MP4 này về máy"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : scene.imageUrl ? (
                      /* Has image, waiting for video */
                      <div className="relative w-full h-full">
                        <img
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover opacity-60 filter blur-[1px]"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/50">
                          <Film className="w-8 h-8 text-purple-400 mb-1" />
                          <span className="text-xs text-slate-300 font-medium">
                            Ảnh đã sẵn sàng
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Bấm "Tạo video" để render chuyển động
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600">
                        <Film className="w-10 h-10 mb-2 opacity-40" />
                        <span className="text-xs text-slate-500">Chưa tạo video</span>
                        <span className="text-[10px] text-slate-600 mt-0.5">
                          Tạo ảnh trước rồi tạo video
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Subtitle preview if exists */}
                  {scene.dialogue && (
                    <div className="text-[11px] text-pink-300/90 mt-1.5 px-2 py-1 bg-pink-950/20 border border-pink-900/30 rounded truncate">
                      💬 {scene.dialogue}
                    </div>
                  )}

                  {/* Bottom Action Buttons (Matches user diagram) */}
                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/70">
                    {/* Nút bấm phóng lên xem */}
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
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <ZoomIn className="w-3 h-3 text-purple-400" />
                      <span>Phóng to</span>
                    </button>

                    {/* Nút chỉnh sửa lại prompt tạo lại từng video */}
                    <button
                      type="button"
                      disabled={scene.videoStatus === 'generating'}
                      onClick={() => onGenerateSingleVideo(scene)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-purple-900/30 border border-slate-700 hover:border-purple-500/50 text-purple-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3 text-purple-400" />
                      <span>Tạo lại</span>
                    </button>

                    {/* Nút tải lên video có sẵn */}
                    <div>
                      <input
                        type="file"
                        accept="video/*"
                        ref={(el) => {
                          uploadInputRefs.current[scene.id] = el;
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadCustomVideo(scene.id, file);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => uploadInputRefs.current[scene.id]?.click()}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Tải video clip có sẵn từ máy tính"
                      >
                        <Upload className="w-3 h-3 text-amber-400" />
                        <span>Tải lên</span>
                      </button>
                    </div>

                    {/* Nút tải xuống */}
                    <button
                      type="button"
                      disabled={!scene.videoUrl}
                      onClick={() =>
                        scene.videoUrl && handleDownload(scene.videoUrl, scene.sceneNumber)
                      }
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500/50 text-emerald-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      title="Tải video MP4 về máy"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
