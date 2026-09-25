import { StudioConfig, VideoModel } from '../types';

export interface CostBreakdown {
  sceneCount: number;
  durationPerSceneSec: number;
  totalDurationSec: number;
  formattedTotalDuration: string;

  // LLM Tokens
  llmInputTokens: number;
  llmOutputTokens: number;
  totalLlmTokens: number;
  formattedTokens: string;

  // Image Generation
  imageCredits: number;

  // Video Generation
  videoCreditsPerScene: number;
  totalVideoCredits: number;

  // TTS Voice
  ttsCharacters: number;

  // Master Credits
  totalCredits: number;

  // Estimated Cost
  estimatedCostUsd: number;
  formattedCostUsd: string;
  estimatedCostVnd: number;
  formattedCostVnd: string;

  // Estimated Generation Time
  estimatedGenerationTimeSec: number;
  formattedTime: string;

  // Model details
  modelName: string;
  modelEfficiencyTier: 'Tiết kiệm cao' | 'Cân bằng' | 'Chất lượng cao 4K' | 'Cao cấp nhất';
}

export function estimateProjectCost(config: StudioConfig): CostBreakdown {
  const sceneCount = Math.max(1, config.sceneCount || 5);
  const durationPerSceneSec = Math.max(3, parseInt(config.duration) || 8);
  const totalDurationSec = sceneCount * durationPerSceneSec;

  // Duration formatting
  const minutes = Math.floor(totalDurationSec / 60);
  const seconds = totalDurationSec % 60;
  const formattedTotalDuration =
    minutes > 0 ? `${minutes} phút ${seconds > 0 ? `${seconds}s` : ''}` : `${seconds} giây`;

  // LLM Token estimation (Gemini 2.5 Pro / Flash)
  const llmInputTokens = 1200 + Math.min(sceneCount * 30, 2000);
  const llmOutputTokens = sceneCount * 450;
  const totalLlmTokens = llmInputTokens + llmOutputTokens;
  const formattedTokens = totalLlmTokens.toLocaleString('vi-VN') + ' Tokens';

  // Image Generation Credits (Imagen 3)
  const imageCredits = sceneCount;

  // Video Generation Credits
  let videoCreditsPerScene = 10;
  let modelEfficiencyTier: CostBreakdown['modelEfficiencyTier'] = 'Cân bằng';
  let modelRatePerSecond = 0.035;

  switch (config.model) {
    case 'omni 1.1Flast':
      videoCreditsPerScene = 6;
      modelEfficiencyTier = 'Tiết kiệm cao';
      modelRatePerSecond = 0.02;
      break;
    case 'veo 3.1-Lite':
      videoCreditsPerScene = 8;
      modelEfficiencyTier = 'Tiết kiệm cao';
      modelRatePerSecond = 0.025;
      break;
    case 'veo 3.1-quality':
      videoCreditsPerScene = 18;
      modelEfficiencyTier = 'Chất lượng cao 4K';
      modelRatePerSecond = 0.06;
      break;
    case 'veo 3.1-fast':
    default:
      videoCreditsPerScene = 10;
      modelEfficiencyTier = 'Cân bằng';
      modelRatePerSecond = 0.035;
      break;
  }

  const totalVideoCredits = sceneCount * videoCreditsPerScene;

  // Voice TTS characters
  const ttsCharacters = config.hasDialogue ? sceneCount * 90 : 0;

  // Total Credits sum
  const totalCredits =
    imageCredits + totalVideoCredits + Math.ceil(totalLlmTokens / 1500) + (config.hasDialogue ? Math.ceil(sceneCount * 0.5) : 0);

  // Financial Cost Estimation in USD
  const llmCost = (llmInputTokens * 0.075 + llmOutputTokens * 0.3) / 1_000_000;
  const imageCost = sceneCount * 0.02;
  const videoCost = totalDurationSec * modelRatePerSecond;
  const ttsCost = (ttsCharacters / 1000) * 0.004;

  const estimatedCostUsd = Math.max(0.01, llmCost + imageCost + videoCost + ttsCost);
  const formattedCostUsd = `$${estimatedCostUsd.toFixed(2)}`;

  // VND conversion (1 USD ≈ 25,400 VND)
  const estimatedCostVnd = Math.round(estimatedCostUsd * 25400);
  const formattedCostVnd = estimatedCostVnd.toLocaleString('vi-VN') + ' đ';

  // Time Estimation
  const scriptTime = 6;
  const imageBatchTime = sceneCount * 2.2;
  const videoBatchTime = sceneCount * 3.5;
  const estimatedGenerationTimeSec = Math.round(scriptTime + imageBatchTime + videoBatchTime);

  const estMin = Math.floor(estimatedGenerationTimeSec / 60);
  const estSec = estimatedGenerationTimeSec % 60;
  const formattedTime =
    estMin > 0 ? `~${estMin} phút ${estSec > 0 ? `${estSec}s` : ''}` : `~${estSec} giây`;

  return {
    sceneCount,
    durationPerSceneSec,
    totalDurationSec,
    formattedTotalDuration,
    llmInputTokens,
    llmOutputTokens,
    totalLlmTokens,
    formattedTokens,
    imageCredits,
    videoCreditsPerScene,
    totalVideoCredits,
    ttsCharacters,
    totalCredits,
    estimatedCostUsd,
    formattedCostUsd,
    estimatedCostVnd,
    formattedCostVnd,
    estimatedGenerationTimeSec,
    formattedTime,
    modelName: config.model,
    modelEfficiencyTier,
  };
}
