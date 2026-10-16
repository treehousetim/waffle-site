/**
 * Draws the example site's raster images from SVG: the default link preview
 * (public/og-default.png, 1200x630), the logo for structured data
 * (public/logo.png, 512x512). Run once; the PNGs are committed. Replace them
 * with your own and delete this.
 *
 *   ./tools/npm.sh exec -- node tools/dev/make-images.mjs
 */
import sharp from 'sharp';

const brand = '#6d28d9';
const soft = '#f1ebfe';
const ink = '#17132b';
const muted = '#5d5873';
const font = 'Helvetica, Arial, sans-serif';

const mark = (x, y, size) => `
  <g transform="translate(${x} ${y}) scale(${size / 32})">
    <rect x="2" y="2" width="28" height="28" rx="8" fill="${brand}"/>
    <path d="M17.5 6L9.5 18h6l-1.5 8 8.5-12.5h-6.2L17.5 6z" fill="#f5a524"/>
  </g>`;

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${soft}"/>
  <circle cx="1080" cy="80" r="260" fill="#e2d5fc"/>
  ${mark(80, 80, 96)}
  <text x="80" y="330" font-family="${font}" font-size="72" font-weight="700" fill="${ink}">Waffle Site</text>
  <text x="80" y="410" font-family="${font}" font-size="40" fill="${muted}">Licensed electricians in Springfield</text>
  <text x="80" y="470" font-family="${font}" font-size="32" fill="${brand}">24/7 emergency service · Free estimates</text>
</svg>`;

const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${mark(0, 0, 512)}</svg>`;

await sharp(Buffer.from(og)).png().toFile('public/og-default.png');
await sharp(Buffer.from(logo)).png().toFile('public/logo.png');
console.log('wrote public/og-default.png and public/logo.png');
