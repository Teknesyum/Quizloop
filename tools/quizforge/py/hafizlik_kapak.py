import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "tools/quizforge/src/hafizlik/kapak"
W, H = 760, 731
ZEMIN = (0, 0, 0)
RENK1 = (0x4D, 0xA6, 0xFF)
RENK3 = (0xB6, 0x8F, 0xFF)
KOYULUK = 0.55


def karis(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def gecis(ust, alt):
    serit = Image.new("RGB", (1, H))
    serit.putdata([karis(ust, alt, y / (H - 1)) for y in range(H)])
    return serit.resize((W, H))


def kaydet(im, yol):
    yol.parent.mkdir(parents=True, exist_ok=True)
    im.save(yol, "WEBP", quality=90, method=6)


def main():
    kaydet(gecis(RENK3, karis(RENK1, ZEMIN, KOYULUK)), OUT / "kapak.webp")
    for n in range(1, 21):
        renk = karis(RENK1, RENK3, (n - 1) / 19)
        kaydet(gecis(renk, karis(renk, ZEMIN, KOYULUK)), OUT / "bolum" / f"{n}.webp")
    print(f"written: {OUT.relative_to(ROOT)} (21)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
