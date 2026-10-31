import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ChapterDefinition } from '../../types/cinematic';
import { vehicle } from '../../config/vehicle';
import { resolveTimeline } from './timeline';
import { createCinematicScroll } from './engine';
import type { MotionRuntime } from './engine';
const posters = { presence: 0, silhouette: 40, detail: 72, interior: 103, journey: 135, invitation: 179 };
test('boundaries, reverse seeks, direct jumps and nonfinite input', () => {
  const boundaries = [0, .14, .32, .49, .66, .85, 1];
  const frames = [0, 25, 57, 87, 118, 152, 179];
  for (const i of [0, 5, 6, 5, 4, 3, 2, 1, 0]) {
    const state = resolveTimeline(boundaries[i], vehicle.chapters, 180);
    assert.equal(state.chapterId, vehicle.chapters[Math.min(i, 5)].id);
    assert.equal(state.frameIndex, frames[i]);
    if (i > 0 && i < 6) {
      assert.equal(resolveTimeline(boundaries[i] - 1e-9, vehicle.chapters, 180).chapterId, vehicle.chapters[i - 1].id);
      assert.equal(resolveTimeline(boundaries[i] + 1e-9, vehicle.chapters, 180).chapterId, vehicle.chapters[i].id);
      assert.equal(state.localProgress, 0);
    }
  }
  for (const p of [-1, NaN, Infinity, -Infinity]) assert.equal(resolveTimeline(p, vehicle.chapters, 180).progress, 0);
  assert.equal(resolveTimeline(2, vehicle.chapters, 180).localProgress, 1);
  assert.equal(resolveTimeline(.4, vehicle.chapters, 180, 'reduced', posters).frameIndex, 72);
  for (const count of [0, -1, 1.5, NaN]) assert.throws(() => resolveTimeline(0, vehicle.chapters, count));
  for (const start of [.1, .2, .32]) {
    const chapters: ChapterDefinition[] = vehicle.chapters.map(c => ({ ...c }));
    chapters[1].start = start;
    assert.throws(() => resolveTimeline(0, chapters, 180));
  }
});
test('rAF coalescing, owned teardown and remount without duplicate listeners', () => {
  const events = new Map<string, Set<unknown>>();
  const add = (name: string, fn: unknown) => { if (!events.has(name)) events.set(name, new Set()); events.get(name)!.add(fn); };
  const remove = (name: string, fn: unknown) => { events.get(name)?.delete(fn); };
  let next = 0, killed = 0, timelineKilled = 0, disconnected = 0, notifications = 0;
  const queued = new Map<number, FrameRequestCallback>();
  const flush = () => { const jobs = [...queued.values()]; queued.clear(); jobs.forEach(fn => fn(0)); };
  const win = { scrollY: 0, innerHeight: 1000, location: { hash: '' },
    matchMedia: (query: string) => ({ matches: false, addEventListener: (_: string, fn: unknown) => add(query, fn), removeEventListener: (_: string, fn: unknown) => remove(query, fn) }),
    requestAnimationFrame: (fn: FrameRequestCallback) => { queued.set(++next, fn); return next; },
    cancelAnimationFrame: (id: number) => queued.delete(id), addEventListener: add, removeEventListener: remove,
    scrollTo: () => {},
  };
  const oldResize = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class { observe() {} disconnect() { disconnected++; } } as unknown as typeof ResizeObserver;
  let update: (self: { progress: number }) => void = () => {};
  const runtime: MotionRuntime = {
    timeline: () => ({ progress() {}, invalidate() {}, kill() { timelineKilled++; } }),
    scrollTrigger: { create: options => { update = options.onUpdate; return { refresh() { options.onRefresh(); }, kill(revert) { assert.equal(revert, true); killed++; } }; } },
  };
  const stage = { dataset: {}, ownerDocument: { defaultView: win }, offsetHeight: 7000, getBoundingClientRect: () => ({ top: 0 }) } as unknown as HTMLElement;
  const chapterElements = Object.fromEntries(vehicle.chapters.map(c => [c.id, stage])) as Record<keyof typeof posters, HTMLElement>;
  try {
    for (let mount = 0; mount < 2; mount++) {
      const engine = createCinematicScroll({ stage, chapters: vehicle.chapters, chapterElements, frameCount: 180, posterFrames: posters, runtime });
      engine.subscribe(() => notifications++);
      flush();
      update({ progress: .14 }); update({ progress: .85 });
      assert.equal(queued.size, 1);
      flush();
      assert.equal(engine.getSnapshot().chapterId, 'invitation');
      engine.refresh();
      const staleUpdate = update;
      engine.destroy(); engine.destroy();
      staleUpdate({ progress: 0 }); engine.navigate('presence');
      assert.equal(queued.size, 0);
      assert.equal([...events.values()].reduce((n, set) => n + set.size, 0), 0);
    }
    assert.equal(killed, 2); assert.equal(timelineKilled, 2); assert.equal(disconnected, 2); assert.equal(notifications, 2);
  } finally { globalThis.ResizeObserver = oldResize; }
});
