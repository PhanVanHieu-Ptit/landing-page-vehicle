import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { AssetId, AssetVariant } from '../../types/cinematic';
import { FrameLoader, getSequence, progressToFrame, validateManifest } from '../../lib/assets';
import type { LoadProgress } from '../../lib/assets';
import { loadImage } from '../../lib/assets/loader';
import type { Drawable } from '../../lib/assets/loader';
import styles from './SequenceCanvas.module.css';

export interface SequenceCanvasProps {
  manifest: unknown;
  variant: AssetVariant;
  progress: number;
  fit?: 'contain' | 'cover';
  posterId?: AssetId;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  maxCacheBytes?: number;
  concurrency?: number;
  onReady?: () => void;
  onError?: (assetId: AssetId, error: Error) => void;
  onProgress?: (progress: LoadProgress) => void;
}

/** Decorative renderer; the caller supplies semantic story content and owns progress. */
export function SequenceCanvas(props: SequenceCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(props);
  current.current = props;
  const request = useRef<(() => void) | null>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    element.dataset.ready = 'false';
    // A failed replacement manifest must not leave the preceding sequence visible.
    element.width = 0;
    let manifest;
    try { manifest = validateManifest(props.manifest); }
    catch (error) { current.current.onError?.(`sequence-${props.variant}`, error as Error); return; }
    if (manifest.status !== 'approved') return;
    const sequence = getSequence(manifest, props.variant);
    const context = element.getContext('2d');
    if (!context) { current.current.onError?.(sequence.id, new Error('Canvas 2D unavailable')); return; }
    let disposed = false;
    let ready = false;
    let raf = 0;
    let poster: Drawable | undefined;
    let lastFrame: Drawable | undefined;
    let lastFit = props.fit;
    const posterAbort = new AbortController();
    const errors = new Set<AssetId>();
    const reportError = (id: AssetId, error: Error) => { if (!errors.has(id)) { errors.add(id); current.current.onError?.(id, error); } };
    const draw = () => {
      raf = 0;
      if (disposed) return;
      const bounds = element.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const width = Math.round(bounds.width * dpr), height = Math.round(bounds.height * dpr);
      const resized = element.width !== width || element.height !== height;
      if (resized) { element.width = width; element.height = height; }
      const frame = loader.nearest(progressToFrame(current.current.progress, sequence)) || poster;
      if (!resized && frame && frame === lastFrame && lastFit === current.current.fit) return;
      lastFrame = frame; lastFit = current.current.fit;
      context.clearRect(0, 0, width, height);
      if (!frame) { element.dataset.ready = 'false'; return; }
      const scale = (current.current.fit === 'contain' ? Math.min : Math.max)(width / frame.width, height / frame.height);
      const w = frame.width * scale, h = frame.height * scale;
      context.drawImage(frame.image, (width - w) / 2, (height - h) / 2, w, h);
      element.dataset.ready = 'true';
      if (!ready) { ready = true; current.current.onReady?.(); }
    };
    const schedule = () => { if (!disposed && !raf) raf = requestAnimationFrame(draw); };
    const loader = new FrameLoader(sequence, state => { current.current.onProgress?.(state); schedule(); }, index => reportError(sequence.id, new Error(`Frame ${index} unavailable`)), { maxBytes: props.maxCacheBytes, concurrency: props.concurrency });
    request.current = () => { loader.request(progressToFrame(current.current.progress, sequence)); schedule(); };
    const posterRecord = manifest.assets.find(a => a.id === props.posterId && a.variant === props.variant && a.kind === 'poster');
    if (posterRecord?.url) void loadImage(posterRecord.url, posterAbort.signal).then(image => {
      if (disposed) image.dispose(); else { poster = image; schedule(); }
    }).catch(error => { if (!disposed) reportError(posterRecord.id, error as Error); });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
    observer?.observe(element);
    // Resize also covers DPR changes when moving a window between displays.
    window.addEventListener('resize', schedule);
    request.current();
    return () => {
      disposed = true; request.current = null; observer?.disconnect(); window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf); loader.dispose(); posterAbort.abort(); poster?.dispose();
      element.dataset.ready = 'false';
      context.clearRect(0, 0, element.width, element.height);
      element.width = 0; element.height = 0;
    };
  }, [props.manifest, props.variant, props.posterId, props.maxCacheBytes, props.concurrency]);
  useEffect(() => { request.current?.(); }, [props.progress, props.fit]);
  return <div className={[styles.root, props.className].filter(Boolean).join(' ')} style={props.style}>
    <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    <div className={styles.fallback}>{props.fallback}</div>
  </div>;
}
export default SequenceCanvas;
