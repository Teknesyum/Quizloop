import difflib
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
PAY = 1
BOSLUK = 2
SON_HARF = 8
TASMA = 2.5
CERCEVE = 20


ES = str.maketrans("آأإٱیىةک", "ااااييهك")


def harf_mi(c: str) -> bool:
    return "ء" <= c <= "غ" or "ف" <= c <= "ي" or "ٱ" <= c <= "ۓ"


def kelime_kutulari(parcalar, metin):
    pdf = [(h, n) for n, p in enumerate(parcalar) for h in p[6]]
    kelimeler = metin.split()
    harfler = [(c, k) for k, w in enumerate(kelimeler) for c in w if harf_mi(c)]
    a = "".join(h[0] for h, _ in pdf).translate(ES)
    b = "".join(c for c, _ in harfler).translate(ES)
    es = [None] * len(b)
    for blok in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for i in range(blok.size):
            es[blok.b + i] = blok.a + i
    kutu = [None] * len(kelimeler)
    for t, i in enumerate(es):
        if i is None:
            continue
        (_, x0, x1), n = pdf[i]
        k = harfler[t][1]
        if kutu[k] is None:
            kutu[k] = [n, x0, x1]
        elif kutu[k][0] == n:
            kutu[k][1] = min(kutu[k][1], x0)
            kutu[k][2] = max(kutu[k][2], x1)
    eslesen = sum(1 for i in es if i is not None)
    return kutu, eslesen, len(b)


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
                "harfler": [(h["c"], h["bbox"][0], h["bbox"][2]) for h in reversed(grup) if harf_mi(h["c"])],
            }
        )
    return cikti


def arasi(satir, sol, sag):
    return [h for h in satir["harfler"] if sol <= (h[1] + h[2]) / 2 < sag]


def main() -> int:
    belge = pymupdf.open(sys.argv[1])
    with open(sys.argv[2], encoding="utf8") as f:
        metinler = {
            f"{s['number']}:{a['ayah']}": a["text_unicode"].strip()
            for s in json.load(f)["surahs"]
            for a in s["ayahs"]
        }
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
        govde = [s for s in govde if s["isaretler"] or s["x1"] - s["x0"] >= genis * DAR]
        csol = min(s["x0"] for s in govde)
        csag = max(s["x1"] for s in govde)
        for s in govde:
            sag = s["x1"]
            sag_uc = (csag if csag - sag < CERCEVE else sag) + TASMA
            sol_uc = (csol if s["x0"] - csol < CERCEVE else s["x0"]) - TASMA
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
                acik.append([no, basili, m["x0"], sag, s["taban"], aralik, arasi(s, m["x1"], sag), m["x0"], sag_uc])
                ayetler[f"{sure}:{sayi}"] = acik
                acik = []
                sag = m["x0"]
                sag_uc = sag
            if sag - s["x0"] > 1:
                acik.append([no, basili, s["x0"], sag, s["taban"], aralik, arasi(s, s["x0"], sag), sol_uc, sag_uc])
    if sure != SURE or len(ayetler) != AYET:
        print(f"{sure} sure, {len(ayetler)} ayet bulundu", file=sys.stderr)
        return 1
    cikti = {}
    eslesen = 0
    toplam = 0
    bos = 0
    sirasiz = 0
    for anahtar, parcalar in ayetler.items():
        kutu, e, t = kelime_kutulari(parcalar, metinler[anahtar])
        eslesen += e
        toplam += t
        bos += sum(1 for k in kutu if k is None)
        liste = []
        onceki = None
        yan = None
        for sira, k in enumerate(kutu):
            if k is not None and onceki is not None:
                if k[0] < onceki[0] or (k[0] == onceki[0] and k[2] > onceki[2] + 1):
                    k = None
                    sirasiz += 1
            if k is not None:
                onceki = k
            komsu = yan
            yan = k
            if k is None:
                liste.append(None)
                continue
            n, sol, uc = k
            no, basili, _x0, _x1, taban, aralik, _harfler, sol_uc, sag_uc = parcalar[n]
            if sira == 0 or (komsu is not None and komsu[0] != n):
                sag = sag_uc
            elif komsu is not None:
                sag = komsu[1] - BOSLUK
            else:
                sag = uc + SON_HARF
            sag = max(sag, uc + PAY)
            sol -= PAY
            sonraki = kutu[sira + 1] if sira + 1 < len(kutu) else None
            if sira == len(kutu) - 1 or (sonraki is not None and sonraki[0] != n):
                sol = min(sol, sol_uc)
            ust = taban - aralik * 0.62
            alt = taban + aralik * 0.38
            kay = 0
            oran = 1
            if no < 2:
                kay = en / 2 if no == 0 else 0
                oran = 0.5
                ust, alt = ust / 2 + boy / 4, alt / 2 + boy / 4
            liste.append(
                [basili, round(sol * oran + kay, 1), round(ust, 1), round(sag * oran + kay, 1), round(alt, 1)]
            )
        cikti[anahtar] = liste
    print(f"harf {eslesen}/{toplam}, yeri bulunamayan kelime {bos}, sıra dışı {sirasiz}", file=sys.stderr)
    json.dump(cikti, sys.stdout, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
