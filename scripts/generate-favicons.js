#!/usr/bin/env node

/**
 * Generate favicon / PWA PNGs and favicon.ico from the source SVGs with sharp.
 *
 * Sources (in static/):
 *   favicon.svg            → favicon-{16,32,48}.png, apple-touch-icon.png, favicon.ico
 *   icons/icon.svg         → icons/icon-{192,512}.png        (manifest "any")
 *   icons/icon-maskable.svg→ icons/icon-maskable-512.png     (manifest "maskable")
 *
 * Usage:  npm run generate:favicons
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = resolve(__dirname, '..', 'static');

// Render the SVG well above the target size then downscale, for crisp edges.
const render = (svgBuffer, size) =>
  sharp(svgBuffer, { density: Math.max(96, size * 3) }).resize(size, size).png();

const JOBS = [
  { src: 'favicon.svg', out: 'favicon-16.png', size: 16 },
  { src: 'favicon.svg', out: 'favicon-32.png', size: 32 },
  { src: 'favicon.svg', out: 'favicon-48.png', size: 48 },
  { src: 'favicon.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'icons/icon.svg', out: 'icons/icon-192.png', size: 192 },
  { src: 'icons/icon.svg', out: 'icons/icon-512.png', size: 512 },
  { src: 'icons/icon-maskable.svg', out: 'icons/icon-maskable-512.png', size: 512 },
];

const ICO_SIZES = [16, 32, 48];

/** Build a multi-resolution ICO buffer from an array of PNG buffers. */
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * count;
  const totalDataSize = pngBuffers.reduce((n, b) => n + b.length, 0);
  const ico = Buffer.alloc(dataOffset + totalDataSize);

  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // type 1 = ICO
  ico.writeUInt16LE(count, 4);

  let offset = dataOffset;
  pngBuffers.forEach((png, i) => {
    const entry = headerSize + i * entrySize;
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    ico.writeUInt8(width >= 256 ? 0 : width, entry);
    ico.writeUInt8(height >= 256 ? 0 : height, entry + 1);
    ico.writeUInt8(0, entry + 2); // palette
    ico.writeUInt8(0, entry + 3); // reserved
    ico.writeUInt16LE(1, entry + 4); // planes
    ico.writeUInt16LE(32, entry + 6); // bpp
    ico.writeUInt32LE(png.length, entry + 8);
    ico.writeUInt32LE(offset, entry + 12);
    png.copy(ico, offset);
    offset += png.length;
  });
  return ico;
}

for (const job of JOBS) {
  const svg = readFileSync(resolve(staticDir, job.src));
  await render(svg, job.size).toFile(resolve(staticDir, job.out));
  console.log(`  ${job.out}`);
}

const favSvg = readFileSync(resolve(staticDir, 'favicon.svg'));
const icoBuffers = await Promise.all(ICO_SIZES.map((s) => render(favSvg, s).toBuffer()));
writeFileSync(resolve(staticDir, 'favicon.ico'), buildIco(icoBuffers));
console.log(`  favicon.ico (${ICO_SIZES.join(', ')}px)`);

console.log('Done.');
