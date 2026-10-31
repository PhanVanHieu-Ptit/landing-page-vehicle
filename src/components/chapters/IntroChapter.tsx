import type { CSSProperties, ReactNode } from 'react';
import { vehicle } from '../../config/vehicle';
import type { MotionMode, NormalizedProgress, VehicleConfiguration } from '../../types/cinematic';
import styles from './IntroChapter.module.css';

/** Media stays owned by the host: mount the existing sequence only once. */
export interface ChapterMediaState {
  /** Global sequence progress; do not remap the shared sequence per chapter. */
  progress: NormalizedProgress;
  revealProgress: NormalizedProgress;
  motionMode: MotionMode;
}
export interface IntroChapterProps {
  /** Local chapter progress in [0, 1]. Invalid values resolve to zero. */
  progress: NormalizedProgress;
  /** Pass the director's global progress when providing sequence media. */
  sequenceProgress?: NormalizedProgress;
  motionMode?: MotionMode;
  /** Enable text choreography only after the host has drawable media. */
  mediaReady?: boolean;
  renderMedia?: (state: ChapterMediaState) => ReactNode;
  identity?: VehicleConfiguration['identity'];
  className?: string;
}
export function clampChapterProgress(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
/** OS preference and short landscape always override animated presentation. */
export function useChapterMotion(mode: MotionMode): MotionMode {
  return mode;
}
export function chapterTextStyle(progress: number, enabled: boolean): CSSProperties {
  const p = clampChapterProgress(progress);
  const ease = (t: number) => 1 - (1 - t) ** 3;
  const entering = ease(Math.min(p / 0.18, 1));
  const leaving = ease(Math.max(0, (p - 0.76) / 0.24));
  return enabled ? {
    '--chapter-opacity': entering * (1 - leaving),
    '--chapter-offset': `${24 * (1 - entering)}px`,
  } as CSSProperties : {};
}

/** Mystery / presence. Identity is editorial until approved brand content exists. */
export function IntroChapter({ progress, sequenceProgress, motionMode = 'full', mediaReady = false,
  renderMedia, identity = vehicle.identity, className }: IntroChapterProps) {
  const mode = useChapterMotion(motionMode);
  const chapter = vehicle.chapters[0];
  const p = clampChapterProgress(progress);
  const global = clampChapterProgress(sequenceProgress ?? chapter.start + p * (chapter.end - chapter.start));
  const brand = identity.brand || 'Light / Form';
  return <section id={chapter.id} aria-labelledby="presence-title"
    className={[styles.chapter, className].filter(Boolean).join(' ')} data-motion={mode}>
    <div className={styles.media} aria-hidden="true" inert>
      {renderMedia?.({ progress: global, revealProgress: 0, motionMode: mode })}
    </div>
    <div className={styles.shade} aria-hidden="true" />
    <header className={styles.masthead}>
      <span className={styles.identity}>{brand}</span>
      <span className={styles.edition}>{[identity.model, identity.modelYear].filter(Boolean).join(' / ') || 'A study in light'}</span>
    </header>
    <div className={styles.copy} style={chapterTextStyle(p, mediaReady && mode === 'full')}>
      <p className={styles.eyebrow}>01 / {chapter.label}</p>
      <h1 id="presence-title" className={styles.headline}>{chapter.headline}</h1>
      <p className={styles.description}>{chapter.description}</p>
    </div>
    <footer className={styles.footer}>
      <span className={styles.note}>Form. Light. Perspective.</span>
      <a className={styles.next} href="#silhouette"><span aria-hidden="true">↓</span> Follow the line</a>
    </footer>
  </section>;
}
