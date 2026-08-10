/**
 * Generates public/press/marvira-one-pager.pdf
 * Run: node generate-press-pdf.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'press', 'marvira-one-pager.pdf');
const HERO_SRC = path.join(ROOT, 'public', 'images', 'home-hero.jpg');
const HERO = path.join(__dirname, '_hero-press.jpg');
const MARK = path.join(ROOT, 'public', 'images', 'marvira-mark.png');

const INK = '#1E293B';
const FOREST = '#6366F1';
const SUN = '#EC4899';
const MIST = '#F8FAFC';
const MUTED = '#64748B';

const COPY = {
  brand: 'Marvira',
  tagline: 'City adventure, on foot.',
  title: 'What is Marvira?',
  body:
    'Marvira is a GPS scavenger-hunt app for city exploration. Players walk to real places, answer location challenges, and compete on leaderboards. Organizers create hunts for events, tourism, venues, and schools — then share a single invite link.',
  audiences: [
    {
      title: 'Cities & tourism boards',
      body: 'Activate districts with walkable discovery routes that highlight local landmarks.',
    },
    {
      title: 'Venues & campuses',
      body: 'Offer self-guided experiences without building a custom app.',
    },
    {
      title: 'Schools',
      body: 'Turn local history and STEM into outdoor team challenges.',
    },
    {
      title: 'Organizers',
      body: 'Publish hunts, invite players, and celebrate results on a live leaderboard.',
    },
  ],
  boilerplate:
    'Marvira turns cities into playable scavenger hunts. Walk real places, solve challenges, and climb the leaderboard — or create hunts for your community.',
  cta: 'Get the app',
  downloadUrl: 'https://www.marvira.com/download',
  contactLabel: 'Media & partnerships',
  contactEmail: 'support@marvira.com',
};

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function drawRoundedRect(doc, x, y, w, h, r, fill) {
  doc.save();
  doc.path(
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`,
  );
  doc.fill(fill);
  doc.restore();
}

async function main() {
  ensureDir(OUT);

  if (fs.existsSync(HERO_SRC)) {
    await sharp(HERO_SRC)
      .resize(1600, 560, { fit: 'cover' })
      .jpeg({ quality: 72, mozjpeg: true })
      .toFile(HERO);
  }

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: 'Marvira — Press one-pager',
      Author: 'Marvira',
      Subject: 'What is Marvira for cities, venues, schools, and organizers',
    },
  });

  const stream = fs.createWriteStream(OUT);
  doc.pipe(stream);

  const pageW = doc.page.width; // 595.28
  const pageH = doc.page.height; // 841.89
  const margin = 40;
  const contentW = pageW - margin * 2;

  // Full-page soft background
  doc.rect(0, 0, pageW, pageH).fill(MIST);

  // Hero band
  const heroH = 210;
  if (fs.existsSync(HERO)) {
    doc.save();
    doc.rect(0, 0, pageW, heroH).clip();
    doc.image(HERO, 0, 0, { width: pageW, height: heroH, cover: [pageW, heroH] });
    doc.restore();
    // Darken for text readability
    doc.save();
    doc.rect(0, 0, pageW, heroH).fillOpacity(0.38).fill('#0F172A');
    doc.restore();
  } else {
    doc.rect(0, 0, pageW, heroH).fill(FOREST);
  }

  // Brand mark + name on hero
  let brandX = margin;
  if (fs.existsSync(MARK)) {
    doc.image(MARK, margin, 28, { width: 36, height: 36 });
    brandX = margin + 48;
  }
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(COPY.brand, brandX, 32, { continued: false });
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica')
    .fontSize(11)
    .text(COPY.tagline, brandX, 58);

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(28)
    .text(COPY.title, margin, 130, { width: contentW });

  // Body
  let y = heroH + 28;
  doc
    .fillColor(INK)
    .font('Helvetica')
    .fontSize(11)
    .text(COPY.body, margin, y, { width: contentW, lineGap: 3 });
  y = doc.y + 22;

  // Audience grid (2x2)
  const gap = 14;
  const colW = (contentW - gap) / 2;
  const cardH = 78;
  COPY.audiences.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (colW + gap);
    const cy = y + row * (cardH + gap);

    drawRoundedRect(doc, x, cy, colW, cardH, 8, '#FFFFFF');
    // Accent bar
    doc.save();
    doc.rect(x, cy, 4, cardH).fill(i % 2 === 0 ? FOREST : SUN);
    doc.restore();

    doc
      .fillColor(FOREST)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(item.title, x + 16, cy + 14, { width: colW - 28 });
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text(item.body, x + 16, cy + 34, { width: colW - 28, lineGap: 2 });
  });

  y += 2 * (cardH + gap) + 8;

  // Boilerplate quote
  doc.save();
  doc.rect(margin, y, 4, 52).fill(SUN);
  doc.restore();
  doc
    .fillColor(INK)
    .font('Helvetica-Oblique')
    .fontSize(11)
    .text(COPY.boilerplate, margin + 16, y, { width: contentW - 16, lineGap: 3 });
  y = Math.max(doc.y, y + 52) + 28;

  // CTA strip
  const ctaH = 72;
  drawRoundedRect(doc, margin, y, contentW, ctaH, 10, FOREST);
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(COPY.cta, margin + 20, y + 16);
  doc
    .fillColor('#E0E7FF')
    .font('Helvetica')
    .fontSize(10)
    .text(COPY.downloadUrl, margin + 20, y + 38);
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica')
    .fontSize(10)
    .text(`${COPY.contactLabel}: ${COPY.contactEmail}`, margin + 20, y + 52, {
      width: contentW - 40,
    });

  // Footer
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(8)
    .text('marvira.com · Press kit one-pager', margin, pageH - 28, {
      width: contentW,
      align: 'left',
    });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  console.log(`Wrote ${OUT} (${fs.statSync(OUT).size} bytes)`);
  if (fs.existsSync(HERO)) fs.unlinkSync(HERO);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
