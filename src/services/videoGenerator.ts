import JSZip from 'jszip';
import { Scene, TransitionEffect, SubtitleConfig } from '../types';
import { generateSrtContent } from './subtitleService';

/**
 * Creates a high-fidelity stylized canvas image if direct API image generation fails
 * or for immediate offline previews.
 */
export function createStyledPlaceholderImage(
  title: string,
  promptVi: string,
  style: string,
  characterName: string,
  aspectRatio: string = '16:9'
): string {
  const canvas = document.createElement('canvas');
  let width = 1280;
  let height = 720;
  if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '1:1') {
    width = 1000;
    height = 1000;
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient based on style
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (style.includes('Hoạt Hình') || style.includes('Anime')) {
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#4338ca');
    grad.addColorStop(1, '#ec4899');
  } else if (style.includes('Điện Ảnh') || style.includes('Phim')) {
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0f172a');
  } else if (style.includes('Cyberpunk')) {
    grad.addColorStop(0, '#111827');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#f43f5e');
  } else {
    grad.addColorStop(0, '#18181b');
    grad.addColorStop(0.5, '#27272a');
    grad.addColorStop(1, '#3f3f46');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Stylized grid & particle lights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Radial glow
  const radialGlow = ctx.createRadialGradient(
    width / 2,
    height * 0.45,
    50,
    width / 2,
    height * 0.45,
    width * 0.6
  );
  radialGlow.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // Character Avatar / Silhouette anchor
  ctx.save();
  ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.4, Math.min(width, height) * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = '#312e81';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#818cf8';
  ctx.stroke();
  ctx.restore();

  // Character icon glyph
  ctx.fillStyle = '#e0e7ff';
  ctx.font = `bold ${Math.floor(Math.min(width, height) * 0.08)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎭', width / 2, height * 0.39);

  // Character badge
  ctx.fillStyle = '#4f46e5';
  const badgeWidth = Math.min(width * 0.6, 400);
  const badgeHeight = 44;
  const badgeX = width / 2 - badgeWidth / 2;
  const badgeY = height * 0.58;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Nhân vật: ${characterName || 'Đồng Bộ'}`, width / 2, badgeY + 28);

  // Scene Title
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(Math.min(width, height) * 0.045)}px sans-serif`;
  ctx.fillText(title, width / 2, height * 0.7);

  // Prompt summary
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '18px sans-serif';
  const cleanDesc = promptVi ? promptVi.slice(0, 110) + '...' : style;
  ctx.fillText(cleanDesc, width / 2, height * 0.78);

  // Watermark/Style Tag
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText(`[ ${style} • AutoVideo AI Studio ]`, width / 2, height - 30);

  return canvas.toDataURL('image/png');
}

/**
 * Synthesizes a real playable dynamic video clip with camera motion and audio
 * from a static image + optional speech track + subtitles.
 */
export async function synthesizeSceneVideoClip(
  imageUrl: string,
  dialogue: string = '',
  cameraMovement: string = 'Cinematic Zoom In',
  durationSeconds: number = 8,
  aspectRatio: string = '16:9',
  audioUrl?: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        let width = 1280;
        let height = 720;
        if (aspectRatio === '9:16') {
          width = 720;
          height = 1280;
        } else if (aspectRatio === '1:1') {
          width = 1000;
          height = 1000;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot create 2d context for video synthesis'));
          return;
        }

        const fps = 30;
        const totalFrames = Math.max(1, Math.floor(durationSeconds * fps));
        const canvasStream = canvas.captureStream(fps);

        // Web Audio routing if audio track provided
        let audioCtx: AudioContext | null = null;
        let sourceNode: AudioNode | null = null;
        let audioElem: HTMLAudioElement | null = null;

        if (audioUrl) {
          try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();
            audioElem = new Audio(audioUrl);
            audioElem.crossOrigin = 'anonymous';
            const track = audioCtx.createMediaElementSource(audioElem);
            track.connect(dest);
            track.connect(audioCtx.destination);
            for (const audioTrack of dest.stream.getAudioTracks()) {
              canvasStream.addTrack(audioTrack);
            }
          } catch (e) {
            console.warn('Audio routing skipped:', e);
          }
        }

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';

        const recorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: 4000000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (audioElem) {
            audioElem.pause();
          }
          if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {});
          }
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };

        recorder.start();
        if (audioElem) {
          audioElem.play().catch(() => {});
        }

        let frame = 0;
        const drawFrame = () => {
          if (frame >= totalFrames) {
            recorder.stop();
            return;
          }

          const progress = frame / totalFrames; // 0 to 1

          // Camera motion simulation (Ken Burns zoom / pan)
          let scale = 1.0;
          let panX = 0;
          let panY = 0;

          if (cameraMovement.toLowerCase().includes('zoom in') || cameraMovement.includes('Close-up')) {
            scale = 1.0 + progress * 0.18; // smooth zoom in
          } else if (cameraMovement.toLowerCase().includes('zoom out') || cameraMovement.includes('Wide')) {
            scale = 1.18 - progress * 0.18; // smooth zoom out
          } else if (cameraMovement.toLowerCase().includes('pan left')) {
            scale = 1.1;
            panX = -(progress * 60);
          } else if (cameraMovement.toLowerCase().includes('pan right')) {
            scale = 1.1;
            panX = (progress * 60);
          } else {
            // cinematic gentle push-in
            scale = 1.0 + Math.sin(progress * Math.PI) * 0.08;
            panY = Math.sin(progress * Math.PI) * 20;
          }

          ctx.clearRect(0, 0, width, height);
          ctx.save();

          // Apply transform from center
          ctx.translate(width / 2 + panX, height / 2 + panY);
          ctx.scale(scale, scale);
          ctx.translate(-width / 2, -height / 2);

          // Draw the base image filling canvas
          const imgAspect = img.width / img.height;
          const canvasAspect = width / height;
          let dw = width;
          let dh = height;
          let dx = 0;
          let dy = 0;

          if (imgAspect > canvasAspect) {
            dh = height;
            dw = height * imgAspect;
            dx = (width - dw) / 2;
          } else {
            dw = width;
            dh = width / imgAspect;
            dy = (height - dh) / 2;
          }

          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();

          // Subtle lighting ray / film grain / ambient vignette
          const vignette = ctx.createRadialGradient(
            width / 2,
            height / 2,
            width * 0.3,
            width / 2,
            height / 2,
            width * 0.75
          );
          vignette.addColorStop(0, 'rgba(0,0,0,0)');
          vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, width, height);

          // Subtitle bar if dialogue exists
          if (dialogue && dialogue.trim()) {
            const subBarHeight = 70;
            const subY = height - subBarHeight - 35;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.beginPath();
            ctx.roundRect(width * 0.06, subY, width * 0.88, subBarHeight, 14);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 8;
            ctx.fillText(dialogue, width / 2, subY + subBarHeight / 2);
            ctx.restore();
          }

          // Progress indicator at top border
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(0, 0, width * progress, 4);

          frame++;
          requestAnimationFrame(drawFrame);
        };

        requestAnimationFrame(drawFrame);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Failed to load image for video rendering: ' + e));
    img.src = imageUrl;
  });
}

/**
 * Stitches multiple ready video scenes sequentially into one combined Master Video!
 */
export async function stitchAllReadyVideos(
  scenes: Scene[],
  aspectRatio: string = '16:9',
  onProgress?: (current: number, total: number) => void,
  bgMusicOptions?: { url?: string; volume?: number },
  transitionEffect: TransitionEffect = 'crossfade',
  subtitleConfig?: SubtitleConfig
): Promise<Blob> {
  const readyScenes = scenes.filter((s) => s.videoUrl || s.imageUrl);
  if (readyScenes.length === 0) {
    throw new Error('Chưa có cảnh nào có video hoặc hình ảnh để ghép.');
  }

  let width = 1280;
  let height = 720;
  if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '1:1') {
    width = 1000;
    height = 1000;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const fps = 30;
  const canvasStream = canvas.captureStream(fps);

  // Background Music setup
  let bgAudioEl: HTMLAudioElement | null = null;
  let audioContext: AudioContext | null = null;

  if (bgMusicOptions?.url) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      bgAudioEl = new Audio();
      bgAudioEl.crossOrigin = 'anonymous';
      bgAudioEl.src = bgMusicOptions.url;
      bgAudioEl.volume = bgMusicOptions.volume ?? 0.35;
      bgAudioEl.loop = true;

      const source = audioContext.createMediaElementSource(bgAudioEl);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = bgMusicOptions.volume ?? 0.35;
      const destination = audioContext.createMediaStreamDestination();

      source.connect(gainNode);
      gainNode.connect(destination);

      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
    } catch (e) {
      console.warn('Không thể khởi tạo luồng âm thanh nền:', e);
    }
  }

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 5000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  // Preload all ready scene images
  const loadedImages: HTMLImageElement[] = await Promise.all(
    readyScenes.map((sc) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          img.src = createStyledPlaceholderImage(
            sc.title,
            sc.imagePromptVi || '',
            'Điện Ảnh',
            'Nhân vật'
          );
          resolve(img);
        };
        img.src =
          sc.imageUrl ||
          createStyledPlaceholderImage(
            sc.title,
            sc.imagePromptVi || '',
            'Điện Ảnh',
            'Nhân vật'
          );
      });
    })
  );

  function drawCover(
    targetCtx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    w: number,
    h: number,
    scale: number = 1.0,
    offsetX: number = 0,
    offsetY: number = 0,
    alpha: number = 1.0
  ) {
    targetCtx.save();
    targetCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
    targetCtx.translate(w / 2 + offsetX, h / 2 + offsetY);
    targetCtx.scale(scale, scale);
    targetCtx.translate(-w / 2, -h / 2);

    const imgAspect = img.width / img.height;
    const canvasAspect = w / h;
    let dw = w;
    let dh = h;
    let dx = 0;
    let dy = 0;

    if (imgAspect > canvasAspect) {
      dh = h;
      dw = h * imgAspect;
      dx = (w - dw) / 2;
    } else {
      dw = w;
      dh = w / imgAspect;
      dy = (h - dh) / 2;
    }

    targetCtx.drawImage(img, dx, dy, dw, dh);
    targetCtx.restore();
  }

  return new Promise(async (resolve, reject) => {
    recorder.onstop = () => {
      if (bgAudioEl) {
        bgAudioEl.pause();
        bgAudioEl = null;
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
      const combinedBlob = new Blob(chunks, { type: mimeType });
      resolve(combinedBlob);
    };

    if (bgAudioEl) {
      bgAudioEl.play().catch(() => {});
    }

    recorder.start();

    try {
      for (let i = 0; i < readyScenes.length; i++) {
        const sc = readyScenes[i];
        onProgress?.(i + 1, readyScenes.length);

        const durationSec = Math.max(3, parseInt(sc.duration) || 5);
        const totalSceneFrames = durationSec * fps;
        const transitionFrames =
          transitionEffect !== 'none' && i < readyScenes.length - 1
            ? Math.min(18, Math.floor(totalSceneFrames * 0.25)) // ~0.6s
            : 0;

        const currentImg = loadedImages[i];
        const nextImg = loadedImages[i + 1];

        for (let f = 0; f < totalSceneFrames; f++) {
          const progress = f / totalSceneFrames;
          const scale = 1.0 + progress * 0.12;

          ctx.clearRect(0, 0, width, height);

          const isTransitioning =
            transitionFrames > 0 && f >= totalSceneFrames - transitionFrames;
          const t = isTransitioning
            ? (f - (totalSceneFrames - transitionFrames)) / transitionFrames
            : 0;

          if (!isTransitioning || !nextImg) {
            // Normal scene frame
            drawCover(ctx, currentImg, width, height, scale);
          } else {
            // Render Transition Effects
            switch (transitionEffect) {
              case 'crossfade':
                drawCover(ctx, currentImg, width, height, scale, 0, 0, 1 - t);
                drawCover(ctx, nextImg, width, height, 1.0, 0, 0, t);
                break;

              case 'fade_black':
                if (t < 0.5) {
                  drawCover(ctx, currentImg, width, height, scale);
                  ctx.fillStyle = `rgba(0, 0, 0, ${t * 2})`;
                  ctx.fillRect(0, 0, width, height);
                } else {
                  drawCover(ctx, nextImg, width, height, 1.0);
                  ctx.fillStyle = `rgba(0, 0, 0, ${(1 - t) * 2})`;
                  ctx.fillRect(0, 0, width, height);
                }
                break;

              case 'wipe_left':
                drawCover(ctx, currentImg, width, height, scale);
                drawCover(ctx, nextImg, width, height, 1.0, (1 - t) * width);
                break;

              case 'zoom_push':
                drawCover(
                  ctx,
                  currentImg,
                  width,
                  height,
                  scale * (1.0 + t * 0.3),
                  0,
                  0,
                  1 - t
                );
                drawCover(ctx, nextImg, width, height, 1.25 - t * 0.25, 0, 0, t);
                break;

              case 'flash_white':
                if (t < 0.5) {
                  drawCover(ctx, currentImg, width, height, scale);
                  ctx.fillStyle = `rgba(255, 255, 255, ${t * 2})`;
                  ctx.fillRect(0, 0, width, height);
                } else {
                  drawCover(ctx, nextImg, width, height, 1.0);
                  ctx.fillStyle = `rgba(255, 255, 255, ${(1 - t) * 2})`;
                  ctx.fillRect(0, 0, width, height);
                }
                break;

              default:
                drawCover(ctx, currentImg, width, height, scale);
                break;
            }
          }

          // Subtitle bar
          const showSubtitle =
            subtitleConfig?.enabled !== false &&
            sc.dialogue &&
            sc.dialogue.trim() &&
            (!isTransitioning || t < 0.5);

          if (showSubtitle) {
            const fontSize = subtitleConfig?.fontSize || 24;
            const fontFamily = subtitleConfig?.fontFamily || 'system-ui, sans-serif';
            const textColor = subtitleConfig?.textColor || '#ffffff';
            const bgColor = subtitleConfig?.bgColor ?? 'rgba(0,0,0,0.75)';
            const pos = subtitleConfig?.position || 'bottom';

            const subH = fontSize + 36;
            let subY = height - subH - 32;
            if (pos === 'top') {
              subY = 40;
            } else if (pos === 'center') {
              subY = (height - subH) / 2;
            }

            if (bgColor !== 'rgba(0, 0, 0, 0)') {
              ctx.fillStyle = bgColor;
              ctx.beginPath();
              ctx.roundRect(width * 0.08, subY, width * 0.84, subH, 12);
              ctx.fill();
            }

            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textToDraw = sc.dialogue || '';
            if (bgColor === 'rgba(0, 0, 0, 0)') {
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 4;
              ctx.strokeText(textToDraw, width / 2, subY + subH / 2);
            }

            ctx.fillStyle = textColor;
            ctx.fillText(textToDraw, width / 2, subY + subH / 2);
          }

          // Scene counter overlay top left
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.roundRect(20, 20, 150, 36, 8);
          ctx.fill();
          ctx.fillStyle = '#818cf8';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Cảnh ${i + 1}/${readyScenes.length}`, 95, 43);

          await new Promise((r) => setTimeout(r, 1000 / fps));
        }
      }

      recorder.stop();
    } catch (err) {
      recorder.stop();
      reject(err);
    }
  });
}

/**
 * Packs all project assets (prompts, images, videos, audio, script) into a single ZIP file.
 */
export async function downloadProjectBatchZip(
  title: string,
  scenes: Scene[],
  scriptSummary: string,
  characterProfile: any
): Promise<void> {
  const zip = new JSZip();

  // 1. Script JSON & TXT
  const scriptContent = {
    title,
    summary: scriptSummary,
    characterProfile,
    totalScenes: scenes.length,
    scenes: scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      title: s.title,
      duration: s.duration,
      dialogue: s.dialogue,
      imagePrompt: s.imagePrompt,
      imagePromptVi: s.imagePromptVi,
      videoPrompt: s.videoPrompt,
      videoPromptVi: s.videoPromptVi,
      cameraMovement: s.cameraMovement,
    })),
  };
  zip.file('kich_ban_chi_tiet.json', JSON.stringify(scriptContent, null, 2));

  // Readable text script
  let textDoc = `=== ${title.toUpperCase()} ===\n`;
  textDoc += `Tóm tắt: ${scriptSummary}\n`;
  textDoc += `Nhân vật chính: ${characterProfile?.name} - ${characterProfile?.appearance} | ${characterProfile?.clothing}\n\n`;
  scenes.forEach((s) => {
    textDoc += `--- CẢNH ${s.sceneNumber}: ${s.title} (${s.duration}) ---\n`;
    textDoc += `Lời thoại: ${s.dialogue || '(Không có)'}\n`;
    textDoc += `Prompt Ảnh: ${s.imagePrompt}\n`;
    textDoc += `Prompt Video: ${s.videoPrompt}\n`;
    textDoc += `Góc máy: ${s.cameraMovement || 'N/A'}\n\n`;
  });
  zip.file('kich_ban_tieng_viet.txt', textDoc);
  zip.file('phu_de_chuan_dong_bo.srt', '\uFEFF' + generateSrtContent(scenes));

  // 2. Images folder
  const imgFolder = zip.folder('hinh_anh');
  const videoFolder = zip.folder('video');

  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const prefix = `canh_${String(s.sceneNumber).padStart(3, '0')}`;

    if (s.imageUrl && s.imageUrl.startsWith('data:image')) {
      const base64Data = s.imageUrl.split(',')[1];
      imgFolder?.file(`${prefix}_image.png`, base64Data, { base64: true });
    }

    if (s.videoBlob) {
      videoFolder?.file(`${prefix}_video.webm`, s.videoBlob);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = `${title.replace(/\s+/g, '_')}_batch_export.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
