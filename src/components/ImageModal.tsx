import React from 'react';
import { X, Download, Copy, Check, ZoomIn } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  prompt: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  prompt,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e2016] border border-[#234b34] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1b3c29]">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white truncate max-w-md">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              title="Tải ảnh PNG này về máy"
            >
              <Download className="w-4 h-4" />
              <span>Tải về</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#142e20] hover:bg-[#1f452f] text-emerald-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-[#070e0a]">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Modal Footer: Prompt details */}
        <div className="p-4 border-t border-[#1b3c29] bg-[#0c1a12] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-emerald-400 font-semibold">Prompt chi tiết tạo ảnh:</span>
            <button
              onClick={handleCopy}
              className="text-lime-400 hover:text-lime-300 flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép prompt'}</span>
            </button>
          </div>
          <p className="text-emerald-200 font-mono text-[11px] bg-[#070e0a] p-2.5 rounded border border-[#1b3b28] leading-relaxed max-h-24 overflow-y-auto">
            {prompt}
          </p>
        </div>
      </div>
    </div>
  );
};
