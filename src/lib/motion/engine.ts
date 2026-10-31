import type { ChapterDefinition, ChapterId, MotionMode, TimelineState } from '../../types/cinematic';
import { resolveTimeline, validateTimeline } from './timeline';

/** Pass gsap and ScrollTrigger after gsap.registerPlugin(ScrollTrigger). No global defaults are changed. */
export interface MotionRuntime {
  scrollTrigger: { create(options: {
    trigger: HTMLElement; start: () => number; end: () => number;
    pin: HTMLElement | false; pinSpacing: false; invalidateOnRefresh: true;
    onUpdate: (self: { progress: number }) => void; onRefresh: () => void;
  }): { kill(revert?: boolean): void; refresh(): void } };
  timeline(options: { paused: true }): MotionTimeline;
}
export interface MotionTimeline { progress(value: number): unknown; invalidate(): unknown; kill(): unknown }
export interface ScrollOptions {
  stage: HTMLElement;
  /** Optional dedicated pin; stage already supplies total travel height. */
  pin?: HTMLElement;
  /** Semantic chapter elements supplied by their owner, never discovered by selectors. */
  chapters: readonly ChapterDefinition[];
  chapterElements: Readonly<Record<ChapterId, HTMLElement>>;
  frameCount: number;
  /** Required in static modes; supplied from approved poster metadata, no duplicated indices. */
  posterFrames: Readonly<Record<ChapterId, number>>;
  runtime: MotionRuntime;
  motionMode?: MotionMode;
  onModeChange?: (mode: MotionMode) => void;
  /** May add only animations of refs owned by the caller. Returned cleanup runs before kill. */
  configureTimeline?: (timeline: MotionTimeline) => void | (() => void);
}
export interface ScrollController {
  getSnapshot(): TimelineState;
  subscribe(listener: () => void): () => void;
  navigate(id: ChapterId, smooth?: boolean): void;
  setMotionMode(mode: MotionMode | undefined): void;
  refresh(): void;
  destroy(): void;
}
export function createCinematicScroll(options: ScrollOptions): ScrollController {
  validateTimeline(options.chapters, options.frameCount);
  for (const c of options.chapters) {
    const index = options.posterFrames[c.id];
    if (!Number.isInteger(index) || index < 0 || index >= options.frameCount) throw new RangeError('Invalid poster index');
  }
  const win = options.stage.ownerDocument.defaultView!;
  const preference = win.matchMedia('(prefers-reduced-motion: reduce)');
  const short = win.matchMedia('(max-height: 499px)');
  const listeners = new Set<() => void>();
  let explicit = options.motionMode;
  const mode = (): MotionMode => short.matches ? 'static' : explicit ?? (preference.matches ? 'reduced' : 'full');
  let state = resolveTimeline(0, options.chapters, options.frameCount, mode(), options.posterFrames);
  let dead = false, raf = 0, pending = 0, needsRefresh = false;
  let trigger: ReturnType<MotionRuntime['scrollTrigger']['create']> | undefined;
  let timeline: MotionTimeline | undefined;
  let cleanup: void | (() => void);
  let observer: IntersectionObserver | undefined;
  let top = 0, distance = 1;
  function measure() {
    top = options.stage.getBoundingClientRect().top + win.scrollY;
    distance = Math.max(options.stage.offsetHeight - (options.pin?.offsetHeight || win.innerHeight), 1);
  }
  function publish(progress: number) {
    if (dead) return;
    const boundary = options.chapters.find(c => Math.abs(progress - c.start) * distance <= 1);
    const next = resolveTimeline(boundary?.start ?? progress, options.chapters, options.frameCount, mode(), options.posterFrames);
    if (next.motionMode !== 'full') next.frameIndex = options.posterFrames[next.chapterId];
    timeline?.progress(next.progress);
    if (Object.keys(next).every(key => next[key as keyof TimelineState] === state[key as keyof TimelineState])) return;
    state = next;
    listeners.forEach(fn => fn());
  }
  function schedule(progress = pending) {
    if (dead) return;
    pending = progress;
    if (raf) return;
    raf = win.requestAnimationFrame(() => {
      raf = 0;
      if (dead) return;
      if (needsRefresh) {
        needsRefresh = false;
        measure();
        timeline?.invalidate();
        trigger?.refresh();
      }
      publish(pending);
    });
  }
  function release() {
    observer?.disconnect(); observer = undefined;
    trigger?.kill(true); trigger = undefined;
    if (typeof cleanup === 'function') cleanup(); cleanup = undefined;
    timeline?.kill(); timeline = undefined;
  }
  function setup() {
    release();
    options.stage.dataset.motion = mode();
    measure();
    if (mode() === 'full') {
      timeline = options.runtime.timeline({ paused: true });
      cleanup = options.configureTimeline?.(timeline);
      trigger = options.runtime.scrollTrigger.create({
        trigger: options.stage, start: () => { measure(); return top; }, end: () => top + distance,
        pin: options.pin ?? false, pinSpacing: false, invalidateOnRefresh: true,
        onUpdate: self => schedule(self.progress), onRefresh: () => { measure(); schedule((win.scrollY - top) / distance); },
      });
    } else {
      const ratios = new Map<Element, number>();
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        const chapter = options.chapters.reduce<ChapterDefinition | undefined>((best, c) =>
          (ratios.get(options.chapterElements[c.id]) ?? 0) > (best ? ratios.get(options.chapterElements[best.id]) ?? 0 : 0) ? c : best, undefined);
        if (chapter) schedule(chapter.start);
      }, { threshold: [0, .25, .5, .75, 1] });
      options.chapters.forEach(c => observer!.observe(options.chapterElements[c.id]));
    }
    options.onModeChange?.(mode());
  }
  function navigate(id: ChapterId, smooth = false) {
    if (dead) return;
    const chapter = options.chapters.find(c => c.id === id);
    if (!chapter) throw new RangeError('Unknown chapter');
    measure();
    const target = mode() === 'full' ? top + chapter.start * distance : options.chapterElements[id].getBoundingClientRect().top + win.scrollY;
    win.scrollTo({ top: target, behavior: smooth && mode() === 'full' ? 'smooth' : 'instant' });
    // Exact chapter ownership despite subpixel scroll rounding. Never move focus.
    schedule(chapter.start);
  }
  function changeMode() {
    if (dead) return;
    const id = state.chapterId;
    setup();
    navigate(id);
  }
  function refresh() { measure(); needsRefresh = true; schedule((win.scrollY - top) / distance); }
  function hash() {
    const id = win.location.hash.slice(1);
    const chapter = options.chapters.find(c => c.id === id);
    if (chapter) navigate(chapter.id);
  }
  const resize = new ResizeObserver(refresh);
  try {
    setup();
    resize.observe(options.stage);
    if (options.pin) resize.observe(options.pin);
    preference.addEventListener('change', changeMode);
    short.addEventListener('change', changeMode);
    win.addEventListener('resize', refresh);
    win.addEventListener('orientationchange', refresh);
    win.addEventListener('hashchange', hash);
    schedule((win.scrollY - top) / distance);
    hash();
  } catch (error) { destroy(); throw error; }
  function destroy() {
    if (dead) return;
    dead = true;
    win.cancelAnimationFrame(raf);
    resize.disconnect();
    preference.removeEventListener('change', changeMode);
    short.removeEventListener('change', changeMode);
    win.removeEventListener('resize', refresh);
    win.removeEventListener('orientationchange', refresh);
    win.removeEventListener('hashchange', hash);
    release(); listeners.clear();
  }
  return { getSnapshot: () => state, subscribe: fn => { if (!dead) listeners.add(fn); return () => { listeners.delete(fn); }; },
    navigate, refresh, setMotionMode: value => { explicit = value; changeMode(); }, destroy };
}
