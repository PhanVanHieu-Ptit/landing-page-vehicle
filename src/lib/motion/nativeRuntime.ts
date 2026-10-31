import type { MotionRuntime } from './engine';
/** Native scroll adapter. CSS owns sticky positioning; this adapter never intercepts input. */
export const nativeRuntime: MotionRuntime = {
  timeline: () => ({ progress() {}, invalidate() {}, kill() {} }),
  scrollTrigger: { create(options) {
    const win = options.trigger.ownerDocument.defaultView!;
    let start = options.start(), end = options.end();
    const update = () => options.onUpdate({ progress: (win.scrollY - start) / Math.max(1, end - start) });
    win.addEventListener('scroll', update, { passive: true });
    return { refresh: () => { start = options.start(); end = options.end(); options.onRefresh(); }, kill: () => win.removeEventListener('scroll', update) };
  } },
};
