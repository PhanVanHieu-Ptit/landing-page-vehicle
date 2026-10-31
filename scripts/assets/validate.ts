import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { frameUrl, validateManifest } from '../../src/lib/assets/manifest';
import type { SequenceAsset } from '../../src/lib/assets/manifest';

/** WebP VP8, VP8L and VP8X dimensions, independent of optional image libraries. */
export function webpDimensions(b: Buffer): [number, number] {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error('Expected WebP');
  for (let p = 12; p + 8 <= b.length;) {
    const kind = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4), d = p + 8;
    if (d + size > b.length) throw new Error('Truncated WebP');
    if (kind === 'VP8X' && size >= 10) return [1 + b.readUIntLE(d + 4, 3), 1 + b.readUIntLE(d + 7, 3)];
    if (kind === 'VP8 ' && size >= 10 && b[d + 3] === 0x9d && b[d + 4] === 0x01 && b[d + 5] === 0x2a) return [b.readUInt16LE(d + 6) & 0x3fff, b.readUInt16LE(d + 8) & 0x3fff];
    if (kind === 'VP8L' && size >= 5 && b[d] === 0x2f) { const bits = b.readUInt32LE(d + 1); return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)]; }
    p = d + size + (size % 2);
  }
  throw new Error('Missing image dimensions');
}
export async function validateFiles(manifestPath: string, publicRoot: string): Promise<string[]> {
  const manifest = validateManifest(JSON.parse(await readFile(manifestPath, 'utf8')));
  const errors: string[] = [];
  if (manifest.status !== 'approved') errors.push('Manifest is requirements-only; production media gate cannot pass.');
  for (const asset of manifest.assets) {
    const urls = asset.kind === 'sequence' ? Array.from({ length: asset.frameCount! }, (_, i) => frameUrl(asset as SequenceAsset, asset.firstFrame! + i)) : [asset.url!];
    for (const url of urls) {
      const path = resolve(publicRoot, `.${url}`);
      if (!path.startsWith(resolve(publicRoot) + sep)) { errors.push(`${url}: outside public root`); continue; }
      try {
        const info = await stat(path);
        if (!info.isFile()) throw new Error('Not a file');
        if (info.size > asset.maxBytesPerFile) errors.push(`${url}: ${info.size} bytes exceeds ${asset.maxBytesPerFile}`);
        const [w, h] = webpDimensions(await readFile(path));
        if (w !== asset.width || h !== asset.height) errors.push(`${url}: ${w}x${h}, expected ${asset.width}x${asset.height}`);
      } catch (error) { errors.push(`${url}: ${(error as Error).message}`); }
    }
  }
  return errors;
}
