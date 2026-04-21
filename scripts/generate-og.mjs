import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const W = 1200;
const H = 630;

// SVG overlay: dark veil + headline + CTA
const overlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#1a1208" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#1a1208" stop-opacity="0.72"/>
    </linearGradient>
  </defs>

  <!-- veil -->
  <rect width="${W}" height="${H}" fill="url(#veil)"/>

  <!-- headline -->
  <text
    x="80" y="260"
    font-family="Georgia, serif"
    font-size="64"
    font-weight="400"
    fill="#f4efe8"
    letter-spacing="2"
  >Dana Serdiuk</text>

  <!-- sub-headline -->
  <text
    x="82" y="326"
    font-family="Georgia, serif"
    font-size="28"
    font-weight="400"
    fill="#d9c9b0"
    letter-spacing="4"
  >ФОТОГРАФ · ІВАНО-ФРАНКІВСЬК</text>

  <!-- divider -->
  <rect x="80" y="358" width="60" height="1" fill="#d9c9b0" opacity="0.7"/>

  <!-- CTA -->
  <text
    x="80" y="420"
    font-family="Georgia, serif"
    font-size="22"
    font-weight="400"
    fill="#f4efe8"
    letter-spacing="3"
  >ЗАБРОНЮВАТИ ЗЙОМКУ →</text>

  <!-- url -->
  <text
    x="80" y="${H - 40}"
    font-family="Arial, sans-serif"
    font-size="16"
    fill="#d9c9b0"
    opacity="0.7"
    letter-spacing="1"
  >danke-photo.vercel.app</text>
</svg>
`;

await sharp(join(root, 'public', 'og-cover.webp'))
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: Buffer.from(overlay), blend: 'over' }])
  .webp({ quality: 90 })
  .toFile(join(root, 'public', 'og-cover-social.webp'));

console.log('✓ og-cover-social.webp generated (1200×630)');
