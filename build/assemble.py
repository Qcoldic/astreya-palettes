# -*- coding: utf-8 -*-
"""Собирает docs/index.html из частей: разметка, стили, данные, скрипты."""
import io, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "docs")

def read(name, base=HERE):
    return io.open(os.path.join(base, name), encoding="utf-8").read()

pals = json.load(io.open(os.path.join(ROOT, "palettes500.json"), encoding="utf-8"))
css = read("all.css")
body = read("body.html")
wheel = read("wheel.js")
gallery = read("gallery.js")

TPL = u"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="description" content="Пятьсот цветовых гамм главного экрана мини-аппа Астреи.">
<meta name="robots" content="noindex">
<title>Гаммы Астреи</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E&#x1F319;%3C/text%3E%3C/svg%3E">
<style>
__CSS__
</style>
</head>
<body>
__BODY__
<script>
__WHEEL__
</script>
<script>
var PAL = __DATA__;
</script>
<script>
__GALLERY__
</script>
</body>
</html>
"""

html = (TPL
        .replace("__CSS__", css)
        .replace("__BODY__", body)
        .replace("__WHEEL__", wheel)
        .replace("__DATA__", json.dumps(pals, ensure_ascii=False))
        .replace("__GALLERY__", gallery))

if not os.path.isdir(OUT_DIR):
    os.makedirs(OUT_DIR)
path = os.path.join(OUT_DIR, "index.html")
io.open(path, "w", encoding="utf-8").write(html)
print("sobrano:", path)
print("palitr:", len(pals), "| ves:", round(len(html.encode("utf-8")) / 1024.0, 1), "KB")
