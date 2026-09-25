import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Plus,
  Wand2,
  Trash2,
  Copy,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  POPULAR_TOKEN_CATEGORIES,
  extractConsistencyTokensFromText,
  isTokenActive,
  toggleTokenInString,
  appendTokensToString,
} from '../utils/consistencyTokens';

interface ConsistencyTokensSuggesterProps {
  descriptionText: string;
  currentTokens: string;
  onChangeTokens: (updatedTokens: string) => void;
  title?: string;
  compact?: boolean;
}

export const ConsistencyTokensSuggester: React.FC<ConsistencyTokensSuggesterProps> = ({
  descriptionText,
  currentTokens,
  onChangeTokens,
  title = 'Gợi Ý Consistency Tokens Đồng Bộ Nhận Diện',
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<string>('auto');
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract tokens automatically from description
  const autoExtractedTokens = useMemo(() => {
    return extractConsistencyTokensFromText(descriptionText);
  }, [descriptionText]);

  // Handle click on a token chip
  const handleToggle = (tok: string) => {
    const updated = toggleTokenInString(currentTokens, tok);
    onChangeTokens(updated);
  };

  // Add all extracted tokens
  const handleAddAllExtracted = () => {
    if (autoExtractedTokens.length === 0) return;
    const updated = appendTokensToString(currentTokens, autoExtractedTokens);
    onChangeTokens(updated);
  };

  // Clear all tokens
  const handleClearAll = () => {
    onChangeTokens('');
  };

  // Copy tokens to clipboard
  const handleCopy = () => {
    if (!currentTokens) return;
    navigator.clipboard.writeText(currentTokens);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const categories = [
    {
      id: 'auto',
      name: `Tự Động Trích Xuất (${autoExtractedTokens.length})`,
      icon: '⚡',
      tokens: autoExtractedTokens,
    },
    ...POPULAR_TOKEN_CATEGORIES,
  ];

  const currentCategory = categories.find((c) => c.id === activeTab) || categories[0];

  return (
    <div className="bg-[#07130b] border border-[#1a3a27] rounded-xl p-3.5 shadow-sm mt-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-600/30 text-lime-400 border border-emerald-500/40">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
              <span>{title}</span>
              {autoExtractedTokens.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-lime-500/20 text-lime-300 border border-lime-500/30">
                  Phát hiện {autoExtractedTokens.length} đặc điểm
                </span>
              )}
            </h4>
            {!compact && (
              <p className="text-[11px] text-emerald-400/90">
                Nhấp vào các đặc điểm dưới đây để tự động đưa vào câu lệnh prompt tạo ảnh đồng bộ
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {autoExtractedTokens.length > 0 && (
            <button
              type="button"
              onClick={handleAddAllExtracted}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Thêm tất cả các đặc điểm AI tự động phát hiện được từ mô tả"
            >
              <Sparkles className="w-3 h-3 text-lime-300" />
              <span>Thêm tất cả gợi ý</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-emerald-400 hover:text-white rounded hover:bg-[#12281b] transition-colors cursor-pointer"
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2.5 scrollbar-thin">
            {categories.map((cat) => {
              const isActive = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold border border-emerald-400 shadow-sm'
                      : 'bg-[#0d2115] text-emerald-300 border border-[#1b3d28] hover:bg-[#153422] hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tokens Grid / Chips */}
          <div className="min-h-[50px] p-2.5 rounded-lg bg-[#040c07] border border-[#142e1f] mb-3">
            {currentCategory.tokens.length === 0 ? (
              <div className="text-center py-3 text-emerald-600 text-xs">
                Chưa có đặc điểm nào được phát hiện từ mô tả. Hãy nhập thêm chi tiết diện mạo hoặc chọn từ các tab bên cạnh!
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {currentCategory.tokens.map((tok) => {
                  const active = isTokenActive(currentTokens, tok);
                  return (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => handleToggle(tok)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer border ${
                        active
                          ? 'bg-emerald-900/90 border-lime-400 text-lime-200 font-bold shadow-md'
                          : 'bg-[#0d2116] border-[#1d432b] text-emerald-300 hover:border-emerald-400 hover:text-white hover:bg-[#143323]'
                      }`}
                      title={active ? 'Nhấp để bỏ chọn' : 'Nhấp để thêm vào prompt'}
                    >
                      {active ? (
                        <Check className="w-3 h-3 text-lime-400 shrink-0" />
                      ) : (
                        <Plus className="w-3 h-3 text-emerald-500 shrink-0" />
                      )}
                      <span>{tok}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Tokens List & Quick Editing */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3 text-lime-400" />
                Tokens đang áp dụng vào Prompt:
              </span>
              <div className="flex items-center gap-2">
                {currentTokens && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-emerald-400 hover:text-lime-300 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Sao chép danh sách tokens"
                    >
                      {isCopied ? <CheckCircle2 className="w-3 h-3 text-lime-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Xóa danh sách"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa hết</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              rows={2}
              value={currentTokens}
              onChange={(e) => onChangeTokens(e.target.value)}
              placeholder="Các đặc điểm đồng bộ nhận diện ngăn cách bởi dấu phẩy (nhấp các nhãn ở trên để thêm tự động)..."
              className="w-full bg-[#050f09] border border-[#183824] rounded-lg p-2 text-xs text-lime-200 font-mono placeholder-emerald-800 focus:outline-none focus:border-emerald-400 resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
};
