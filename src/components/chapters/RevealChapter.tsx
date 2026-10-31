import type { CSSProperties } from 'react';
import { vehicle } from '../../config/vehicle';
import type { IntroChapterProps } from './IntroChapter';
import { chapterTextStyle, clampChapterProgress, useChapterMotion } from './IntroChapter';
import styles from './RevealChapter.module.css';

export type RevealChapterProps = Omit<IntroChapterProps, 'identity'>;

/** Vehicle reveal / silhouette. No timers, scroll listeners or autonomous playback. */
export function RevealChapter({ progress, sequenceProgress, motionMode = 'full', mediaReady = false,
  renderMedia, className }: RevealChapterProps) {
  const chapter = vehicle.chapters[1];
  const mode = useChapterMotion(motionMode);
  const p = clampChapterProgress(progress);
  const reveal = mode === 'full' ? 1 - (1 - p) ** 3 : 1;
  const global = clampChapterProgress(sequenceProgress ?? chapter.start + p * (chapter.end - chapter.start));
  return <section id={chapter.id} aria-labelledby="silhouette-title"
    className={[styles.chapter, className].filter(Boolean).join(' ')} data-motion={mode}
    style={{ '--reveal-cover': 1 - reveal } as CSSProperties}>
    <div className={styles.media} aria-hidden="true" inert>
      {renderMedia?.({ progress: global, revealProgress: reveal, motionMode: mode })}
    </div>
    <div className={styles.veil} aria-hidden="true" />
    <div className={styles.shade} aria-hidden="true" />
    <div className={styles.copy} style={chapterTextStyle(p, mediaReady && mode === 'full')}>
      <p className={styles.eyebrow}>02 / {chapter.label}</p>
      <h2 id="silhouette-title" className={styles.headline}>{chapter.headline}</h2>
      <p className={styles.description}>{chapter.description}</p>
    </div>
    <footer className={styles.footer}>
      <a className={styles.next} href="#presence">↑ Presence</a>
      <a className={styles.next} href="#detail">Look closer <span aria-hidden="true">↓</span></a>
    </footer>
  </section>;
}
