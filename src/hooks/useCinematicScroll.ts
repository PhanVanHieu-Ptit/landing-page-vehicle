import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { ChapterId, MotionMode, TimelineState } from '../types/cinematic';
import { createCinematicScroll } from '../lib/motion/engine';
import type { ScrollController, ScrollOptions } from '../lib/motion/engine';

export interface CinematicScrollOptions extends Omit<ScrollOptions, 'stage' | 'pin' | 'chapterElements'> {
  stageRef: RefObject<HTMLElement | null>;
  pinRef?: RefObject<HTMLElement | null>;
  chapterRefs: Readonly<Record<ChapterId, RefObject<HTMLElement | null>>>;
  onProgress?: (state: TimelineState) => void;
}
export interface CinematicScrollHandle {
  getSnapshot(): TimelineState | null;
  subscribe(listener: (state: TimelineState) => void): () => void;
  navigate(id: ChapterId, smooth?: boolean): void;
  setMotionMode(mode: MotionMode | undefined): void;
  refresh(): void;
}
/** Stable imperative handle; scroll never schedules React state updates. Memoize configuration/ref maps. */
export function useCinematicScroll(options: CinematicScrollOptions): CinematicScrollHandle {
  const controller = useRef<ScrollController | null>(null);
  const callback = useRef(options.onProgress);
  callback.current = options.onProgress;
  const listeners = useRef(new Set<(state: TimelineState) => void>());
  const handle = useRef<CinematicScrollHandle | null>(null);
  if (!handle.current) handle.current = {
    getSnapshot: () => controller.current?.getSnapshot() ?? null,
    subscribe: fn => { listeners.current.add(fn); return () => { listeners.current.delete(fn); }; },
    navigate: (id, smooth) => controller.current?.navigate(id, smooth),
    setMotionMode: mode => controller.current?.setMotionMode(mode),
    refresh: () => controller.current?.refresh(),
  };
  const { stageRef, pinRef, chapterRefs, chapters, frameCount, posterFrames, runtime, configureTimeline, onModeChange, motionMode } = options;
  const initialMode = useRef(motionMode);
  initialMode.current = motionMode;
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const elements = {} as Record<ChapterId, HTMLElement>;
    for (const chapter of chapters) {
      const element = chapterRefs[chapter.id].current;
      if (!element) throw new Error(`Missing chapter ref: ${chapter.id}`);
      elements[chapter.id] = element;
    }
    const engine = createCinematicScroll({ stage, pin: pinRef?.current ?? undefined,
      chapterElements: elements, chapters, frameCount, posterFrames, runtime, configureTimeline,
      onModeChange, motionMode: initialMode.current });
    controller.current = engine;
    const emit = () => {
      const state = engine.getSnapshot();
      callback.current?.(state);
      listeners.current.forEach(fn => fn(state));
    };
    const unsubscribe = engine.subscribe(emit);
    try { emit(); } catch (error) { unsubscribe(); engine.destroy(); controller.current = null; throw error; }
    return () => { unsubscribe(); engine.destroy(); controller.current = null; };
  }, [stageRef, pinRef, chapterRefs, chapters, frameCount, posterFrames, runtime, configureTimeline, onModeChange]);
  const previousMode = useRef(motionMode);
  useEffect(() => {
    if (previousMode.current !== motionMode) controller.current?.setMotionMode(motionMode);
    previousMode.current = motionMode;
  }, [motionMode]);
  return handle.current;
}
