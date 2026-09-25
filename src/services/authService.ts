import { MembershipTier, UserAccount, UserSubscription } from '../types';

export const USER_STORAGE_KEY = 'autovideo_studio_user_account';
export const ACCOUNTS_MAP_KEY = 'autovideo_studio_accounts_map';

export const TIER_CONFIGS: Record<MembershipTier, UserSubscription> = {
  free: {
    tier: 'free',
    tierName: 'Gói Miễn Phí (Free)',
    maxScenesPerProject: 10,
    maxDailyRenders: 20,
    unlimitedScenes: false,
    priorityQueue: false,
    resolution: '720p HD',
    hasWatermark: true,
  },
  pro: {
    tier: 'pro',
    tierName: 'Gói Chuyên Nghiệp (Pro)',
    maxScenesPerProject: 40,
    maxDailyRenders: 300,
    unlimitedScenes: false,
    priorityQueue: true,
    resolution: '1080p Full HD',
    hasWatermark: false,
    expiresAt: '2027-12-31',
  },
  vip: {
    tier: 'vip',
    tierName: 'Gói VIP Studio (100 Cảnh)',
    maxScenesPerProject: 100,
    maxDailyRenders: 10000,
    unlimitedScenes: true,
    priorityQueue: true,
    resolution: '4K Ultra Cinema',
    hasWatermark: false,
    expiresAt: '2028-12-31',
  },
};

const DEFAULT_USER: UserAccount = {
  uid: 'user_pro_vip_auto',
  email: 'nghikyht38@gmail.com',
  displayName: 'Nghi Ky Studio',
  photoURL: '',
  subscription: TIER_CONFIGS.vip, // Default to VIP so user can immediately use 100 scenes!
  rendersUsedToday: 3,
  scenesCreated: 15,
  createdAt: new Date().toISOString(),
  apiKey: '',
  apiKeyStatus: 'untested',
  usePersonalApiKey: true,
};

/**
 * Gets all saved user accounts from localStorage mapped by email
 */
export function getAllSavedAccounts(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_MAP_KEY);
    if (!raw) {
      const initial: Record<string, UserAccount> = {
        [DEFAULT_USER.email]: DEFAULT_USER,
      };
      localStorage.setItem(ACCOUNTS_MAP_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return { [DEFAULT_USER.email]: DEFAULT_USER };
  }
}

/**
 * Saves all accounts map to localStorage
 */
function saveAllAccounts(accounts: Record<string, UserAccount>): void {
  try {
    localStorage.setItem(ACCOUNTS_MAP_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts map:', e);
  }
}

/**
 * Gets currently logged in user from localStorage
 */
export function getCurrentUser(): UserAccount {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    return DEFAULT_USER;
  }
}

/**
 * Saves user account state both as current user and in accounts map
 */
export function saveUserAccount(user: UserAccount): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    const all = getAllSavedAccounts();
    all[user.email.toLowerCase()] = user;
    saveAllAccounts(all);
  } catch (e) {
    console.error('Failed to save user account:', e);
  }
}

/**
 * Gets the active Gemini API key of the current user (if configured)
 */
export function getActiveApiKey(): string | undefined {
  const current = getCurrentUser();
  if (current.usePersonalApiKey !== false && current.apiKey && current.apiKey.trim()) {
    return current.apiKey.trim();
  }
  return undefined;
}

/**
 * Switches or logs in to a Gmail account, automatically restoring its saved API key!
 */
export function switchOrLoginGmail(email: string, displayName?: string, photoURL?: string): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const all = getAllSavedAccounts();
  let account = all[cleanEmail];

  if (!account) {
    // Brand new account for this Gmail
    account = {
      uid: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      displayName: displayName?.trim() || cleanEmail.split('@')[0],
      photoURL: photoURL || '',
      subscription: TIER_CONFIGS.vip, // Give VIP access
      rendersUsedToday: 0,
      scenesCreated: 0,
      createdAt: new Date().toISOString(),
      apiKey: '',
      apiKeyStatus: 'untested',
      usePersonalApiKey: true,
    };
  } else {
    // Existing account: update name or photo if provided
    if (displayName) account.displayName = displayName.trim();
    if (photoURL) account.photoURL = photoURL;
  }

  saveUserAccount(account);
  return account;
}

/**
 * Updates the Gemini API Key linked specifically to this Gmail account
 */
export function updateGmailApiKey(
  email: string,
  apiKey: string,
  status: 'valid' | 'invalid' | 'untested' = 'untested'
): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const all = getAllSavedAccounts();
  let account = all[cleanEmail] || getCurrentUser();

  account = {
    ...account,
    apiKey: apiKey.trim(),
    apiKeyStatus: status,
    apiKeyTestedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    usePersonalApiKey: true,
  };

  saveUserAccount(account);
  return account;
}

/**
 * Toggles whether this account uses its personal API key or the system key
 */
export function toggleUsePersonalApiKey(email: string, usePersonal: boolean): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const all = getAllSavedAccounts();
  let account = all[cleanEmail] || getCurrentUser();

  account = {
    ...account,
    usePersonalApiKey: usePersonal,
  };

  saveUserAccount(account);
  return account;
}

/**
 * Validates a Gemini API Key against the backend /api/validate-key
 */
export async function validateApiKeyWithServer(
  apiKey: string
): Promise<{ valid: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });

    if (res.status === 404) {
      // Backend not running (e.g. GitHub Pages static deployment)
      return await validateApiKeyDirect(apiKey);
    }

    const data = await res.json();
    if (res.ok && data.valid) {
      return { valid: true, message: data.message || 'Kết nối thành công!' };
    }
    return { valid: false, error: data.error || 'API Key không hợp lệ.' };
  } catch (_err: any) {
    // If backend /api endpoint is unreachable (static GitHub Pages)
    return await validateApiKeyDirect(apiKey);
  }
}

async function validateApiKeyDirect(
  apiKey: string
): Promise<{ valid: boolean; message?: string; error?: string }> {
  try {
    const directRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`
    );
    if (directRes.ok) {
      return {
        valid: true,
        message: 'Kết nối API Key thành công (Chế độ Trực Tiếp Client GitHub Pages)!',
      };
    }
    const errData = await directRes.json().catch(() => ({}));
    return {
      valid: false,
      error: errData?.error?.message || 'API Key không chính xác hoặc chưa bật Google AI Studio.',
    };
  } catch (directErr: any) {
    return {
      valid: false,
      error: directErr?.message || 'Không thể kết nối đến máy chủ Google Gemini.',
    };
  }
}

/**
 * Upgrades or changes subscription tier
 */
export function switchSubscriptionTier(tier: MembershipTier): UserAccount {
  const current = getCurrentUser();
  const updated: UserAccount = {
    ...current,
    subscription: TIER_CONFIGS[tier],
  };
  saveUserAccount(updated);
  return updated;
}

/**
 * Log in with custom email (kept for backward compatibility)
 */
export function loginUser(email: string, displayName?: string): UserAccount {
  return switchOrLoginGmail(email, displayName);
}

/**
 * Checks if user is eligible to generate scenes
 */
export function checkSceneQuota(sceneCount: number, user: UserAccount): {
  allowed: boolean;
  maxAllowed: number;
  message?: string;
} {
  const max = user.subscription.maxScenesPerProject;
  if (sceneCount > max) {
    return {
      allowed: false,
      maxAllowed: max,
      message: `Tài khoản của bạn (${user.subscription.tierName}) chỉ hỗ trợ tối đa ${max} phân cảnh. Vui lòng nâng cấp lên gói cao hơn để tạo ${sceneCount} phân cảnh.`,
    };
  }
  return { allowed: true, maxAllowed: max };
}
