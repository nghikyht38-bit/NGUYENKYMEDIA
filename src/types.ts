export type AspectRatio = '16:9' | '9:16' | '1:1';

export type VideoModel = 'omni 1.1Flast' | 'veo 3.1-fast' | 'veo 3.1-Lite' | 'veo 3.1-quality';

export type VideoStyle = 
  | 'Điện Ảnh'
  | 'Hoạt Hình'
  | 'Sân Khấu'
  | 'Tối Giản'
  | 'Phim Ảnh'
  | 'Anime 3D'
  | 'Cyberpunk'
  | 'Tranh Thủy Mặc'
  | 'Cổ Trang Huyền Huyễn';

export type VoiceOption =
  | 'Nam Miền Bắc'
  | 'Nam Miền Trung'
  | 'Nam Miền Nam'
  | 'Nữ Miền Bắc'
  | 'Nữ Miền Trung'
  | 'Nữ Miền Nam';

export type VideoDuration = '5s' | '8s' | '10s' | '15s';

export interface ReferenceImage {
  id: string;
  name: string;
  data: string; // base64 data url
  mimeType: string;
  size: number;
  previewUrl: string;
}

export interface CharacterProfile {
  name: string;
  age?: string;
  appearance: string;
  clothing: string;
  consistencyTokens: string;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  imagePrompt: string;
  imagePromptVi?: string;
  videoPrompt: string;
  videoPromptVi?: string;
  cameraMovement?: string;
  dialogue?: string;
  voiceToneNote?: string;
  duration: string;
  
  // Media status
  imageStatus: 'idle' | 'generating' | 'ready' | 'error';
  imageUrl?: string;
  imageError?: string;

  videoStatus: 'idle' | 'generating' | 'ready' | 'error';
  videoUrl?: string;
  videoBlob?: Blob;
  videoError?: string;

  audioStatus?: 'idle' | 'generating' | 'ready' | 'error';
  audioUrl?: string;
}

export interface ScriptAnalysisResult {
  title: string;
  summary: string;
  characterProfile: CharacterProfile;
  scenes: Scene[];
}

export interface StudioConfig {
  model: VideoModel;
  hasDialogue: boolean;
  style: VideoStyle;
  voice: VoiceOption;
  voiceTone?: string;
  sceneCount: number;
  duration: VideoDuration;
  aspectRatio: AspectRatio;
  bgMusicUrl?: string;
  bgMusicName?: string;
  bgMusicVolume?: number;
}

export type TransitionEffect =
  | 'none'
  | 'crossfade'
  | 'fade_black'
  | 'wipe_left'
  | 'zoom_push'
  | 'flash_white';

export type SubtitlePosition = 'bottom' | 'center' | 'top';

export interface SubtitleConfig {
  enabled: boolean;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  position: SubtitlePosition;
  bgColor: string;
  strokeColor?: string;
}

export type MembershipTier = 'free' | 'pro' | 'vip';

export interface UserSubscription {
  tier: MembershipTier;
  tierName: string;
  maxScenesPerProject: number;
  maxDailyRenders: number;
  unlimitedScenes: boolean;
  priorityQueue: boolean;
  resolution: string;
  hasWatermark: boolean;
  expiresAt?: string;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  subscription: UserSubscription;
  rendersUsedToday: number;
  scenesCreated: number;
  createdAt: string;
  apiKey?: string; // Gemini API Key cá nhân theo Gmail
  apiKeyStatus?: 'valid' | 'invalid' | 'untested';
  apiKeyTestedAt?: string;
  usePersonalApiKey?: boolean; // Tùy chọn ưu tiên dùng API riêng hay API hệ thống
}
