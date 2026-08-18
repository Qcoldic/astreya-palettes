const fs = require("fs");
const path = require("path");

function h2r(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + t.map(v => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function lum(hex) {
  const v = hex.slice(1).match(/../g).map(q => { let c = parseInt(q, 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
function tune(h, s, bg, target, goLighter) {
  let lo = goLighter ? 25 : 5, hi = goLighter ? 98 : 62, best = null;
  for (let i = 0; i < 44; i++) {
    const mid = (lo + hi) / 2, hex = h2r(h, s, mid), c = cr(hex, bg);
    if (c >= target) { best = hex; if (goLighter) hi = mid; else lo = mid; }
    else { if (goLighter) lo = mid; else hi = mid; }
  }
  return best;
}

// ── словари тонов ─────────────────────────────────────────────
const DARK_BG = [
  ["Полночь", 232], ["Индиго", 243], ["Чернила", 226], ["Сапфир", 215], ["Океан", 202],
  ["Лагуна", 192], ["Бирюза", 184], ["Нефрит", 168], ["Малахит", 158], ["Изумруд", 150],
  ["Хвоя", 143], ["Кипарис", 133], ["Мох", 118], ["Полынь", 100], ["Олива", 82],
  ["Табак", 38], ["Уголь", 25], ["Гранат", 356], ["Вино", 347], ["Бордо", 340],
  ["Пион", 332], ["Фуксия", 318], ["Орхидея", 303], ["Слива", 288], ["Виноград", 278],
  ["Аметист", 268], ["Сирень", 260], ["Базальт", 210], ["Сланец", 220], ["Оникс", 250],
  ["Обсидиан", 238], ["Агат", 205], ["Гагат", 275], ["Терн", 295], ["Черника", 255],
  ["Индиговый шёлк", 248], ["Кобальт", 222], ["Лазурит", 228], ["Тис", 138], ["Папоротник", 128],
  ["Шалфей", 108], ["Хаки", 75], ["Бронза", 30], ["Каштан", 15], ["Марсала", 350]
];
const ACC = [
  ["мята", 165], ["роса", 176], ["лёд", 196], ["лазурь", 205], ["сталь", 213],
  ["жемчуг", 45], ["латунь", 48], ["мёд", 42], ["серебро", 220], ["дым", 250],
  ["роза", 342], ["пион", 330], ["сирень", 272], ["лаванда", 262], ["василёк", 228],
  ["нефрит", 162], ["папоротник", 140], ["олово", 210], ["иней", 190], ["шалфей", 128],
  ["перо", 236], ["опал", 186], ["хвоя", 146], ["барвинок", 245], ["фиалка", 280],
  ["коралл", 350], ["пепел", 216], ["слюда", 200], ["полынь", 96], ["вереск", 300]
];
const WHITES = [
  ["Снег", 220, 12, 99.2], ["Молоко", 42, 26, 97.6], ["Жемчуг", 210, 16, 97.8],
  ["Иней", 250, 14, 98.2], ["Лён", 46, 20, 96.4], ["Бумага", 34, 24, 96.0],
  ["Перламутр", 265, 18, 97.2], ["Пепел", 215, 6, 96.6], ["Пудра", 340, 16, 97.4],
  ["Фарфор", 195, 14, 98.4], ["Слоновая кость", 50, 22, 96.8], ["Туман", 200, 10, 96.2],
  ["Сливки", 40, 30, 97.0], ["Алебастр", 30, 12, 98.0], ["Мел", 0, 0, 100]
];
const LIGHT_ACC = [
  ["индиго", 243], ["сапфир", 214], ["хвоя", 146], ["вино", 348], ["графит", 218],
  ["слива", 288], ["бирюза", 186], ["мох", 120], ["лаванда", 264], ["нефрит", 165],
  ["гранат", 356], ["олива", 84], ["уголь", 230], ["василёк", 226], ["пион", 332],
  ["мята", 168], ["сталь", 212], ["рябина", 344], ["барвинок", 246], ["марсала", 350],
  ["хаки", 78], ["кобальт", 224], ["фиалка", 282], ["изумруд", 152], ["латунь", 46],
  ["иней", 192], ["шалфей", 110], ["опал", 188], ["вереск", 300], ["перо", 238]
];

// ── сборка спецификаций ───────────────────────────────────────
const SPECS = [];
const seen = new Set();
function addSpec(name, hBg, sBg, lBg, hAcc, hSec, dark, filled, cardLighter) {
  if (seen.has(name)) return;
  seen.add(name);
  SPECS.push({ name, hBg, sBg, lBg, hAcc, hSec, dark, filled, cardLighter });
}

// 90 тёмных: каждый фон × 3 акцента
DARK_BG.forEach((bg, i) => {
  for (let k = 0; k < 6 && SPECS.length < 250; k++) {
    const a = ACC[(i + k * 3) % ACC.length];
    const sec = ACC[(i + k * 3 + 9) % ACC.length];
    const satBg = [22, 16, 28][k % 3];
    const lBg = [6.5, 8.5, 5.5][(i + k) % 3];
    addSpec(`${bg[0]} и ${a[0]}`, bg[1], satBg, lBg, a[1], sec[1], 1, (i + k) % 2, 1);
  }
});

// 110 светлых: каждый оттенок белого × разные акценты, оба рода карточки
WHITES.forEach((w, i) => {
  const n = 17;
  for (let k = 0; k < n && SPECS.length < 500; k++) {
    const a = LIGHT_ACC[(i + k) % LIGHT_ACC.length];
    const sec = LIGHT_ACC[(i + k + 6) % LIGHT_ACC.length];
    addSpec(`${w[0]} и ${a[0]}`, w[1], w[2], w[3], a[1], sec[1], 0, k % 2, k % 3 !== 2);
  }
});

// ── генерация ─────────────────────────────────────────────────
const out = [], report = [];
SPECS.forEach((sp, idx) => {
  const { name, hBg, sBg, lBg, hAcc, hSec, dark, filled, cardLighter } = sp;
  let ink, ink2, ink3, line, chip, silver, silver2, hnum, sel, onSel, ink4, onAccent, priceOn, nav, violet, gold;

  if (dark) {
    ink = h2r(hBg, sBg, lBg);
    ink2 = h2r(hBg, sBg - 3, lBg + 4.5);
    ink3 = h2r(hBg, sBg - 4, lBg + 12);
    line = tune(hBg, sBg - 5, ink, 2.0, true);
    chip = ink2;
    nav = h2r(hBg, sBg, lBg + 2);
    silver = h2r(hBg, 14, 94);
    silver2 = tune(hBg, 12, ink2, 4.8, true);
    hnum = tune(hBg, 14, ink, 4.7, true);
    violet = tune(hAcc, 62, nav, 4.8, true);
    gold = tune(hSec, 55, ink2, 4.8, true);
    if (filled) {
      ink4 = tune(hAcc, 58, ink, 9.0, true);
      onAccent = tune(hAcc, 45, ink4, 6.0, false);
      priceOn = tune(hSec, 45, ink4, 4.8, false);
    } else {
      ink4 = h2r(hAcc, 38, lBg + 15);
      onAccent = tune(hAcc, 18, ink4, 6.0, true);
      priceOn = tune(hSec, 55, ink4, 4.8, true);
    }
    sel = ink4; onSel = onAccent;
  } else {
    ink = h2r(hBg, sBg, lBg);
    ink2 = cardLighter
      ? (lBg >= 99 ? h2r(hBg, Math.max(sBg - 4, 2), 96.5) : h2r(hBg, Math.max(sBg - 12, 0), Math.min(lBg + 2.4, 100)))
      : h2r(hBg, Math.max(sBg - 6, 3), lBg - 3.2);
    ink3 = h2r(hBg, Math.max(sBg - 8, 4), lBg - 8);
    line = tune(hBg, Math.max(sBg - 10, 4), ink, 2.0, false);
    chip = h2r(hBg, Math.max(sBg - 4, 3), lBg - 3);
    nav = ink2;
    silver = h2r(hBg, 12, 10);
    silver2 = tune(hBg, 10, ink2, 4.8, false);
    hnum = tune(hBg, 10, ink, 4.7, false);
    violet = tune(hAcc, 68, nav, 4.8, false);
    gold = tune(hSec, 62, ink2, 4.8, false);
    if (filled) {
      ink4 = tune(hAcc, 55, "#FFFFFF", 5.6, false);
      onAccent = "#FFFFFF";
      priceOn = tune(hSec, 40, ink4, 4.8, true);
      sel = h2r(hAcc, 45, 92); onSel = tune(hAcc, 55, sel, 5.5, false);
    } else {
      ink4 = h2r(hAcc, 40, 93);
      onAccent = tune(hAcc, 55, ink4, 5.5, false);
      priceOn = tune(hSec, 55, ink4, 4.8, false);
      sel = h2r(hAcc, 40, 92); onSel = tune(hAcc, 55, sel, 5.5, false);
    }
  }

  const p = { id: "p" + idx, name, dark: !!dark, ink, ink2, ink3, ink4, silver, silver2,
    violet, gold, nav, hnum, onAccent, priceOn, sel, onSel, line, chip };

  const missing = Object.entries(p).filter(([k, v]) => v === null || v === undefined).map(([k]) => k);
  const checks = [
    ["текст/фон", silver, ink, 7], ["вторичный/карточка", silver2, ink2, 4.5],
    ["дома/фон", hnum, ink, 4.5], ["цена/карточка", gold, ink2, 4.5],
    ["текст кнопки", onAccent, ink4, 4.5], ["цена кнопки", priceOn, ink4, 4.5],
    ["навигация", silver2, nav, 4.5], ["вкладка", violet, nav, 4.5],
    ["планета", onSel, sel, 4.5], ["обводка", violet, ink, 3],
    ["линии", line, ink, 1.8], ["карточка/фон", ink2, ink, 1.02]
  ];
  const bad = missing.length ? ["пустые поля: " + missing.join(",")]
    : checks.filter(([n, f, b, m]) => cr(f, b) < m).map(([n, f, b, m]) => `${n} ${cr(f, b).toFixed(2)}<${m}`);
  report.push({ name, bad });
  if (!bad.length) out.push(p);
});

const ok = report.filter(r => !r.bad.length).length;
console.log(`спецификаций ${SPECS.length}, прошли контраст ${ok}`);
report.filter(r => r.bad.length).slice(0, 14).forEach(r => console.log(`  ✗ ${r.name}: ${r.bad.join(", ")}`));
if (report.filter(r => r.bad.length).length > 14) console.log(`  … ещё ${report.filter(r => r.bad.length).length - 14}`);
console.log(`тёмных ${out.filter(p => p.dark).length}, светлых ${out.filter(p => !p.dark).length}`);
fs.writeFileSync(path.join(__dirname, "palettes500.json"), JSON.stringify(out));
console.log(`записано ${out.length}, вес ${(JSON.stringify(out).length / 1024).toFixed(1)} КБ`);
