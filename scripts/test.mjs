import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const directory = await mkdtemp(join(tmpdir(), 'vehicle-tests-'));
try {
  for (const [index, entry] of ['scripts/assets/assets.test.ts', 'src/lib/motion/motion.test.ts', 'src/components/chapters/PerformanceChapter.gauge.test.mjs'].entries()) {
    const outfile = join(directory, `${index}.mjs`);
    await build({ entryPoints: [entry], outfile, bundle: true, platform: 'node', format: 'esm' });
    const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
    if (result.status) process.exitCode = result.status;
  }
} finally { await rm(directory, { recursive: true, force: true }); }
