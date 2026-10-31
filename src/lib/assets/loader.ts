import { frameUrl } from './manifest';
import type { SequenceAsset } from './manifest';

export interface Drawable { image: CanvasImageSource; width: number; height: number; dispose: () => void }
export interface LoadProgress { loaded: number; failed: number; total: number; cached: number; pending: number }
const bounded = (value: number | undefined, fallback: number, max: number) =>
  Number.isFinite(value) ? Math.max(1, Math.min(max, Math.floor(value!))) : fallback;

export type ImageLoader = (url: string, signal: AbortSignal) => Promise<Drawable>;
export const loadImage: ImageLoader = async (url, signal) => {
  const image = new Image();
  image.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => { image.onload = null; image.onerror = null; signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); image.src = ''; reject(new DOMException('Aborted', 'AbortError')); };
    image.onload = () => { cleanup(); resolve(); };
    image.onerror = () => { cleanup(); reject(new Error(`Image unavailable: ${url}`)); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else image.src = url;
  });
  try { await image.decode(); } catch { /* Loaded images can still draw when decode() is unsupported/rejected. */ }
  if (signal.aborted || !image.naturalWidth || !image.naturalHeight) { image.src = ''; throw new Error(`Image not drawable: ${url}`); }
  return { image, width: image.naturalWidth, height: image.naturalHeight, dispose: () => { image.src = ''; } };
};

/** Sliding priority window. Decoded RGBA estimates, rather than compressed bytes, bound memory. */
export class FrameLoader {
  private cache = new Map<number, Drawable>();
  private failed = new Set<number>();
  private loaded = new Set<number>();
  private active = new Set<number>();
  private queue: number[] = [];
  private controller = new AbortController();
  private target: number;
  private bytes = 0;
  private stopped = false;
  private concurrency: number;
  private maxFrames: number;
  private maxBytes: number;
  constructor(private sequence: SequenceAsset, private update: (progress: LoadProgress) => void, private onError: (index: number) => void = () => {}, options: { concurrency?: number; maxFrames?: number; maxBytes?: number; load?: ImageLoader } = {}) {
    this.target = sequence.firstFrame;
    this.concurrency = bounded(options.concurrency, 3, 4);
    this.maxFrames = bounded(options.maxFrames, 12, 12);
    this.maxBytes = bounded(options.maxBytes, 96 * 1024 * 1024, Number.MAX_SAFE_INTEGER);
    this.load = options.load || loadImage;
  }
  private load: ImageLoader;
  request(index: number): void {
    if (this.stopped) return;
    this.target = Math.max(this.sequence.firstFrame, Math.min(this.sequence.lastFrame, Math.round(Number.isFinite(index) ? index : this.sequence.firstFrame)));
    this.queue = [];
    const capacity = Math.max(1, Math.min(this.maxFrames, Math.floor(this.maxBytes / (this.sequence.width * this.sequence.height * 4))));
    let selected = 0;
    for (let distance = 0; distance < this.sequence.frameCount && selected < capacity; distance++) {
      for (const i of distance ? [this.target + distance, this.target - distance] : [this.target]) {
        if (i < this.sequence.firstFrame || i > this.sequence.lastFrame || selected >= capacity) continue;
        // Count cached and active frames too, so repeated requests never churn a window larger than the cache.
        selected++;
        if (!this.cache.has(i) && !this.failed.has(i) && !this.active.has(i)) this.queue.push(i);
      }
    }
    this.pump();
  }
  nearest(index: number): Drawable | undefined {
    let best: number | undefined;
    for (const key of this.cache.keys()) if (best === undefined || Math.abs(key - index) < Math.abs(best - index)) best = key;
    return best === undefined ? undefined : this.cache.get(best);
  }
  private report(): void { this.update({ loaded: this.loaded.size, failed: this.failed.size, total: this.sequence.frameCount, cached: this.cache.size, pending: this.queue.length + this.active.size }); }
  private pump(): void {
    if (this.stopped) return;
    while (this.active.size < this.concurrency && this.queue.length) {
      const index = this.queue.shift()!;
      this.active.add(index);
      void (async () => {
        try { return await this.load(frameUrl(this.sequence, index), this.controller.signal); }
        catch (error) { if (this.stopped) throw error; return this.load(frameUrl(this.sequence, index), this.controller.signal); }
      })().then(frame => {
        if (this.stopped) { frame.dispose(); return; }
        const cost = frame.width * frame.height * 4;
        if (!Number.isFinite(cost) || frame.width <= 0 || frame.height <= 0 || cost > this.maxBytes) { frame.dispose(); throw new Error('Frame exceeds decoded memory budget'); }
        this.cache.set(index, frame); this.bytes += cost; this.loaded.add(index);
        while (this.cache.size > this.maxFrames || this.bytes > this.maxBytes) {
          const victim = [...this.cache.keys()].sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target))[0];
          const removed = this.cache.get(victim)!;
          this.bytes -= removed.width * removed.height * 4; removed.dispose(); this.cache.delete(victim);
        }
      }).catch(() => { if (!this.stopped) { this.failed.add(index); this.onError(index); } }).finally(() => {
        this.active.delete(index);
        if (!this.stopped) { this.report(); this.pump(); }
      });
    }
    this.report();
  }
  dispose(): void { this.stopped = true; this.controller.abort(); this.queue = []; for (const f of this.cache.values()) f.dispose(); this.cache.clear(); this.bytes = 0; }
}
