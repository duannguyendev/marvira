/**
 * Generate Marvira platform icons from SVG masters in this folder.
 *
 * Edit:
 *   marvira-app-icon.svg              — full icon (iOS / marketing / Android legacy)
 *     - scale(...): mark size (currently 2)
 *     - stroke-width: letter weight (currently 64); i-dot r ~= half of that
 *   marvira-app-icon-foreground.svg   — Android adaptive foreground (transparent)
 *     - scale(...): currently 1.1 (smaller — circular adaptive masks crop more)
 *
 * Run (from repo root or this folder):
 *   npm install --no-save @resvg/resvg-js sharp
 *   node app-icon/generate.js
 *
 * Writes:
 *   - preview PNGs in this folder
 *   - marvira_mobile iOS AppIcon + Android mipmaps
 *   - marvira_dashboard_api marketing favicon / PWA / mark
 *   - marvira_dashboard_api dashboard favicon / mark
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const iconDir = __dirname;
const root = path.join(__dirname, '..');
const masterSvg = fs.readFileSync(path.join(iconDir, 'marvira-app-icon.svg'));
const fgSvg = fs.readFileSync(path.join(iconDir, 'marvira-app-icon-foreground.svg'));

function renderSvg(svgBuffer, size) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: 'width', value: size },
  });
  return Buffer.from(resvg.render().asPng());
}

async function writePng(filePath, buffer) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await sharp(buffer).png().toFile(filePath);
  console.log('wrote', path.relative(root, filePath));
}

async function solidColorPng(filePath, size, hex) {
  const buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: hex,
    },
  })
    .png()
    .toBuffer();
  await writePng(filePath, buf);
}

async function resizeFrom(masterBuf, filePath, size) {
  const buf = await sharp(masterBuf).resize(size, size).png().toBuffer();
  await writePng(filePath, buf);
}

/** Web favicons need baked-in rounded corners (browsers don't CSS-radius tab icons). */
async function resizeRoundedFrom(masterBuf, filePath, size, radiusRatio = 0.22) {
  const r = Math.round(size * radiusRatio);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/>
    </svg>`
  );
  const buf = await sharp(masterBuf)
    .resize(size, size)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await writePng(filePath, buf);
}

async function main() {
  // Higher master render for cleaner downscales into launcher/splash mipmaps.
  const master2048 = renderSvg(masterSvg, 2048);
  const master1024 = await sharp(master2048).resize(1024, 1024).png().toBuffer();
  await writePng(path.join(iconDir, 'marvira-app-icon.png'), master1024);
  await writePng(path.join(iconDir, 'marvira-icon-master.png'), master1024);

  const iosDir = path.join(
    root,
    'marvira_mobile/ios/Marvira/Images.xcassets/AppIcon.appiconset'
  );
  const iosSizes = [
    ['AppIcon-20x20@2x.png', 40],
    ['AppIcon-20x20@3x.png', 60],
    ['AppIcon-29x29@2x.png', 58],
    ['AppIcon-29x29@3x.png', 87],
    ['AppIcon-40x40@2x.png', 80],
    ['AppIcon-40x40@3x.png', 120],
    ['AppIcon-60x60@2x.png', 120],
    ['AppIcon-60x60@3x.png', 180],
    ['AppIcon-20x20@1x-ipad.png', 20],
    ['AppIcon-20x20@2x-ipad.png', 40],
    ['AppIcon-29x29@1x-ipad.png', 29],
    ['AppIcon-29x29@2x-ipad.png', 58],
    ['AppIcon-40x40@1x-ipad.png', 40],
    ['AppIcon-40x40@2x-ipad.png', 80],
    ['AppIcon-76x76@1x.png', 76],
    ['AppIcon-76x76@2x.png', 152],
    ['AppIcon-83.5x83.5@2x.png', 167],
    ['AppIcon-1024x1024@1x.png', 1024],
  ];
  for (const [name, size] of iosSizes) {
    await resizeFrom(master1024, path.join(iosDir, name), size);
  }

  // 2x supersampled vs standard dp sizes so splash/launcher stay sharper when scaled.
  const android = {
    mdpi: { launcher: 96, adaptive: 216 },
    hdpi: { launcher: 144, adaptive: 324 },
    xhdpi: { launcher: 192, adaptive: 432 },
    xxhdpi: { launcher: 288, adaptive: 648 },
    xxxhdpi: { launcher: 384, adaptive: 864 },
  };
  const resRoot = path.join(root, 'marvira_mobile/android/app/src/main/res');
  // Render large from SVG then downscale — keeps edges crisp.
  const fg2048 = renderSvg(fgSvg, 2048);

  for (const [density, sizes] of Object.entries(android)) {
    const dir = path.join(resRoot, `mipmap-${density}`);
    await resizeFrom(master2048, path.join(dir, 'ic_launcher.png'), sizes.launcher);
    await resizeFrom(master2048, path.join(dir, 'ic_launcher_round.png'), sizes.launcher);
    await resizeFrom(fg2048, path.join(dir, 'ic_launcher_foreground.png'), sizes.adaptive);
    await solidColorPng(path.join(dir, 'ic_launcher_background.png'), sizes.adaptive, '#818CF8');
  }

  const mkt = path.join(root, 'marvira_dashboard_api/apps/marketing');
  const dash = path.join(root, 'marvira_dashboard_api/apps/dashboard');
  // Rounded for browser tab / PWA / site mark (iOS/Android stay square — OS masks them)
  await resizeRoundedFrom(master1024, path.join(mkt, 'src/app/icon.png'), 48);
  await resizeRoundedFrom(master1024, path.join(mkt, 'src/app/apple-icon.png'), 180);
  await resizeRoundedFrom(master1024, path.join(dash, 'src/app/icon.png'), 48);
  await resizeRoundedFrom(master1024, path.join(dash, 'src/app/apple-icon.png'), 180);
  await resizeRoundedFrom(master1024, path.join(mkt, 'public/icons/icon-192.png'), 192);
  await resizeRoundedFrom(master1024, path.join(mkt, 'public/icons/icon-512.png'), 512);
  await resizeRoundedFrom(master1024, path.join(mkt, 'public/images/marvira-mark.png'), 256);
  await resizeRoundedFrom(master1024, path.join(dash, 'public/images/marvira-mark.png'), 256);

  console.log('Done. Preview PNGs in app-icon/; platform icons updated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
