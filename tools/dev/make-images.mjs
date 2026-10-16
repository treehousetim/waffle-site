/**
 * Draws the example site's raster images from SVG: the default link preview
 * (public/og-default.png, 1200x630), the logo for structured data
 * (public/logo.png, 512x512) and the example posts' covers. Run once; the
 * PNGs are committed. Replace them with your own photos and delete this.
 *
 *   ./tools/npm.sh exec -- node tools/dev/make-images.mjs
 */
import sharp from 'sharp';

const brand = '#6d28d9';
const soft = '#f1ebfe';
const ink = '#1c1830';
const muted = '#5d5873';
const font = 'Helvetica, Arial, sans-serif';

const mark = (x, y, size) => `
  <g transform="translate(${x} ${y}) scale(${size / 32})">
    <rect x="2" y="2" width="28" height="28" rx="8" fill="${brand}"/>
    <path d="M17.5 6L9.5 18h6l-1.5 8 8.5-12.5h-6.2L17.5 6z" fill="#fff"/>
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

const frame = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
  <rect width="1600" height="900" fill="#f7f5fc"/>${body}</svg>`;

// An open panel: two columns of breakers, labelled.
const breakers = [];
for (let row = 0; row < 8; row += 1) {
    for (const [x, label] of [[640, 'L'], [820, 'R']]) {
        breakers.push(`<rect x="${x}" y="${190 + row * 70}" width="140" height="50" rx="8" fill="${row % 3 === 0 ? brand : '#a78bfa'}"/>`);
        breakers.push(`<rect x="${x + (label === 'L' ? 150 : -40)}" y="${200 + row * 70}" width="30" height="30" rx="4" fill="#fff" stroke="${muted}"/>`);
    }
}
const panel = frame(`<rect x="560" y="110" width="480" height="700" rx="24" fill="#fff" stroke="#d9d0f0" stroke-width="6"/>${breakers.join('')}`);

// A car at a wall charger.
const ev = frame(`
  <rect x="0" y="700" width="1600" height="200" fill="#e6e1f2"/>
  <rect x="200" y="260" width="120" height="200" rx="18" fill="${brand}"/>
  <circle cx="260" cy="330" r="26" fill="#fff"/>
  <path d="M260 460 C 260 600, 520 560, 560 520" stroke="${ink}" stroke-width="12" fill="none"/>
  <path d="M520 560 h700 a80 80 0 0 0 80 -80 v-40 a40 40 0 0 0 -30 -38 l-160 -40 l-120 -110 h-300 l-150 150 h-60 a40 40 0 0 0 -40 40 v118 z" fill="#8b5cf6"/>
  <circle cx="720" cy="620" r="70" fill="${ink}"/><circle cx="1150" cy="620" r="70" fill="${ink}"/>
  <path d="M860 290 h220 l90 100 h-380 z" fill="#ddd6fe"/>`);

// A standby generator beside a house.
const generator = frame(`
  <rect x="0" y="720" width="1600" height="180" fill="#e6e1f2"/>
  <rect x="200" y="200" width="560" height="520" fill="#fff" stroke="#d9d0f0" stroke-width="6"/>
  <path d="M170 220 L480 40 L790 220 z" fill="#c4b5fd"/>
  <rect x="300" y="320" width="140" height="140" fill="#ede9fe"/><rect x="520" y="320" width="140" height="140" fill="#ede9fe"/>
  <rect x="900" y="660" width="520" height="60" rx="8" fill="#cbd5e1"/>
  <rect x="940" y="440" width="440" height="220" rx="28" fill="${brand}"/>
  <path d="M1060 500 h200 M1060 545 h200 M1060 590 h200" stroke="#fff" stroke-width="14" stroke-linecap="round"/>`);

await sharp(Buffer.from(og)).png().toFile('public/og-default.png');
await sharp(Buffer.from(logo)).png().toFile('public/logo.png');
await sharp(Buffer.from(panel)).png().toFile('src/assets/blog/panel.png');
await sharp(Buffer.from(ev)).png().toFile('src/assets/blog/ev.png');
await sharp(Buffer.from(generator)).png().toFile('src/assets/blog/generator.png');
console.log('wrote public/og-default.png, public/logo.png and three covers in src/assets/blog/');
