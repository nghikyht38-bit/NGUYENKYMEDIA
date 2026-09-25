import { useState, useRef, useCallback, useEffect } from 'react';
import { Scene } from '../types';

const MAX_HISTORY_STACK = 40;
const TYPING_DEBOUNCE_MS = 750;

export interface UseSceneHistoryReturn {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  updateScene: (sceneId: string, updates: Partial<Scene>, isTyping?: boolean) => void;
  setScenesWithCheckpoint: (newScenes: Scene[] | ((prev: Scene[]) => Scene[]), recordCheckpoint?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pastCount: number;
  futureCount: number;
  historyNotice: string | null;
  clearNotice: () => void;
}

export function useSceneHistory(initialScenes: Scene[] = []): UseSceneHistoryReturn {
  const [scenes, setScenesState] = useState<Scene[]>(initialScenes);
  const [past, setPast] = useState<Scene[][]>([]);
  const [future, setFuture] = useState<Scene[][]>([]);
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);

  // Keep references for async debounce operations
  const scenesRef = useRef<Scene[]>(scenes);
  scenesRef.current = scenes;

  const pastRef = useRef<Scene[][]>(past);
  pastRef.current = past;

  const futureRef = useRef<Scene[][]>(future);
  futureRef.current = future;

  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingSessionRef = useRef<boolean>(false);
  const preTypingSnapshotRef = useRef<Scene[]>(initialScenes);

  const showNotice = useCallback((text: string) => {
    setHistoryNotice(text);
    setTimeout(() => {
      setHistoryNotice((curr) => (curr === text ? null : curr));
    }, 2500);
  }, []);

  const clearNotice = useCallback(() => {
    setHistoryNotice(null);
  }, []);

  /**
   * Directly sets scenes state while synchronizing references
   */
  const setScenes: React.Dispatch<React.SetStateAction<Scene[]>> = useCallback((action) => {
    setScenesState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      scenesRef.current = next;
      return next;
    });
  }, []);

  /**
   * Set scenes with an explicit checkpoint (e.g. after AI script analysis, reset, or batch operation)
   */
  const setScenesWithCheckpoint = useCallback((
    newScenesOrUpdater: Scene[] | ((prev: Scene[]) => Scene[]),
    recordCheckpoint: boolean = true
  ) => {
    // Clear any pending typing session
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    isTypingSessionRef.current = false;

    setScenesState((prev) => {
      const next = typeof newScenesOrUpdater === 'function' ? newScenesOrUpdater(prev) : newScenesOrUpdater;
      scenesRef.current = next;

      if (recordCheckpoint && prev.length > 0) {
        setPast((p) => [...p.slice(-MAX_HISTORY_STACK + 1), prev]);
        setFuture([]);
      }
      preTypingSnapshotRef.current = next;
      return next;
    });
  }, []);

  /**
   * Updates an individual scene's fields, automatically grouping typing keystrokes
   */
  const updateScene = useCallback((sceneId: string, updates: Partial<Scene>, isTyping: boolean = true) => {
    if (isTyping) {
      // If starting a new typing burst, record snapshot of the scene list before this burst
      if (!isTypingSessionRef.current) {
        isTypingSessionRef.current = true;
        preTypingSnapshotRef.current = scenesRef.current;
        setPast((p) => [...p.slice(-MAX_HISTORY_STACK + 1), preTypingSnapshotRef.current]);
        setFuture([]);
      }

      // Reset debounce timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = setTimeout(() => {
        isTypingSessionRef.current = false;
        preTypingSnapshotRef.current = scenesRef.current;
      }, TYPING_DEBOUNCE_MS);
    } else {
      // Discrete non-typing action: record checkpoint immediately
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      isTypingSessionRef.current = false;
      setPast((p) => [...p.slice(-MAX_HISTORY_STACK + 1), scenesRef.current]);
      setFuture([]);
    }

    setScenesState((prev) => {
      const next = prev.map((s) => (s.id === sceneId ? { ...s, ...updates } : s));
      scenesRef.current = next;
      return next;
    });
  }, []);

  /**
   * Undo: Pop previous state from past stack, push current state to future stack
   */
  const undo = useCallback(() => {
    // Clear any active typing timer so it doesn't overwrite
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    isTypingSessionRef.current = false;

    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previousState = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setFuture((prevFuture) => [scenesRef.current, ...prevFuture.slice(0, MAX_HISTORY_STACK - 1)]);
      setScenesState(previousState);
      scenesRef.current = previousState;
      preTypingSnapshotRef.current = previousState;

      showNotice('↩️ Đã hoàn tác (Undo)');
      return newPast;
    });
  }, [showNotice]);

  /**
   * Redo: Pop next state from future stack, push current state to past stack
   */
  const redo = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    isTypingSessionRef.current = false;

    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const nextState = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast((prevPast) => [...prevPast.slice(-MAX_HISTORY_STACK + 1), scenesRef.current]);
      setScenesState(nextState);
      scenesRef.current = nextState;
      preTypingSnapshotRef.current = nextState;

      showNotice('↪️ Đã làm lại (Redo)');
      return newFuture;
    });
  }, [showNotice]);

  // Global Keyboard shortcuts: Ctrl+Z / Cmd+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          // Redo
          if (futureRef.current.length > 0) {
            e.preventDefault();
            redo();
          }
        } else {
          // Undo
          if (pastRef.current.length > 0) {
            e.preventDefault();
            undo();
          }
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        // Redo
        if (futureRef.current.length > 0) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    scenes,
    setScenes,
    updateScene,
    setScenesWithCheckpoint,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pastCount: past.length,
    futureCount: future.length,
    historyNotice,
    clearNotice,
  };
}
