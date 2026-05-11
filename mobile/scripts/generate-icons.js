const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets');

// Full AgriWatch icon SVG (1024x1024 viewbox, dark bg + amber logo)
function makeSvg(size, bg = '#0f0a05', logoScale = 0.55) {
  const s = size * logoScale;
  const offset = (size - s) / 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="stem" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
    <linearGradient id="ll" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="lr" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="eye" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${bg}" rx="${size * 0.22}"/>

  <!-- Subtle amber glow -->
  <circle cx="${size/2}" cy="${size * 0.44}" r="${size * 0.38}"
    fill="none" stroke="rgba(245,158,11,0.06)" stroke-width="${size * 0.35}"/>

  <!-- AgriWatch logo scaled and centered -->
  <g transform="translate(${offset}, ${offset}) scale(${s / 64})">
    <!-- Shield fill -->
    <path d="M32 4L8 14v18c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V14L32 4z"
      fill="url(#sg)" opacity="0.18"/>
    <!-- Shield stroke -->
    <path d="M32 4L8 14v18c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V14L32 4z"
      stroke="url(#sg)" stroke-width="2" fill="none"/>
    <!-- Stem -->
    <path d="M32 48V28" stroke="url(#stem)" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Left leaf -->
    <path d="M32 28c-6-8-16-8-16-8s2 10 10 14" fill="url(#ll)" opacity="0.95"/>
    <!-- Right leaf -->
    <path d="M32 28c6-8 16-8 16-8s-2 10-10 14" fill="url(#lr)" opacity="0.95"/>
    <!-- Eye outer -->
    <circle cx="32" cy="22" r="5" fill="url(#eye)"/>
    <!-- Eye inner -->
    <circle cx="32" cy="22" r="2" fill="white" opacity="0.92"/>
    <!-- Signal wave 1 -->
    <path d="M22 16a14 14 0 0 1 20 0"
      stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.65"/>
    <!-- Signal wave 2 -->
    <path d="M25 13a10 10 0 0 1 14 0"
      stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.40"/>
  </g>
</svg>`.trim();
}

// Splash icon: bigger logo on dark bg, no rounded corners (Expo handles it)
function makeSplashSvg(size) {
  const s = size * 0.55;
  const offset = (size - s) / 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="stem2" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
    <linearGradient id="ll2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="lr2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/><stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="eye2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#0f0a05"/>
  <g transform="translate(${offset}, ${offset}) scale(${s / 64})">
    <path d="M32 4L8 14v18c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V14L32 4z"
      fill="url(#sg2)" opacity="0.18"/>
    <path d="M32 4L8 14v18c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V14L32 4z"
      stroke="url(#sg2)" stroke-width="2" fill="none"/>
    <path d="M32 48V28" stroke="url(#stem2)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M32 28c-6-8-16-8-16-8s2 10 10 14" fill="url(#ll2)" opacity="0.95"/>
    <path d="M32 28c6-8 16-8 16-8s-2 10-10 14" fill="url(#lr2)" opacity="0.95"/>
    <circle cx="32" cy="22" r="5" fill="url(#eye2)"/>
    <circle cx="32" cy="22" r="2" fill="white" opacity="0.92"/>
    <path d="M22 16a14 14 0 0 1 20 0" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.65"/>
    <path d="M25 13a10 10 0 0 1 14 0" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.40"/>
  </g>
</svg>`.trim();
}

async function generate() {
  console.log('Generating AgriWatch icons...');

  // App icon (1024x1024 with rounded corners in the SVG)
  await sharp(Buffer.from(makeSvg(1024)))
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('✔ icon.png (1024x1024)');

  // Adaptive icon foreground (1024x1024, no bg — transparent center, Expo uses backgroundColor from app.json)
  await sharp(Buffer.from(makeSvg(1024, 'transparent', 0.50)))
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));
  console.log('✔ adaptive-icon.png (1024x1024)');

  // Splash icon (512x512)
  await sharp(Buffer.from(makeSplashSvg(512)))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('✔ splash-icon.png (512x512)');

  // Favicon (48x48)
  await sharp(Buffer.from(makeSvg(48, '#0f0a05', 0.70)))
    .resize(48, 48)
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));
  console.log('✔ favicon.png (48x48)');

  console.log('\nAll icons generated successfully!');
}

generate().catch(e => { console.error(e); process.exit(1); });
