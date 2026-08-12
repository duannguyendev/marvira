/**
 * Builds the boot splash logo from the iOS app icon, masked with an iOS-style squircle so the
 * splash matches how the icon looks on a home screen.
 *
 * Run: node scripts/generate-bootsplash-logo.js
 * Then: npx react-native-bootsplash generate assets/bootsplash-src/logo.png \
 *         --platforms=android --background=6366f1 --logo-width=128 \
 *         --assets-output=assets/bootsplash --flavor=main
 */
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_ICON = path.join(
  ROOT,
  'ios/Marvira/Images.xcassets/AppIcon.appiconset/AppIcon-1024x1024@1x.png',
);
const OUTPUT = path.join(ROOT, 'assets/bootsplash-src/logo.png');
const IOS_IMAGESET = path.join(
  ROOT,
  'ios/Marvira/Images.xcassets/BootSplashLogo-88de73.imageset',
);

const SIZE = 1024;
// Superellipse exponent 5 approximates Apple's continuous corner curvature.
const SQUIRCLE_EXPONENT = 5;

function squirclePath(size, exponent) {
  const steps = 720;
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const t = (2 * Math.PI * i) / steps;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const x = Math.sign(cos) * Math.abs(cos) ** (2 / exponent);
    const y = Math.sign(sin) * Math.abs(sin) ** (2 / exponent);
    points.push(
      `${(((x + 1) / 2) * size).toFixed(2)},${(((y + 1) / 2) * size).toFixed(2)}`,
    );
  }

  return `M${points.join('L')}Z`;
}

async function main() {
  const mask = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">` +
      `<path d="${squirclePath(SIZE, SQUIRCLE_EXPONENT)}" fill="#fff"/></svg>`,
  );

  const logo = await sharp(SOURCE_ICON)
    .resize(SIZE, SIZE)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(logo).toFile(OUTPUT);

  // The bootsplash CLI only regenerates Android here, so write the iOS imageset directly.
  for (const [suffix, size] of [['', 128], ['@2x', 256], ['@3x', 384]]) {
    await sharp(logo)
      .resize(size, size)
      .png()
      .toFile(path.join(IOS_IMAGESET, `logo-88de73${suffix}.png`));
  }

  console.log('Wrote', OUTPUT, 'and iOS imageset (128/256/384)');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
