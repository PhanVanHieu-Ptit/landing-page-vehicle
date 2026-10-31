// Compile TypeScript tools without changing the repository's dependency files.
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const directory = await mkdtemp(join(tmpdir(), 'vehicle-assets-'));
try {
  const test = process.argv[2] === 'test';
  const outfile = join(directory, 'tool.mjs');
  await build({ entryPoints: [test ? 'scripts/assets/assets.test.ts' : 'scripts/assets/cli.ts'], outfile, bundle: true, platform: 'node', format: 'esm' });
  const result = spawnSync(process.execPath, [...(test ? ['--test'] : []), outfile, ...process.argv.slice(3)], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally { await rm(directory, { recursive: true, force: true }); }
