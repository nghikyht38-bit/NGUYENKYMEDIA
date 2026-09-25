/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  CharacterProfile,
  ReferenceImage,
  Scene,
  StudioConfig,
} from './types';
import { analyzeScript, generateSceneImage, generateSceneSpeech } from './services/aiService';
import {
  createStyledPlaceholderImage,
  synthesizeSceneVideoClip,
} from './services/videoGenerator';
import {
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
  clearProjectLocalStorage,
} from './services/storageService';
import { useSceneHistory } from './hooks/useSceneHistory';
import { Header } from './components/Header';
import { ScriptInputSection } from './components/ScriptInputSection';
import { ConfigSettingsSection } from './components/ConfigSettingsSection';
import { CharacterConsistencyBanner } from './components/CharacterConsistencyBanner';
import { ActionControls } from './components/ActionControls';
import { UnifiedSceneSection } from './components/UnifiedSceneSection';
import { BottomStitcherSection } from './components/BottomStitcherSection';
import { ImageModal } from './components/ImageModal';
import { VideoModal } from './components/VideoModal';
import { StorageManagerModal } from './components/StorageManagerModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { GmailAuthModal } from './components/GmailAuthModal';
import {
  getCurrentUser,
  switchSubscriptionTier,
  loginUser,
  checkSceneQuota,
} from './services/authService';
import { MembershipTier, UserAccount } from './types';

export default function App() {
  // Load initially saved state from localStorage if available
  const savedInitial = useRef(loadProjectFromLocalStorage()).current;

  // 1. Initial State
  const [idea, setIdea] = useState<string>(
    savedInitial?.idea ??
      'Một cậu bé phi hành gia nhí dũng cảm tên Leo mặc trang phục không gian màu xanh rêu phát sáng neon, cùng người bạn robot nhỏ khám phá hành tinh pha lê kỳ bí.'
  );
  const [characterSeed, setCharacterSeed] = useState<string>(
    savedInitial?.characterSeed ?? ''
  );
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>(
    savedInitial?.referenceImages ?? []
  );

  const [config, setConfig] = useState<StudioConfig>(() => ({
    model: 'veo 3.1-fast',
    hasDialogue: true,
    style: 'Điện Ảnh',
    voice: 'Nam Miền Bắc',
    voiceTone: 'Đọc nhẹ, nhanh, giọng trầm ấm',
    sceneCount: 5,
    duration: '8s',
    aspectRatio: '16:9',
    ...(savedInitial?.config || {}),
  }));

  const [projectTitle, setProjectTitle] = useState<string>(
    savedInitial?.projectTitle ?? 'Hành Trình Khám Phá Pha Lê'
  );
  const [projectSummary, setProjectSummary] = useState<string>(
    savedInitial?.projectSummary ?? ''
  );
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile>(
    savedInitial?.characterProfile ?? {
      name: 'Leo - Phi Hành Gia Nhí',
      age: '10 tuổi',
      appearance: 'Khuôn mặt thông minh, mắt sáng, tóc nâu ngắn, đeo tai nghe radar công nghệ cao',
      clothing: 'Bộ đồ du hành vũ trụ màu xanh rêu viền vàng neon phát sáng, giày phản trọng lực',
      consistencyTokens: 'young astronaut boy Leo, moss green glowing spacesuit, high-tech radar headset',
    }
  );

  const {
    scenes,
    setScenes,
    updateScene,
    setScenesWithCheckpoint,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount,
    futureCount,
    historyNotice,
  } = useSceneHistory(savedInitial?.scenes ?? []);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    if (savedInitial?.lastSaved) {
      try {
        return new Date(savedInitial.lastSaved).toLocaleTimeString('vi-VN');
      } catch {
        return 'Đã khôi phục';
      }
    }
    return null;
  });

  // Auto-save to localStorage whenever config, scenes, idea, or project details change
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Avoid re-saving on the very first mount if loaded from storage
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const res = saveProjectToLocalStorage({
        idea,
        characterSeed,
        referenceImages,
        config,
        projectTitle,
        projectSummary,
        characterProfile,
        scenes,
      });

      if (res.success) {
        setLastSavedTime(new Date(res.timestamp).toLocaleTimeString('vi-VN'));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    idea,
    characterSeed,
    referenceImages,
    config,
    projectTitle,
    projectSummary,
    characterProfile,
    scenes,
  ]);

  // Generation Loading States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isBatchGeneratingImages, setIsBatchGeneratingImages] = useState<boolean>(false);
  const [isBatchGeneratingVideos, setIsBatchGeneratingVideos] = useState<boolean>(false);
  const [batchProgressText, setBatchProgressText] = useState<string>('');
  const shouldStopBatchRef = useRef<boolean>(false);

  // Modals
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    prompt: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    prompt: '',
  });

  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
    prompt: string;
    dialogue?: string;
  }>({
    isOpen: false,
    videoUrl: '',
    title: '',
    prompt: '',
  });

  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => getCurrentUser());
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const handleSelectTier = (tier: MembershipTier) => {
    const updated = switchSubscriptionTier(tier);
    setCurrentUser(updated);
  };

  const handleUpdateProfile = (email: string, displayName: string) => {
    const updated = loginUser(email, displayName);
    setCurrentUser(updated);
  };

  // Handler: Select Preset Idea
  const handleSelectSampleIdea = (sampleText: string) => {
    setIdea(sampleText);
  };

  // Handler: Analyze Script (Nút PHÂN TÍCH TẠO KỊCH BẢN)
  const handleAnalyzeScript = async () => {
    if (!idea || !idea.trim()) {
      alert('Vui lòng nhập ý tưởng tạo kịch bản!');
      return;
    }

    // Check membership tier quota for number of scenes
    const quota = checkSceneQuota(config.sceneCount, currentUser);
    if (!quota.allowed) {
      alert(quota.message || 'Số lượng phân cảnh vượt quá giới hạn gói của bạn.');
      setIsSubscriptionModalOpen(true);
      return;
    }

    try {
      setIsAnalyzing(true);
      setBatchProgressText('AI đang phân tích ý tưởng & thiết kế bản đồng bộ nhân vật...');

      const result = await analyzeScript(idea, config, referenceImages, characterSeed);

      setProjectTitle(result.title);
      setProjectSummary(result.summary);
      setCharacterProfile(result.characterProfile);
      setScenesWithCheckpoint(result.scenes, true);
    } catch (err: any) {
      console.warn('Lỗi phân tích hoặc chạm giới hạn API, tự động dùng kịch bản dự phòng:', err);
      // Fallback local intelligent generator if network or API error occurs
      generateLocalScriptFallback();
    } finally {
      setIsAnalyzing(false);
      setBatchProgressText('');
    }
  };

  // Fallback generator if offline / API quota
  const generateLocalScriptFallback = () => {
    const count = config.sceneCount;
    const fallbackScenes: Scene[] = [];

    const charName = characterProfile.name || 'Nhân vật chính';
    const style = config.style;

    for (let i = 1; i <= count; i++) {
      fallbackScenes.push({
        id: `scene-${i}-${Date.now()}`,
        sceneNumber: i,
        title: `Phân cảnh ${i}: Diễn biến kịch bản ${i}`,
        imagePrompt: `Cinematic wide shot of ${charName}, consistent face and outfit, in ${style} aesthetic, scene ${i} of the adventure. Detailed background, dramatic cinematic lighting, masterpiece 8k.`,
        imagePromptVi: `Cảnh ${i}: ${charName} xuất hiện với phong cách ${style}, bối cảnh điện ảnh sắc nét và đồng bộ.`,
        videoPrompt: `Camera slow cinematic push-in tracking ${charName} moving with natural expression, ambient atmosphere, 4k render 60fps.`,
        videoPromptVi: `Góc máy cinematic dolly zoom bắt trọn biểu cảm và hành động của nhân vật.`,
        cameraMovement: i % 2 === 0 ? 'Cinematic Dolly In' : 'Cinematic Pan Right',
        dialogue: config.hasDialogue ? `Phân đoạn ${i}: Cuộc hành trình tiếp tục mở ra bất ngờ mới.` : '',
        voiceToneNote: config.voiceTone || 'đọc nhẹ, nhanh, giọng trầm ấm',
        duration: config.duration,
        imageStatus: 'idle',
        videoStatus: 'idle',
      });
    }

    setScenesWithCheckpoint(fallbackScenes, true);
    setProjectSummary(`Kịch bản phân cảnh chi tiết gồm ${count} cảnh cho: ${idea}`);
  };

  // Handler: Reset All (Nút LÀM MỚI NHẬP LẠI)
  const handleReset = () => {
    if (scenes.length > 0 && !window.confirm('Bạn có chắc chắn muốn đặt lại tất cả về trạng thái ban đầu?')) {
      return;
    }
    setIdea('');
    setCharacterSeed('');
    setReferenceImages([]);
    setScenesWithCheckpoint([], true);
    setProjectSummary('');
    setBatchProgressText('');
    shouldStopBatchRef.current = true;
    clearProjectLocalStorage();
    setLastSavedTime(null);
  };

  // Handler: Update Prompt in Scene with debounced Undo/Redo checkpoint
  const handleUpdateImagePrompt = (sceneId: string, newPrompt: string) => {
    updateScene(sceneId, { imagePrompt: newPrompt }, true);
  };

  const handleUpdateVideoPrompt = (sceneId: string, newPrompt: string) => {
    updateScene(sceneId, { videoPrompt: newPrompt }, true);
  };

  const handleUpdateDialogue = (sceneId: string, newDialogue: string) => {
    updateScene(sceneId, { dialogue: newDialogue }, true);
  };

  const handleUpdateVoiceToneNote = (sceneId: string, newTone: string) => {
    updateScene(sceneId, { voiceToneNote: newTone }, true);
  };

  // Export full JSON project & config
  const handleExportProjectJson = () => {
    if (scenes.length === 0) {
      alert('Chưa có phân cảnh nào để xuất JSON. Vui lòng phân tích kịch bản trước!');
      return;
    }

    const exportData = {
      version: '1.0',
      app: 'AutoVideo Batch Studio',
      exportedAt: new Date().toISOString(),
      projectTitle: projectTitle || 'Du_An_Video_AI',
      projectSummary: projectSummary || '',
      idea: idea || '',
      characterSeed: characterSeed || '',
      config,
      characterProfile,
      totalScenes: scenes.length,
      scenes,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Kich_Ban_${(projectTitle || 'Du_An_Video').replace(/\s+/g, '_')}_Config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Import JSON project file
  const handleImportProjectJson = (data: any) => {
    try {
      if (!data) return;
      if (data.idea) setIdea(data.idea);
      if (data.characterSeed !== undefined) setCharacterSeed(data.characterSeed);
      if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
      if (data.projectTitle) setProjectTitle(data.projectTitle);
      if (data.projectSummary) setProjectSummary(data.projectSummary);
      if (data.characterProfile) setCharacterProfile(data.characterProfile);
      if (Array.isArray(data.scenes) && data.scenes.length > 0) {
        setScenes(data.scenes);
      }

      // Automatically sync imported project to localStorage
      saveProjectToLocalStorage({
        idea: data.idea || idea,
        characterSeed: data.characterSeed ?? characterSeed,
        referenceImages: data.referenceImages || referenceImages,
        config: data.config ? { ...config, ...data.config } : config,
        projectTitle: data.projectTitle || projectTitle,
        projectSummary: data.projectSummary || projectSummary,
        characterProfile: data.characterProfile || characterProfile,
        scenes: data.scenes || scenes,
      });
      setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));

      alert(`Đã khôi phục thành công kịch bản "${data.projectTitle || 'Dự án'}" với ${data.scenes?.length || 0} phân cảnh và tự động lưu vào trình duyệt!`);
    } catch (err: any) {
      console.error('Error importing project JSON:', err);
      alert('Lỗi nhập dự án JSON: ' + (err.message || 'Tệp không hợp lệ'));
    }
  };

  // Handler: Generate Single Image
  const handleGenerateSingleImage = async (scene: Scene) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === scene.id ? { ...s, imageStatus: 'generating' } : s))
    );

    try {
      const refImg = referenceImages.length > 0 ? referenceImages[0] : null;
      let imageUrl = '';

      try {
        imageUrl = await generateSceneImage(
          scene.imagePrompt,
          config.aspectRatio,
          refImg,
          characterProfile.consistencyTokens
        );
      } catch (apiErr) {
        console.warn('API image generation fallback to styled canvas:', apiErr);
        imageUrl = createStyledPlaceholderImage(
          scene.title,
          scene.imagePromptVi || scene.imagePrompt,
          config.style,
          characterProfile.name,
          config.aspectRatio
        );
      }

      if (!imageUrl) {
        imageUrl = createStyledPlaceholderImage(
          scene.title,
          scene.imagePromptVi || scene.imagePrompt,
          config.style,
          characterProfile.name,
          config.aspectRatio
        );
      }

      setScenes((prev) =>
        prev.map((s) =>
          s.id === scene.id ? { ...s, imageUrl, imageStatus: 'ready', imageError: undefined } : s
        )
      );
    } catch (err: any) {
      setScenes((prev) =>
        prev.map((s) =>
          s.id === scene.id ? { ...s, imageStatus: 'error', imageError: err.message } : s
        )
      );
    }
  };

  // Handler: Generate Single Video
  const handleGenerateSingleVideo = async (scene: Scene) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === scene.id ? { ...s, videoStatus: 'generating' } : s))
    );

    try {
      // 1. Ensure image is available
      let imgUrl = scene.imageUrl;
      if (!imgUrl) {
        imgUrl = createStyledPlaceholderImage(
          scene.title,
          scene.imagePromptVi || scene.imagePrompt,
          config.style,
          characterProfile.name,
          config.aspectRatio
        );
        setScenes((prev) =>
          prev.map((s) => (s.id === scene.id ? { ...s, imageUrl: imgUrl, imageStatus: 'ready' } : s))
        );
      }

      // 2. Audio TTS if dialogue present
      let audioUrl: string | undefined = undefined;
      if (scene.dialogue && config.hasDialogue) {
        try {
          audioUrl = await generateSceneSpeech(
            scene.dialogue,
            config.voice,
            scene.voiceToneNote || config.voiceTone || 'đọc nhẹ, nhanh, giọng trầm ấm'
          );
        } catch (e) {
          console.warn('TTS speech skipped:', e);
        }
      }

      // 3. Synthesize dynamic motion video
      const durationNum = parseInt(scene.duration) || 8;
      const videoBlob = await synthesizeSceneVideoClip(
        imgUrl,
        scene.dialogue,
        scene.cameraMovement || 'Cinematic Dolly In',
        durationNum,
        config.aspectRatio,
        audioUrl
      );

      const videoUrl = URL.createObjectURL(videoBlob);

      setScenes((prev) =>
        prev.map((s) =>
          s.id === scene.id
            ? {
                ...s,
                videoUrl,
                videoBlob,
                videoStatus: 'ready',
                audioUrl,
                videoError: undefined,
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Error generating video clip:', err);
      setScenes((prev) =>
        prev.map((s) =>
          s.id === scene.id ? { ...s, videoStatus: 'error', videoError: err.message } : s
        )
      );
    }
  };

  // Handler: Batch Generate All Images
  const handleBatchGenerateImages = async () => {
    if (scenes.length === 0) return;
    shouldStopBatchRef.current = false;
    setIsBatchGeneratingImages(true);

    try {
      for (let i = 0; i < scenes.length; i++) {
        if (shouldStopBatchRef.current) {
          setBatchProgressText('Đã dừng tiến trình tạo ảnh.');
          break;
        }

        const sc = scenes[i];
        setBatchProgressText(
          `Đang tạo hình ảnh cảnh ${i + 1}/${scenes.length}: ${sc.title}...`
        );

        await handleGenerateSingleImage(sc);
        await new Promise((r) => setTimeout(r, 600));
      }
      setBatchProgressText('Hoàn thành lượt tạo ảnh hàng loạt!');
      setTimeout(() => setBatchProgressText(''), 3000);
    } finally {
      setIsBatchGeneratingImages(false);
    }
  };

  // Handler: Batch Generate All Videos
  const handleBatchGenerateVideos = async () => {
    if (scenes.length === 0) return;
    shouldStopBatchRef.current = false;
    setIsBatchGeneratingVideos(true);

    try {
      for (let i = 0; i < scenes.length; i++) {
        if (shouldStopBatchRef.current) {
          setBatchProgressText('Đã dừng tiến trình tạo video.');
          break;
        }

        const sc = scenes[i];
        setBatchProgressText(
          `Đang render video cảnh ${i + 1}/${scenes.length}: ${sc.title}...`
        );

        await handleGenerateSingleVideo(sc);
        await new Promise((r) => setTimeout(r, 500));
      }
      setBatchProgressText('Hoàn thành toàn bộ video kịch bản!');
      setTimeout(() => setBatchProgressText(''), 3000);
    } finally {
      setIsBatchGeneratingVideos(false);
    }
  };

  // Handler: Stop Batch
  const handleStopBatch = () => {
    shouldStopBatchRef.current = true;
    setIsBatchGeneratingImages(false);
    setIsBatchGeneratingVideos(false);
    setBatchProgressText('Đang dừng các tác vụ...');
  };

  // Handler: Upload Custom Image replacement
  const handleUploadCustomImage = (sceneId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateScene(sceneId, { imageUrl: dataUrl, imageStatus: 'ready', imageError: undefined }, false);
    };
    reader.readAsDataURL(file);
  };

  // Handler: Upload Custom Video replacement
  const handleUploadCustomVideo = (sceneId: string, file: File) => {
    const url = URL.createObjectURL(file);
    updateScene(sceneId, { videoUrl: url, videoBlob: file, videoStatus: 'ready', videoError: undefined }, false);
  };

  return (
    <div className="min-h-screen bg-[#070e0a] text-emerald-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-16">
      {/* Top Header */}
      <Header
        onSelectSampleIdea={handleSelectSampleIdea}
        lastSavedTime={lastSavedTime}
        isAutoSaved={true}
        onOpenStorageManager={() => setIsStorageModalOpen(true)}
        currentUser={currentUser}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        {/* 1. KHUNG NHẬP Ý TƯỞNG & TẢI ẢNH THAM CHIẾU */}
        <ScriptInputSection
          idea={idea}
          setIdea={setIdea}
          referenceImages={referenceImages}
          setReferenceImages={setReferenceImages}
          characterSeed={characterSeed}
          setCharacterSeed={setCharacterSeed}
        />

        {/* 2. KHUNG CÀI ĐẶT CẤU HÌNH CHO VIDEO */}
        <ConfigSettingsSection config={config} setConfig={setConfig} />

        {/* Master Character Consistency Banner (if active) */}
        {scenes.length > 0 && (
          <CharacterConsistencyBanner
            characterProfile={characterProfile}
            onChangeProfile={setCharacterProfile}
          />
        )}

        {/* 3. NÚT BẤM PHÂN TÍCH & LÀM MỚI (Action Controls) */}
        <ActionControls
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyzeScript}
          onReset={handleReset}
          scenes={scenes}
          isBatchGeneratingImages={isBatchGeneratingImages}
          isBatchGeneratingVideos={isBatchGeneratingVideos}
          onBatchGenerateImages={handleBatchGenerateImages}
          onBatchGenerateVideos={handleBatchGenerateVideos}
          onStopBatch={handleStopBatch}
          batchProgressText={batchProgressText}
          onExportJson={handleExportProjectJson}
          onImportJson={handleImportProjectJson}
          onOpenStorageManager={() => setIsStorageModalOpen(true)}
          config={config}
        />

        {/* 4. BẢNG PHÂN CẢNH THEO HÀNG NGANG ĐỐI SOÁT (Prompt Ảnh ➜ Ảnh ➜ Prompt Video ➜ Video) */}
        <UnifiedSceneSection
          scenes={scenes}
          onUpdateImagePrompt={handleUpdateImagePrompt}
          onUpdateVideoPrompt={handleUpdateVideoPrompt}
          onUpdateDialogue={handleUpdateDialogue}
          onUpdateVoiceToneNote={handleUpdateVoiceToneNote}
          onGenerateSingleImage={handleGenerateSingleImage}
          onGenerateSingleVideo={handleGenerateSingleVideo}
          onUploadCustomImage={handleUploadCustomImage}
          onUploadCustomVideo={handleUploadCustomVideo}
          onOpenZoomModal={(imageUrl, title, prompt) =>
            setImageModal({ isOpen: true, imageUrl, title, prompt })
          }
          onOpenVideoModal={(videoUrl, title, prompt, dialogue) =>
            setVideoModal({ isOpen: true, videoUrl, title, prompt, dialogue })
          }
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          pastCount={pastCount}
          futureCount={futureCount}
          historyNotice={historyNotice}
        />

        {/* 5. KHUNG CUỐI CÙNG: LƯU VIDEO & GHÉP LẠI TẢI XUỐNG */}
        <BottomStitcherSection
          scenes={scenes}
          projectTitle={projectTitle}
          projectSummary={projectSummary}
          characterProfile={characterProfile}
          aspectRatio={config.aspectRatio}
          idea={idea}
          characterSeed={characterSeed}
          config={config}
          onImportProject={handleImportProjectJson}
        />
      </main>

      {/* Zoom Modals */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={imageModal.imageUrl}
        title={imageModal.title}
        prompt={imageModal.prompt}
      />

      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal((prev) => ({ ...prev, isOpen: false }))}
        videoUrl={videoModal.videoUrl}
        title={videoModal.title}
        prompt={videoModal.prompt}
        dialogue={videoModal.dialogue}
      />

      {/* Storage & Cache Management Modal */}
      <StorageManagerModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        scenes={scenes}
        onStorageCleared={handleReset}
      />

      {/* Membership & Subscription Pricing Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={currentUser}
        onSelectTier={handleSelectTier}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Gmail Login & Personal API Key Modal */}
      <GmailAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(u) => setCurrentUser(u)}
      />
    </div>
  );
}
