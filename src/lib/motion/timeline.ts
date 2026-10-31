import type { ChapterDefinition, ChapterId, MotionMode, TimelineState } from '../../types/cinematic';

export const clampProgress = (value: number): number => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
export function validateTimeline(chapters: readonly ChapterDefinition[], frameCount: number): void {
  if (!Number.isInteger(frameCount) || frameCount < 1) throw new RangeError('Invalid frameCount');
  const ids = new Set<ChapterId>();
  let end = 0;
  if (chapters.length !== 6) throw new RangeError('Expected six chapters');
  for (const chapter of chapters) {
    if (ids.has(chapter.id) || !Number.isFinite(chapter.end) || chapter.start !== end || chapter.end <= chapter.start || chapter.end > 1) throw new RangeError('Chapters must uniquely and contiguously cover [0,1]');
    ids.add(chapter.id);
    end = chapter.end;
  }
  if (end !== 1) throw new RangeError('Chapters must end at 1');
}
export function resolveTimeline(progress: number, chapters: readonly ChapterDefinition[], frameCount: number, motionMode: MotionMode = 'full', posterFrames?: Readonly<Record<ChapterId, number>>): TimelineState {
  validateTimeline(chapters, frameCount);
  const p = clampProgress(progress);
  const chapter = chapters.find(c => p < c.end) ?? chapters[chapters.length - 1];
  if (motionMode !== 'full' && !posterFrames) throw new RangeError('Static mode requires poster indices');
  return { progress: motionMode === 'full' ? p : chapter.start, chapterId: chapter.id,
    localProgress: motionMode === 'full' ? clampProgress((p - chapter.start) / (chapter.end - chapter.start)) : 0,
    frameIndex: motionMode === 'full' ? Math.floor(p * (frameCount - 1)) : posterFrames![chapter.id], motionMode };
}
