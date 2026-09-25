import React, { useRef } from 'react';
import {
  Image as ImageIcon,
  ZoomIn,
  RefreshCw,
  Upload,
  Download,
  Copy,
  Check,
  Edit3,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Scene } from '../types';

interface ImageSectionProps {
  scenes: Scene[];
  onUpdateImagePrompt: (sceneId: string, newPrompt: string) => void;
  onGenerateSingleImage: (scene: Scene) => void;
  onUploadCustomImage: (sceneId: string, file: File) => void;
  onOpenZoomModal: (imageUrl: string, title: string, prompt: string) => void;
}

export const ImageSection: React.FC<ImageSectionProps> = ({
  scenes,
  onUpdateImagePrompt,
  onGenerateSingleImage,
  onUploadCustomImage,
  onOpenZoomModal,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const uploadInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (imageUrl: string, sceneNumber: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `Canh_${String(sceneNumber).padStart(2, '0')}_HinhAnh.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-6 bg-blue-500 rounded-full inline-block"></span>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            HÌNH ẢNH ({scenes.length} Phân Cảnh)
          </h3>
        </div>
        <span className="text-xs text-blue-300 font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900">
          {scenes.filter((s) => s.imageUrl).length}/{scenes.length} Ảnh Đã Tạo
        </span>
      </div>

      {scenes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 px-4">
          <ImageIcon className="w-12 h-12 stroke-[1.2] text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">Chưa có prompt hình ảnh nào</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Vui lòng nhập ý tưởng và bấm nút <strong>"PHÂN TÍCH TẠO KỊCH BẢN"</strong> ở trên để hệ thống tự động phân tách 100% prompt cho từng cảnh.
          </p>
        </div>
      ) : (
        /* Two Sub-columns inside Image Section (As drawn in diagram) */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
          {/* Sub-column Left: Danh sách Prompt Hình Ảnh (Col 6) */}
          <div className="md:col-span-6 flex flex-col">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-3 text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Toàn bộ prompt tạo hình ảnh từ Ý tưởng:
              </span>
              <span className="text-[11px] text-slate-500">Chỉnh sửa trực tiếp</span>
            </div>

            <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 rounded-xl p-3 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold flex items-center justify-center font-mono">
                        {scene.sceneNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
                        {scene.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(scene.id, scene.imagePrompt)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Sao chép prompt này"
                      >
                        {copiedId === scene.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={scene.imageStatus === 'generating'}
                        onClick={() => onGenerateSingleImage(scene)}
                        className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Tạo riêng ảnh cho cảnh này"
                      >
                        {scene.imageStatus === 'generating' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-blue-400" />
                        )}
                        <span>{scene.imageUrl ? 'Tạo lại' : 'Tạo ảnh'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Editable prompt textarea */}
                  <textarea
                    rows={3}
                    value={scene.imagePrompt}
                    onChange={(e) => onUpdateImagePrompt(scene.id, e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-sans"
                    placeholder="Nhập prompt chi tiết cho hình ảnh này..."
                  />

                  {scene.imagePromptVi && (
                    <div className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                      💡 {scene.imagePromptVi}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sub-column Right: Hình Ảnh Tạo Ra Tương Ứng (Col 6) */}
          <div className="md:col-span-6 flex flex-col">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-3 text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Hình ảnh tạo ra tương ứng từng prompt:
              </span>
              <span className="text-[11px] text-slate-500">Phóng to • Chỉnh sửa • Tải lên</span>
            </div>

            <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 transition-colors shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Cảnh {scene.sceneNumber}: {scene.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {scene.duration}
                    </span>
                  </div>

                  {/* Image Display / Placeholder */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group shadow-inner">
                    {scene.imageStatus === 'generating' ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-xs text-blue-300 font-medium">
                          Đang tạo hình ảnh đồng bộ...
                        </span>
                      </div>
                    ) : scene.imageUrl ? (
                      <>
                        <img
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          {/* Phóng to xem */}
                          <button
                            type="button"
                            onClick={() =>
                              onOpenZoomModal(scene.imageUrl!, scene.title, scene.imagePrompt)
                            }
                            className="p-2 rounded-full bg-slate-800/90 text-white hover:bg-blue-600 transition-colors shadow cursor-pointer"
                            title="Phóng to xem ảnh chi tiết"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>

                          {/* Tải xuống ảnh */}
                          <button
                            type="button"
                            onClick={() => handleDownload(scene.imageUrl!, scene.sceneNumber)}
                            className="p-2 rounded-full bg-slate-800/90 text-white hover:bg-emerald-600 transition-colors shadow cursor-pointer"
                            title="Tải ảnh này về máy (PNG)"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                        <span className="text-xs text-slate-500">Chưa tạo ảnh</span>
                        <span className="text-[10px] text-slate-600 mt-0.5">
                          Bấm nút Tạo ảnh hoặc Tạo tất cả
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons (Matches user requirement) */}
                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/70">
                    {/* Nút phóng lên xem */}
                    <button
                      type="button"
                      disabled={!scene.imageUrl}
                      onClick={() =>
                        scene.imageUrl &&
                        onOpenZoomModal(scene.imageUrl, scene.title, scene.imagePrompt)
                      }
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <ZoomIn className="w-3 h-3 text-blue-400" />
                      <span>Phóng to</span>
                    </button>

                    {/* Nút chỉnh sửa lại prompt tạo lại từng ảnh */}
                    <button
                      type="button"
                      disabled={scene.imageStatus === 'generating'}
                      onClick={() => onGenerateSingleImage(scene)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500/50 text-blue-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-400" />
                      <span>Tạo lại</span>
                    </button>

                    {/* Nút tải lên ảnh có sẵn thay thế */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => {
                          uploadInputRefs.current[scene.id] = el;
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadCustomImage(scene.id, file);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => uploadInputRefs.current[scene.id]?.click()}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Tải lên ảnh tùy chỉnh của bạn để thay thế cảnh này"
                      >
                        <Upload className="w-3 h-3 text-amber-400" />
                        <span>Tải lên</span>
                      </button>
                    </div>

                    {/* Nút tải xuống */}
                    <button
                      type="button"
                      disabled={!scene.imageUrl}
                      onClick={() =>
                        scene.imageUrl && handleDownload(scene.imageUrl, scene.sceneNumber)
                      }
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-500/50 text-emerald-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      title="Tải ảnh PNG về máy"
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
