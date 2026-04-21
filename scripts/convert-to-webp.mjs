import { readdir, rename, unlink, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'src', 'assets');
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png']);
const QUALITY = 82;

async function processDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const images = entries
    .filter((e) => e.isFile() && SUPPORTED.has(extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort();

  if (images.length === 0) return 0;

  const folderName = dir.split('/').pop();
  let converted = 0;

  for (let i = 0; i < images.length; i++) {
    const oldName = images[i];
    const oldPath = join(dir, oldName);
    const newName = `${folderName}-${String(i + 1).padStart(2, '0')}.webp`;
    const newPath = join(dir, newName);

    await sharp(oldPath)
      .webp({ quality: QUALITY })
      .toFile(newPath + '.tmp');

    await rename(newPath + '.tmp', newPath);
    await unlink(oldPath);
    console.log(`  ${oldName} -> ${newName}`);
    converted++;
  }

  return converted;
}

async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      console.log(`\n[${entry.name}]`);
      total += await processDir(full);
      total += await walk(full);
    }
  }
  return total;
}

(async () => {
  try {
    await stat(ASSETS_DIR);
  } catch {
    console.error(`Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }

  console.log(`Converting images in ${ASSETS_DIR} to WebP (quality=${QUALITY})`);
  const total = await walk(ASSETS_DIR);
  console.log(`\nDone. Converted ${total} file(s).`);
})();
