import { resolve } from 'node:path';
import { validateFiles } from './validate';
const root = resolve(process.argv[2] || 'public');
try {
  const errors = await validateFiles(resolve(root, 'assets/manifest.json'), root);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Asset production gate passed.');
} catch (error) { console.error(error); process.exitCode = 1; }
