import type { AssetManifest, AssetRecord } from '../../types/cinematic';

export type SequenceAsset = AssetRecord & { kind: 'sequence'; pattern: string; frameCount: number; firstFrame: number; lastFrame: number };
const chapters = 'presence|silhouette|detail|interior|journey|invitation';
const idPattern = new RegExp(`^(sequence|poster-(${chapters}))-(desktop|mobile)$`);
const token = /\{index(?::0([1-9]\d?)d)?\}/;
export function validateManifest(value: unknown): AssetManifest {
  const fail = (message: string): never => { throw new Error(`Invalid asset manifest: ${message}`); };
  if (!value || typeof value !== 'object') return fail('expected object');
  const m = value as AssetManifest;
  if (m.schemaVersion !== 1 || !['requirements-only', 'approved'].includes(m.status) || !Array.isArray(m.assets)) return fail('schema or status');
  const ids = new Set<string>();
  for (const a of m.assets) {
    if (!a || typeof a.id !== 'string' || !idPattern.test(a.id) || ids.has(a.id)) return fail('unknown or duplicate ID');
    ids.add(a.id);
    if (!['desktop', 'mobile'].includes(a.variant) || !a.id.endsWith(`-${a.variant}`) || !['required', 'approved'].includes(a.status)) return fail(`${a.id}: variant/status`);
    for (const n of [a.width, a.height, a.maxBytesPerFile]) if (!Number.isSafeInteger(n) || n <= 0) return fail(`${a.id}: dimensions/budget`);
    for (const field of [a.source, a.license, a.alt]) if (field !== null && (typeof field !== 'string' || !field.trim())) return fail(`${a.id}: metadata`);
    if (a.kind === 'sequence' && a.id.startsWith('sequence-')) {
      if (typeof a.pattern !== 'string' || !token.test(a.pattern) || (a.pattern.match(/\{/g) || []).length !== 1 || a.pattern.replace(token, '').includes('}')) return fail(`${a.id}: pattern`);
      if (a.frameCount !== 180 || !Number.isSafeInteger(a.firstFrame) || a.firstFrame! < 0 || a.lastFrame !== a.firstFrame! + a.frameCount - 1) return fail(`${a.id}: consecutive 180 frames required`);
      assertLocalPath(a.pattern.replace(token, '0000'));
    } else if (a.kind === 'poster' && a.id.startsWith('poster-') && typeof a.url === 'string') assertLocalPath(a.url);
    else return fail(`${a.id}: kind/path`);
    if (a.status === 'approved' && (!a.source || !a.license || (a.kind === 'poster' && !a.alt))) return fail(`${a.id}: approval metadata required`);
    if (m.status === 'approved' && a.status !== 'approved') return fail('unapproved record');
  }
  if (!ids.has('sequence-desktop') || !ids.has('sequence-mobile')) return fail('both sequence variants required');
  if (m.status === 'approved' && ids.size !== 14) return fail('all sequences and chapter posters required');
  return m;
}
export function assertLocalPath(path: string): void {
  if (!/^\/assets\/[a-zA-Z0-9_./-]+$/.test(path) || path.split('/').includes('..') || path.includes('//')) throw new Error(`Unsafe asset path: ${path}`);
}
export function progressToFrame(progress: number, sequence: SequenceAsset): number {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return sequence.firstFrame + Math.floor(p * (sequence.frameCount - 1));
}
export function frameUrl(sequence: SequenceAsset, index: number): string {
  if (!Number.isInteger(index) || index < sequence.firstFrame || index > sequence.lastFrame) throw new RangeError('Frame outside sequence');
  return sequence.pattern.replace(token, (_, digits: string | undefined) => String(index).padStart(Number(digits || 0), '0'));
}
export function getSequence(manifest: AssetManifest, variant: 'desktop' | 'mobile'): SequenceAsset {
  const asset = manifest.assets.find(a => a.id === `sequence-${variant}`);
  if (!asset || asset.kind !== 'sequence') throw new Error(`Missing sequence variant: ${variant}`);
  return asset as SequenceAsset;
}
