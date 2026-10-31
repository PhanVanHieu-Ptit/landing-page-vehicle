import { useMemo } from 'react';
import type { ChapterDefinition, AssetId, AssetManifest, AssetVariant, MotionMode, NormalizedProgress } from '../../types/cinematic';
import { validateManifest } from '../../lib/assets';
import { SequenceCanvas } from '../cinematic/SequenceCanvas';
import styles from './OrbitChapter.module.css';

export interface OrbitSequenceContract {
  /** Media owner confirms this interval is one aligned orbit, in the shared sequence. */
  verified: true;
  variant: AssetVariant;
  startProgress: NormalizedProgress;
  endProgress: NormalizedProgress;
  /** Local chapter positions for front, side, rear-three-quarter and rear. */
  perspectives: readonly [NormalizedProgress, NormalizedProgress, NormalizedProgress, NormalizedProgress];
}
export interface OrbitChapterProps {
  chapter?: ChapterDefinition;
  sharedMedia?: boolean;
  manifest: AssetManifest;
  variant: AssetVariant;
  /** Chapter-local progress supplied by the scroll director. */
  progress: NormalizedProgress;
  motionMode: MotionMode;
  sequence?: OrbitSequenceContract;
  className?: string;
  onError?: (assetId: AssetId, error: Error) => void;
}
export const clampChapterProgress = (value: number): number => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const views = ['Front', 'Side', 'Rear three-quarter', 'Rear'] as const;

/** No static-image substitution: only an explicitly verified aligned sequence can orbit. */
export function OrbitChapter({ manifest, variant, progress, motionMode, sequence, className, onError, chapter, sharedMedia }: OrbitChapterProps) {
  const approved = useMemo(() => {
    try { return validateManifest(manifest).status === 'approved'; } catch { return false; }
  }, [manifest]);
  const p = clampChapterProgress(progress);
  const valid = approved && sequence?.verified === true && sequence.variant === variant
    && Number.isFinite(sequence.startProgress) && Number.isFinite(sequence.endProgress)
    && sequence.startProgress >= 0 && sequence.endProgress <= 1 && sequence.startProgress < sequence.endProgress
    && sequence.perspectives.length === 4 && sequence.perspectives[0] === 0 && sequence.perspectives[3] === 1
    && sequence.perspectives.every((v, i, a) => Number.isFinite(v) && v >= 0 && v <= 1 && (i === 0 || v > a[i - 1]));
  const anchors = valid ? sequence!.perspectives : [0, 1 / 3, 2 / 3, 1];
  const index = anchors.reduce((best, value, i) => Math.abs(value - p) < Math.abs(anchors[best] - p) ? i : best, 0);
  // Reduced/static modes never mount or request the sequence.
  const full = motionMode === 'full';
  return <section className={[styles.root, className].filter(Boolean).join(' ')} aria-label="Orbit" data-motion={motionMode}>
    {!sharedMedia && <div className={styles.media} aria-hidden="true">
      {valid && full && <SequenceCanvas manifest={manifest} variant={variant}
        progress={sequence!.startProgress + p * (sequence!.endProgress - sequence!.startProgress)}
        fit="contain" className={styles.sequence} concurrency={3} onError={onError}
        fallback={<div className={styles.missing}>Orbit imagery unavailable — aligned frames could not be loaded.</div>} />}
      {(!valid || !full) && <div className={styles.missing}>{!valid
        ? 'Orbit assets missing — a verified aligned front-to-rear sequence is required.'
        : 'Orbit paused — a verified static orbit poster is not supplied.'}</div>}
    </div>}
    <div className={styles.copy}>
      <p className={styles.eyebrow}>{chapter?.label ?? 'Orbit'}</p>
      <h2 className={styles.title}>{chapter?.headline ?? <>Every angle.<br />One form.</>}</h2>
      <p className={styles.description}>{chapter?.description ?? 'Follow the form from front to rear.'}</p>
      {!sharedMedia && (!valid || !full) && <p className={styles.description}>{!valid
        ? 'Orbit assets missing. A verified aligned sequence is required.'
        : 'Static orbit imagery is not supplied.'}</p>}
    </div>
    {!sharedMedia && <ol className={styles.views} aria-label="Perspectives">
      {views.map((view, i) => <li key={view} data-current={i === index}>
        <span className={styles.number}>0{i + 1}</span>{view}
      </li>)}
    </ol>}
  </section>;
}

export default OrbitChapter;
