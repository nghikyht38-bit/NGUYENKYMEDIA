import React, { useRef, useState, useMemo } from 'react';
import { UploadCloud, Image as ImageIcon, X, Lightbulb, Users, ShieldCheck, Sparkles, Wand2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { ReferenceImage } from '../types';
import { ConsistencyTokensSuggester } from './ConsistencyTokensSuggester';
import { extractConsistencyTokensFromText, appendTokensToString } from '../utils/consistencyTokens';

interface ScriptInputSectionProps {
  idea: string;
  setIdea: (val: string) => void;
  referenceImages: ReferenceImage[];
  setReferenceImages: React.Dispatch<React.SetStateAction<ReferenceImage[]>>;
  characterSeed: string;
  setCharacterSeed: (val: string) => void;
}

export const ScriptInputSection: React.FC<ScriptInputSectionProps> = ({
  idea,
  setIdea,
  referenceImages,
  setReferenceImages,
  characterSeed,
  setCharacterSeed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTokenSuggester, setShowTokenSuggester] = useState(false);

  // Quick extract tokens from idea + characterSeed for instant chips
  const quickExtractedTokens = useMemo(() => {
    return extractConsistencyTokensFromText(`${idea} ${characterSeed}`);
  }, [idea, characterSeed]);

  const handleQuickAddToken = (token: string) => {
    const updated = appendTokensToString(characterSeed, [token]);
    setCharacterSeed(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newImg: ReferenceImage = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          data: base64,
          mimeType: file.type,
          size: file.size,
          previewUrl: base64,
        };
        setReferenceImages((prev) => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
      {/* 1. KHUNG NHẬP Ý TƯỞNG TẠO KỊCH BẢN (Col 7) */}
      <div className="lg:col-span-7 bg-[#0f1f16]/90 border border-[#1e3d2b] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              <h2 className="text-base font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-lime-400" />
                1. Nhập Ý Tưởng Tạo Kịch Bản
              </h2>
            </div>
            <span className="text-xs text-emerald-400/80 font-mono">
              {idea.length} ký tự
            </span>
          </div>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ví dụ: Cuộc phiêu lưu của cậu bé Tí Đô ở vương quốc mây bay bổng. Cậu bé mặc áo choàng đỏ viền vàng, tóc đen vuốt nhọn, mang đôi giày trượt phản trọng lực bay qua các đảo đá thần tiên..."
            rows={5}
            className="w-full bg-[#08120c] border border-[#1e3c2a] rounded-xl p-3.5 text-sm text-emerald-100 placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all leading-relaxed shadow-inner"
          />

          {/* Optional character detail override & consistency tokens */}
          <div className="mt-3 pt-3 border-t border-[#183623]">
            <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-emerald-300 font-medium">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ghi chú nhân vật đồng bộ (Tùy chọn bổ sung):</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenSuggester(!showTokenSuggester)}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-[#142d1f] hover:bg-[#1d412d] border border-[#234d35] text-lime-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Mở bảng gợi ý tokens nhận diện thông minh"
              >
                <Wand2 className="w-3 h-3 text-lime-400" />
                <span>Gợi ý Tokens</span>
                {showTokenSuggester ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <input
              type="text"
              value={characterSeed}
              onChange={(e) => setCharacterSeed(e.target.value)}
              placeholder="VD: Cậu bé 12 tuổi, mắt xanh lá, áo khoác da nâu có huy hiệu sao băng, luôn đi ủng cao cổ..."
              className="w-full bg-[#08120c] border border-[#1e3c2a] rounded-lg px-3 py-2 text-xs text-emerald-200 placeholder-emerald-700 focus:outline-none focus:border-emerald-500 shadow-inner"
            />

            {/* Quick extracted chips directly below input */}
            {quickExtractedTokens.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-lime-400" />
                  Đặc điểm nhận diện nhanh:
                </span>
                {quickExtractedTokens.slice(0, 6).map((tok) => (
                  <button
                    key={tok}
                    type="button"
                    onClick={() => handleQuickAddToken(tok)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d2316] hover:bg-emerald-800 border border-[#1f482f] text-emerald-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    title={`Thêm "${tok}" vào ghi chú nhân vật`}
                  >
                    <span>+</span>
                    <span>{tok}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Full collapsible token suggester */}
            {showTokenSuggester && (
              <ConsistencyTokensSuggester
                descriptionText={`${idea} ${characterSeed}`}
                currentTokens={characterSeed}
                onChangeTokens={setCharacterSeed}
                title="Bảng Chọn Nhanh Đặc Điểm Nhận Dạng (Consistency Tokens)"
              />
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-400/80 bg-[#08130d] p-2.5 rounded-lg border border-[#183523]">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            AI sẽ tự phân tích ý tưởng thành phân cảnh có diễn tiến kịch bản điện ảnh mạch lạc.
          </span>
          <span className="hidden sm:inline text-emerald-600">Hỗ trợ tối đa 100 cảnh</span>
        </div>
      </div>

      {/* 2. KHUNG TẢI HÌNH ẢNH THAM CHIẾU (Col 5) */}
      <div className="lg:col-span-5 bg-[#0f1f16]/90 border border-[#1e3d2b] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-lime-500 rounded-full inline-block"></span>
              <h2 className="text-base font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-lime-400" />
                Khung Tải Hình Ảnh Tham Chiếu
              </h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-[#13281c] text-emerald-300 border border-[#21432f]">
              Đã tải: {referenceImages.length} ảnh
            </span>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#234b34] hover:border-emerald-500/80 bg-[#08120c]/80 hover:bg-[#0d1d14] rounded-xl p-4 text-center cursor-pointer transition-all duration-200 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#13281c] group-hover:bg-emerald-600/25 text-emerald-400 group-hover:text-emerald-300 flex items-center justify-center transition-colors">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-emerald-200 group-hover:text-emerald-100">
                Nhấn hoặc Kéo thả nhiều ảnh nhân vật vào đây
              </p>
              <p className="text-[11px] text-emerald-500">
                Tải ảnh chân dung, trang phục, hoặc phong cách bối cảnh tham chiếu (PNG, JPG, WebP)
              </p>
            </div>
          </div>

          {/* Uploaded Thumbnails Grid */}
          {referenceImages.length > 0 ? (
            <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-28 overflow-y-auto pr-1">
              {referenceImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group rounded-lg overflow-hidden border border-[#234b34] aspect-square bg-[#070e0a] shadow"
                >
                  <img
                    src={img.previewUrl}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-[#070e0a]/90 text-[9px] text-emerald-300 truncate px-1 py-0.5">
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 p-2.5 rounded-lg bg-[#0d2217] border border-[#1b432e] text-[11px] text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Tự động Đồng Bộ:</strong> Nếu không có hình ảnh tham chiếu, hệ thống AI sẽ tự tạo Bản Thiết Kế Nhân Vật Gốc (Master Character Anchor) và tự động đồng bộ xuyên suốt 100% video!
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 text-[10px] text-emerald-500/80 italic">
          * Hỗ trợ tải cùng lúc nhiều ảnh để AI phân tích khuôn mặt & trang phục nhân vật.
        </div>
      </div>
    </div>
  );
};
