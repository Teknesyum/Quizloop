import argparse
import hashlib
import io
import json
import re
import unicodedata
from pathlib import Path

import pymupdf

TIRNAK = {
    "‘": "'", "’": "'", "‚": "'", "‛": "'",
    "“": '"', "”": '"', "„": '"', "‟": '"',
    "′": "'", "″": '"', "«": '"', "»": '"',
    "–": "-", "—": "-", "−": "-", "‐": "-",
    " ": " ", " ": " ", " ": " ", "​": "",
    "­": "",
}

HARF = re.compile(r"[^0-9a-zçğıöşü]+")

MIN_ORAN = 0.7
PAY = 7.0
ZOOM = 2.6


def duzelt(s):
    s = unicodedata.normalize("NFKC", s)
    s = "".join(TIRNAK.get(ch, ch) for ch in s)
    s = re.sub(r"-\s*\n\s*", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def anahtar(w):
    w = duzelt(w).casefold()
    w = w.replace("İ", "i").replace("I", "ı")
    return HARF.sub("", w)


def parcala(s):
    return [t for t in (anahtar(w) for w in duzelt(s).split(" ")) if t]


def hizala(ptoks, qtoks, bas):
    i = bas
    j = 0
    kacik = 0
    tutan = 0
    son = bas
    izin = max(3, len(qtoks) // 5)
    while j < len(qtoks) and i < len(ptoks):
        if ptoks[i] == qtoks[j]:
            tutan += 1
            son = i
            i += 1
            j += 1
            continue
        birlesti = False
        for k in (2, 3):
            if i + k <= len(ptoks) and "".join(ptoks[i:i + k]) == qtoks[j]:
                tutan += 1
                son = i + k - 1
                i += k
                j += 1
                birlesti = True
                break
        if birlesti:
            continue
        if j + 1 < len(qtoks) and ptoks[i] == qtoks[j] + qtoks[j + 1]:
            tutan += 2
            son = i
            i += 1
            j += 2
            continue
        kacik += 1
        if kacik > izin:
            return None
        i += 1
        j += 1
    oran = tutan / len(qtoks)
    return bas, son, oran


def sayfa_kelimeleri(page):
    ws = page.get_text("words")
    ptoks = []
    kutular = []
    for w in ws:
        t = anahtar(w[4])
        if not t:
            continue
        ptoks.append(t)
        kutular.append(pymupdf.Rect(w[0], w[1], w[2], w[3]))
    return ptoks, kutular


def jeton_ara(page, qtoks):
    ptoks, kutular = sayfa_kelimeleri(page)
    if not ptoks or not qtoks:
        return None
    en_iyi = None
    for bas, t in enumerate(ptoks):
        if t != qtoks[0]:
            continue
        r = hizala(ptoks, qtoks, bas)
        if r is None:
            continue
        if en_iyi is None or r[2] > en_iyi[2]:
            en_iyi = r
    if en_iyi is None or en_iyi[2] < MIN_ORAN:
        return None
    bas, son, oran = en_iyi
    if son - bas > 3 * len(qtoks) + 10:
        return None, "cok dagilmis"
    kutu = pymupdf.Rect(kutular[bas])
    for k in kutular[bas:son + 1]:
        kutu |= k
    return kutu, oran


def dogrudan_ara(page, metin):
    for deneme in (metin, duzelt(metin)):
        if not deneme:
            continue
        try:
            rects = page.search_for(deneme, quads=False)
        except Exception:
            rects = []
        if rects:
            kutu = pymupdf.Rect(rects[0])
            for r in rects:
                kutu |= r
            return kutu
    return None


def sayfa_adaylari(kitap_sayfa, ofset, sayfa_sayisi):
    taban = kitap_sayfa + ofset
    sira = [taban]
    for d in (1, -1, 2, -2):
        sira.append(taban + d)
    return [p for p in sira if 1 <= p <= sayfa_sayisi]


def coz(doc, q, ofset):
    src = q["source"]
    quote = src.get("quote", "")
    kitap = src["pages"][0]
    adaylar = sayfa_adaylari(kitap, ofset, doc.page_count)
    if not adaylar:
        return None, adaylar, "sayfa yok"
    qtoks = parcala(quote)
    if len(qtoks) < 3:
        return None, adaylar, "alinti cok kisa"
    parca = qtoks[:12] if len(qtoks) > 14 else qtoks
    sebep = "bulunamadi"
    for pno in adaylar:
        page = doc[pno - 1]
        kutu = dogrudan_ara(page, quote)
        if kutu is not None and not kutu.is_empty:
            return (pno, kutu), adaylar, None
        r = jeton_ara(page, qtoks)
        if isinstance(r, tuple) and len(r) == 2 and r[0] is None:
            sebep = r[1]
            r = None
        if r is not None:
            return (pno, r[0]), adaylar, None
        r = jeton_ara(page, parca)
        if isinstance(r, tuple) and len(r) == 2 and r[0] is None:
            sebep = r[1]
            r = None
        if r is not None:
            return (pno, r[0]), adaylar, None
    return None, adaylar, sebep


def kes(doc, pno, kutu, hedef):
    page = doc[pno - 1]
    alan = pymupdf.Rect(kutu)
    alan.x0 -= PAY
    alan.y0 -= PAY
    alan.x1 += PAY
    alan.y1 += PAY
    alan &= page.rect
    pix = page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=alan)
    hedef.parent.mkdir(parents=True, exist_ok=True)
    pix.pil_save(str(hedef), format="WEBP", quality=82, method=6)
    return alan


def yaz_blok(path, data):
    text = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
    io.open(path, "w", encoding="utf-8", newline="").write(text)


def resync(module_dir):
    meta_path = Path(module_dir) / "module.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    for ref in meta["blocks"]:
        raw = (Path(module_dir) / ref["file"]).read_bytes()
        ref["sha256"] = hashlib.sha256(raw).hexdigest()
    yaz_blok(meta_path, meta)
    return len(meta["blocks"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--modul", required=True)
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--ofset", type=int, required=True)
    ap.add_argument("--rapor", required=True)
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()

    module_dir = Path(a.modul)
    doc = pymupdf.open(a.pdf)
    kaynak_dir = module_dir / "assets" / "kaynak"

    kesildi = 0
    cozulemedi = 0
    bakilan = 0
    rapor = []
    degisen = 0

    for bp in sorted((module_dir / "blocks").glob("*.json")):
        data = json.loads(bp.read_text(encoding="utf-8"))
        questions = data["questions"] if isinstance(data, dict) else data
        dokundu = False
        for q in questions:
            if a.limit and bakilan >= a.limit:
                break
            bakilan += 1
            src = q["source"]
            sonuc, adaylar, sebep = coz(doc, q, a.ofset)
            if sonuc is None:
                cozulemedi += 1
                src.pop("kesit", None)
                dokundu = True
                rapor.append({
                    "id": q["id"],
                    "kitapSayfa": src["pages"][0],
                    "denenenPdfSayfalari": adaylar,
                    "alinti": src.get("quote", ""),
                    "sebep": sebep,
                })
                continue
            pno, kutu = sonuc
            ref = "assets/kaynak/%s.webp" % q["id"]
            alan = kes(doc, pno, kutu, module_dir / "assets" / "kaynak" / ("%s.webp" % q["id"]))
            src["kesit"] = {
                "pdfSayfa": pno,
                "bbox": [round(alan.x0, 2), round(alan.y0, 2), round(alan.x1, 2), round(alan.y1, 2)],
                "ref": ref,
            }
            kesildi += 1
            dokundu = True
        if dokundu:
            yaz_blok(bp, data)
            degisen += 1
        if a.limit and bakilan >= a.limit:
            break

    bloklar = resync(module_dir)

    rapor_path = Path(a.rapor)
    rapor_path.parent.mkdir(parents=True, exist_ok=True)
    ozet = {
        "modul": module_dir.name,
        "pdf": str(a.pdf),
        "ofset": a.ofset,
        "bakilanSoru": bakilan,
        "kesitOlustu": kesildi,
        "cozulemedi": cozulemedi,
        "sebepDagilimi": {},
        "satirlar": rapor,
    }
    for r in rapor:
        ozet["sebepDagilimi"][r["sebep"]] = ozet["sebepDagilimi"].get(r["sebep"], 0) + 1
    yaz_blok(rapor_path, ozet)

    print("bakilan %d soru, %d kesit, %d cozulemedi" % (bakilan, kesildi, cozulemedi))
    print("sebepler: %s" % json.dumps(ozet["sebepDagilimi"], ensure_ascii=False))
    print("%d blok dosyasi yazildi, %d blok ozeti yenilendi" % (degisen, bloklar))
    print("kesitler: %s" % kaynak_dir)
    print("rapor: %s" % rapor_path)


if __name__ == "__main__":
    main()
