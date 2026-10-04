import io
import math
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "tools/quizforge/src/hafizlik/kapak"
WOFF = ROOT / "node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-600-normal.woff"
W, H, K = 760, 731, 3
ZEMIN = (0, 0, 0)
RENK1 = (0x4D, 0xA6, 0xFF)
RENK3 = (0xB6, 0x8F, 0xFF)


def yazi_tipi(boyut):
    f = TTFont(WOFF)
    f.flavor = None
    b = io.BytesIO()
    f.save(b)
    b.seek(0)
    return ImageFont.truetype(b, boyut)


def kare(cx, cy, r, aci):
    return [
        (cx + r * math.cos(aci + i * math.pi / 2), cy + r * math.sin(aci + i * math.pi / 2))
        for i in range(4)
    ]


def yildiz(d, cx, cy, r, renk, kalinlik):
    for aci in (0, math.pi / 4):
        p = kare(cx, cy, r, aci)
        d.line(p + [p[0]], fill=renk, width=kalinlik, joint="curve")


def soluk(renk, oran):
    return tuple(round(c * oran) for c in renk)


def zemin():
    im = Image.new("RGB", (W * K, H * K), ZEMIN)
    d = ImageDraw.Draw(im)
    adim = 152 * K
    for j in range(-1, H * K // adim + 2):
        for i in range(-1, W * K // adim + 2):
            yildiz(d, i * adim + adim // 2, j * adim + adim // 2, adim * 0.5, soluk(RENK1, 0.28), K)
    return im, d


def kaydet(im, yol):
    yol.parent.mkdir(parents=True, exist_ok=True)
    im.resize((W, H), Image.LANCZOS).save(yol, "WEBP", quality=82, method=6)


def modul():
    im, d = zemin()
    cx, cy, r = W * K // 2, H * K * 0.42, 230 * K
    d.ellipse([cx - r * 1.12, cy - r * 1.12, cx + r * 1.12, cy + r * 1.12], fill=ZEMIN)
    yildiz(d, cx, cy, r, RENK3, 5 * K)
    yildiz(d, cx, cy, r * 0.74, RENK1, 3 * K)
    q = r * 0.34
    d.ellipse([cx - q, cy - q, cx + q, cy + q], outline=RENK3, width=4 * K)
    kaydet(im, OUT / "kapak.webp")


def bolum(n, f):
    im, d = zemin()
    cx, cy, r = W * K // 2, H * K * 0.62, 190 * K
    d.ellipse([cx - r * 1.12, cy - r * 1.12, cx + r * 1.12, cy + r * 1.12], fill=ZEMIN)
    yildiz(d, cx, cy, r, RENK3, 5 * K)
    d.text((cx, cy), str(n), font=f, fill=RENK1, anchor="mm")
    kaydet(im, OUT / "bolum" / f"{n}.webp")


def main():
    modul()
    f = yazi_tipi(170 * K)
    for n in range(1, 31):
        bolum(n, f)
    print(f"yazıldı: {OUT.relative_to(ROOT)} (31 görsel)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
