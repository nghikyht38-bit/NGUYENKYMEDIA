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

// Detect if the app is hosted on static pages (e.g. GitHub Pages) where /api doesn't exist
const isStaticHosting =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('github.io') ||
    window.location.hostname.endsWith('pages.dev') ||
    window.location.protocol === 'file:');

export async function analyzeScript(
  idea: string,
  config: StudioConfig,
  referenceImages: ReferenceImage[] = [],
  characterSeed?: string
): Promise<ScriptAnalysisResult> {
  // If running on GitHub Pages, directly use client-side generator to avoid failed network requests
  if (isStaticHosting) {
    return await analyzeScriptClientSide(idea, config, characterSeed);
  }

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

    if (response.status === 404 || !response.ok) {
      return await analyzeScriptClientSide(idea, config, characterSeed);
    }

    const data = await response.json();
    return formatAnalysisResult(data, config);
  } catch (_err: any) {
    return await analyzeScriptClientSide(idea, config, characterSeed);
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
  const activeKey = getActiveApiKey();

  // 1. If running on static hosting (GitHub Pages) or client-side mode with Gemini API key
  if (isStaticHosting) {
    // Try generating real AI image via Gemini 3.1 Flash Image if API key is present
    if (activeKey) {
      try {
        const fullPrompt = characterConsistency
          ? `Consistent character ${characterConsistency}. Scene action: ${prompt}. Cinematic lighting, 8k resolution, masterpiece.`
          : `${prompt}, cinematic quality, ultra-detailed 8k masterpiece.`;

        const parts: any[] = [];
        if (referenceImage && referenceImage.data) {
          const cleanBase64 = referenceImage.data.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: referenceImage.mimeType || 'image/jpeg',
            },
          });
          parts.push({
            text: `Follow the character facial features and outfit from this reference image: ${fullPrompt}`,
          });
        } else {
          parts.push({ text: fullPrompt });
        }

        const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
        const selectedRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${encodeURIComponent(activeKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                imageConfig: {
                  aspectRatio: selectedRatio,
                  imageSize: '1K',
                },
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const cand = geminiData.candidates?.[0]?.content?.parts || [];
          for (const p of cand) {
            if (p.inlineData?.data) {
              return `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`;
            }
          }
        }
      } catch (geminiImgErr) {
        console.warn('Direct Gemini Image API attempt failed, trying Banana Image Provider:', geminiImgErr);
      }
    }

    // 2. High-speed Banana AI Image Generation (Banana / Pollinations AI Engine)
    try {
      const cleanPrompt = encodeURIComponent(
        `${characterConsistency ? characterConsistency + ', ' : ''}${prompt}, cinematic masterpiece, 8k`
      );
      const width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 1024 : 1280;
      const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1024 : 720;
      const seed = Math.floor(Math.random() * 999999);
      const bananaUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

      // Preload test image to verify connectivity
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        testImg.onload = res;
        testImg.onerror = rej;
        testImg.src = bananaUrl;
      });

      return bananaUrl;
    } catch (_bananaErr) {
      // 3. Fallback to styled dynamic canvas artwork
      return createStyledPlaceholderImage(
        prompt,
        prompt,
        'Điện Ảnh',
        characterConsistency || 'Nhân vật chính',
        aspectRatio
      );
    }
  }

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

    if (response.status === 404 || !response.ok) {
      // Try banana AI image generator
      try {
        const cleanPrompt = encodeURIComponent(`${characterConsistency ? characterConsistency + ', ' : ''}${prompt}, cinematic, 8k`);
        const width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 1024 : 1280;
        const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1024 : 720;
        const seed = Math.floor(Math.random() * 999999);
        return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
      } catch (_) {
        return createStyledPlaceholderImage(
          prompt,
          prompt,
          'Điện Ảnh',
          characterConsistency || 'Nhân vật chính',
          aspectRatio
        );
      }
    }

    const data = await response.json();
    return data.imageUrl || createStyledPlaceholderImage(
      prompt,
      prompt,
      'Điện Ảnh',
      characterConsistency || 'Nhân vật chính',
      aspectRatio
    );
  } catch (_err: any) {
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
