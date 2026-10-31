import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { vehicle } from '../../config/vehicle';
import type { AssetManifest, MotionMode, VehicleConfiguration } from '../../types/cinematic';
import { clampProgress } from './PerformanceChapter.gauge';
import { useChapterReducedMotion } from './PerformanceChapter';
import './FinaleChapter.css';

export interface FinaleChapterProps {
  /** Local chapter progress; no scroll subscription is created here. */
  progress: number;
  motionMode?: MotionMode;
  config?: VehicleConfiguration;
  /** Only approved, licensed invitation posters are rendered. */
  manifest?: AssetManifest;
  id?: string;
  className?: string;
}

export function isFinaleDestination(href: string): boolean {
  const destination = href.trim();
  // Control characters must be rejected in user-facing destinations.
  // eslint-disable-next-line no-control-regex
  if (!destination || /[\s\\\u0000-\u001f]/.test(destination)) return false;
  if (/^(?:\/(?!\/)|#|\.\.?\/)/.test(destination)) return true;
  try {
    const url = new URL(destination);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch { return false; }
}

export function FinaleChapter({ progress, motionMode = 'full', config = vehicle, manifest,
  id = 'invitation', className = '' }: FinaleChapterProps) {
  const headingId = useId();
  const reduced = useChapterReducedMotion(motionMode);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const amount = reduced ? 1 : clampProgress(progress);
  const chapter = config.chapters.find(item => item.id === 'invitation');
  const posters = manifest?.status === 'approved' ? manifest.assets.filter(asset =>
    asset.kind === 'poster' && asset.status === 'approved' && asset.license && asset.source &&
    asset.alt?.trim() && asset.id.startsWith('poster-invitation-') && asset.url) : [];
  const desktop = posters.find(asset => asset.variant === 'desktop');
  const mobile = posters.find(asset => asset.variant === 'mobile');
  const poster = desktop ?? mobile;
  const action = config.primaryAction;
  const hasAction = action && action.label.trim() && isFinaleDestination(action.href);
  const identity = [config.identity.brand, config.identity.model, config.identity.modelYear].filter(Boolean).join(' / ');

  return <section id={id} className={`finale-chapter ${className}`} aria-labelledby={headingId}
    data-motion={reduced ? 'reduced' : 'full'} style={{ '--finale-progress': amount } as CSSProperties}>
    <div className="finale-chapter__stage">
      {poster?.url && failedUrl !== poster.url ? <picture>
        {mobile?.url && <source media="(max-width: 767px)" srcSet={mobile.url} />}
        <img src={poster.url} alt={poster.alt ?? ''} width={poster.width} height={poster.height}
          loading="lazy" decoding="async" onError={() => setFailedUrl(poster.url ?? null)} />
      </picture> : <div className="finale-chapter__placeholder"><span>Vehicle portrait</span><p>Awaiting approved imagery</p></div>}
    </div>
    <div className="finale-chapter__content">
      <p className="finale-chapter__signature">{identity || 'Brand signature forthcoming'}</p>
      <h2 id={headingId}>{chapter?.headline ?? 'Stay with the moment.'}</h2>
      <p className="finale-chapter__description">{chapter?.description}</p>
      {hasAction ? <a className="finale-chapter__cta" href={action.href.trim()}>
        {action.label}<span aria-hidden="true">↗</span>
      </a> : <p className="finale-chapter__pending">Your next step will appear once confirmed.</p>}
    </div>
  </section>;
}
