import type { ReactNode } from 'react';
import type { ChapterDefinition, ChapterId } from '../types/cinematic';
import { ErrorBoundary, SiteNavigation } from '../components/layout';
import styles from '../components/layout/Layout.module.css';

export interface ChapterSlotContext {
  chapter: ChapterDefinition;
  index: number;
  headingId: string;
}

export interface AppShellProps {
  chapters: readonly ChapterDefinition[];
  title?: string;
  introduction?: ReactNode;
  activeChapterId?: ChapterId;
  /** Return chapter body content. Shell owns section IDs and h2 headings; do not duplicate them. */
  renderChapter?: (context: ChapterSlotContext) => ReactNode;
  /** Optional future experience controls; shell implements no motion or media behavior. */
  controls?: ReactNode;
  footer?: ReactNode;
}

function ChapterContent({ renderChapter, context }: {
  renderChapter: NonNullable<AppShellProps['renderChapter']>;
  context: ChapterSlotContext;
}) {
  // Execute the renderer below the slot's boundary, so renderer errors are contained.
  return renderChapter(context);
}

/** Layout-only composition surface. No canvas, asset requests, or timeline state. */
export function AppShell({
  chapters, title = 'Light / Form', introduction = 'A study in presence, perspective and possibility.',
  activeChapterId, renderChapter, controls, footer,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <a className={styles.brand} href="#main-content" aria-label={`${title} — introduction`}>{title}</a>
        <SiteNavigation chapters={chapters} activeChapterId={activeChapterId} />
      </header>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div className={styles.introduction}>
          <p className={styles.eyebrow}>An automotive study</p>
          <h1>{title}</h1>
          <div className={styles.introCopy}>{introduction}</div>
        </div>
        {controls && <ErrorBoundary label="Experience controls">{controls}</ErrorBoundary>}
        {chapters.map((chapter, index) => {
          const headingId = `${chapter.id}-heading`;
          return (
            <section key={chapter.id} id={chapter.id} aria-labelledby={headingId}
              className={styles.chapter} tabIndex={-1}>
              <p className={styles.eyebrow}><span aria-hidden="true">{String(index + 1).padStart(2, '0')} / </span>{chapter.label}</p>
              <h2 id={headingId}>{chapter.headline}</h2>
              <ErrorBoundary label={chapter.label}>
                {renderChapter
                  ? <ChapterContent renderChapter={renderChapter} context={{ chapter, index, headingId }} />
                  : <p className={styles.chapterCopy}>{chapter.description}</p>}
              </ErrorBoundary>
            </section>
          );
        })}
      </main>
      <footer className={styles.footer}>
        {footer ?? <p>{title} <span aria-hidden="true">/</span> An automotive study</p>}
        <a href="#main-content">Back to introduction ↑</a>
      </footer>
    </div>
  );
}
