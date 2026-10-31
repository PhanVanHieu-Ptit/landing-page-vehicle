import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateManifest, frameUrl, progressToFrame, getSequence } from '../../src/lib/assets/manifest';
import { FrameLoader } from '../../src/lib/assets/loader';
import type { Drawable } from '../../src/lib/assets/loader';
import { validateFiles, webpDimensions } from './validate';
const raw = JSON.parse(await readFile('public/assets/manifest.json', 'utf8'));
const manifest = validateManifest(raw);
const sequence = getSequence(manifest, 'desktop');
const clone = () => structuredClone(raw);
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
test('index endpoints, clamping, nonfinite and nonzero origins', () => {
  assert.equal(progressToFrame(0, sequence), 0);
  assert.equal(progressToFrame(1, sequence), 179);
  assert.equal(progressToFrame(-1, sequence), 0);
  assert.equal(progressToFrame(2, sequence), 179);
  assert.equal(progressToFrame(NaN, sequence), 0);
  assert.equal(progressToFrame(.5, sequence), 89);
  assert.equal(progressToFrame(1, { ...sequence, firstFrame: 10, lastFrame: 189 }), 189);
  assert.equal(frameUrl(sequence, 9), '/assets/vehicle/desktop/frame-0009.webp');
  assert.throws(() => frameUrl(sequence, 180));
  assert.throws(() => frameUrl(sequence, .5));
});
test('manifest rejects invalid contracts and permits honest requirements', () => {
  assert.equal(manifest.status, 'requirements-only');
  const mutations = [
    (m: typeof raw) => m.assets.push(m.assets[0]),
    (m: typeof raw) => m.assets[0].width = 0,
    (m: typeof raw) => m.assets[0].lastFrame = 180,
    (m: typeof raw) => m.assets[0].frameCount = 179,
    (m: typeof raw) => m.assets[0].pattern = '/assets/../secret-{index}.webp',
    (m: typeof raw) => m.assets[0].pattern = '/assets/frame.webp',
    (m: typeof raw) => m.assets[0].id = 'unknown',
    (m: typeof raw) => m.assets[0].status = 'approved',
    (m: typeof raw) => m.status = 'approved',
    (m: typeof raw) => m.assets = m.assets.filter((a: { id: string }) => a.id !== 'sequence-mobile'),
  ];
  for (const mutate of mutations) { const m = clone(); mutate(m); assert.throws(() => validateManifest(m)); }
});
test('missing frames fail once, use nearest drawable, and dispose', async () => {
  const failures: number[] = []; let disposed = 0;
  const loader = new FrameLoader(sequence, () => {}, index => failures.push(index), {
    maxFrames: 2, concurrency: 1,
    load: async url => { if (url.includes('0000')) throw new Error('missing'); return { image: {} as CanvasImageSource, width: 10, height: 10, dispose: () => { disposed++; } }; },
  });
  assert.equal(loader.nearest(0), undefined);
  loader.request(0); await settle();
  assert.deepEqual(failures, [0]); assert.ok(loader.nearest(0));
  loader.request(0); await settle(); assert.deepEqual(failures, [0]);
  loader.dispose(); assert.equal(loader.nearest(0), undefined); assert.ok(disposed > 0);
});
test('queue bounds concurrency, reprioritizes seeks and cleans late completions', async () => {
  const pending: { url: string; done: (frame: Drawable) => void }[] = [];
  let disposed = 0;
  const loader = new FrameLoader(sequence, () => {}, () => {}, { concurrency: 2, maxFrames: 2, load: url => new Promise(done => pending.push({ url, done })) });
  loader.request(0); assert.equal(pending.length, 2);
  loader.request(179); assert.equal(pending.length, 2);
  pending[0].done({ image: {} as CanvasImageSource, width: 1, height: 1, dispose: () => { disposed++; } });
  await settle(); assert.equal(pending.length, 3); assert.ok(pending[2].url.includes('0179'));
  loader.dispose();
  for (const p of pending.slice(1)) p.done({ image: {} as CanvasImageSource, width: 1, height: 1, dispose: () => { disposed++; } });
  await settle(); assert.equal(disposed, 3);
});
test('decoded byte budget rejects oversize images', async () => {
  let disposed = false; const failures: number[] = [];
  const loader = new FrameLoader(sequence, () => {}, i => failures.push(i), { maxBytes: 1, load: async () => ({ image: {} as CanvasImageSource, width: 2, height: 2, dispose: () => { disposed = true; } }) });
  loader.request(0); await settle(); assert.ok(disposed); assert.deepEqual(failures, [0]); assert.equal(loader.nearest(0), undefined); loader.dispose();
});
test('file gate reports all absent frames without inventing assets', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'missing-assets-'));
  try {
    const errors = await validateFiles('public/assets/manifest.json', directory);
    assert.equal(errors.length, 373); // 360 frames + 12 posters + requirements-only gate
    assert.ok(errors.some(e => e.includes('frame-0179.webp')));
  } finally { await rm(directory, { recursive: true }); }
});
test('WebP parser rejects invalid/truncated files and reads VP8X dimensions', () => {
  assert.throws(() => webpDimensions(Buffer.from('invalid')));
  const b = Buffer.alloc(30); b.write('RIFF'); b.write('WEBP', 8); b.write('VP8X', 12); b.writeUInt32LE(10, 16); b.writeUIntLE(1919, 24, 3); b.writeUIntLE(1079, 27, 3);
  assert.deepEqual(webpDimensions(b), [1920, 1080]); assert.throws(() => webpDimensions(b.subarray(0, 29)));
});

test('repeated preload requests do not churn the bounded cache', async () => {
  let requests = 0;
  const loader = new FrameLoader(sequence, () => {}, () => {}, {
    maxFrames: 3, concurrency: 2,
    load: async () => { requests++; return { image: {} as CanvasImageSource, width: 1, height: 1, dispose: () => {} }; },
  });
  loader.request(90); await settle();
  assert.equal(requests, 3);
  loader.request(90); await settle();
  assert.equal(requests, 3);
  loader.request(NaN); await settle();
  assert.ok(loader.nearest(0)); loader.dispose();
});

test('manifest rejects malformed metadata, tokens and variant mismatches', () => {
  for (const mutate of [
    (m: typeof raw) => m.assets[0].source = undefined,
    (m: typeof raw) => m.assets[0].variant = 'mobile',
    (m: typeof raw) => m.assets[0].pattern = '/assets/frame-{index}}.webp',
    (m: typeof raw) => m.assets[0].maxBytesPerFile = Infinity,
    (m: typeof raw) => m.assets[0].firstFrame = -1,
  ]) { const m = clone(); mutate(m); assert.throws(() => validateManifest(m)); }
  assert.throws(() => getSequence({ ...manifest, assets: [] }, 'desktop'));
});
