import fs from 'node:fs';

const outPath = new URL('./mat-thu-practice.ts', import.meta.url);

// ─── crypto ─────────────────────────────────────────────────────────

const decShift = (s, n) =>
  [...s]
    .map((ch) => {
      if (ch < 'A' || ch > 'Z') return ch;
      return String.fromCharCode(((ch.charCodeAt(0) - 65 - n + 26) % 26) + 65);
    })
    .join('');

const encShift = (s, n) => decShift(s, (26 - (n % 26)) % 26);

function removeSeq(nw, key) {
  const drop = new Set();
  let start = 0;
  for (const ch of key) {
    const i = nw.indexOf(ch, start);
    if (i < 0) throw new Error(`missing ${ch} in ${nw} for key ${key}`);
    drop.add(i);
    start = i + 1;
  }
  return [...nw].filter((_, i) => !drop.has(i)).join('');
}

function insertKey(plain, key) {
  const arr = [...plain];
  for (let i = 0; i < key.length; i++) arr.splice(i * 2, 0, key[i]);
  const result = arr.join('');
  if (removeSeq(result, key) !== plain) {
    throw new Error(`insertKey failed: ${plain}+${key}=>${result}`);
  }
  return result;
}

function rail2Encode(plain) {
  const a = [];
  const b = [];
  [...plain].forEach((ch, i) => (i % 2 === 0 ? a : b).push(ch));
  return a.join('') + b.join('');
}

function withFillers(plain, fill = 'X') {
  return [...plain].join(fill);
}

function atbash(s) {
  return [...s]
    .map((c) => (c < 'A' || c > 'Z' ? c : String.fromCharCode(155 - c.charCodeAt(0))))
    .join('');
}

function assertEq(name, got, expect) {
  if (got !== expect) {
    console.error('FAIL', name, { got, expect });
    process.exit(1);
  }
}

// ─── word bank ────────────────────────────────────────────────────────

const VIET = [
  { answer: 'Hà Nội', telex: 'HAF NOOJ' },
  { answer: 'Tập trung', telex: 'TAPJ TRUNGF' },
  { answer: 'Hoạt động', telex: 'HOATJ DDOONGJ' },
  { answer: 'Đồng ý', telex: 'DDOONGF YF' },
  { answer: 'Xin chào', telex: 'XINF CHAOF' },
  { answer: 'Đến hội', telex: 'DDEENS HOOJ' },
  { answer: 'Hoa Sen', telex: 'HOA SEN' },
  { answer: 'Tháp Trông', telex: 'THAPS TRONGF' },
  { answer: 'Trưởng ban', telex: 'TRUOWNGR BAN' },
  { answer: 'Kho báu', telex: 'KHOF BAUS' },
  { answer: 'Điểm hẹn', telex: 'DDIEEMR HEJN' },
  { answer: 'Bản đồ', telex: 'BARNF DOOF' },
  { answer: 'Chìa khóa', telex: 'CHIAF KHOAS' },
  { answer: 'Đường đi', telex: 'DUWOWNGF DIF' },
  { answer: 'Cửa hàng', telex: 'CUWAR HARNGF' },
  { answer: 'Công viên', telex: 'CONGF VIEENF' },
  { answer: 'Bảo tàng', telex: 'BAROF TARNGF' },
  { answer: 'Thư viện', telex: 'THUW VIEENJ' },
  { answer: 'Nhà thờ', telex: 'NHAF THOWF' },
  { answer: 'Chợ đêm', telex: 'CHOWS DDEEMF' },
  { answer: 'Vườn hoa', telex: 'VUWOWNF HOA' },
  { answer: 'Sông Hồng', telex: 'SONGF HONGF' },
  { answer: 'Bến Thành', telex: 'BEENS THANHF' },
  { answer: 'Đà Lạt', telex: 'DDAAF LATS' },
  { answer: 'Cần Thơ', telex: 'CAANF THOWF' },
  { answer: 'Vũng Tàu', telex: 'VUWNGF TAAF' },
  { answer: 'Lý Hiếm', telex: 'LYS HIEEMS' },
  { answer: 'Đêm Rồi', telex: 'DDEEM ROOI' },
  { answer: 'Đẹp', telex: 'DDEEPJ' },
  { answer: 'Họ Can', telex: 'HOF CAN' },
  { answer: 'Trưởng ban hoạt động VM', telex: 'TRUOWNGR-BAN-HOATJ-DDOONGJ-VM' },
];

const ASCII = [
  { answer: 'Marvira', plain: 'MARVIRA' },
  { answer: 'seventyone', plain: 'SEVENTYONE' },
];

const BANK = [...VIET, ...ASCII];

function isTelex(entry) {
  return Boolean(entry.telex);
}

function encodePlain(entry) {
  if (entry.telex) return entry.telex.replace(/[\s-]/g, '');
  return entry.plain;
}

function telexLabel(entry) {
  return entry.telex ?? entry.plain;
}

function explain(entry, steps) {
  if (isTelex(entry)) {
    return `${steps} → ${telexLabel(entry)} (Telex) → ${entry.answer}.`;
  }
  return `${steps} → ${entry.plain} → ${entry.answer}.`;
}

function qText(ott, nw) {
  return `OTT: ${ott}\nNW: ${nw} / AR`;
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function findAnswer(answer) {
  return BANK.find((e) => e.answer === answer);
}

// ─── 1 OTT / 1 cipher key ───────────────────────────────────────────
// cipher key = cơ chế giải (bỏ MUA, C/H=5, rail-2, lệch N…)

/** @type {Array<{ cipherKey: string, ott: string, key?: string, entry: any, nw?: string, steps: string, points: number, encode?: Function }>} */
const SPECS = [
  // Null cipher — 1 / từ khóa bỏ
  {
    cipherKey: 'null:SONGS',
    ott: 'Hôm nay trời xanh biển lặng',
    key: 'SONGS',
    entry: findAnswer('Lý Hiếm'),
    nw: 'LSYSHIOENEGMSS',
    steps: 'Bỏ SONGS',
    points: 15,
  },
  {
    cipherKey: 'null:SONG',
    ott: 'Bờ sông êm đêm không sóng dữ',
    key: 'SONG',
    entry: findAnswer('Điểm hẹn'),
    steps: 'Bỏ SONG',
    points: 15,
  },
  {
    cipherKey: 'null:MUA',
    ott: 'Ban công rộng gió nhẹ không mưa',
    key: 'MUA',
    entry: findAnswer('Tháp Trông'),
    steps: 'Bỏ MUA',
    points: 15,
  },
  {
    cipherKey: 'null:MAY',
    ott: 'Đêm thanh quang không mây che',
    key: 'MAY',
    entry: findAnswer('Đêm Rồi'),
    steps: 'Bỏ MAY',
    points: 15,
  },
  {
    cipherKey: 'null:GIO',
    ott: 'Sân trường yên ả chẳng gió thổi',
    key: 'GIO',
    entry: findAnswer('Hoa Sen'),
    steps: 'Bỏ GIO',
    points: 15,
  },
  {
    cipherKey: 'null:LUA',
    ott: 'Kho lương phải xa lửa thiêu',
    key: 'LUA',
    entry: findAnswer('Đẹp'),
    steps: 'Bỏ LUA',
    points: 15,
  },
  {
    cipherKey: 'null:BUI',
    ott: 'Trời trong xanh không bụi mờ',
    key: 'BUI',
    entry: findAnswer('Họ Can'),
    steps: 'Bỏ BUI',
    points: 15,
  },
  {
    cipherKey: 'null:AM',
    ott: 'Trong nhà khô ráo không ẩm mốc',
    key: 'AM',
    entry: findAnswer('Bản đồ'),
    steps: 'Bỏ AM',
    points: 15,
  },
  {
    cipherKey: 'null:XE',
    ott: 'Đường vắng vẻ chẳng xe qua lại',
    key: 'XE',
    entry: findAnswer('Cửa hàng'),
    steps: 'Bỏ XE',
    points: 15,
  },
  {
    cipherKey: 'null:CAT',
    ott: 'Bãi sạch bóng không cát vàng',
    key: 'CAT',
    entry: findAnswer('Chợ đêm'),
    steps: 'Bỏ CAT',
    points: 15,
  },

  // C/H + Telex — 1
  {
    cipherKey: 'ch5',
    ott: 'Cờ bay phất phới trong nắng chiều\nHát hân hoan rộn núi rừng',
    entry: findAnswer('Trưởng ban hoạt động VM'),
    nw: 'YWZTBSLW-GFS-MTFYO-IITTSLO-AR',
    steps: 'C/H lệch 5',
    points: 20,
  },

  // Khóa kép — 1 / null-key, OTT 2 dòng không trùng dòng null đơn
  {
    cipherKey: 'double:SONGS',
    ott: 'Biển chiều nay chẳng gợn sóng nào\nCờ đỏ tung bay trên cột cao',
    key: 'SONGS',
    entry: findAnswer('Bến Thành'),
    steps: 'Bỏ SONGS rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:MUA',
    ott: 'Sân nhà khô ráo suốt ngày không mưa\nHát vang vọng khắp bản làng quê',
    key: 'MUA',
    entry: findAnswer('Công viên'),
    steps: 'Bỏ MUA rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:MAY',
    ott: 'Trăng đêm tỏ không có mây che\nCây cầu gỗ bắc ngang dòng sông',
    key: 'MAY',
    entry: findAnswer('Bảo tàng'),
    steps: 'Bỏ MAY rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:GIO',
    ott: 'Đêm hè nồng chẳng một làn gió\nHoa lan nở muộn bên hiên nhà',
    key: 'GIO',
    entry: findAnswer('Đường đi'),
    steps: 'Bỏ GIO rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:LUA',
    ott: 'Kho thóc đứng xa ngọn lửa đang cháy\nChim én liệng thấp trước sân đình',
    key: 'LUA',
    entry: findAnswer('Nhà thờ'),
    steps: 'Bỏ LUA rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:BUI',
    ott: 'Đường phố sạch bóng không bụi bay\nHạt giống gieo đều trên luống đất',
    key: 'BUI',
    entry: findAnswer('Thư viện'),
    steps: 'Bỏ BUI rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:SONG',
    ott: 'Sông quê êm đềm không sóng dữ dội\nCổng đá cổ kính mở ra đón khách',
    key: 'SONG',
    entry: findAnswer('Sông Hồng'),
    steps: 'Bỏ SONG rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:AM',
    ott: 'Gác sách khô thoáng không ẩm mốc\nHương trầm thoảng nhẹ trong gian thờ',
    key: 'AM',
    entry: findAnswer('Vũng Tàu'),
    steps: 'Bỏ AM rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:XE',
    ott: 'Ngõ nhỏ vắng tanh không xe cộ\nCỏ may đung đưa theo chiều gió',
    key: 'XE',
    entry: findAnswer('Xin chào'),
    steps: 'Bỏ XE rồi C/H lệch 5',
    points: 25,
    double: true,
  },
  {
    cipherKey: 'double:CAT',
    ott: 'Bờ đê sạch sẽ không cát bay\nHàng cau thẳng tắp trước nhà sàn',
    key: 'CAT',
    entry: findAnswer('Cần Thơ'),
    steps: 'Bỏ CAT rồi C/H lệch 5',
    points: 25,
    double: true,
  },

  // Sóng biển — 1
  {
    cipherKey: 'rail2',
    ott: 'Lên rừng xuống biển',
    entry: findAnswer('Tập trung'),
    steps: 'Sóng biển 2 tầng',
    points: 15,
    kind: 'rail2',
  },

  // Trồng/chặt — 1
  {
    cipherKey: 'interleave',
    ott: 'Trồng một cây chặt một cây',
    entry: findAnswer('Marvira'),
    steps: 'Trồng/chặt (bỏ X)',
    points: 15,
    kind: 'interleave',
  },

  // Atbash — 1
  {
    cipherKey: 'atbash',
    ott: 'Soi gương sáng bừng trước mặt',
    entry: findAnswer('Hà Nội'),
    steps: 'Soi gương (A↔Z)',
    points: 15,
    kind: 'atbash',
  },

  // Caesar ẩn — 1 / mỗi N
  {
    cipherKey: 'caesar:3',
    ott: 'Ba anh em cùng một nhà',
    entry: findAnswer('Kho báu'),
    steps: 'Lệch 3',
    points: 15,
    shift: 3,
  },
  {
    cipherKey: 'caesar:4',
    ott: 'Một vòng tròn có bốn phần tư',
    entry: findAnswer('Chìa khóa'),
    steps: 'Lệch 4',
    points: 15,
    shift: 4,
  },
  {
    cipherKey: 'caesar:5',
    ott: 'Năm ngón tay trên bàn tay',
    entry: findAnswer('Đường đi'),
    steps: 'Lệch 5',
    points: 15,
    shift: 5,
  },
  {
    cipherKey: 'caesar:6',
    ott: 'Sáu cây sáo ríu rít bên bờ',
    entry: findAnswer('Cửa hàng'),
    steps: 'Lệch 6',
    points: 15,
    shift: 6,
  },
  {
    cipherKey: 'caesar:7',
    ott: 'Bảy màu cầu vồng sau mưa',
    entry: findAnswer('Công viên'),
    steps: 'Lệch 7',
    points: 15,
    shift: 7,
  },
  {
    cipherKey: 'caesar:8',
    ott: 'Tám hướng gió thổi bốn phương trời',
    entry: findAnswer('Bảo tàng'),
    steps: 'Lệch 8',
    points: 15,
    shift: 8,
  },
  {
    cipherKey: 'caesar:9',
    ott: 'Chín tầng mây cao vút ngàn trùng',
    entry: findAnswer('Thư viện'),
    steps: 'Lệch 9',
    points: 15,
    shift: 9,
  },
  {
    cipherKey: 'caesar:10',
    ott: 'Mười ngón đếm xuôi trên tay',
    entry: findAnswer('Nhà thờ'),
    steps: 'Lệch 10',
    points: 15,
    shift: 10,
  },
  {
    cipherKey: 'caesar:12',
    ott: 'Mười hai tháng tròn một năm',
    entry: findAnswer('Vườn hoa'),
    steps: 'Lệch 12',
    points: 15,
    shift: 12,
  },
  {
    cipherKey: 'caesar:22',
    ott: 'Một đàn chim bay thành hình chữ V',
    entry: findAnswer('Đà Lạt'),
    steps: 'Lệch 22',
    points: 15,
    shift: 22,
  },
];

const FORBIDDEN = [
  'Gõ Telex',
  'Alphabet tiến',
  'Lấy chữ',
  'lưới',
  'nhảy cóc',
  'A=1',
  'Mã Morse',
  'điện báo',
  'đọc Telex',
  'Caesar',
  'Atbash',
  'Rail',
];

const questions = [];
const usedOtt = new Set();
const usedCipherKey = new Set();
const usedFirstLine = new Set();

for (const spec of SPECS) {
  if (!spec.entry) throw new Error(`Missing entry for ${spec.cipherKey}`);
  if (usedCipherKey.has(spec.cipherKey)) {
    throw new Error(`Duplicate cipher key ${spec.cipherKey}`);
  }
  if (usedOtt.has(spec.ott)) throw new Error(`Duplicate OTT ${spec.ott}`);

  const first = spec.ott.split('\n')[0];
  if (usedFirstLine.has(first)) {
    throw new Error(`Duplicate first-line key phrase: ${first}`);
  }

  let nw = spec.nw;
  const plain = encodePlain(spec.entry);

  if (!nw) {
    if (spec.double) {
      nw = encShift(insertKey(plain, spec.key), 5);
    } else if (spec.key) {
      nw = insertKey(plain, spec.key);
    } else if (spec.kind === 'rail2') {
      nw = rail2Encode(plain);
    } else if (spec.kind === 'interleave') {
      nw = withFillers(plain, 'X');
    } else if (spec.kind === 'atbash') {
      nw = atbash(plain);
    } else if (spec.shift != null) {
      nw = encShift(plain, spec.shift);
    } else {
      throw new Error(`No NW encode for ${spec.cipherKey}`);
    }
  }

  if (spec.key && !spec.double && !spec.nw) {
    assertEq(spec.cipherKey, removeSeq(nw, spec.key), plain);
  }
  if (spec.key && spec.nw) {
    assertEq(spec.cipherKey, removeSeq(nw, spec.key), plain);
  }
  if (spec.double) {
    assertEq(
      spec.cipherKey,
      removeSeq(decShift(nw, 5), spec.key),
      plain,
    );
  }

  usedOtt.add(spec.ott);
  usedCipherKey.add(spec.cipherKey);
  usedFirstLine.add(first);

  questions.push({
    id: `seed-practice-matthu-${String(questions.length + 1).padStart(3, '0')}`,
    type: 'TEXT',
    points: spec.points,
    question: qText(spec.ott, nw),
    answer: spec.entry.answer,
    explanation: explain(spec.entry, spec.steps),
  });
}

// Validate output
for (const q of questions) {
  for (const bad of FORBIDDEN) {
    if (q.question.toLowerCase().includes(bad.toLowerCase())) {
      console.error('Forbidden phrase', q.id, bad);
      process.exit(1);
    }
  }
  const nwBody = q.question.match(/NW:\s*(.+?)\s*\/\s*AR/s)?.[1] ?? '';
  if (/[.\-]{2,}/.test(nwBody) || /(^|\s)[.\-]+(\s|$)/.test(nwBody)) {
    console.error('Morse-like NW', q.id, nwBody);
    process.exit(1);
  }
  const hasDiacritics =
    /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(
      q.answer,
    );
  if (hasDiacritics && !q.explanation.includes('Telex')) {
    console.error('Missing Telex explanation', q.id);
    process.exit(1);
  }
}

function esc(s) {
  return JSON.stringify(s);
}

const lines = [];
lines.push(`import { QuestionType } from '@prisma/client';`);
lines.push('');
lines.push('/**');
lines.push(' * Mật thư Practice (vi) — mỗi khóa cipher đúng 1 câu.');
lines.push(` * ${questions.length} câu. Bạch văn có dấu = Telex.`);
lines.push(' * Generated by _generate-mat-thu.mjs');
lines.push(' */');
lines.push('export type MatThuPracticeSeed = {');
lines.push('  id: string;');
lines.push('  question: string;');
lines.push('  type: QuestionType;');
lines.push('  answer: string;');
lines.push('  explanation: string;');
lines.push('  points: number;');
lines.push('};');
lines.push('');
lines.push('export const matThuPracticeQuestions: MatThuPracticeSeed[] = [');

for (const item of questions) {
  lines.push('  {');
  lines.push(`    id: ${esc(item.id)},`);
  lines.push(`    type: QuestionType.TEXT,`);
  lines.push(`    points: ${item.points},`);
  lines.push(`    question: ${esc(item.question)},`);
  lines.push(`    answer: ${esc(item.answer)},`);
  lines.push(`    explanation: ${esc(item.explanation)},`);
  lines.push('  },');
}
lines.push('];');
lines.push('');

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${questions.length} questions`);
console.log('Cipher keys:', [...usedCipherKey].join(', '));
console.log('Sample:', questions[0].question);
