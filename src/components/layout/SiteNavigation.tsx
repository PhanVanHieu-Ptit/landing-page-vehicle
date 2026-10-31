import { useRef } from 'react';
import type { ChapterDefinition, ChapterId } from '../../types/cinematic';
import styles from './Layout.module.css';

export interface SiteNavigationProps {
  chapters: readonly ChapterDefinition[];
  /** Supplied by the future experience owner; navigation does not track scrolling. */
  activeChapterId?: ChapterId;
}

export function SiteNavigation({ chapters, activeChapterId }: SiteNavigationProps) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const links = (mobile: boolean) => (
    <ol className={styles.links}>
      {chapters.map((chapter, index) => (
        <li key={chapter.id}>
          <a href={`#${chapter.id}`}
            aria-current={activeChapterId === chapter.id ? 'step' : undefined}
            onClick={() => {
              if (mobile && disclosure.current) {
                // Move focus before hiding the activated link. Native anchors scroll normally.
                summary.current?.focus({ preventScroll: true });
                disclosure.current.open = false;
              }
            }}>
            <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            {chapter.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav aria-label="Chapters" className={styles.desktopNavigation}>{links(false)}</nav>
      <details ref={disclosure} className={styles.mobileNavigation}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && disclosure.current?.open) {
            disclosure.current.open = false;
            summary.current?.focus();
          }
        }}>
        <summary ref={summary}>Explore chapters</summary>
        <nav aria-label="Chapters">{links(true)}</nav>
      </details>
    </>
  );
}
