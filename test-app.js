const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "docs", "index.html"), "utf8");
const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

let fails = 0;
function ok(cond, label, extra) {
  if (!cond) fails++;
  console.log(`  ${cond ? "OK  " : "СБОЙ"} ${label}${extra ? " — " + extra : ""}`);
}

function node(tag) {
  const n = {
    tag, attrs: {}, kids: [], _txt: "", _html: "", handlers: {}, hidden: false, value: "",
    style: { props: {}, setProperty(k, v) { n.style.props[k] = v; } },
    setAttribute(k, v) { n.attrs[k] = v; },
    getAttribute(k) { return n.attrs[k] === undefined ? null : n.attrs[k]; },
    appendChild(c) { n.kids.push(c); return c; },
    addEventListener(e, f) { (n.handlers[e] = n.handlers[e] || []).push(f); },
    click(ev) { (n.handlers.click || []).forEach(f => f(ev || { stopPropagation() {} })); },
    key(k) { (n.handlers.keydown || []).forEach(f => f({ key: k, preventDefault() {} })); },
    scrollIntoView() { n._scrolled = true; },
    createElementNS(ns, t) { return node(t); },
    set textContent(v) { n._txt = String(v); }, get textContent() { return n._txt; },
    set innerHTML(v) { n._html = String(v); }, get innerHTML() { return n._html; },
    set className(v) { n.attrs.class = v; }, get className() { return n.attrs.class || ""; },
    set type(v) { n.attrs.type = v; },
    get children() { return n.kids; },
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, has(c) { return this._s.has(c); } }
  };
  return n;
}

const ids = {};
["phone", "navbar", "gal", "readout", "cur-screen", "cur-nav", "filters", "whites", "count",
 "fav-list", "t-screen", "t-nav", "seek-input", "seek-go", "seek-clear",
 "fav-copy", "fav-only", "fav-clear", "wheel-static", "wheel-asp", "wheel-pl",
 "c-k", "c-t", "c-p"].forEach(id => ids[id] = node("div"));

const store = {};
global.window = { localStorage: {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
} };
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };
global.document = {
  getElementById: id => ids[id] || null,
  querySelector: s => (s === ".phone" ? ids.phone : null),
  querySelectorAll: () => [],
  createElement: t => node(t),
  createElementNS: (ns, t) => node(t)
};

console.log("\n── колесо");
try { new Function(scripts[0])(); } catch (e) { console.log("  ИСКЛЮЧЕНИЕ:", e.message); fails++; }
const walk = (n, acc = []) => { acc.push(n); n.kids.forEach(k => walk(k, acc)); return acc; };
const wheelNodes = [ids["wheel-static"], ids["wheel-asp"], ids["wheel-pl"]].flatMap(g => walk(g));
const cls = c => wheelNodes.filter(n => (n.className || "").split(" ").includes(c));
ok(wheelNodes.filter(n => n.tag === "g" && (n.className || "").includes("pl")).length === 11, "11 планет");
ok(cls("asp").length === 8, "8 линий аспектов");
ok(cls("hnum").length === 12, "12 номеров домов");
ok(cls("sgl").length === 12, "12 символов знаков");
ok(cls("lead").length === 11, "11 выносок");

console.log("\n── данные");
new Function(scripts[1] + "\nglobal.PAL = PAL;")();
const PAL = global.PAL;
ok(PAL.length === 500, "500 палитр", "получено " + PAL.length);
ok(PAL.filter(p => p.dark).length === 250, "250 тёмных");
ok(PAL.filter(p => !p.dark).length === 250, "250 светлых");
ok(new Set(PAL.map(p => p.name)).size === 500, "все имена уникальны");
const FIELDS = ["ink","ink2","ink3","ink4","silver","silver2","violet","gold","nav","hnum","onAccent","priceOn","sel","onSel","line","chip"];
ok(PAL.every(p => FIELDS.every(f => /^#[0-9A-F]{6}$/i.test(p[f]))), "все цвета — валидный hex");

console.log("\n── галерея");
global.PAL = PAL;
new Function("PAL", scripts[2])(PAL);
const gal = ids.gal, phone = ids.phone, navbar = ids.navbar;
ok(gal.kids.length === 500, "500 карточек", gal.kids.length + " шт.");
const pickOf = i => gal.kids[i].kids[0];
const favOf = i => gal.kids[i].kids[1];
ok(pickOf(0).innerHTML.includes("№1"), "нумерация с №1");
ok(pickOf(499).innerHTML.includes("№500"), "последняя — №500");
ok(ids["cur-screen"].textContent.startsWith("№1 "), "экран стартует с №1", ids["cur-screen"].textContent);
ok(Object.keys(phone.style.props).length === 15, "экрану проставлены 15 переменных");
ok(!!navbar.style.props["--nav-bg"], "панели проставлен свой фон");

console.log("\n── независимость нижней панели");
pickOf(6).click();
const screenAfter = { ...phone.style.props };
ok(ids["cur-screen"].textContent.startsWith("№7 "), "клик красит экран, пока цель «экран»");
ids["t-nav"].click();
ok(ids["t-nav"].getAttribute("aria-pressed") === "true", "переключились на панель");
pickOf(299).click();
ok(ids["cur-nav"].textContent.startsWith("№300 "), "панель взяла №300", ids["cur-nav"].textContent);
ok(ids["cur-screen"].textContent.startsWith("№7 "), "экран НЕ изменился при покраске панели");
ok(JSON.stringify(phone.style.props) === JSON.stringify(screenAfter), "переменные экрана не тронуты");
ok(navbar.style.props["--nav-bg"] === PAL[299].ink2, "фон панели = поверхность палитры №300");
ok(navbar.style.props["--nav-acc"] === PAL[299].violet, "акцент панели = violet палитры №300");
ids["t-screen"].click();
pickOf(11).click();
ok(ids["cur-screen"].textContent.startsWith("№12 "), "вернулись к экрану, красится он");
ok(ids["cur-nav"].textContent.startsWith("№300 "), "панель осталась на №300");

console.log("\n── избранное");
favOf(4).click(); favOf(99).click(); favOf(250).click();
ok(ids["fav-list"].textContent === "5, 100, 251", "список отмеченных по возрастанию", ids["fav-list"].textContent);
ok(favOf(4).textContent === "★", "звезда закрашена");
ok(store["astreya-fav"] === "[5,100,251]", "сохранено в localStorage", store["astreya-fav"]);
favOf(99).click();
ok(ids["fav-list"].textContent === "5, 251", "повторный клик снимает отметку");
ids["fav-only"].click();
ok(ids.count.textContent.startsWith("показано 2 из 500"), "«только они» показывает 2", ids.count.textContent);
ids["fav-only"].click();
ok(ids.count.textContent.startsWith("показано 500 из 500"), "возврат ко всем");
ids["fav-copy"].click();
ok(true, "копирование не падает");

console.log("\n── фильтры и поиск");
ids.filters.kids[1].click();
ok(ids.count.textContent.startsWith("показано 250 из 500"), "тёмные — 250");
ok(ids.whites.hidden === true, "панель белых скрыта на тёмных");
ids.filters.kids[2].click();
ok(ids.count.textContent.startsWith("показано 250 из 500"), "светлые — 250");
ok(ids.whites.hidden === false, "панель белых открыта");
ok(ids.whites.kids.length === 15, "15 оттенков белого", ids.whites.kids.length + " шт.");
ids.whites.kids[0].click();
const narrowed = parseInt(ids.count.textContent.match(/\d+/)[0], 10);
ok(narrowed > 0 && narrowed < 250, "оттенок сужает выборку", "показано " + narrowed);
ids.whites.kids[0].click();
ok(ids.count.textContent.startsWith("показано 250"), "повторный клик снимает оттенок");

ids["seek-input"].value = "137";
ids["seek-go"].click();
ok(ids["cur-screen"].textContent.startsWith("№137 "), "поиск по номеру применил №137", ids["cur-screen"].textContent);
ok(ids.count.textContent.startsWith("показано 500"), "поиск сбросил фильтры");
ids["seek-input"].value = "999";
ids["seek-go"].click();
ok(ids.count.textContent.includes("нет такого номера"), "невалидный номер — понятная ошибка");
ids["seek-input"].value = "abc";
ids["seek-go"].click();
ok(ids.count.textContent.includes("нет такого номера"), "буквы не ломают поиск");
ids["seek-input"].value = "42";
ids["seek-input"].key("Enter");
ok(ids["cur-screen"].textContent.startsWith("№42 "), "Enter в поле работает");
ids["fav-clear"].click();
ok(ids["fav-list"].textContent.includes("пусто"), "очистка избранного");

console.log(`\nитог: ${fails === 0 ? "багов не найдено, все проверки пройдены" : fails + " СБОЕВ"}`);
process.exit(fails === 0 ? 0 : 1);
