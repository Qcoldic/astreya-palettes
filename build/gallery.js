(function () {
  function lum(hex) {
    var v = hex.slice(1).match(/../g).map(function (h) {
      var c = parseInt(h, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function cr(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function hue(hex) {
    var p = hex.slice(1).match(/../g).map(function (h) { return parseInt(h, 16) / 255; });
    var mx = Math.max.apply(null, p), mn = Math.min.apply(null, p), d = mx - mn;
    if (!d) return null;
    var h = mx === p[0] ? ((p[1] - p[2]) / d) % 6 : mx === p[1] ? (p[2] - p[0]) / d + 2 : (p[0] - p[1]) / d + 4;
    return Math.round((h * 60 + 360) % 360);
  }

  var KEYS = ["ink", "ink-2", "ink-3", "ink-4", "silver", "silver-2", "violet", "gold",
              "hnum", "on-accent", "price-on", "sel", "on-sel", "line", "chip"];
  var FIELD = { "ink": "ink", "ink-2": "ink2", "ink-3": "ink3", "ink-4": "ink4",
    "silver": "silver", "silver-2": "silver2", "violet": "violet", "gold": "gold",
    "hnum": "hnum", "on-accent": "onAccent", "price-on": "priceOn",
    "sel": "sel", "on-sel": "onSel", "line": "line", "chip": "chip" };

  var phone = document.getElementById("phone");
  var navbar = document.getElementById("navbar");
  var gal = document.getElementById("gal");
  var out = document.getElementById("readout");
  var curScreen = document.getElementById("cur-screen");
  var curNav = document.getElementById("cur-nav");
  var filters = document.getElementById("filters");
  var whitesBar = document.getElementById("whites");
  var countEl = document.getElementById("count");
  var favList = document.getElementById("fav-list");
  var tScreen = document.getElementById("t-screen");
  var tNav = document.getElementById("t-nav");
  var seekInput = document.getElementById("seek-input");
  var favOnlyBtn = document.getElementById("fav-only");

  var items = [], picks = [], favBtns = [];
  var mode = "all", whiteFilter = null, favOnly = false;
  var target = "screen", screenIdx = 0, navIdx = 0;
  var fav = [];

  try {
    var saved = window.localStorage.getItem("astreya-fav");
    if (saved) {
      fav = JSON.parse(saved).filter(function (n) {
        return typeof n === "number" && n >= 1 && n <= PAL.length;
      });
    }
  } catch (e) { fav = []; }

  var whiteNames = [];
  PAL.forEach(function (p) {
    if (p.dark) return;
    var w = p.name.split(" и ")[0];
    if (whiteNames.indexOf(w) < 0) whiteNames.push(w);
  });

  function label(i) { return "№" + (i + 1) + " " + PAL[i].name; }

  function paintScreen(i) {
    var p = PAL[i];
    KEYS.forEach(function (k) { phone.style.setProperty("--" + k, p[FIELD[k]]); });
    screenIdx = i;
    curScreen.textContent = label(i);
    out.textContent = "текст " + cr(p.silver, p.ink).toFixed(1) + ":1 · вторичный " +
      cr(p.silver2, p.ink2).toFixed(1) + ":1 · кнопка " + cr(p.onAccent, p.ink4).toFixed(1) +
      ":1 · фон " + (p.dark ? "тёмный" : "светлый") + " " +
      (hue(p.ink) === null ? "нейтральный" : hue(p.ink) + "°");
  }

  function paintNav(i) {
    var p = PAL[i];
    navbar.style.setProperty("--nav-bg", p.ink2);
    navbar.style.setProperty("--nav-fg", p.silver2);
    navbar.style.setProperty("--nav-acc", p.violet);
    navbar.style.setProperty("--nav-line", p.violet);
    navbar.style.setProperty("--nav-sel", p.sel);
    navbar.style.setProperty("--nav-on-sel", p.onSel);
    navIdx = i;
    curNav.textContent = label(i);
  }

  function markPicks() {
    var active = target === "screen" ? screenIdx : navIdx;
    picks.forEach(function (b, j) {
      b.setAttribute("aria-pressed", j === active ? "true" : "false");
    });
  }

  function choose(i) {
    if (target === "screen") paintScreen(i); else paintNav(i);
    markPicks();
  }

  function setTarget(t) {
    target = t;
    tScreen.setAttribute("aria-pressed", t === "screen" ? "true" : "false");
    tNav.setAttribute("aria-pressed", t === "nav" ? "true" : "false");
    markPicks();
  }

  function saveFav() {
    try { window.localStorage.setItem("astreya-fav", JSON.stringify(fav)); } catch (e) {}
  }

  function renderFav() {
    fav.sort(function (a, b) { return a - b; });
    favList.textContent = fav.length ? fav.join(", ") : "пусто — жми звёздочку на карточке";
    favBtns.forEach(function (b, j) {
      var on = fav.indexOf(j + 1) >= 0;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "★" : "☆";
    });
    saveFav();
  }

  function toggleFav(i) {
    var n = i + 1, k = fav.indexOf(n);
    if (k >= 0) fav.splice(k, 1); else fav.push(n);
    renderFav();
    refresh();
  }

  PAL.forEach(function (p, i) {
    var wrap = document.createElement("div");
    wrap.className = "item";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pick";
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<span class="no">№' + (i + 1) + '</span>' +
      '<p class="nm">' + p.name + '</p>' +
      '<span class="strip">' +
      '<i class="wide" style="background:' + p.ink + '"></i>' +
      '<i style="background:' + p.ink2 + '"></i>' +
      '<i style="background:' + p.ink4 + '"></i>' +
      '<i style="background:' + p.violet + '"></i>' +
      '<i style="background:' + p.gold + '"></i>' +
      '</span>' +
      '<span class="tag">' + (p.dark ? "тёмная" : "светлая") + '</span>';
    b.addEventListener("click", function () { choose(i); });

    var f = document.createElement("button");
    f.type = "button";
    f.className = "fav";
    f.textContent = "☆";
    f.setAttribute("aria-pressed", "false");
    f.setAttribute("aria-label", "Отметить номер " + (i + 1));
    f.addEventListener("click", function (ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      toggleFav(i);
    });

    wrap.appendChild(b);
    wrap.appendChild(f);
    gal.appendChild(wrap);
    items.push(wrap); picks.push(b); favBtns.push(f);
  });

  function visible(p, i) {
    if (favOnly && fav.indexOf(i + 1) < 0) return false;
    if (mode === "dark" && !p.dark) return false;
    if (mode === "light" && p.dark) return false;
    if (mode === "light" && whiteFilter && p.name.split(" и ")[0] !== whiteFilter) return false;
    return true;
  }

  function refresh() {
    var n = 0;
    PAL.forEach(function (p, i) {
      var v = visible(p, i);
      items[i].hidden = !v;
      if (v) n++;
    });
    whitesBar.hidden = mode !== "light";
    countEl.textContent = "показано " + n + " из " + PAL.length +
      (fav.length ? " · отмечено " + fav.length : "");
  }

  function resetFilterButtons() {
    [].forEach.call(filters.children, function (c, k) {
      c.setAttribute("aria-pressed", k === 0 ? "true" : "false");
    });
    [].forEach.call(whitesBar.children, function (c) { c.setAttribute("aria-pressed", "false"); });
  }

  [["all", "Все"], ["dark", "Тёмные"], ["light", "Светлые"]].forEach(function (f) {
    var b = document.createElement("button");
    b.type = "button";
    var n = f[0] === "all" ? PAL.length : PAL.filter(function (p) {
      return f[0] === "dark" ? p.dark : !p.dark;
    }).length;
    b.textContent = f[1] + " · " + n;
    b.setAttribute("aria-pressed", f[0] === "all" ? "true" : "false");
    b.addEventListener("click", function () {
      mode = f[0];
      whiteFilter = null;
      favOnly = false;
      favOnlyBtn.setAttribute("aria-pressed", "false");
      favOnlyBtn.textContent = "Показать только их";
      [].forEach.call(filters.children, function (c) { c.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      [].forEach.call(whitesBar.children, function (c) { c.setAttribute("aria-pressed", "false"); });
      refresh();
    });
    filters.appendChild(b);
  });

  whiteNames.forEach(function (w) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = w;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () {
      var on = whiteFilter === w;
      whiteFilter = on ? null : w;
      [].forEach.call(whitesBar.children, function (c) { c.setAttribute("aria-pressed", "false"); });
      if (!on) b.setAttribute("aria-pressed", "true");
      refresh();
    });
    whitesBar.appendChild(b);
  });

  tScreen.addEventListener("click", function () { setTarget("screen"); });
  tNav.addEventListener("click", function () { setTarget("nav"); });

  function seek() {
    var n = parseInt(String(seekInput.value).replace(/\D/g, ""), 10);
    if (!n || n < 1 || n > PAL.length) {
      countEl.textContent = "нет такого номера — введи от 1 до " + PAL.length;
      return;
    }
    mode = "all";
    whiteFilter = null;
    favOnly = false;
    favOnlyBtn.setAttribute("aria-pressed", "false");
    favOnlyBtn.textContent = "Показать только их";
    resetFilterButtons();
    refresh();
    choose(n - 1);
    if (items[n - 1].scrollIntoView) items[n - 1].scrollIntoView({ block: "center" });
  }

  document.getElementById("seek-go").addEventListener("click", seek);
  seekInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { if (e.preventDefault) e.preventDefault(); seek(); }
  });
  document.getElementById("seek-clear").addEventListener("click", function () {
    seekInput.value = "";
    mode = "all";
    whiteFilter = null;
    favOnly = false;
    favOnlyBtn.setAttribute("aria-pressed", "false");
    favOnlyBtn.textContent = "Показать только их";
    resetFilterButtons();
    refresh();
  });

  document.getElementById("fav-copy").addEventListener("click", function () {
    if (!fav.length) {
      favList.textContent = "нечего копировать — сначала отметь звёздочкой";
      return;
    }
    var txt = fav.map(function (n) { return "№" + n + " " + PAL[n - 1].name; }).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        countEl.textContent = "скопировано " + fav.length + " шт.";
      }, function () {
        countEl.textContent = "не вышло скопировать, номера: " + fav.join(", ");
      });
    } else {
      countEl.textContent = "номера: " + fav.join(", ");
    }
  });

  favOnlyBtn.addEventListener("click", function () {
    favOnly = !favOnly;
    favOnlyBtn.setAttribute("aria-pressed", favOnly ? "true" : "false");
    favOnlyBtn.textContent = favOnly ? "Показать все" : "Показать только их";
    refresh();
  });

  document.getElementById("fav-clear").addEventListener("click", function () {
    fav = [];
    renderFav();
    refresh();
  });

  renderFav();
  refresh();
  paintScreen(0);
  paintNav(0);
  setTarget("screen");
})();
