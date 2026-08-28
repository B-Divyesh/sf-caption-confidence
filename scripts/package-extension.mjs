import { createWriteStream } from 'node:fs';
import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import archiver from 'archiver';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, '.output/chrome-mv3');
const extensionOutput = resolve(root, 'dist/extension');
const zipPath = resolve(root, 'dist/site/downloads/caption-confidence-chrome.zip');

await mkdir(extensionOutput, { recursive: true });
await cp(source, extensionOutput, { recursive: true });
await mkdir(dirname(zipPath), { recursive: true });

await new Promise((resolveArchive, reject) => {
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolveArchive);
  output.on('error', reject);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(source, false);
  void archive.finalize();
});

console.log(`Packaged extension: ${zipPath}`);
