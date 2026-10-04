import json
import statistics
import sys

import pymupdf

BEKLENEN = 605
AYET = 6236
SURE = 114
AC = "﴾"
KAPA = "﴿"
UST = 50
DAR = 0.8
YAKIN = 12


def rakam(metin: str) -> int:
    return int("".join(str(ord(c) - 0x660) for c in metin))


def satirlar(sayfa):
    harfler = []
    for blok in sayfa.get_text("rawdict")["blocks"]:
        for satir in blok.get("lines", []):
            if satir["bbox"][1] < UST:
                continue
            harfler += [h for parca in satir["spans"] for h in parca["chars"]]
    harfler.sort(key=lambda h: h["origin"][1])
    gruplar = []
    for h in harfler:
        if gruplar and h["origin"][1] - gruplar[-1][-1]["origin"][1] < YAKIN:
            gruplar[-1].append(h)
        else:
            gruplar.append([h])
    cikti = []
    for grup in gruplar:
        grup.sort(key=lambda h: h["bbox"][0])
        isaretler = []
        i = 0
        while i < len(grup):
            if grup[i]["c"] != AC:
                i += 1
                continue
            j = i + 1
            while j < len(grup) and grup[j]["c"] != KAPA:
                j += 1
            if j == len(grup):
                break
            sayi = "".join(h["c"] for h in grup[i + 1 : j])
            isaretler.append({"x0": grup[i]["bbox"][0], "x1": grup[j]["bbox"][2], "ham": sayi})
            i = j + 1
        cikti.append(
            {
                "x0": min(h["bbox"][0] for h in grup),
                "x1": max(h["bbox"][2] for h in grup),
                "taban": statistics.median(h["origin"][1] for h in grup),
                "isaretler": sorted(isaretler, key=lambda m: -m["x0"]),
            }
        )
    return cikti


def main() -> int:
    belge = pymupdf.open(sys.argv[1])
    if belge.page_count != BEKLENEN:
        print(f"sayfa sayisi {belge.page_count}, {BEKLENEN} olmali", file=sys.stderr)
        return 1
    en = belge[0].rect.width
    boy = belge[0].rect.height
    ayetler = {}
    sure = 1
    onceki = 0
    acik = []
    for no in range(BEKLENEN):
        govde = satirlar(belge[no])
        if not govde:
            continue
        genis = max(s["x1"] - s["x0"] for s in govde)
        tabanlar = [s["taban"] for s in govde]
        farklar = [b - a for a, b in zip(tabanlar, tabanlar[1:]) if b - a > 1]
        aralik = statistics.median(farklar) if farklar else 36.0
        basili = 1 if no < 2 else no
        for s in govde:
            if not s["isaretler"] and s["x1"] - s["x0"] < genis * DAR:
                continue
            sag = s["x1"]
            for m in s["isaretler"]:
                ham = m["ham"]
                sayi = rakam(ham)
                if sayi != onceki + 1 and sayi != 1 and rakam(ham[::-1]) == onceki + 1:
                    sayi = rakam(ham[::-1])
                if sayi == 1 and onceki != 0:
                    sure += 1
                elif sayi != onceki + 1:
                    print(f"sayfa {no}: {onceki} sonrasi {sayi}", file=sys.stderr)
                    return 1
                onceki = sayi
                acik.append([no, basili, m["x0"], sag, s["taban"], aralik])
                ayetler[f"{sure}:{sayi}"] = acik
                acik = []
                sag = m["x0"]
            if sag - s["x0"] > 1:
                acik.append([no, basili, s["x0"], sag, s["taban"], aralik])
    if sure != SURE or len(ayetler) != AYET:
        print(f"{sure} sure, {len(ayetler)} ayet bulundu", file=sys.stderr)
        return 1
    cikti = {}
    for anahtar, parcalar in ayetler.items():
        liste = []
        for no, basili, x0, x1, taban, aralik in parcalar:
            ust = taban - aralik * 0.62
            alt = taban + aralik * 0.38
            if no < 2:
                kay = en / 2 if no == 0 else 0
                x0, x1 = x0 / 2 + kay, x1 / 2 + kay
                ust, alt = ust / 2 + boy / 4, alt / 2 + boy / 4
            liste.append([basili, round(x0, 1), round(ust, 1), round(x1, 1), round(alt, 1)])
        cikti[anahtar] = liste
    json.dump(cikti, sys.stdout, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
