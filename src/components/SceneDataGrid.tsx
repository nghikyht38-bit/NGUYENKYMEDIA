import React, { useRef, useState } from 'react';
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
  AlertCircle,
  Clock,
  Mic,
} from 'lucide-react';
import { Scene } from '../types';

interface SceneDataGridProps {
  scenes: Scene[];
  onUpdateImagePrompt: (sceneId: string, newPrompt: string) => void;
  onUpdateVideoPrompt: (sceneId: string, newPrompt: string) => void;
  onUpdateDialogue: (sceneId: string, newDialogue: string) => void;
  onUpdateVoiceToneNote: (sceneId: string, newTone: string) => void;
  onGenerateSingleImage: (scene: Scene) => void;
  onGenerateSingleVideo: (scene: Scene) => void;
  onUploadCustomImage: (sceneId: string, file: File) => void;
  onUploadCustomVideo: (sceneId: string, file: File) => void;
  onOpenZoomModal: (imageUrl: string, title: string, prompt: string) => void;
  onOpenVideoModal: (videoUrl: string, title: string, prompt: string, dialogue?: string) => void;
  onCopy: (id: string, text: string) => void;
  copiedId: string | null;
  onDownloadImage: (imageUrl: string, sceneNumber: number) => void;
  isExpandedFull: boolean;
}

export const SceneDataGrid: React.FC<SceneDataGridProps> = ({
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
  onCopy,
  copiedId,
  onDownloadImage,
  isExpandedFull,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const uploadImgRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const uploadVidRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const togglePlayVideo = (sceneId: string) => {
    const video = videoRefs.current[sceneId];
    if (!video) return;

    if (playingId === sceneId) {
      video.pause();
      setPlayingId(null);
    } else {
      if (playingId && videoRefs.current[playingId]) {
        videoRefs.current[playingId]?.pause();
      }
      video.play().catch(() => {});
      setPlayingId(sceneId);
    }
  };

  return (
    <div
      className={`border border-[#1e3d2b] rounded-2xl bg-[#09150e] overflow-hidden shadow-2xl transition-all ${
        isExpandedFull ? 'max-h-none' : 'max-h-[660px] xl:max-h-[740px] flex flex-col'
      }`}
    >
      <div className="overflow-x-auto overflow-y-auto custom-moss-scrollbar flex-1">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-20 bg-[#0d2215] text-[11px] font-bold text-emerald-300 uppercase tracking-wider border-b border-[#1b3e28] shadow-md">
            <tr>
              <th className="py-3 px-3 w-[70px] text-center border-r border-[#183624]"># Cảnh</th>
              <th className="py-3 px-3 w-[150px] border-r border-[#183624]">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ảnh xem trước</span>
                </div>
              </th>
              <th className="py-3 px-3 w-[260px] border-r border-[#183624]">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prompt Tạo Hình Ảnh</span>
                </div>
              </th>
              <th className="py-3 px-3 w-[260px] border-r border-[#183624]">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-lime-400" />
                  <span>Lời Thoại & Sắc Thái Giọng Đọc</span>
                </div>
              </th>
              <th className="py-3 px-3 w-[260px] border-r border-[#183624]">
                <div className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-lime-400" />
                  <span>Prompt Video & Camera</span>
                </div>
              </th>
              <th className="py-3 px-3 w-[180px]">
                <div className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-lime-400" />
                  <span>Video & Thao Tác</span>
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Rows */}
          <tbody className="divide-y divide-[#152e20] text-xs">
            {scenes.map((scene) => {
              const isImageLoading = scene.imageStatus === 'generating';
              const isVideoLoading = scene.videoStatus === 'generating';
              const isPlaying = playingId === scene.id;

              return (
                <tr
                  key={scene.id}
                  className="hover:bg-[#0e2116]/80 transition-colors group"
                >
                  {/* Column 1: # Cảnh & Thời lượng */}
                  <td className="py-3 px-2 text-center align-top border-r border-[#152e20] bg-[#07120b]/50">
                    <span className="inline-block px-2 py-1 rounded-md bg-[#132a1d] text-emerald-200 border border-[#214731] font-mono font-bold text-xs shadow-sm">
                      #{String(scene.sceneNumber).padStart(2, '0')}
                    </span>
                    <div className="text-[10px] text-emerald-500 font-mono mt-1.5 flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{scene.duration || '8s'}</span>
                    </div>
                  </td>

                  {/* Column 2: Ảnh & Xem Trước */}
                  <td className="py-3 px-3 align-top border-r border-[#152e20]">
                    <div className="flex flex-col gap-2">
                      <div className="relative w-28 h-20 bg-[#061009] rounded-lg border border-[#1b3e28] overflow-hidden flex items-center justify-center group/thumb">
                        {isImageLoading ? (
                          <div className="flex flex-col items-center gap-1 text-emerald-400 p-2 text-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[9px] font-mono">Đang tạo...</span>
                          </div>
                        ) : scene.imageUrl ? (
                          <>
                            <img
                              src={scene.imageUrl}
                              alt={`Cảnh ${scene.sceneNumber}`}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() =>
                                onOpenZoomModal(
                                  scene.imageUrl!,
                                  `Phân cảnh #${scene.sceneNumber}`,
                                  scene.imagePrompt
                                )
                              }
                            />
                            {/* Hover overlay icons */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenZoomModal(
                                    scene.imageUrl!,
                                    `Phân cảnh #${scene.sceneNumber}`,
                                    scene.imagePrompt
                                  )
                                }
                                className="p-1 rounded bg-[#10291a] text-emerald-200 hover:text-white"
                                title="Phóng to ảnh"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDownloadImage(scene.imageUrl!, scene.sceneNumber)
                                }
                                className="p-1 rounded bg-[#10291a] text-emerald-200 hover:text-white"
                                title="Tải ảnh về máy"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-emerald-700 p-2 text-center">
                            <ImageIcon className="w-6 h-6 stroke-[1.2]" />
                            <span className="text-[9px] mt-0.5">Chưa có ảnh</span>
                          </div>
                        )}
                      </div>

                      {/* Image Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isImageLoading}
                          onClick={() => onGenerateSingleImage(scene)}
                          className="flex-1 py-1 px-1.5 rounded bg-[#12281c] hover:bg-[#1a3827] border border-[#214731] text-emerald-200 hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          title="Tạo ảnh bằng AI"
                        >
                          {isImageLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{scene.imageUrl ? 'Tạo lại' : 'Tạo ảnh'}</span>
                        </button>

                        {/* Upload local image input */}
                        <input
                          ref={(el) => {
                            uploadImgRefs.current[scene.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadCustomImage(scene.id, file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => uploadImgRefs.current[scene.id]?.click()}
                          className="p-1 rounded bg-[#12281c] hover:bg-[#1a3827] border border-[#214731] text-emerald-400 hover:text-white text-[10px]"
                          title="Tải ảnh từ máy"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                      </div>

                      {scene.imageError && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1 line-clamp-1" title={scene.imageError}>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Lỗi tạo ảnh</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Column 3: Prompt Tạo Hình Ảnh */}
                  <td className="py-3 px-3 align-top border-r border-[#152e20]">
                    <div className="flex flex-col gap-1.5 h-full">
                      <div className="flex items-center justify-between text-[10px] text-emerald-500">
                        <span>Tiếng Anh (cho Imagen/SD)</span>
                        <button
                          type="button"
                          onClick={() => onCopy(`img-${scene.id}`, scene.imagePrompt)}
                          className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                          title="Sao chép prompt ảnh"
                        >
                          {copiedId === `img-${scene.id}` ? (
                            <Check className="w-3 h-3 text-lime-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                      <textarea
                        value={scene.imagePrompt}
                        onChange={(e) => onUpdateImagePrompt(scene.id, e.target.value)}
                        rows={3}
                        className="w-full bg-[#08120c] border border-[#1b3e28] focus:border-emerald-500 rounded-lg p-2 text-xs text-emerald-100 placeholder-emerald-800 focus:outline-none resize-none transition-colors"
                        placeholder="Mô tả phân cảnh tạo hình ảnh..."
                      />
                    </div>
                  </td>

                  {/* Column 4: Lời Thoại & Sắc Thái Giọng Đọc */}
                  <td className="py-3 px-3 align-top border-r border-[#152e20]">
                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-emerald-500 mb-1">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-lime-400" />
                            Lời thoại tiếng Việt
                          </span>
                          <button
                            type="button"
                            onClick={() => onCopy(`dlg-${scene.id}`, scene.dialogue || '')}
                            className="flex items-center gap-1 hover:text-lime-300"
                            title="Sao chép lời thoại"
                          >
                            {copiedId === `dlg-${scene.id}` ? (
                              <Check className="w-3 h-3 text-lime-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                        <textarea
                          value={scene.dialogue || ''}
                          onChange={(e) => onUpdateDialogue(scene.id, e.target.value)}
                          rows={2}
                          className="w-full bg-[#08120c] border border-[#1b3e28] focus:border-lime-500 rounded-lg p-2 text-xs text-lime-100 placeholder-emerald-800 focus:outline-none resize-none transition-colors"
                          placeholder="Lời thoại hoặc thuyết minh cho cảnh này..."
                        />
                      </div>

                      {/* Ghi chú sắc thái giọng đọc */}
                      <div className="flex items-center gap-1.5">
                        <Mic className="w-3 h-3 text-emerald-500 shrink-0" />
                        <input
                          type="text"
                          value={scene.voiceToneNote || ''}
                          onChange={(e) => onUpdateVoiceToneNote(scene.id, e.target.value)}
                          placeholder="Sắc thái: ấm áp, dồn dập, thì thầm..."
                          className="w-full bg-[#08120c] border border-[#1b3e28] focus:border-emerald-500 rounded px-2 py-1 text-[11px] text-emerald-300 placeholder-emerald-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Column 5: Prompt Video & Camera */}
                  <td className="py-3 px-3 align-top border-r border-[#152e20]">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] text-emerald-500">
                        {scene.cameraMovement ? (
                          <span className="px-1.5 py-0.5 rounded bg-lime-950/80 text-lime-300 border border-lime-800/60 font-mono text-[9px] flex items-center gap-1">
                            <Camera className="w-2.5 h-2.5" />
                            {scene.cameraMovement}
                          </span>
                        ) : (
                          <span>Chuyển động video (Veo)</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onCopy(`vid-${scene.id}`, scene.videoPrompt)}
                          className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                          title="Sao chép prompt video"
                        >
                          {copiedId === `vid-${scene.id}` ? (
                            <Check className="w-3 h-3 text-lime-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                      <textarea
                        value={scene.videoPrompt}
                        onChange={(e) => onUpdateVideoPrompt(scene.id, e.target.value)}
                        rows={3}
                        className="w-full bg-[#08120c] border border-[#1b3e28] focus:border-emerald-500 rounded-lg p-2 text-xs text-emerald-100 placeholder-emerald-800 focus:outline-none resize-none transition-colors"
                        placeholder="Mô tả chuyển động video & góc máy..."
                      />
                    </div>
                  </td>

                  {/* Column 6: Video & Thao Tác */}
                  <td className="py-3 px-3 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="relative w-36 h-20 bg-[#061009] rounded-lg border border-[#1b3e28] overflow-hidden flex items-center justify-center group/vid">
                        {isVideoLoading ? (
                          <div className="flex flex-col items-center gap-1 text-lime-400 p-2 text-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[9px] font-mono">Đang render...</span>
                          </div>
                        ) : scene.videoUrl ? (
                          <>
                            <video
                              ref={(el) => {
                                videoRefs.current[scene.id] = el;
                              }}
                              src={scene.videoUrl}
                              className="w-full h-full object-cover"
                              loop
                              muted
                              playsInline
                            />
                            {/* Play/Pause Button Overlay */}
                            <button
                              type="button"
                              onClick={() => togglePlayVideo(scene.id)}
                              className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-full bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                                {isPlaying ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 ml-0.5" />
                                )}
                              </div>
                            </button>

                            {/* Corner Zoom icon */}
                            <button
                              type="button"
                              onClick={() =>
                                onOpenVideoModal(
                                  scene.videoUrl!,
                                  `Phân cảnh #${scene.sceneNumber}`,
                                  scene.videoPrompt,
                                  scene.dialogue
                                )
                              }
                              className="absolute top-1 right-1 p-1 rounded bg-black/60 hover:bg-black/90 text-white text-[10px] opacity-0 group-hover/vid:opacity-100 transition-opacity"
                              title="Phóng to video"
                            >
                              <ZoomIn className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-emerald-700 p-2 text-center">
                            <Film className="w-6 h-6 stroke-[1.2]" />
                            <span className="text-[9px] mt-0.5">Chưa có video</span>
                          </div>
                        )}
                      </div>

                      {/* Video Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isVideoLoading}
                          onClick={() => onGenerateSingleVideo(scene)}
                          className="flex-1 py-1 px-2 rounded bg-[#152e20] hover:bg-[#1f422e] border border-[#27533a] text-lime-200 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          title="Tạo video phân cảnh"
                        >
                          {isVideoLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Film className="w-3 h-3 text-lime-400" />
                          )}
                          <span>{scene.videoUrl ? 'Tạo lại' : 'Tạo video'}</span>
                        </button>

                        {/* Upload local video input */}
                        <input
                          ref={(el) => {
                            uploadVidRefs.current[scene.id] = el;
                          }}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadCustomVideo(scene.id, file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => uploadVidRefs.current[scene.id]?.click()}
                          className="p-1 rounded bg-[#152e20] hover:bg-[#1f422e] border border-[#27533a] text-lime-400 hover:text-white text-[10px]"
                          title="Tải video lên từ máy"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                      </div>

                      {scene.videoError && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1 line-clamp-1" title={scene.videoError}>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Lỗi tạo video</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
