/**
 * Premium Marvira promotional store graphics (v2).
 * Run: node generate-promotional.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'promotional');
const ICON_CANDIDATES = [
  path.resolve(ROOT, '../app-icon/marvira-icon-master.png'),
  path.resolve(ROOT, '../app-icon/marvira-app-icon.png'),
  path.resolve(
    ROOT,
    '../marvira_mobile/ios/Marvira/Images.xcassets/AppIcon.appiconset/AppIcon-1024x1024@1x.png',
  ),
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function resolveIcon() {
  for (const p of ICON_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Icon not found');
}

/** Design tokens — zones computed so nothing overlaps */
function layout(W, H) {
  const s = W / 1080;
  const tall = H / W; // ios ~2.17, android ~1.78, ipad ~1.33
  const pad = Math.round(56 * s);
  const brandY = Math.round(64 * s);
  const iconS = Math.round(64 * s);
  const titleSize = Math.round(tall > 2 ? 64 * s : tall > 1.6 ? 52 * s : 50 * s);
  const subSize = Math.round(22 * s);
  const kickerSize = Math.round(16 * s);

  // Explicit stack. librsvg uses alphabetic baseline (y = baseline).
  // Clearance must include full fontSize + comfortable air gap.
  const brandBottom = brandY + iconS;
  const kickerY = brandBottom + Math.round(28 * s);
  const kickerH = Math.round(38 * s);
  const gapAfterKicker = Math.round(72 * s);
  const titleBaseline = kickerY + kickerH + gapAfterKicker + titleSize;
  const gapAfterTitle = Math.round(28 * s);
  const subtitleBaseline = titleBaseline + gapAfterTitle + subSize;
  const headerBottom = subtitleBaseline + Math.round(18 * s);

  // Callout chip sits in its own row under subtitle (never on the phone)
  const calloutH = Math.round(48 * s);
  const calloutY = headerBottom + Math.round(20 * s);
  const afterCallout = calloutY + calloutH + Math.round(36 * s);

  // Footer: skyline + tagline — keep clearly below phone
  const footerH = Math.round(H * (tall > 2 ? 0.1 : 0.12));
  const footerTop = H - footerH;
  const taglineY = H - Math.round(44 * s);

  // Phone fills the clear middle band with breathing room
  const phoneGapTop = afterCallout;
  const phoneGapBottom = footerTop - Math.round(36 * s);
  const maxPhoneH = phoneGapBottom - phoneGapTop;
  const phoneW = Math.round(W * (tall > 2 ? 0.76 : 0.72));
  // Keep device shorter than max band so UI isn't drowned in empty white
  const phoneH = Math.min(
    maxPhoneH,
    Math.round(phoneW * (tall > 2 ? 1.52 : tall > 1.6 ? 1.48 : 1.35)),
  );
  const phoneX = (W - phoneW) / 2;
  const phoneY = phoneGapTop + Math.round((maxPhoneH - phoneH) / 2);

  return {
    W,
    H,
    s,
    tall,
    pad,
    brandY,
    iconS,
    titleSize,
    subSize,
    kickerSize,
    kickerY,
    kickerH,
    titleBaseline,
    subtitleBaseline,
    headerBottom,
    calloutY,
    calloutH,
    phoneW,
    phoneH,
    phoneX,
    phoneY,
    footerTop,
    taglineY,
    // legacy aliases used by clip/phone helpers
    heroCy: phoneY + phoneH / 2,
  };
}

function defs(uid) {
  return `
  <defs>
    <linearGradient id="${uid}-bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="#0C0A1D"/>
      <stop offset="28%" stop-color="#1E1348"/>
      <stop offset="58%" stop-color="#5B21B6"/>
      <stop offset="82%" stop-color="#DB2777"/>
      <stop offset="100%" stop-color="#FB923C"/>
    </linearGradient>
    <radialGradient id="${uid}-sun" cx="85%" cy="8%" r="50%">
      <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.65"/>
      <stop offset="40%" stop-color="#F472B6" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#F472B6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${uid}-moon" cx="10%" cy="55%" r="40%">
      <stop offset="0%" stop-color="#A5B4FC" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#A5B4FC" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${uid}-chip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="${uid}-map" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#FCE7F3"/>
    </linearGradient>
    <linearGradient id="${uid}-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.08"/>
    </linearGradient>
    <filter id="${uid}-d" x="-20%" y="-15%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#020617" flood-opacity="0.28"/>
    </filter>
    <filter id="${uid}-ds" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#020617" flood-opacity="0.3"/>
    </filter>
    <filter id="${uid}-glow">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="${uid}-screen">
      <rect id="${uid}-screenRect" x="0" y="0" width="10" height="10" rx="40"/>
    </clipPath>
  </defs>`;
}

function cityscape(L) {
  const { W, H, s, footerTop } = L;
  // Keep skyline entirely in the footer band — never climb into the phone zone
  const base = H - Math.round(28 * s);
  const maxH = Math.max(24 * s, base - footerTop - 8 * s);
  const blocks = [
    [0, 0.11, 0.55, 0],
    [0.09, 0.08, 0.75, 1],
    [0.16, 0.13, 0.45, 0],
    [0.27, 0.09, 0.85, 2],
    [0.35, 0.07, 1.0, 1],
    [0.42, 0.1, 0.6, 0],
    [0.51, 0.12, 0.7, 2],
    [0.62, 0.08, 0.5, 0],
    [0.7, 0.14, 0.8, 1],
    [0.82, 0.1, 0.55, 0],
    [0.91, 0.09, 0.65, 2],
  ];
  let svg = `<rect x="0" y="${footerTop}" width="${W}" height="${H - footerTop}" fill="#020617" fill-opacity="0.18"/>`;
  for (const [x, bw, bh, roof] of blocks) {
    const rx = W * x;
    const rw = W * bw;
    const rh = maxH * bh * 0.85;
    const ry = base - rh;
    svg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#020617" fill-opacity="0.4"/>`;
    if (roof === 1) {
      svg += `<polygon points="${rx},${ry} ${rx + rw / 2},${ry - 10 * s} ${rx + rw},${ry}" fill="#020617" fill-opacity="0.4"/>`;
    } else if (roof === 2) {
      svg += `<rect x="${rx + rw * 0.35}" y="${ry - 16 * s}" width="${rw * 0.3}" height="${16 * s}" fill="#020617" fill-opacity="0.4"/>`;
    }
  }
  for (let i = 0; i < 28; i++) {
    const wx = W * (0.04 + ((i * 37) % 92) / 100);
    const wy = base - maxH * (0.15 + ((i * 19) % 60) / 100);
    if (wy < footerTop + 4) continue;
    svg += `<rect x="${wx}" y="${wy}" width="${2.8 * s}" height="${3.6 * s}" rx="1" fill="#FDE68A" fill-opacity="${0.35 + (i % 4) * 0.1}"/>`;
  }
  return svg;
}

function phoneFrame(L, contentSvg) {
  const pw = L.phoneW;
  const ph = L.phoneH;
  const px = L.phoneX;
  const py = L.phoneY;
  const s = L.s;
  const rx = Math.round(48 * s);
  const bezel = Math.round(14 * s);
  const screenX = px + bezel;
  const screenY = py + bezel;
  const screenW = pw - bezel * 2;
  const screenH = ph - bezel * 2;
  const screenRx = Math.round(36 * s);
  const notchW = pw * 0.32;
  const notchH = Math.round(18 * s);
  // Content inset below notch so titles aren't covered
  const contentTop = screenY + Math.round(36 * s);
  const contentH = screenY + screenH - contentTop;

  return `
  <ellipse cx="${L.W / 2}" cy="${py + ph + 12 * s}" rx="${pw * 0.38}" ry="${16 * s}" fill="#020617" fill-opacity="0.22"/>
  <g filter="url(#${L.uid}-d)">
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${rx}" fill="#0B1020"/>
    <rect x="${px + 3}" y="${py + 3}" width="${pw - 6}" height="${ph - 6}" rx="${rx - 2}" fill="#1E293B"/>
    <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="${screenRx}" fill="#F8FAFC"/>
    <g clip-path="url(#${L.uid}-clip)">
      <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" fill="#F8FAFC"/>
      ${contentSvg(screenX, contentTop, screenW, contentH, s)}
    </g>
    <rect x="${px + (pw - notchW) / 2}" y="${py + Math.round(10 * s)}" width="${notchW}" height="${notchH}" rx="${notchH / 2}" fill="#0B1020"/>
    <rect x="${px - 3 * s}" y="${py + ph * 0.22}" width="${4 * s}" height="${44 * s}" rx="2" fill="#334155"/>
    <rect x="${px - 3 * s}" y="${py + ph * 0.34}" width="${4 * s}" height="${64 * s}" rx="2" fill="#334155"/>
    <rect x="${px + pw - 1 * s}" y="${py + ph * 0.3}" width="${4 * s}" height="${80 * s}" rx="2" fill="#334155"/>
  </g>`;
}

function clipDef(L) {
  const bezel = Math.round(14 * L.s);
  const screenRx = Math.round(36 * L.s);
  return `<clipPath id="${L.uid}-clip"><rect x="${L.phoneX + bezel}" y="${L.phoneY + bezel}" width="${L.phoneW - bezel * 2}" height="${L.phoneH - bezel * 2}" rx="${screenRx}"/></clipPath>`;
}

/* ---- In-phone screens ---- */

function screenDiscover(x, y, w, h, s) {
  const cardH = Math.round(108 * s);
  const cardGap = Math.round(14 * s);
  const cardX = x + 20 * s;
  const cardW = w - 40 * s;
  const cards = [
    { t: 'Downtown Hunt', m: '320 m · 6 stops', c: '#A5B4FC', o: 1 },
    { t: 'Old Town Trail', m: '650 m · 5 stops', c: '#F9A8D4', o: 0.95 },
    { t: 'Harbor Walk', m: '1.2 km · 8 stops', c: '#FDBA74', o: 0.9 },
  ];
  const headerBlock = 96 * s;
  const topPad = 16 * s;
  let svg = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#bgmap)"/>
    <text x="${x + 28 * s}" y="${y + topPad + 28 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${14 * s}" font-weight="700" fill="#6366F1" letter-spacing="1.5">NEAR YOU</text>
    <text x="${x + 28 * s}" y="${y + topPad + 64 * s}" font-family="Georgia, 'Times New Roman', serif" font-size="${30 * s}" font-weight="700" fill="#0F172A">Tonight's hunts</text>`;

  cards.forEach((c, i) => {
    const cy = y + topPad + headerBlock + i * (cardH + cardGap);
    const thumb = 72 * s;
    const playW = 84 * s;
    const playX = cardX + cardW - playW - 16 * s;
    const playY = cy + (cardH - 34 * s) / 2;
    const pinCx = cardX + 16 * s + thumb / 2;
    const pinCy = cy + 16 * s + thumb / 2 - 4 * s;
    svg += `
    <g opacity="${c.o}" filter="url(#fds)">
      <rect x="${cardX}" y="${cy}" width="${cardW}" height="${cardH}" rx="${20 * s}" fill="#FFFFFF"/>
      <rect x="${cardX + 16 * s}" y="${cy + 16 * s}" width="${thumb}" height="${thumb}" rx="${16 * s}" fill="${c.c}"/>
      <circle cx="${pinCx}" cy="${pinCy}" r="${11 * s}" fill="#FFFFFF"/>
      <circle cx="${pinCx}" cy="${pinCy}" r="${4.5 * s}" fill="#4F46E5"/>
      <path d="M${pinCx} ${pinCy + 9 * s} L${pinCx - 8 * s} ${pinCy + 24 * s} L${pinCx + 8 * s} ${pinCy + 24 * s} Z" fill="#FFFFFF"/>
      <text x="${cardX + 16 * s + thumb + 14 * s}" y="${cy + 46 * s}" font-family="Georgia, 'Times New Roman', serif" font-size="${20 * s}" font-weight="700" fill="#0F172A">${esc(c.t)}</text>
      <text x="${cardX + 16 * s + thumb + 14 * s}" y="${cy + 72 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${14 * s}" fill="#64748B">${esc(c.m)}</text>
      <rect x="${playX}" y="${playY}" width="${playW}" height="${34 * s}" rx="${17 * s}" fill="url(#fchip)"/>
      <text x="${playX + playW / 2}" y="${playY + 22 * s}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${13 * s}" font-weight="700" fill="#FFF">Play</text>
    </g>`;
  });
  return svg;
}

function screenWalk(x, y, w, h, s) {
  let svg = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#fmap)"/>
    <!-- soft roads -->
    <path d="M${x} ${y + h * 0.35} L${x + w} ${y + h * 0.4}" stroke="#C7D2FE" stroke-width="${18 * s}"/>
    <path d="M${x + w * 0.3} ${y} L${x + w * 0.45} ${y + h}" stroke="#C7D2FE" stroke-width="${18 * s}"/>
    <path d="M${x} ${y + h * 0.7} L${x + w} ${y + h * 0.55}" stroke="#E9D5FF" stroke-width="${14 * s}"/>
    <!-- dashed route -->
    <path d="M${x + w * 0.22} ${y + h * 0.78}
             C${x + w * 0.28} ${y + h * 0.55}, ${x + w * 0.48} ${y + h * 0.6}, ${x + w * 0.52} ${y + h * 0.42}
             S${x + w * 0.7} ${y + h * 0.28}, ${x + w * 0.76} ${y + h * 0.18}"
          fill="none" stroke="#4F46E5" stroke-width="${7 * s}" stroke-linecap="round"
          stroke-dasharray="${16 * s} ${12 * s}"/>
    <!-- pins -->
    <g filter="url(#fglow)">
      <circle cx="${x + w * 0.22}" cy="${y + h * 0.78}" r="${20 * s}" fill="#10B981"/>
      <circle cx="${x + w * 0.22}" cy="${y + h * 0.78}" r="${8 * s}" fill="#FFF"/>
      <circle cx="${x + w * 0.52}" cy="${y + h * 0.42}" r="${24 * s}" fill="#F97316"/>
      <circle cx="${x + w * 0.52}" cy="${y + h * 0.42}" r="${9 * s}" fill="#FFF"/>
      <circle cx="${x + w * 0.76}" cy="${y + h * 0.18}" r="${18 * s}" fill="#EC4899"/>
    </g>
    <text x="${x + w * 0.22 + 28 * s}" y="${y + h * 0.79}" font-family="Arial, Helvetica, sans-serif" font-size="${18 * s}" font-weight="700" fill="#0F172A">You</text>
    <text x="${x + w * 0.52 + 30 * s}" y="${y + h * 0.43}" font-family="Arial, Helvetica, sans-serif" font-size="${18 * s}" font-weight="700" fill="#0F172A">Place 2</text>
    <!-- top status -->
    <g filter="url(#fds)">
      <rect x="${x + w * 0.18}" y="${y + 36 * s}" width="${w * 0.64}" height="${64 * s}" rx="${32 * s}" fill="#0F172A"/>
      <circle cx="${x + w * 0.28}" cy="${y + 68 * s}" r="${10 * s}" fill="#10B981"/>
      <text x="${x + w * 0.5}" y="${y + 76 * s}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${24 * s}" font-weight="700" fill="#FFF">84 m · Keep walking</text>
    </g>
    <!-- bottom sheet -->
    <rect x="${x}" y="${y + h - 130 * s}" width="${w}" height="${130 * s}" rx="${32 * s}" fill="#FFFFFF"/>
    <rect x="${x}" y="${y + h - 100 * s}" width="${w}" height="${100 * s}" fill="#FFFFFF"/>
    <text x="${x + 32 * s}" y="${y + h - 72 * s}" font-family="Georgia, 'Times New Roman', serif" font-size="${26 * s}" font-weight="700" fill="#0F172A">Central Library</text>
    <text x="${x + 32 * s}" y="${y + h - 40 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${16 * s}" fill="#64748B">Unlock when you arrive</text>
    <rect x="${x + w - 160 * s}" y="${y + h - 88 * s}" width="${120 * s}" height="${44 * s}" rx="${22 * s}" fill="url(#fchip)"/>
    <text x="${x + w - 100 * s}" y="${y + h - 58 * s}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${15 * s}" font-weight="700" fill="#FFF">Navigate</text>`;
  return svg;
}

function screenChallenge(x, y, w, h, s) {
  const opts = [
    ['1887', false],
    ['1912', true],
    ['1945', false],
  ];
  let svg = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.28}" fill="url(#fchip)"/>
    <text x="${x + 32 * s}" y="${y + 48 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${14 * s}" font-weight="700" letter-spacing="1.5" fill="#FFFFFF" fill-opacity="0.85">PLACE 3 · UNLOCKED</text>
    <text x="${x + 32 * s}" y="${y + 100 * s}" font-family="Georgia, 'Times New Roman', serif" font-size="${30 * s}" font-weight="700" fill="#FFFFFF">What year was</text>
    <text x="${x + 32 * s}" y="${y + 138 * s}" font-family="Georgia, 'Times New Roman', serif" font-size="${30 * s}" font-weight="700" fill="#FFFFFF">the gate built?</text>`;
  opts.forEach(([label, active], i) => {
    const oy = y + h * 0.36 + i * 90 * s;
    svg += `
    <rect x="${x + 28 * s}" y="${oy}" width="${w - 56 * s}" height="${74 * s}" rx="${20 * s}"
      fill="${active ? '#EEF2FF' : '#F8FAFC'}" stroke="${active ? '#6366F1' : '#E2E8F0'}" stroke-width="${active ? 3 : 2}"/>
    <circle cx="${x + 64 * s}" cy="${oy + 37 * s}" r="${14 * s}" fill="${active ? '#6366F1' : '#CBD5E1'}"/>
    ${active ? `<circle cx="${x + 64 * s}" cy="${oy + 37 * s}" r="${6 * s}" fill="#FFF"/>` : ''}
    <text x="${x + 96 * s}" y="${oy + 46 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${22 * s}" font-weight="${active ? 700 : 500}" fill="#0F172A">${label}</text>`;
  });
  svg += `
    <rect x="${x + 28 * s}" y="${y + h - 90 * s}" width="${w - 56 * s}" height="${56 * s}" rx="${28 * s}" fill="#0F172A"/>
    <text x="${x + w / 2}" y="${y + h - 52 * s}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${18 * s}" font-weight="700" fill="#FFF">Submit answer</text>`;
  return svg;
}

function screenLeaderboard(x, y, w, h, s) {
  const rows = [
    ['1', 'Maya Chen', '2,480', '#FBBF24'],
    ['2', 'You', '2,310', '#6366F1'],
    ['3', 'Leo Park', '2,105', '#FB923C'],
    ['4', 'Aya Sato', '1,980', '#94A3B8'],
    ['5', 'Chris N.', '1,840', '#CBD5E1'],
  ];
  const headerH = 110 * s;
  const rowH = 68 * s;
  const gap = 12 * s;
  let svg = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F8FAFC"/>
    <rect x="${x}" y="${y}" width="${w}" height="${headerH}" fill="#FFFFFF"/>
    <text x="${x + 28 * s}" y="${y + 48 * s}" font-family="Georgia, 'Times New Roman', serif" font-size="${30 * s}" font-weight="700" fill="#0F172A">Leaderboard</text>
    <text x="${x + 28 * s}" y="${y + 82 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${15 * s}" fill="#64748B">Downtown Hunt · Live now</text>`;
  rows.forEach(([rank, name, score, accent], i) => {
    const ry = y + headerH + i * (rowH + gap);
    if (ry + rowH > y + h - 16 * s) return;
    const you = name === 'You';
    const mid = ry + rowH / 2;
    svg += `
    <g filter="url(#fds)">
      <rect x="${x + 20 * s}" y="${ry}" width="${w - 40 * s}" height="${rowH}" rx="${16 * s}" fill="${you ? '#EEF2FF' : '#FFFFFF'}" stroke="${you ? '#6366F1' : 'transparent'}" stroke-width="2"/>
      <circle cx="${x + 54 * s}" cy="${mid}" r="${18 * s}" fill="${accent}"/>
      <text x="${x + 54 * s}" y="${mid + 6 * s}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${16 * s}" font-weight="700" fill="${Number(rank) >= 4 ? '#334155' : '#0F172A'}">${rank}</text>
      <text x="${x + 86 * s}" y="${mid + 6 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${18 * s}" font-weight="${you ? 700 : 600}" fill="#0F172A">${esc(name)}</text>
      <text x="${x + w - 36 * s}" y="${mid + 6 * s}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${16 * s}" font-weight="700" fill="#64748B">${score}</text>
    </g>`;
  });
  return svg;
}

function screenCreate(x, y, w, h, s) {
  const places = [1, 2, 3];
  const headerH = 128 * s;
  const btnH = 56 * s;
  const btnY = y + h - btnH - 24 * s;
  const rowH = 84 * s;
  const gap = 14 * s;
  let svg = `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF"/>
    <text x="${x + 28 * s}" y="${y + 48 * s}" font-family="Georgia, 'Times New Roman', serif" font-size="${28 * s}" font-weight="700" fill="#0F172A">New hunt</text>
    <text x="${x + 28 * s}" y="${y + 80 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${14 * s}" fill="#64748B">Step 2 of 3 · Places &amp; clues</text>
    <rect x="${x + 28 * s}" y="${y + 100 * s}" width="${w - 56 * s}" height="${9 * s}" rx="4" fill="#E2E8F0"/>
    <rect x="${x + 28 * s}" y="${y + 100 * s}" width="${(w - 56 * s) * 0.66}" height="${9 * s}" rx="4" fill="url(#fchip)"/>`;
  places.forEach((n, i) => {
    const ry = y + headerH + i * (rowH + gap);
    if (ry + rowH > btnY - 12 * s) return;
    const accent = n === 3 ? '#F97316' : '#6366F1';
    const mid = ry + rowH / 2;
    svg += `
    <g filter="url(#fds)">
      <rect x="${x + 24 * s}" y="${ry}" width="${w - 48 * s}" height="${rowH}" rx="${20 * s}" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="${x + 64 * s}" cy="${mid}" r="${24 * s}" fill="${accent}"/>
      <text x="${x + 64 * s}" y="${mid + 7 * s}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${18 * s}" font-weight="700" fill="#FFF">${n}</text>
      <text x="${x + 104 * s}" y="${mid - 6 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${18 * s}" font-weight="700" fill="#0F172A">Place ${n}</text>
      <text x="${x + 104 * s}" y="${mid + 18 * s}" font-family="Arial, Helvetica, sans-serif" font-size="${14 * s}" fill="#64748B">${n === 3 ? 'Add question…' : 'Quiz ready ✓'}</text>
    </g>`;
  });
  svg += `
    <rect x="${x + 24 * s}" y="${btnY}" width="${w - 48 * s}" height="${btnH}" rx="${28 * s}" fill="#0F172A"/>
    <text x="${x + w / 2}" y="${btnY + btnH * 0.62}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${17 * s}" font-weight="700" fill="#FFF">Continue</text>`;
  return svg;
}

const SCREENS = {
  discover: screenDiscover,
  walk: screenWalk,
  challenge: screenChallenge,
  leaderboard: screenLeaderboard,
  create: screenCreate,
};

/** Callout chips — always in the strip BETWEEN subtitle and phone (no rotation, no overlap) */
function calloutChip(L, scene) {
  const s = L.s;
  const y = L.calloutY;
  const h = L.calloutH;
  const x = L.pad;
  const specs = {
    discover: { bg: '#FFFFFF', fg: '#0F172A', label: '3 hunts nearby', dot: '#10B981', w: 220 },
    walk: { bg: '#0F172A', fg: '#FDE68A', label: 'GPS unlocks places', dot: null, w: 240 },
    challenge: { bg: '#FFFFFF', fg: '#DB2777', label: '+120 pts for accuracy', dot: null, w: 250 },
    leaderboard: { bg: '#FBBF24', fg: '#0F172A', label: "You're climbing — #2", dot: null, w: 250 },
    create: { bg: '#FFFFFF', fg: '#4F46E5', label: 'Invite with 1 link', dot: null, w: 220 },
  };
  const c = specs[scene] || specs.discover;
  const w = c.w * s;
  const dot = c.dot
    ? `<circle cx="${x + 26 * s}" cy="${y + h / 2}" r="${10 * s}" fill="${c.dot}"/>`
    : '';
  const textX = c.dot ? x + 48 * s : x + w / 2;
  const anchor = c.dot ? 'start' : 'middle';
  return `
  <g filter="url(#${L.uid}-ds)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c.bg}"/>
    ${dot}
    <text x="${textX}" y="${y + h * 0.66}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${18 * s}" font-weight="700" fill="${c.fg}">${esc(c.label)}</text>
  </g>`;
}

function buildSvg(slide, size, iconHref) {
  const L = layout(size.width, size.height);
  L.uid = `u${size.width}${slide.scene}`.replace(/[^a-z0-9]/gi, '');

  const globalDefs = `
  <defs>
    ${defs(L.uid).replace(/<\/?defs>/g, '')}
    ${clipDef(L)}
    <linearGradient id="fchip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="fmap" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EEF2FF"/><stop offset="100%" stop-color="#FCE7F3"/>
    </linearGradient>
    <linearGradient id="bgmap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F8FAFC"/><stop offset="100%" stop-color="#EEF2FF"/>
    </linearGradient>
    <filter id="fds" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#020617" flood-opacity="0.14"/>
    </filter>
    <filter id="fglow">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  const phone = phoneFrame(L, SCREENS[slide.scene]);
  const chip = calloutChip(L, slide.scene);
  const city = cityscape(L);
  const kickerW = Math.round(slide.kicker.length * 11.5 * L.s + 40 * L.s);

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  ${globalDefs}
  <rect width="${L.W}" height="${L.H}" fill="url(#${L.uid}-bg)"/>
  <rect width="${L.W}" height="${L.H}" fill="url(#${L.uid}-sun)"/>
  <rect width="${L.W}" height="${L.H}" fill="url(#${L.uid}-moon)"/>
  ${city}

  <!-- ZONE 1: brand + copy -->
  <image xlink:href="${iconHref}" x="${L.pad}" y="${L.brandY}" width="${L.iconS}" height="${L.iconS}"/>
  <text x="${L.pad + L.iconS + 14 * L.s}" y="${L.brandY + L.iconS * 0.68}" font-family="Georgia, 'Times New Roman', serif" font-size="${32 * L.s}" font-weight="700" fill="#FFFFFF">Marvira</text>

  <rect x="${L.pad}" y="${L.kickerY}" width="${kickerW}" height="${L.kickerH}" rx="${L.kickerH / 2}" fill="#FFFFFF" fill-opacity="0.12"/>
  <text x="${L.pad + 20 * L.s}" y="${L.kickerY + L.kickerH * 0.68}" font-family="Arial, Helvetica, sans-serif" font-size="${L.kickerSize}" font-weight="700" letter-spacing="2" fill="#FDE68A">${esc(slide.kicker)}</text>

  <text x="${L.pad}" y="${L.titleBaseline}" font-family="Arial, Helvetica, sans-serif" font-size="${L.titleSize}" font-weight="700" fill="#FFFFFF">${esc(slide.title)}</text>
  <text x="${L.pad}" y="${L.subtitleBaseline}" font-family="Arial, Helvetica, sans-serif" font-size="${L.subSize}" fill="#F5D0FE">${esc(slide.subtitle)}</text>

  <!-- ZONE 2: callout (clear of phone) -->
  ${chip}

  <!-- ZONE 3: device -->
  ${phone}

  <!-- ZONE 4: footer -->
  <text x="${L.pad}" y="${L.taglineY}" font-family="Arial, Helvetica, sans-serif" font-size="${20 * L.s}" font-weight="600" fill="#FFF7ED">City adventure, on foot.</text>
</svg>`);
}

async function main() {
  ensureDir(OUT);
  const iconPath = await resolveIcon();
  const iconBuf = await sharp(iconPath).resize(160, 160).png().toBuffer();
  const iconHref = `data:image/png;base64,${iconBuf.toString('base64')}`;

  const slides = [
    { file: '01-find-a-hunt', kicker: '01 · DISCOVER', title: 'Find a hunt', subtitle: 'Scavenger hunts waiting near you', scene: 'discover' },
    { file: '02-walk-to-places', kicker: '02 · EXPLORE', title: 'Walk to places', subtitle: 'GPS unlocks the next landmark', scene: 'walk' },
    { file: '03-answer-challenges', kicker: '03 · CHALLENGE', title: 'Solve the clue', subtitle: 'Quizzes at every stop — no spoilers', scene: 'challenge' },
    { file: '04-leaderboard', kicker: '04 · COMPETE', title: 'Climb the board', subtitle: 'Race friends across the city', scene: 'leaderboard' },
    { file: '05-create-hunts', kicker: '05 · CREATE', title: 'Build a hunt', subtitle: 'Publish routes for teams & events', scene: 'create' },
  ];

  const sizes = [
    { key: 'ios-6.7', width: 1290, height: 2796 },
    { key: 'android-phone', width: 1080, height: 1920 },
    { key: 'ipad-12.9', width: 2048, height: 2732, limit: 3 },
  ];

  for (const size of sizes) {
    const list = size.limit ? slides.slice(0, size.limit) : slides;
    for (const slide of list) {
      const svg = buildSvg(slide, size, iconHref);
      const dest = path.join(OUT, `${slide.file}-${size.key}.png`);
      // density 72 keeps font-size in sync with viewBox coords (high density
      // can make glyphs larger than layout math expects → overlaps)
      await sharp(svg, { density: 72 })
        .resize(size.width, size.height, { fit: 'fill' })
        .png({ compressionLevel: 9 })
        .toFile(dest);
      console.log('✓', path.basename(dest));
    }
  }
  console.log('Done →', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
