/**
 * Marvira store marketing assets — premium marketing series.
 * Run: node generate-assets.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..');
const ICON_SOURCES = [
  path.join(REPO, 'app-icon/marvira-icon-master.png'),
  path.join(REPO, 'app-icon/marvira-app-icon.png'),
  path.join(
    REPO,
    'marvira_mobile/ios/Marvira/Images.xcassets/AppIcon.appiconset/AppIcon-1024x1024@1x.png',
  ),
  path.join(REPO, 'marvira_dashboard_api/apps/marketing/public/icons/icon-512.png'),
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function resolveIcon() {
  for (const p of ICON_SOURCES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Marvira icon PNG found — run: node app-icon/generate.js');
}

async function writeIcons(iconPath) {
  const out = path.join(ROOT, 'images', 'icon');
  ensureDir(out);

  // Master is already 1024 from app-icon/generate.js (scale 2 mark)
  await sharp(iconPath)
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toFile(path.join(out, 'app-icon-1024.png'));

  const play512 = path.join(REPO, 'marvira_dashboard_api/apps/marketing/public/icons/icon-512.png');
  if (fs.existsSync(play512)) {
    await fs.promises.copyFile(play512, path.join(out, 'play-icon-512.png'));
  } else {
    await sharp(iconPath)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toFile(path.join(out, 'play-icon-512.png'));
  }

  // App Store marketing icon — opaque, no alpha channel
  await sharp(iconPath)
    .resize(1024, 1024, { fit: 'cover' })
    .flatten({ background: '#A5B4FC' })
    .png()
    .toFile(path.join(out, 'app-icon-1024-opaque.png'));

  console.log('✓ icons (source:', path.relative(REPO, iconPath), ')');
}

/* -------------------------------------------------------------------------- */
/*  Shared SVG building blocks                                                 */
/* -------------------------------------------------------------------------- */

function defsBlock(idPrefix) {
  return `
  <defs>
    <linearGradient id="${idPrefix}-sky" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="#1A1040"/>
      <stop offset="38%" stop-color="#2D1B69"/>
      <stop offset="72%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#FB7185"/>
    </linearGradient>
    <linearGradient id="${idPrefix}-warm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#F97316" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${idPrefix}-card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="#F8FAFC" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="${idPrefix}-chip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="${idPrefix}-map" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="100%" stop-color="#FCE7F3"/>
    </linearGradient>
    <radialGradient id="${idPrefix}-orb" cx="70%" cy="18%" r="45%">
      <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="#F472B6" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#F472B6" stop-opacity="0"/>
    </radialGradient>
    <filter id="${idPrefix}-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0F172A" flood-opacity="0.28"/>
    </filter>
    <filter id="${idPrefix}-softSm" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.22"/>
    </filter>
    <filter id="${idPrefix}-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

function skyline(width, height, yBase) {
  const h = height;
  const w = width;
  const y = yBase;
  // Stylized city silhouette — warm windows
  const buildings = [
    [0.02, 0.14, 0.22],
    [0.14, 0.1, 0.28],
    [0.22, 0.16, 0.18],
    [0.36, 0.12, 0.32],
    [0.46, 0.08, 0.4],
    [0.54, 0.14, 0.24],
    [0.66, 0.11, 0.3],
    [0.76, 0.18, 0.16],
    [0.88, 0.13, 0.26],
  ];
  let rects = buildings
    .map(([x, bw, bh]) => {
      const rx = w * x;
      const rw = w * bw;
      const rh = h * bh;
      return `<rect x="${rx}" y="${y - rh}" width="${rw}" height="${rh}" fill="#0F172A" fill-opacity="0.35"/>`;
    })
    .join('');
  // Tiny window lights
  let windows = '';
  for (let i = 0; i < 40; i++) {
    const wx = w * (0.05 + Math.random() * 0.9);
    const wy = y - h * (0.04 + Math.random() * 0.28);
    windows += `<rect x="${wx}" y="${wy}" width="3" height="4" rx="1" fill="#FDE68A" fill-opacity="${0.25 + Math.random() * 0.5}"/>`;
  }
  return `${rects}${windows}
  <rect x="0" y="${y}" width="${w}" height="${h - y}" fill="#0F172A" fill-opacity="0.22"/>`;
}

function phoneChrome(x, y, pw, ph, rx, innerFill = 'url(#ph-map)') {
  const bezel = Math.max(10, pw * 0.035);
  const notchW = pw * 0.32;
  const notchH = ph * 0.022;
  return `
  <g filter="url(#ph-soft)">
    <rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="${rx}" fill="#0B1020"/>
    <rect x="${x + 3}" y="${y + 3}" width="${pw - 6}" height="${ph - 6}" rx="${rx - 2}" fill="#1E293B"/>
    <rect x="${x + bezel}" y="${y + bezel}" width="${pw - bezel * 2}" height="${ph - bezel * 2}" rx="${rx * 0.72}" fill="${innerFill}"/>
    <rect x="${x + (pw - notchW) / 2}" y="${y + bezel * 0.55}" width="${notchW}" height="${notchH}" rx="${notchH / 2}" fill="#0B1020"/>
  </g>`;
}

/* -------------------------------------------------------------------------- */
/*  Scene illustrations (drawn inside phone or as hero cards)                  */
/* -------------------------------------------------------------------------- */

function sceneDiscover(cx, cy, scale) {
  // Stacked hunt cards
  const w = 420 * scale;
  const h = 520 * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const card = (ox, oy, title, meta, accent, opacity = 1) => `
    <g opacity="${opacity}" filter="url(#ph-softSm)" transform="translate(${ox},${oy})">
      <rect width="${340 * scale}" height="${150 * scale}" rx="${28 * scale}" fill="url(#ph-card)"/>
      <rect x="${22 * scale}" y="${22 * scale}" width="${96 * scale}" height="${96 * scale}" rx="${22 * scale}" fill="${accent}"/>
      <circle cx="${70 * scale}" cy="${70 * scale}" r="${18 * scale}" fill="#FFF" fill-opacity="0.9"/>
      <path d="M${70 * scale} ${58 * scale} L${70 * scale} ${86 * scale} M${58 * scale} ${70 * scale} L${82 * scale} ${70 * scale}" stroke="#6366F1" stroke-width="${5 * scale}" stroke-linecap="round"/>
      <text x="${138 * scale}" y="${52 * scale}" font-family="Georgia, 'Times New Roman', serif" font-size="${26 * scale}" font-weight="700" fill="#0F172A">${escapeXml(title)}</text>
      <text x="${138 * scale}" y="${88 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${18 * scale}" fill="#64748B">${escapeXml(meta)}</text>
      <rect x="${138 * scale}" y="${108 * scale}" width="${110 * scale}" height="${28 * scale}" rx="${14 * scale}" fill="url(#ph-chip)"/>
      <text x="${155 * scale}" y="${128 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${14 * scale}" font-weight="700" fill="#FFF">Play nearby</text>
    </g>`;
  return `
  <g>
    ${card(x + 40 * scale, y + 40 * scale, 'Harbor Walk', '1.2 km · 8 stops', '#FDBA74', 0.55)}
    ${card(x + 20 * scale, y + 90 * scale, 'Old Town Trail', '650 m · 5 stops', '#F9A8D4', 0.78)}
    ${card(x, y + 150 * scale, 'Downtown Hunt', '320 m · 6 stops', '#A5B4FC', 1)}
  </g>`;
}

function sceneWalk(cx, cy, scale) {
  const w = 400 * scale;
  const h = 480 * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return `
  <g filter="url(#ph-soft)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${36 * scale}" fill="url(#ph-map)"/>
    <!-- map grid -->
    ${[0.2, 0.4, 0.6, 0.8]
      .map(
        (t) =>
          `<line x1="${x + w * t}" y1="${y + 30 * scale}" x2="${x + w * t}" y2="${y + h - 30 * scale}" stroke="#6366F1" stroke-opacity="0.12" stroke-width="2"/>
           <line x1="${x + 30 * scale}" y1="${y + h * t}" x2="${x + w - 30 * scale}" y2="${y + h * t}" stroke="#6366F1" stroke-opacity="0.12" stroke-width="2"/>`,
      )
      .join('')}
    <!-- route -->
    <path d="M${x + 70 * scale} ${y + 380 * scale}
             C${x + 90 * scale} ${y + 280 * scale}, ${x + 180 * scale} ${y + 300 * scale}, ${x + 200 * scale} ${y + 220 * scale}
             S${x + 280 * scale} ${y + 160 * scale}, ${x + 310 * scale} ${y + 100 * scale}"
          fill="none" stroke="#6366F1" stroke-width="${8 * scale}" stroke-linecap="round" stroke-dasharray="${18 * scale} ${14 * scale}" opacity="0.9"/>
    <!-- pins -->
    <g filter="url(#ph-glow)">
      <circle cx="${x + 70 * scale}" cy="${y + 380 * scale}" r="${16 * scale}" fill="#10B981"/>
      <circle cx="${x + 200 * scale}" cy="${y + 220 * scale}" r="${18 * scale}" fill="#F97316"/>
      <circle cx="${x + 310 * scale}" cy="${y + 100 * scale}" r="${16 * scale}" fill="#EC4899"/>
    </g>
    <text x="${x + 90 * scale}" y="${y + 385 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${16 * scale}" font-weight="700" fill="#0F172A">You</text>
    <text x="${x + 220 * scale}" y="${y + 215 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${16 * scale}" font-weight="700" fill="#0F172A">Place 2</text>
    <!-- distance pill -->
    <g filter="url(#ph-softSm)">
      <rect x="${x + 100 * scale}" y="${y + 40 * scale}" width="${200 * scale}" height="${56 * scale}" rx="${28 * scale}" fill="#0F172A"/>
      <text x="${x + 200 * scale}" y="${y + 75 * scale}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${22 * scale}" font-weight="700" fill="#FFF">84 m away</text>
    </g>
  </g>`;
}

function sceneChallenge(cx, cy, scale) {
  const w = 400 * scale;
  const h = 460 * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const opt = (oy, label, active) => `
    <rect x="${x + 36 * scale}" y="${oy}" width="${w - 72 * scale}" height="${64 * scale}" rx="${18 * scale}"
      fill="${active ? '#EEF2FF' : '#FFFFFF'}" stroke="${active ? '#6366F1' : '#E2E8F0'}" stroke-width="${active ? 3 : 2}"/>
    <circle cx="${x + 70 * scale}" cy="${oy + 32 * scale}" r="${12 * scale}" fill="${active ? '#6366F1' : '#CBD5E1'}"/>
    <text x="${x + 100 * scale}" y="${oy + 40 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${20 * scale}" font-weight="${active ? 700 : 500}" fill="#0F172A">${escapeXml(label)}</text>`;
  return `
  <g filter="url(#ph-soft)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${36 * scale}" fill="#FFFFFF"/>
    <rect x="${x}" y="${y}" width="${w}" height="${110 * scale}" rx="${36 * scale}" fill="url(#ph-chip)"/>
    <rect x="${x}" y="${y + 70 * scale}" width="${w}" height="${40 * scale}" fill="url(#ph-chip)"/>
    <text x="${x + 36 * scale}" y="${y + 48 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${16 * scale}" font-weight="700" fill="#FFF" fill-opacity="0.85">PLACE 3 · UNLOCKED</text>
    <text x="${x + 36 * scale}" y="${y + 88 * scale}" font-family="Georgia, 'Times New Roman', serif" font-size="${28 * scale}" font-weight="700" fill="#FFF">What year was the gate built?</text>
    ${opt(y + 150 * scale, '1887', false)}
    ${opt(y + 230 * scale, '1912', true)}
    ${opt(y + 310 * scale, '1945', false)}
    <rect x="${x + 36 * scale}" y="${y + 395 * scale}" width="${w - 72 * scale}" height="${48 * scale}" rx="${24 * scale}" fill="#0F172A"/>
    <text x="${x + w / 2}" y="${y + 426 * scale}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${18 * scale}" font-weight="700" fill="#FFF">Submit answer</text>
  </g>`;
}

function sceneLeaderboard(cx, cy, scale) {
  const w = 400 * scale;
  const h = 480 * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const rows = [
    ['1', 'Maya Chen', '2,480', '#FBBF24'],
    ['2', 'You', '2,310', '#6366F1'],
    ['3', 'Leo Park', '2,105', '#FB923C'],
    ['4', 'Aya Sato', '1,980', '#CBD5E1'],
  ];
  const rowSvg = rows
    .map(([rank, name, score, accent], i) => {
      const ry = y + 130 * scale + i * 78 * scale;
      const you = name === 'You';
      return `
      <g filter="url(#ph-softSm)">
        <rect x="${x + 24 * scale}" y="${ry}" width="${w - 48 * scale}" height="${66 * scale}" rx="${20 * scale}" fill="${you ? '#EEF2FF' : '#FFFFFF'}" stroke="${you ? '#6366F1' : 'transparent'}" stroke-width="2"/>
        <circle cx="${x + 60 * scale}" cy="${ry + 33 * scale}" r="${20 * scale}" fill="${accent}"/>
        <text x="${x + 60 * scale}" y="${ry + 40 * scale}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${18 * scale}" font-weight="700" fill="${rank === '4' ? '#334155' : '#0F172A'}">${rank}</text>
        <text x="${x + 96 * scale}" y="${ry + 40 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${20 * scale}" font-weight="${you ? 700 : 600}" fill="#0F172A">${escapeXml(name)}</text>
        <text x="${x + w - 48 * scale}" y="${ry + 40 * scale}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${18 * scale}" font-weight="700" fill="#64748B">${score}</text>
      </g>`;
    })
    .join('');
  return `
  <g filter="url(#ph-soft)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${36 * scale}" fill="#F8FAFC"/>
    <text x="${x + 36 * scale}" y="${y + 56 * scale}" font-family="Georgia, 'Times New Roman', serif" font-size="${32 * scale}" font-weight="700" fill="#0F172A">Leaderboard</text>
    <text x="${x + 36 * scale}" y="${y + 90 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${16 * scale}" fill="#64748B">Downtown Hunt · Live</text>
    ${rowSvg}
  </g>`;
}

function sceneCreate(cx, cy, scale) {
  const w = 400 * scale;
  const h = 480 * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return `
  <g filter="url(#ph-soft)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${36 * scale}" fill="#FFFFFF"/>
    <text x="${x + 32 * scale}" y="${y + 52 * scale}" font-family="Georgia, 'Times New Roman', serif" font-size="${28 * scale}" font-weight="700" fill="#0F172A">New hunt</text>
    <text x="${x + 32 * scale}" y="${y + 86 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${15 * scale}" fill="#64748B">Step 2 of 3 · Places</text>
    <!-- progress -->
    <rect x="${x + 32 * scale}" y="${y + 106 * scale}" width="${w - 64 * scale}" height="${8 * scale}" rx="4" fill="#E2E8F0"/>
    <rect x="${x + 32 * scale}" y="${y + 106 * scale}" width="${(w - 64 * scale) * 0.66}" height="${8 * scale}" rx="4" fill="url(#ph-chip)"/>
    <!-- place rows -->
    ${[1, 2, 3]
      .map((n, i) => {
        const ry = y + 150 * scale + i * 88 * scale;
        return `
        <rect x="${x + 28 * scale}" y="${ry}" width="${w - 56 * scale}" height="${76 * scale}" rx="${20 * scale}" fill="#F8FAFC" stroke="#E2E8F0"/>
        <circle cx="${x + 64 * scale}" cy="${ry + 38 * scale}" r="${22 * scale}" fill="${n === 3 ? '#F97316' : '#6366F1'}"/>
        <text x="${x + 64 * scale}" y="${ry + 45 * scale}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${18 * scale}" font-weight="700" fill="#FFF">${n}</text>
        <text x="${x + 100 * scale}" y="${ry + 32 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${18 * scale}" font-weight="700" fill="#0F172A">Place ${n}</text>
        <text x="${x + 100 * scale}" y="${ry + 56 * scale}" font-family="Arial, Helvetica, sans-serif" font-size="${14 * scale}" fill="#64748B">${n === 3 ? 'Add question…' : 'Quiz ready'}</text>`;
      })
      .join('')}
    <rect x="${x + 28 * scale}" y="${y + 420 * scale}" width="${w - 56 * scale}" height="${44 * scale}" rx="${22 * scale}" fill="#0F172A"/>
    <text x="${x + w / 2}" y="${y + 448 * scale}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${16 * scale}" font-weight="700" fill="#FFF">Continue</text>
  </g>`;
}

const SCENES = {
  discover: sceneDiscover,
  walk: sceneWalk,
  challenge: sceneChallenge,
  leaderboard: sceneLeaderboard,
  create: sceneCreate,
};

/* -------------------------------------------------------------------------- */
/*  Full marketing canvas                                                        */
/* -------------------------------------------------------------------------- */

function promoCanvas({
  width,
  height,
  kicker,
  title,
  subtitle,
  scene,
  iconHref,
}) {
  const id = `p${width}x${height}${scene}`.replace(/[^a-z0-9]/gi, '');
  // Normalize design to a virtual 1290×2796 artboard then we just use actual size
  const s = width / 1290;
  const padX = Math.round(72 * s);
  const topY = Math.round(120 * s);
  const titleSize = Math.round(78 * s);
  const subSize = Math.round(30 * s);
  const kickerSize = Math.round(22 * s);
  const sceneCx = width / 2;
  const sceneCy = Math.round(height * 0.58);
  const sceneScale = s * (height / 2796 > 0.85 ? 1.05 : 0.95);
  const skylineY = Math.round(height * 0.93);

  // Rewrite defs ids to be unique per canvas via string replace in defs
  const defs = defsBlock(id)
    .replace(/id="ph-/g, `id="${id}-`)
    .replace(/url\(#ph-/g, `url(#${id}-`);

  // Scene functions use url(#ph-*) — inject id prefix by wrapping with a patched string
  let sceneSvg = SCENES[scene](sceneCx, sceneCy, sceneScale);
  sceneSvg = sceneSvg
    .replace(/url\(#ph-/g, `url(#${id}-`)
    .replace(/filter="url\(#ph-/g, `filter="url(#${id}-`);

  // Also need defs that scenes reference: ph-soft, ph-softSm, ph-glow, ph-card, ph-chip, ph-map
  // defsBlock already creates id-soft etc. Scene uses url(#ph-soft) which we remapped to url(#${id}-soft)
  // But defs has id="${idPrefix}-soft" so we need defs to also alias OR use consistent naming.
  // Fix: redefine defs with ph- prefix unique via idPrefix that equals our id, and scenes remap ph- to id-
  // defsBlock creates `${idPrefix}-soft`. Scene after replace looks for `${id}-soft`. Good if idPrefix === id.

  const floatingOrbs = `
    <circle cx="${width * 0.82}" cy="${height * 0.12}" r="${width * 0.38}" fill="url(#${id}-orb)"/>
    <circle cx="${width * 0.08}" cy="${height * 0.42}" r="${width * 0.22}" fill="url(#${id}-warm)"/>
    <circle cx="${width * 0.9}" cy="${height * 0.72}" r="${width * 0.18}" fill="#818CF8" fill-opacity="0.2"/>
  `;

  // Use deterministic "windows" instead of Math.random for stable output
  const skylineSvg = (() => {
    const y = skylineY;
    const buildings = [
      [0.0, 0.12, 0.2],
      [0.1, 0.09, 0.28],
      [0.18, 0.14, 0.16],
      [0.3, 0.1, 0.3],
      [0.4, 0.07, 0.38],
      [0.48, 0.12, 0.22],
      [0.58, 0.1, 0.26],
      [0.68, 0.15, 0.15],
      [0.8, 0.11, 0.24],
      [0.9, 0.1, 0.2],
    ];
    const rects = buildings
      .map(([bx, bw, bh]) => {
        const rh = height * bh * 0.35;
        return `<rect x="${width * bx}" y="${y - rh}" width="${width * bw}" height="${rh}" fill="#0F172A" fill-opacity="0.28"/>`;
      })
      .join('');
    const wins = [];
    for (let i = 0; i < 36; i++) {
      const wx = width * (0.04 + ((i * 17) % 92) / 100);
      const wy = y - height * (0.03 + ((i * 13) % 22) / 100);
      wins.push(
        `<rect x="${wx}" y="${wy}" width="${3 * s}" height="${4 * s}" rx="1" fill="#FDE68A" fill-opacity="${0.3 + (i % 5) * 0.1}"/>`,
      );
    }
    return `${rects}${wins.join('')}`;
  })();

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  ${defs}
  <rect width="${width}" height="${height}" fill="url(#${id}-sky)"/>
  ${floatingOrbs}
  ${skylineSvg}

  <!-- top brand row -->
  <image xlink:href="${iconHref}" x="${padX}" y="${topY}" width="${Math.round(64 * s)}" height="${Math.round(64 * s)}" />
  <text x="${padX + Math.round(80 * s)}" y="${topY + Math.round(42 * s)}" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(36 * s)}" font-weight="700" fill="#FFFFFF">Marvira</text>

  <!-- kicker pill -->
  <rect x="${padX}" y="${topY + Math.round(100 * s)}" width="${Math.round(kicker.length * 14 * s + 48 * s)}" height="${Math.round(44 * s)}" rx="${Math.round(22 * s)}" fill="#FFFFFF" fill-opacity="0.14"/>
  <text x="${padX + Math.round(24 * s)}" y="${topY + Math.round(130 * s)}" font-family="Arial, Helvetica, sans-serif" font-size="${kickerSize}" font-weight="700" letter-spacing="1.5" fill="#FDE68A">${escapeXml(kicker.toUpperCase())}</text>

  <!-- headline -->
  <text x="${padX}" y="${topY + Math.round(220 * s)}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="700" fill="#FFFFFF">${escapeXml(title)}</text>
  <text x="${padX}" y="${topY + Math.round(270 * s)}" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" fill="#E9D5FF">${escapeXml(subtitle)}</text>

  <!-- hero scene -->
  ${sceneSvg}

  <!-- bottom tagline -->
  <text x="${padX}" y="${height - Math.round(70 * s)}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(24 * s)}" fill="#FCE7F3" fill-opacity="0.9">City adventure, on foot.</text>
</svg>`);
}

async function writeFeatureGraphic(iconPath) {
  const out = path.join(ROOT, 'images', 'feature-graphic');
  ensureDir(out);
  const w = 1024;
  const h = 500;
  const iconBuf = await sharp(iconPath)
    .resize(220, 220)
    .png()
    .toBuffer();
  const iconData = `data:image/png;base64,${iconBuf.toString('base64')}`;

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A1040"/>
      <stop offset="45%" stop-color="#4C1D95"/>
      <stop offset="100%" stop-color="#FB7185"/>
    </linearGradient>
    <radialGradient id="sun" cx="78%" cy="30%" r="40%">
      <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#FDE68A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="0" cy="500" r="280" fill="#818CF8" fill-opacity="0.2"/>
  <rect width="${w}" height="${h}" fill="url(#sun)"/>
  <image xlink:href="${iconData}" x="740" y="140" width="220" height="220"/>
  <text x="56" y="175" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="700" fill="#FFFFFF">Marvira</text>
  <text x="56" y="235" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#FDE68A">City adventure, on foot.</text>
  <text x="56" y="320" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#F5E1FF">Walk real places · Answer challenges</text>
  <text x="56" y="358" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#F5E1FF">Climb the leaderboard with friends</text>
</svg>`);

  await sharp(svg).png().toFile(path.join(out, 'play-feature-graphic-1024x500.png'));
  console.log('✓ feature graphic');
}

async function main() {
  const iconPath = await resolveIcon();
  console.log('Using icon:', iconPath);
  await writeIcons(iconPath);
  await writeFeatureGraphic(iconPath);
  console.log('Done → store-submission/images/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
