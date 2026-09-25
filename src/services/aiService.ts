import { ReferenceImage, Scene, ScriptAnalysisResult, StudioConfig } from '../types';
import { getActiveApiKey } from './authService';
import { createStyledPlaceholderImage } from './videoGenerator';

function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const activeKey = getActiveApiKey();
  if (activeKey) {
    headers['x-api-key'] = activeKey;
  }
  return headers;
}

export async function analyzeScript(
  idea: string,
  config: StudioConfig,
  referenceImages: ReferenceImage[] = [],
  characterSeed?: string
): Promise<ScriptAnalysisResult> {
  const payload = {
    idea,
    sceneCount: config.sceneCount,
    model: config.model,
    hasDialogue: config.hasDialogue,
    style: config.style,
    voice: config.voice,
    voiceTone: config.voiceTone || 'đọc nhẹ, nhanh, giọng trầm ấm',
    duration: config.duration,
    aspectRatio: config.aspectRatio,
    referenceImages: referenceImages.map((img) => ({
      data: img.data,
      mimeType: img.mimeType,
      name: img.name,
    })),
    characterSeed,
  };

  try {
    const response = await fetch('/api/analyze-script', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      // Running on static hosting like GitHub Pages without Express backend
      return await analyzeScriptClientSide(idea, config, characterSeed);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Lỗi phân tích kịch bản (${response.status})`);
    }

    const data = await response.json();
    return formatAnalysisResult(data, config);
  } catch (err: any) {
    // If network error (backend not running, e.g. GitHub Pages)
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('404')) {
      return await analyzeScriptClientSide(idea, config, characterSeed);
    }
    throw err;
  }
}

function formatAnalysisResult(data: any, config: StudioConfig): ScriptAnalysisResult {
  const formattedScenes: Scene[] = (data.scenes || []).map((sc: any, index: number) => ({
    id: `scene-${index + 1}-${Date.now()}`,
    sceneNumber: sc.sceneNumber || index + 1,
    title: sc.title || `Phân cảnh ${index + 1}`,
    imagePrompt: sc.imagePrompt || '',
    imagePromptVi: sc.imagePromptVi || '',
    videoPrompt: sc.videoPrompt || '',
    videoPromptVi: sc.videoPromptVi || '',
    cameraMovement: sc.cameraMovement || 'Cinematic Dolly',
    dialogue: sc.dialogue || '',
    voiceToneNote: sc.voiceToneNote || config.voiceTone || 'đọc nhẹ, nhanh, giọng trầm ấm',
    duration: sc.duration || config.duration,
    imageStatus: 'idle',
    videoStatus: 'idle',
  }));

  return {
    title: data.title || 'Kịch Bản Video Hàng Loạt',
    summary: data.summary || '',
    characterProfile: data.characterProfile || {
      name: 'Nhân vật chính',
      appearance: 'Đồng bộ khuôn mặt và phong cách',
      clothing: 'Trang phục chuẩn kịch bản',
      consistencyTokens: 'consistent master character',
    },
    scenes: formattedScenes,
  };
}

async function analyzeScriptClientSide(
  idea: string,
  config: StudioConfig,
  characterSeed?: string
): Promise<ScriptAnalysisResult> {
  const activeKey = getActiveApiKey();
  const count = Math.min(Math.max(Number(config.sceneCount) || 1, 1), 100);

  if (activeKey) {
    try {
      const prompt = `Bạn là đạo diễn điện ảnh. Phân tích ý tưởng: "${idea}". Hãy tạo kịch bản phân cảnh gồm đúng ${count} cảnh với phong cách ${config.style}, tỉ lệ ${config.aspectRatio}. Trả về JSON với title, summary, characterProfile (name, appearance, clothing, consistencyTokens) và mảng scenes (sceneNumber, title, imagePrompt, imagePromptVi, videoPrompt, videoPromptVi, cameraMovement, dialogue, voiceToneNote, duration).`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(activeKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        const genData = await res.json();
        const text = genData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return formatAnalysisResult(parsed, config);
        }
      }
    } catch (_) {}
  }

  // Smart client-side generator for offline or static hosting
  const charName = characterSeed
    ? characterSeed.split(/[,;\.]/)[0].trim().slice(0, 30)
    : idea.includes('Leo')
    ? 'Leo - Phi Hành Gia Nhí'
    : 'Nhân Vật Chính (Master Protagonist)';

  const charAppearance = characterSeed || 'Khuôn mặt góc cạnh, đôi mắt kiên định, vóc dáng phong trần điện ảnh';
  const charClothing = 'Trang phục chuẩn kịch bản, áo khoác đặc trưng, phụ kiện đồng bộ';
  const consistencyTokens = `master protagonist ${charName}, consistent face geometry, ${charAppearance}, identical outfit across all scenes, cinematic 8k`;

  const fallbackScenes: Scene[] = [];
  for (let i = 1; i <= count; i++) {
    fallbackScenes.push({
      id: `scene-${i}-${Date.now()}`,
      sceneNumber: i,
      title: `Phân cảnh ${i}: Diễn biến câu chuyện ${charName}`,
      imagePrompt: `Cinematic wide master shot of ${charName}, ${consistencyTokens}, set in ${config.style} aesthetic, scene ${i} of the adventure based on: ${idea.slice(0, 80)}. Masterpiece lighting, dynamic depth of field, 8k resolution.`,
      imagePromptVi: `Phân cảnh ${i}: ${charName} xuất hiện với tạo hình đồng bộ, phong cách ${config.style}, bối cảnh điện ảnh sắc nét.`,
      videoPrompt: `Cinematic camera dolly motion tracking ${charName} moving naturally through environment, atmospheric depth, realistic motion blur.`,
      videoPromptVi: `Góc máy chuyển động mượt mà bám theo ${charName}, tạo cảm giác điện ảnh sống động.`,
      cameraMovement: i % 2 === 0 ? 'Cinematic Dolly Push-In' : 'Cinematic Slow Pan Right',
      dialogue: config.hasDialogue ? `Phân đoạn ${i}: Hành trình của ${charName} tiếp tục mở ra những diễn biến bất ngờ mới.` : '',
      voiceToneNote: config.voiceTone || 'đọc nhẹ, nhanh, giọng trầm ấm',
      duration: config.duration,
      imageStatus: 'idle',
      videoStatus: 'idle',
    });
  }

  return {
    title: `Kịch Bản: ${idea.slice(0, 50)}...`,
    summary: `Kịch bản phân cảnh ${count} cảnh cho ý tưởng: "${idea}". Nhân vật chính ${charName} được thiết kế đồng bộ nhất quán 100% diện mạo và trang phục xuyên suốt.`,
    characterProfile: {
      name: charName,
      appearance: charAppearance,
      clothing: charClothing,
      consistencyTokens,
    },
    scenes: fallbackScenes,
  };
}

export async function generateSceneImage(
  prompt: string,
  aspectRatio: string,
  referenceImage?: ReferenceImage | null,
  characterConsistency?: string
): Promise<string> {
  const payload: any = {
    prompt,
    aspectRatio,
    characterConsistency,
  };

  if (referenceImage) {
    payload.referenceImage = {
      data: referenceImage.data,
      mimeType: referenceImage.mimeType,
    };
  }

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      return createStyledPlaceholderImage(
        prompt,
        prompt,
        'Điện Ảnh',
        characterConsistency || 'Nhân vật chính',
        aspectRatio
      );
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tạo ảnh qua API');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (err: any) {
    // Graceful fallback for static deployment (GitHub Pages) or offline
    return createStyledPlaceholderImage(
      prompt,
      prompt,
      'Điện Ảnh',
      characterConsistency || 'Nhân vật chính',
      aspectRatio
    );
  }
}

export async function generateSceneSpeech(
  text: string,
  voice: string,
  voiceTone: string = 'đọc nhẹ, nhanh, giọng trầm ấm'
): Promise<string | undefined> {
  try {
    const response = await fetch('/api/generate-tts', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({ text, voice, voiceTone }),
    });

    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    return data.audioData || undefined;
  } catch {
    return undefined;
  }
}

export async function generateVeoVideo(
  prompt: string,
  model: string,
  aspectRatio: string,
  imageBase64?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.('Đang gửi yêu cầu khởi tạo Veo Video...');
  const initRes = await fetch('/api/generate-video', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ prompt, model, aspectRatio, imageBase64 }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi bắt đầu Veo Video');
  }

  const initData = await initRes.json();
  const operationName = initData.operationName;

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  while (attempts < maxAttempts) {
    attempts++;
    onProgress?.(`Đang render video Veo (${attempts * 5}s)... Vui lòng đợi.`);
    await new Promise((r) => setTimeout(r, 5000));

    const statusRes = await fetch('/api/video-status', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({ operationName }),
    });

    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();

    if (statusData.error) {
      throw new Error(statusData.error.message || 'Lỗi từ Veo Video API');
    }

    if (statusData.done && statusData.hasVideo) {
      onProgress?.('Video đã render xong! Đang tải stream video...');
      const dlRes = await fetch('/api/video-download', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ operationName }),
      });

      if (!dlRes.ok) {
        throw new Error('Không thể tải video từ server');
      }

      const blob = await dlRes.blob();
      return URL.createObjectURL(blob);
    }
  }

  throw new Error('Hết thời gian chờ kết quả từ Veo API.');
}
