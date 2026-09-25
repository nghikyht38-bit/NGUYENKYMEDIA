import { Scene, SubtitleConfig } from '../types';

/**
 * Formats milliseconds into standard SRT timestamp format: HH:MM:SS,mmm
 */
export function formatSrtTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Generates valid .SRT subtitle content from scenes dialogues
 */
export function generateSrtContent(scenes: Scene[]): string {
  let srt = '';
  let cumulativeMs = 0;
  let srtIndex = 1;

  scenes.forEach((scene) => {
    const durationSec = Math.max(3, parseInt(scene.duration) || 5);
    const startMs = cumulativeMs;
    const endMs = cumulativeMs + durationSec * 1000;
    cumulativeMs = endMs;

    const dialogueText = scene.dialogue?.trim() || `(Cảnh ${scene.sceneNumber}: ${scene.title})`;

    srt += `${srtIndex}\n`;
    srt += `${formatSrtTime(startMs)} --> ${formatSrtTime(endMs)}\n`;
    srt += `${dialogueText}\n\n`;
    srtIndex++;
  });

  return srt;
}

/**
 * Triggers client-side download of the .SRT file
 */
export function downloadSrtFile(scenes: Scene[], projectTitle: string): void {
  const srtContent = generateSrtContent(scenes);
  // Add UTF-8 BOM so Vietnamese characters render accurately in any player (VLC, CapCut, Premiere, etc.)
  const blob = new Blob(['\uFEFF' + srtContent], { type: 'text/srt;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (projectTitle || 'Phu_De_Video').replace(/\s+/g, '_');
  a.download = `${safeName}.srt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Default Subtitle Styling Configuration
 */
export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  enabled: true,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 24,
  textColor: '#ffffff',
  position: 'bottom',
  bgColor: 'rgba(0, 0, 0, 0.75)',
  strokeColor: '#000000',
};

export const SUBTITLE_FONTS = [
  { id: 'system-ui, -apple-system, sans-serif', name: 'Hiện đại (Modern Sans)' },
  { id: 'Georgia, serif', name: 'Điện ảnh (Classic Serif)' },
  { id: 'Playfair Display, Georgia, serif', name: 'Uy nghi (Playfair Serif)' },
  { id: 'ui-monospace, monospace', name: 'Công nghệ (Monospace)' },
];

export const SUBTITLE_COLORS = [
  { hex: '#ffffff', name: 'Trắng Sáng' },
  { hex: '#fbbf24', name: 'Vàng Hoàng Kim' },
  { hex: '#a3e635', name: 'Xanh Chanh Neon' },
  { hex: '#38bdf8', name: 'Xanh Biển Nhẹ' },
  { hex: '#f43f5e', name: 'Hồng Đỏ Nổi Bật' },
];

export const SUBTITLE_BG_STYLES = [
  { val: 'rgba(0, 0, 0, 0.75)', name: 'Hộp Đen Mờ (Rõ Nét)' },
  { val: 'rgba(4, 38, 24, 0.85)', name: 'Xanh Ngọc Cinema' },
  { val: 'rgba(0, 0, 0, 0)', name: 'Trong Suốt (Viền Chữ)' },
];
