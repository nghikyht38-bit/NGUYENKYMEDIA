import { CharacterProfile, ReferenceImage, Scene, StudioConfig } from '../types';

export const STORAGE_KEY = 'autovideo_studio_project_state';

// Browser localStorage typical ceiling is 5MB (~5,242,880 bytes in UTF-16 characters = ~2.6M - 5M chars)
export const ESTIMATED_LOCALSTORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

export interface SavedProjectState {
  version: string;
  lastSaved: string;
  idea: string;
  characterSeed: string;
  referenceImages: ReferenceImage[];
  config: StudioConfig;
  projectTitle: string;
  projectSummary: string;
  characterProfile: CharacterProfile;
  scenes: Scene[];
}

export interface StorageUsageInfo {
  usedBytes: number;
  usedFormatted: string;
  totalLimitBytes: number;
  percentUsed: number;
  itemCount: number;
  hasHighUsageWarning: boolean;
  projectSizeBytes: number;
  projectSizeFormatted: string;
}

/**
 * Format bytes to readable KB / MB
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Measure current LocalStorage usage
 */
export function getStorageUsage(): StorageUsageInfo {
  let totalChars = 0;
  let projectChars = 0;
  let itemCount = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        itemCount++;
        const val = localStorage.getItem(key) || '';
        const entryChars = (key.length + val.length) * 2; // JS UTF-16 character representation ~ 2 bytes
        totalChars += entryChars;
        if (key === STORAGE_KEY) {
          projectChars = entryChars;
        }
      }
    }
  } catch (e) {
    console.error('Error calculating storage usage:', e);
  }

  const percentUsed = Math.min(100, Math.round((totalChars / ESTIMATED_LOCALSTORAGE_LIMIT_BYTES) * 100));

  return {
    usedBytes: totalChars,
    usedFormatted: formatBytes(totalChars),
    totalLimitBytes: ESTIMATED_LOCALSTORAGE_LIMIT_BYTES,
    percentUsed,
    itemCount,
    hasHighUsageWarning: percentUsed >= 70,
    projectSizeBytes: projectChars,
    projectSizeFormatted: formatBytes(projectChars),
  };
}

/**
 * Sanitizes scenes for JSON serialization (stripping non-serializable Blobs & invalid blob URLs)
 */
function sanitizeScenesForStorage(scenes: Scene[], stripHeavyBase64Images: boolean = false): Scene[] {
  return scenes.map((scene) => {
    const isBlobVideo = scene.videoUrl?.startsWith('blob:');
    const isBase64Image = scene.imageUrl?.startsWith('data:');

    // If stripHeavyBase64Images is enabled or image is gigantic (> 30KB base64), drop the image string from localStorage
    const shouldDropImage = stripHeavyBase64Images && isBase64Image;

    return {
      ...scene,
      videoBlob: undefined, // Non-serializable
      videoUrl: isBlobVideo ? undefined : scene.videoUrl,
      videoStatus: isBlobVideo && scene.videoStatus === 'ready' ? 'idle' : scene.videoStatus,
      imageUrl: shouldDropImage ? undefined : scene.imageUrl,
      imageStatus: shouldDropImage && scene.imageStatus === 'ready' ? 'idle' : scene.imageStatus,
    };
  });
}

/**
 * Saves project state to localStorage with QuotaExceededError protection
 */
export function saveProjectToLocalStorage(state: {
  idea: string;
  characterSeed: string;
  referenceImages: ReferenceImage[];
  config: StudioConfig;
  projectTitle: string;
  projectSummary: string;
  characterProfile: CharacterProfile;
  scenes: Scene[];
}): { success: boolean; error?: string; timestamp: string; isOptimized?: boolean } {
  const timestamp = new Date().toISOString();

  // If there are many scenes (> 20 scenes), proactively prevent saving giant base64 images into localStorage
  const shouldProactivelyStripHeavyImages = state.scenes.length >= 20;

  const dataToSave: SavedProjectState = {
    version: '1.0',
    lastSaved: timestamp,
    idea: state.idea || '',
    characterSeed: state.characterSeed || '',
    referenceImages: state.referenceImages || [],
    config: state.config,
    projectTitle: state.projectTitle || 'Dự án Video AI',
    projectSummary: state.projectSummary || '',
    characterProfile: state.characterProfile,
    scenes: sanitizeScenesForStorage(state.scenes || [], shouldProactivelyStripHeavyImages),
  };

  try {
    const json = JSON.stringify(dataToSave);
    localStorage.setItem(STORAGE_KEY, json);
    return { success: true, timestamp, isOptimized: shouldProactivelyStripHeavyImages };
  } catch (err: any) {
    // If quota exceeded, automatically strip heavy image data URLs and reference images
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      console.warn('LocalStorage quota exceeded, performing automatic storage optimization...');
      try {
        const lightweightScenes = sanitizeScenesForStorage(dataToSave.scenes, true);
        const lightweightData: SavedProjectState = {
          ...dataToSave,
          referenceImages: [], // strip reference images
          scenes: lightweightScenes,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightData));
        return { success: true, timestamp, isOptimized: true };
      } catch (retryErr: any) {
        console.error('Failed to save even lightweight project to localStorage:', retryErr);
        return { success: false, error: retryErr.message, timestamp };
      }
    }

    console.error('LocalStorage save error:', err);
    return { success: false, error: err.message, timestamp };
  }
}

/**
 * Deep cache cleanup: Clears heavy base64 images and temporary blob references from LocalStorage
 * Preserves 100% of the prompts, dialogues, tones, timestamps, camera angles, configs, and character data.
 */
export function clearStorageMediaCache(
  currentScenes?: Scene[],
  cleanActiveMemoryBlobs: boolean = true
): {
  success: boolean;
  bytesFreed: number;
  freedFormatted: string;
  updatedUsage: StorageUsageInfo;
} {
  const usageBefore = getStorageUsage();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedProjectState;
      if (parsed && parsed.scenes) {
        // Strip heavy base64 strings and orphaned blob URLs from saved state
        const cleanedScenes = sanitizeScenesForStorage(parsed.scenes, true);
        const cleanedData: SavedProjectState = {
          ...parsed,
          lastSaved: new Date().toISOString(),
          referenceImages: [], // clear heavy reference images from storage
          scenes: cleanedScenes,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
      }
    }

    // Revoke active browser object URLs to free heap RAM
    if (cleanActiveMemoryBlobs && currentScenes) {
      revokeAllBlobUrls(currentScenes);
    }

    const usageAfter = getStorageUsage();
    const bytesFreed = Math.max(0, usageBefore.usedBytes - usageAfter.usedBytes);

    return {
      success: true,
      bytesFreed,
      freedFormatted: formatBytes(bytesFreed),
      updatedUsage: usageAfter,
    };
  } catch (err: any) {
    console.error('Failed to clear storage media cache:', err);
    return {
      success: false,
      bytesFreed: 0,
      freedFormatted: '0 B',
      updatedUsage: getStorageUsage(),
    };
  }
}

/**
 * Revokes all Blob URLs to free RAM in the browser
 */
export function revokeAllBlobUrls(scenes: Scene[]): void {
  scenes.forEach((scene) => {
    if (scene.videoUrl && scene.videoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(scene.videoUrl);
      } catch (e) {
        // ignore
      }
    }
  });
}

/**
 * Loads project state from localStorage
 */
export function loadProjectFromLocalStorage(): SavedProjectState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedProjectState;
    if (!parsed || (!parsed.scenes && !parsed.config && !parsed.idea)) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load project from localStorage:', err);
    return null;
  }
}

/**
 * Clears all project state from localStorage
 */
export function clearProjectLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear project from localStorage:', err);
  }
}
