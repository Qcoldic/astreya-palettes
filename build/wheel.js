(function () {
  var C = 160, cusps = [8, 40, 78, 105, 130, 155, 188, 220, 258, 285, 310, 335];
  var signs = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  var asc = cusps[0];
  function pos(lon, r) {
    var a = (180 + (lon - asc)) * Math.PI / 180;
    return [C + r * Math.cos(a), C - r * Math.sin(a)];
  }
  function el(n, at) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var k in at) e.setAttribute(k, at[k]);
    return e;
  }
  var gS = document.getElementById("wheel-static");
  [150, 124, 104].forEach(function (r) {
    gS.appendChild(el("circle", { cx: C, cy: C, r: r, class: "ring" }));
  });
  for (var s = 0; s < 12; s++) {
    var lon = s * 30, p1 = pos(lon, 150), p2 = pos(lon, 124);
    gS.appendChild(el("line", { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], class: "tick" }));
    var pm = pos(lon + 15, 137), t = el("text", { x: pm[0], y: pm[1] + 4, class: "sgl" });
    t.textContent = signs[s];
    gS.appendChild(t);
  }
  cusps.forEach(function (cu, i) {
    var a = pos(cu, 124), b = pos(cu, 104);
    gS.appendChild(el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: "tick" }));
    var nxt = cusps[(i + 1) % 12], span = ((nxt - cu) + 360) % 360;
    var m = pos(cu + span / 2, 114), n = el("text", { x: m[0], y: m[1] + 3, class: "hnum" });
    n.textContent = i + 1;
    gS.appendChild(n);
  });

  var planets = [
    { g: "☉", n: "Солнце", lon: 354, sign: "Рыбы 24°", house: "12 дом", txt: "Ты считываешь настроение комнаты раньше, чем звучит первое слово. Сила — в этой чуткости, цена — в том, что чужое состояние ты часто носишь как своё." },
    { g: "☽", n: "Луна", lon: 132, sign: "Лев 12°", house: "5 дом", txt: "Тебе нужно, чтобы твоё присутствие замечали. Это не тщеславие, а способ убедиться, что связь настоящая." },
    { g: "☿", n: "Меркурий", lon: 338, sign: "Рыбы 8°", house: "12 дом", txt: "Ты думаешь образами, а не тезисами. Формулировка приходит позже понимания — и это сбивает собеседников." },
    { g: "♀", n: "Венера", lon: 315, sign: "Водолей 15°", house: "11 дом", txt: "Ты сближаешься через общий интерес, а не через быт. Отсюда и лёгкость дружбы, и трудность оседлости." },
    { g: "♂", n: "Марс", lon: 140, sign: "Лев 20°", house: "5 дом", txt: "Ты вкладываешься туда, где виден результат и есть зритель. Без отклика запал гаснет быстрее, чем задача." },
    { g: "♃", n: "Юпитер", lon: 257, sign: "Стрелец 17°", house: "9 дом", txt: "Тебя тянет за горизонт: учёба, дорога, чужой язык. Рост приходит через выход из привычного круга." },
    { g: "♄", n: "Сатурн", lon: 342, sign: "Рыбы 12°", house: "12 дом", txt: "Твоя дисциплина спрятана внутрь. Ты требуешь с себя молча и потому редко засчитываешь себе сделанное." },
    { g: "♅", n: "Уран", lon: 329, sign: "Водолей 29°", house: "11 дом", txt: "Ты плохо переносишь правила, которых никто не может объяснить. Ломаешь их не из бунта, а из непонимания." },
    { g: "♆", n: "Нептун", lon: 294, sign: "Козерог 24°", house: "10 дом", txt: "У тебя высокий образ того, кем ты должна стать. Он вдохновляет — и он же обесценивает достигнутое." },
    { g: "♇", n: "Плутон", lon: 240, sign: "Стрелец 0°", house: "8 дом", txt: "Ты идёшь до дна там, где другие останавливаются. Это делает тебя опорой в кризисе и тяжёлой в мелочах." },
    { g: "⚷", n: "Хирон", lon: 178, sign: "Дева 28°", house: "6 дом", txt: "Больное место — быть неидеальной в деле. Отсюда и мастерство, и привычка перепроверять уже готовое." }
  ];
  var aspects = [
    [354, 257, "hard"], [132, 315, "hard"], [354, 178, "hard"],
    [342, 257, "hard"], [329, 240, "hard"],
    [240, 178, "soft"], [315, 257, "soft"], [354, 294, "soft"]
  ];
  var gA = document.getElementById("wheel-asp");
  aspects.forEach(function (a) {
    var p = pos(a[0], 76), q = pos(a[1], 76);
    gA.appendChild(el("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: "asp " + a[2] }));
  });

  var PR = 90, DOT = 10;
  var minDeg = 2 * Math.asin((2 * DOT + 1) / (2 * PR)) * 180 / Math.PI;
  var slots = planets.map(function (pl, i) {
    return { i: i, a: ((pl.lon - asc) % 360 + 360) % 360 };
  }).sort(function (x, y) { return x.a - y.a; });
  slots.forEach(function (s) { s.s = s.a; });
  for (var pass = 0; pass < 400; pass++) {
    var moved = false;
    for (var k = 0; k < slots.length; k++) {
      var nx = (k + 1) % slots.length, gap = slots[nx].s - slots[k].s;
      if (nx === 0) gap += 360;
      if (gap < minDeg - 1e-6) {
        var push = (minDeg - gap) / 2;
        slots[k].s -= push;
        slots[nx].s += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  var shifted = [];
  slots.forEach(function (s) { shifted[s.i] = s.s; });

  var gP = document.getElementById("wheel-pl"), nodes = [];
  planets.forEach(function (pl, i) {
    var ang = shifted[i] + asc, p = pos(ang, PR);
    var g = el("g", { class: "pl", tabindex: "0", role: "button", "aria-label": pl.n + ", " + pl.sign });
    var t0 = pos(pl.lon, 103), t1 = pos(ang, PR + DOT);
    g.appendChild(el("line", { x1: t0[0], y1: t0[1], x2: t1[0], y2: t1[1], class: "lead" }));
    g.appendChild(el("circle", { cx: p[0], cy: p[1], r: DOT }));
    var t = el("text", { x: p[0], y: p[1] + 5 });
    t.textContent = pl.g;
    g.appendChild(t);
    function sel() {
      nodes.forEach(function (n) { n.classList.remove("on"); });
      g.classList.add("on");
      document.getElementById("c-k").textContent = pl.n;
      document.getElementById("c-t").textContent = pl.sign + " · " + pl.house;
      document.getElementById("c-p").textContent = pl.txt;
    }
    g.addEventListener("click", sel);
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel(); }
    });
    if (i === 0) g.classList.add("on");
    gP.appendChild(g);
    nodes.push(g);
  });
})();
