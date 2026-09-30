import argparse
import json
import os
import random
import re
import unicodedata
from collections import Counter

import numpy as np
import pymupdf
from scipy import ndimage

SEKIL = re.compile(r'^\s*[ŞS]\s*E\s*K\s*[İI]\s*L\s*(\d+)\s*[-–—]\s*(\d+)([A-Z])?(?![0-9])')
TABLO = re.compile(r'^\s*TABLO\s*(\d+)\s*[-–—]\s*(\d+)')
BASLIK_UST = re.compile(r'(BÖLÜM|KISIM)\s*[\dIVX]', re.I)
SAYI = re.compile(r'^[\d\s.,:;%+\-–—/()=<>±×x°]+$')
OK = re.compile(r'[►◄→←»«▶◀↑↓]')
UNLU = set('aeıioöuüâîûAEIİOÖUÜ')

SUTUN = 189.2
ARALIK = 14.6
DPI_MASKE = 48
DPI_KIRP = 200
KATSAYI = DPI_MASKE / 72.0
PAY_BOLGE = 4.0
PAY_KUTU = 2.0


def duzelt(s):
    s = unicodedata.normalize('NFKC', s)
    s = s.replace('\xad', '')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def kutu_birlesim(a, b):
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]


def x_ortusme(a, b):
    return max(0.0, min(a[2], b[2]) - max(a[0], b[0]))


def y_ortusme(a, b):
    return max(0.0, min(a[3], b[3]) - max(a[1], b[1]))


def kutu_mesafe(a, b):
    dx = max(0.0, max(a[0], b[0]) - min(a[2], b[2]))
    dy = max(0.0, max(a[1], b[1]) - min(a[3], b[3]))
    return max(dx, dy)


def ocr_satirlari(words):
    gruplar = {}
    for w in words:
        gruplar.setdefault((w[5], w[6]), []).append(w)
    satirlar = []
    for ws in gruplar.values():
        ws.sort(key=lambda w: w[0])
        parca = [ws[0]]
        for w in ws[1:]:
            h = max(parca[-1][3] - parca[-1][1], 4)
            if w[0] - parca[-1][2] > max(7.0, 0.9 * h):
                satirlar.append(parca)
                parca = [w]
            else:
                parca.append(w)
        satirlar.append(parca)
    out = []
    for ws in satirlar:
        out.append({
            'bbox': [min(w[0] for w in ws), min(w[1] for w in ws), max(w[2] for w in ws), max(w[3] for w in ws)],
            'words': ws,
            'text': duzelt(' '.join(w[4] for w in ws)),
            'tur': None,
        })
    out.sort(key=lambda s: (s['bbox'][1], s['bbox'][0]))
    return out


def kumeler(vals, tol=4.0, en_az=4):
    vals = sorted(vals)
    out = []
    i = 0
    while i < len(vals):
        j = i
        while j + 1 < len(vals) and vals[j + 1] - vals[i] <= tol:
            j += 1
        if j - i + 1 >= en_az:
            out.append(float(np.median(vals[i:j + 1])))
            i = j + 1
        else:
            i += 1
    return out


def govde_isaretle(satirlar):
    genis = [s for s in satirlar if len(s['words']) >= 3 and s['bbox'][2] - s['bbox'][0] >= 80]
    sol = kumeler([s['bbox'][0] for s in genis])
    sag = kumeler([s['bbox'][2] for s in genis])
    orta = 218.0
    sol = sol + [r - SUTUN for r in sag] + [l + SUTUN + ARALIK if l < orta else l - SUTUN - ARALIK for l in sol]
    sag = sag + [l + SUTUN for l in sol]
    for s in satirlar:
        if s['tur']:
            continue
        x0, _, x1, _ = s['bbox']
        if len(s['words']) < 3 or x1 - x0 < 90:
            continue
        if any(abs(x1 - r) <= 5 for r in sag) and any(-3 <= x0 - l <= 22 for l in sol):
            s['tur'] = 'govde'
    degisti = True
    while degisti:
        degisti = False
        for s in satirlar:
            if s['tur']:
                continue
            for b in satirlar:
                if b['tur'] != 'govde':
                    continue
                gap = s['bbox'][1] - b['bbox'][3]
                if -3 <= gap <= 6 and abs(s['bbox'][0] - b['bbox'][0]) <= 22 and s['bbox'][2] <= b['bbox'][2] + 4 \
                        and any(-3 <= s['bbox'][0] - l <= 4 for l in sol) and len(s['words']) >= 1:
                    s['tur'] = 'govde'
                    degisti = True
                    break
    return sol, sag


def altyazi_paragrafi(satirlar, i, rect):
    bas = satirlar[i]
    grup = [bas]
    sag_sinir = rect.width - 10 if bas['bbox'][2] - bas['bbox'][0] > 250 or bas['bbox'][0] > rect.width / 2 \
        else max(bas['bbox'][2], rect.width / 2 + 4)
    son = bas
    adaylar = [s for s in satirlar[i + 1:] if bas['bbox'][0] - 8 <= s['bbox'][0] <= bas['bbox'][0] + 25
               and s['bbox'][2] <= sag_sinir + 8 and not SEKIL.match(s['text']) and not TABLO.match(s['text'])]
    for s in sorted(adaylar, key=lambda s: s['bbox'][1]):
        gap = s['bbox'][1] - son['bbox'][3]
        if gap > 5:
            break
        if gap < -4:
            continue
        grup.append(s)
        son = s
    return grup


def cop_mu(metin):
    t = metin.strip(' .,;:·-–—_|\'"`()[]{}*~')
    if not t:
        return 'cop'
    harf = sum(ch.isalpha() for ch in t)
    rakam = sum(ch.isdigit() for ch in t)
    if SAYI.match(t) or (harf <= 1 and rakam >= 1):
        return 'sayi'
    if harf <= 1:
        return 'tek_harf'
    if re.fullmatch(r'[IVXLivx]+', t):
        return 'sayi'
    if re.fullmatch(r'[IlH|1!\s]+', t):
        return 'cop'
    dolu = [ch for ch in t if not ch.isspace()]
    if harf / len(dolu) < 0.6:
        return 'cop'
    kelimeler = t.split()
    if re.search(r'[A-Za-zÇç]\d', t) and not re.search(r'[a-zçğıöşü]{4,}', t):
        return 'cop'
    if len(kelimeler) > 10 or len(t) > 70:
        return 'uzun'
    if all(len(re.sub(r'\W', '', k)) <= 2 for k in kelimeler) and not t.replace(' ', '').isupper():
        return 'cop'
    for k in kelimeler:
        kh = re.sub(r'[^\w]', '', k)
        if re.search(r'(.)\1\1', kh):
            return 'cop'
        if len(kh) >= 4 and not kh.isupper() and not any(ch in UNLU for ch in kh):
            return 'cop'
    if re.search(r'[a-zçğıöşü][A-ZÇĞİÖŞÜ][a-zçğıöşü]', t) and len(kelimeler) == 1 and len(t) < 5:
        return 'cop'
    return None


def etiket_birlestir(satirlar):
    etiketler = [{'bbox': list(s['bbox']), 'satirlar': [s], 'h': s['bbox'][3] - s['bbox'][1]} for s in satirlar]
    degisti = True
    while degisti:
        degisti = False
        for a in etiketler:
            for b in etiketler:
                if a is b:
                    continue
                alt = a['satirlar'][-1]['bbox']
                ust = b['satirlar'][0]['bbox']
                h = min(a['h'], b['h'])
                gap = ust[1] - alt[3]
                if not (-0.35 * h <= gap <= 0.3 * h):
                    continue
                dar = min(alt[2] - alt[0], ust[2] - ust[0])
                ov = x_ortusme(alt, ust)
                xc = abs((alt[0] + alt[2]) / 2 - (ust[0] + ust[2]) / 2)
                if not (ov >= 0.6 * dar and (abs(alt[0] - ust[0]) <= 10 or xc <= 10 or abs(alt[2] - ust[2]) <= 10)):
                    continue
                ilk = b['satirlar'][0]['text']
                onceki = a['satirlar'][-1]['text']
                devam = ilk[:1].islower() or ilk[:1] in '([/-&' or onceki[-1:] in ',-/(&'                     or re.search(r'(ve|veya|ile|ya da|of|and)$', onceki)                     or (onceki.replace(' ', '').isupper() and ilk.replace(' ', '').isupper())
                if not devam:
                    continue
                if len(a['satirlar']) + len(b['satirlar']) > 4:
                    continue
                if sum(len(s['words']) for s in a['satirlar'] + b['satirlar']) > 14:
                    continue
                a['satirlar'] += b['satirlar']
                a['bbox'] = kutu_birlesim(a['bbox'], b['bbox'])
                etiketler.remove(b)
                degisti = True
                break
            if degisti:
                break
    for e in etiketler:
        metin = ' '.join(s['text'] for s in e['satirlar'])
        metin = re.sub(r'(\w)- (\w)', r'\1\2', metin)
        metin = re.sub(r"^[a-zı][*'’`]\s*(?=[A-ZÇĞİÖŞÜ])", '', metin.strip())
        e['metin'] = duzelt(re.sub(r'[-_–—.]{2,}$', '', metin.strip()))
    return etiketler


def murekkep(page, rect):
    pix = page.get_pixmap(dpi=DPI_MASKE, colorspace=pymupdf.csRGB)
    a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3].astype(np.int16)
    gri = a.mean(axis=2)
    doy = a.max(axis=2) - a.min(axis=2)
    return (gri < 232) | ((doy > 15) & (gri < 248))


def px(k, shape):
    x0 = int(max(0, np.floor(k[0] * KATSAYI)))
    y0 = int(max(0, np.floor(k[1] * KATSAYI)))
    x1 = int(min(shape[1], np.ceil(k[2] * KATSAYI)))
    y1 = int(min(shape[0], np.ceil(k[3] * KATSAYI)))
    return x0, y0, x1, y1


def bilesenler(maske):
    genis = ndimage.binary_dilation(maske, structure=np.ones((5, 5), bool))
    etiket, n = ndimage.label(genis)
    out = []
    for i, sl in enumerate(ndimage.find_objects(etiket), 1):
        if sl is None:
            continue
        parca = (etiket[sl] == i) & maske[sl]
        ys, xs = np.nonzero(parca)
        if len(ys) < 25:
            continue
        k = [(sl[1].start + xs.min()) / KATSAYI, (sl[0].start + ys.min()) / KATSAYI,
             (sl[1].start + xs.max() + 1) / KATSAYI, (sl[0].start + ys.max() + 1) / KATSAYI]
        if k[2] - k[0] < 18 and k[3] - k[1] < 18:
            continue
        out.append({'bbox': k, 'n': int(len(ys)), 'sahip': None})
    return out


def sayfa_isle(doc, pno, sayac, iz=None):
    page = doc[pno]
    rect = page.rect
    words = page.get_text('words')
    satirlar = ocr_satirlari(words)
    altyazilar = []
    for i, s in enumerate(satirlar):
        m = SEKIL.match(s['text'])
        t = TABLO.match(s['text'])
        if not m and not t:
            continue
        if s['bbox'][0] > rect.width / 2 + 40 and s['bbox'][2] - s['bbox'][0] < 60:
            continue
        grup = altyazi_paragrafi(satirlar, i, rect)
        for g in grup:
            g['tur'] = 'altyazi'
        kutu = grup[0]['bbox']
        for g in grup[1:]:
            kutu = kutu_birlesim(kutu, g['bbox'])
        altyazilar.append({
            'tur': 'S' if m else 'T',
            'no': (m.group(1) + '-' + m.group(2) + (m.group(3) or '')) if m else (t.group(1) + '-' + t.group(2)),
            'kutu': kutu,
            'metin': duzelt(re.sub(r'-\s*$', '', ' '.join(g['text'] for g in grup))),
        })
    if not any(a['tur'] == 'S' for a in altyazilar):
        return [], []
    for s in satirlar:
        if not s['tur'] and s['bbox'][3] < 52 and (BASLIK_UST.search(s['text']) or re.fullmatch(r'\d{1,4}', s['text'])):
            s['tur'] = 'ust'
    ustler = [s['bbox'] for s in satirlar if s['tur'] == 'ust']
    for s in satirlar:
        if not s['tur'] and s['bbox'][3] < 55 and any(y_ortusme(s['bbox'], u) > 0.5 * (s['bbox'][3] - s['bbox'][1]) for u in ustler):
            s['tur'] = 'ust'
    govde_isaretle(satirlar)

    maske = murekkep(page, rect)
    ham = maske.copy()
    kenar = int(8 * KATSAYI)
    maske[:, :kenar] = False
    maske[:, -kenar:] = False
    maske[:kenar, :] = False
    maske[-kenar:, :] = False
    gorseller = []
    for info in page.get_image_info():
        b = info['bbox']
        if (b[2] - b[0]) > rect.width * 0.9 and (b[3] - b[1]) > rect.height * 0.9:
            continue
        if (b[2] - b[0]) < 40 or (b[3] - b[1]) < 40:
            continue
        gorseller.append(list(b))
        x0, y0, x1, y1 = px(b, maske.shape)
        maske[y0:y1, x0:x1] = True
    for s in satirlar:
        if not s['tur']:
            for w in s['words']:
                x0, y0, x1, y1 = px(w[:4], maske.shape)
                maske[y0:y1, x0:x1] = True
    for s in satirlar:
        if s['tur']:
            b = s['bbox']
            x0, y0, x1, y1 = px([b[0] - 1.5, b[1] - 2, b[2] + 1.5, b[3] + 2], maske.shape)
            maske[y0:y1, x0:x1] = False
    for a in altyazilar:
        b = a['kutu']
        x0, y0, x1, y1 = px([b[0] - 2, b[1] - 2, b[2] + 2, b[3] + 2], maske.shape)
        maske[y0:y1, x0:x1] = False

    comps = bilesenler(maske)
    for a in altyazilar:
        if a['tur'] != 'T':
            continue
        for c in comps:
            if c['sahip'] is None and x_ortusme(c['bbox'], a['kutu']) > 0 and a['kutu'][3] - 6 <= c['bbox'][1] <= a['kutu'][3] + 30:
                c['sahip'] = 'T'

    govdeler = [s['bbox'] for s in satirlar if s['tur'] in ('govde', 'altyazi', 'ust')]
    orta = rect.width / 2

    def secim(a):
        P = a['kutu']
        en_iyi = None
        for c in comps:
            if c['sahip'] == 'T':
                continue
            B = c['bbox']
            dar = min(B[2] - B[0], P[2] - P[0])
            skor = None
            yon = None
            if x_ortusme(B, P) >= min(0.3 * dar, 30) and B[3] <= P[1] + 6:
                g = P[1] - B[3]
                if g <= 45:
                    skor, yon = max(g, 0), 'ust'
            if skor is None and (y_ortusme(B, P) > 0 or (B[1] < P[3] and B[3] > P[1] - 30)):
                hg = P[0] - B[2] if B[2] <= P[0] + 6 else (B[0] - P[2] if B[0] >= P[2] - 6 else None)
                if hg is not None and hg <= 40:
                    skor, yon = max(hg, 0) + 10, 'yan'
            if skor is None and x_ortusme(B, P) >= min(0.3 * dar, 30) and B[1] >= P[3] - 6:
                g = B[1] - P[3]
                if g <= 30:
                    skor, yon = max(g, 0) + 25, 'alt'
            if skor is not None and (en_iyi is None or skor < en_iyi[0]):
                en_iyi = (skor, c, yon)
        return en_iyi

    if iz is not None:
        iz.update(satirlar=satirlar, comps=comps, altyazilar=altyazilar, maske=maske)
    secimler = []
    for a in altyazilar:
        if a['tur'] != 'S':
            continue
        sec = secim(a)
        secimler.append((a, sec))
    birincil = Counter(id(sec[1]) for _, sec in secimler if sec)

    sonuc = []
    ret = []
    for a, sec in secimler:
        if not sec:
            ret.append({'pdfSayfa': pno + 1, 'sekil': a['no'], 'sebep': 'bolge_yok'})
            continue
        _, c, yon = sec
        U = list(c['bbox'])
        P = a['kutu']
        paylasim = birincil[id(c)] > 1
        if paylasim:
            if P[2] - P[0] > 250:
                pass
            elif (P[0] + P[2]) / 2 < orta:
                U[2] = min(U[2], orta)
            else:
                U[0] = max(U[0], orta)
        diger = {id(s[1]) for b2, s in secimler if s and b2 is not a}
        degisti = True
        while degisti:
            degisti = False
            for d in comps:
                if d is c or d['sahip'] == 'T' or id(d) in diger or d.get('_alindi') is a:
                    continue
                if kutu_mesafe(U, d['bbox']) > 36:
                    continue
                if yon == 'ust' and d['bbox'][3] > P[1] + 6:
                    continue
                aday = kutu_birlesim(U, d['bbox'])
                if y_ortusme(aday, P) > 0 and x_ortusme(aday, P) > 0:
                    continue
                if any(x_ortusme(aday, g) > 0.5 * (g[2] - g[0]) and y_ortusme(aday, g) > 0.5 * (g[3] - g[1]) for g in govdeler):
                    continue
                U = aday
                d['_alindi'] = a
                degisti = True
        for g in gorseller:
            if x_ortusme(g, U) > 0.5 * (g[2] - g[0]) and y_ortusme(g, U) > 0.5 * (g[3] - g[1]):
                U = kutu_birlesim(U, g)
        R = pymupdf.Rect(U[0] - PAY_BOLGE, U[1] - PAY_BOLGE, U[2] + PAY_BOLGE, U[3] + PAY_BOLGE) & rect
        bitisik = 0
        for g in satirlar:
            if g['tur'] != 'govde':
                continue
            b = g['bbox']
            if y_ortusme(b, U) < 0.5 * (b[3] - b[1]):
                continue
            if 0 <= b[0] - U[2] <= 20:
                serit = [U[2], b[1], b[0], b[3]]
            elif 0 <= U[0] - b[2] <= 20:
                serit = [b[2], b[1], U[0], b[3]]
            else:
                continue
            x0, y0, x1, y1 = px(serit, ham.shape)
            if x1 > x0 and y1 > y0 and ham[y0:y1, x0:x1].mean() > 0.5:
                bitisik += 1
        if bitisik >= 2:
            ret.append({'pdfSayfa': pno + 1, 'sekil': a['no'], 'sebep': 'govde_bitisik'})
            continue
        if R.width < 40 or R.height < 30:
            ret.append({'pdfSayfa': pno + 1, 'sekil': a['no'], 'sebep': 'bolge_kucuk'})
            continue
        ksat = []
        for s in satirlar:
            if s['tur']:
                continue
            ws0 = [w for w in s['words'] if R.x0 <= (w[0] + w[2]) / 2 <= R.x1 and R.y0 <= (w[1] + w[3]) / 2 <= R.y1]
            parcalar = [[]]
            ws0 = [w for w in ws0 if not re.fullmatch(r'[IilLHn1|!]{4,}', w[4])]
            for w in ws0:
                if OK.search(w[4]) or re.fullmatch(r'[-–—*~=_.]{2,}', w[4]):
                    parcalar.append([])
                else:
                    parcalar[-1].append(w)
            for ws in parcalar:
                while ws and (not re.search(r'[^\W_]', ws[0][4]) or (len(ws) > 1 and len(ws[0][4]) == 1)):
                    ws = ws[1:]
                while ws and (not re.search(r'[^\W_]', ws[-1][4]) or (len(ws) > 1 and len(ws[-1][4]) == 1 and not ws[-1][4].isdigit())):
                    ws = ws[:-1]
                if not ws:
                    continue
                ksat.append({'bbox': [min(w[0] for w in ws), min(w[1] for w in ws), max(w[2] for w in ws), max(w[3] for w in ws)],
                             'words': ws, 'text': duzelt(' '.join(w[4] for w in ws))})
        temiz = []
        for s in ksat:
            neden = cop_mu(s['text'])
            if neden in ('sayi', 'tek_harf', 'cop'):
                sayac[neden] += 1
                continue
            temiz.append(s)
        etiketler = []
        for e in etiket_birlestir(temiz):
            neden = cop_mu(e['metin'])
            if neden:
                sayac[neden] += 1
                continue
            b = e['bbox']
            x = (b[0] - PAY_KUTU - R.x0) / R.width
            y = (b[1] - PAY_KUTU - R.y0) / R.height
            x2 = (b[2] + PAY_KUTU - R.x0) / R.width
            y2 = (b[3] + PAY_KUTU - R.y0) / R.height
            x, y, x2, y2 = max(0.0, x), max(0.0, y), min(1.0, x2), min(1.0, y2)
            etiketler.append({'metin': e['metin'], 'kutu': [round(x, 4), round(y, 4), round(x2 - x, 4), round(y2 - y, 4)]})
            sayac['gecerli'] += 1
        gorsel_alan = sum(x_ortusme(g, U) * y_ortusme(g, U) for g in gorseller)
        kayit = {
            'pdfSayfa': pno + 1,
            'sekil': a['no'],
            'altyazi': a['metin'],
            'bolge': [round(R.x0, 1), round(R.y0, 1), round(R.x1, 1), round(R.y1, 1)],
            'yon': yon,
            'gorselAgirlikli': bool(gorsel_alan > 0.5 * (U[2] - U[0]) * (U[3] - U[1])),
            'etiketler': etiketler,
        }
        if len(etiketler) > 30:
            ret.append({'pdfSayfa': pno + 1, 'sekil': a['no'], 'sebep': 'cok_etiket', 'etiketSayisi': len(etiketler), 'yon': yon})
            continue
        if sum(e['metin'].rstrip().endswith('?') for e in etiketler) >= 3:
            ret.append({'pdfSayfa': pno + 1, 'sekil': a['no'], 'sebep': 'form', 'etiketSayisi': len(etiketler), 'yon': yon})
            continue
        if len(etiketler) < 3:
            if etiketler:
                sebep = 'az_etiket'
            elif not ksat and any(x_ortusme(g, U) * y_ortusme(g, U) > 0.5 * (U[2] - U[0]) * (U[3] - U[1]) for g in gorseller):
                sebep = 'gorsel_ocr_yok'
            else:
                sebep = 'etiket_yok'
            ret.append({'pdfSayfa': pno + 1, 'sekil': a['no'], 'sebep': sebep,
                        'etiketSayisi': len(etiketler), 'yon': yon})
            continue
        sonuc.append(kayit)
    return sonuc, ret


def onizleme(a):
    from PIL import Image, ImageDraw
    with open(os.path.join(a.out, 'index.json'), encoding='utf-8') as fh:
        index = json.load(fh)
    hedef = os.path.join(a.out, 'onizleme')
    os.makedirs(hedef, exist_ok=True)
    if a.sayfalar:
        istek = {int(v) for v in a.sayfalar.split(',')}
        secilen = [k for k in index if k['pdfSayfa'] in istek]
    else:
        random.seed(a.tohum)
        secilen = random.sample(index, min(a.onizleme, len(index)))
    doc = pymupdf.open(a.pdf)
    for k in secilen:
        im = Image.open(os.path.join(a.out, '..', 'figures', k['dosya'])).convert('RGB')
        W, H = im.size
        dr = ImageDraw.Draw(im)
        for e in k['etiketler']:
            x, y, w, h = e['kutu']
            dr.rectangle([x * W, y * H, (x + w) * W, (y + h) * H], outline=(255, 0, 0), width=3)
        im.save(os.path.join(hedef, k['dosya']))
        page = doc[k['pdfSayfa'] - 1]
        pix = page.get_pixmap(dpi=60)
        pim = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        pd = ImageDraw.Draw(pim)
        f = 60 / 72.0
        b = k['bolge']
        pd.rectangle([b[0] * f, b[1] * f, b[2] * f, b[3] * f], outline=(0, 0, 255), width=2)
        pim.save(os.path.join(hedef, 'sayfa-' + k['dosya']))
        print(k['dosya'], k['sekil'], k['yon'], len(k['etiketler']), ' | '.join(e['metin'] for e in k['etiketler']))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', required=True)
    ap.add_argument('--corpus', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--first', type=int, required=True)
    ap.add_argument('--last', type=int, required=True)
    ap.add_argument('--onizleme', type=int, default=0)
    ap.add_argument('--tohum', type=int, default=7)
    ap.add_argument('--sayfalar', default='')
    a = ap.parse_args()

    if a.onizleme or a.sayfalar:
        onizleme(a)
        return

    sayfalar = set()
    with open(a.corpus, encoding='utf-8') as fh:
        for line in fh:
            if line.strip():
                sayfalar.add(json.loads(line)['pdfPage'])

    sekil_dir = os.path.join(a.out, '..', 'figures')
    os.makedirs(a.out, exist_ok=True)
    os.makedirs(sekil_dir, exist_ok=True)
    doc = pymupdf.open(a.pdf)
    sayac = Counter()
    index = []
    reddedilen = []
    for pno in range(a.first - 1, a.last):
        if sayfalar and pno + 1 not in sayfalar:
            continue
        sonuc, ret = sayfa_isle(doc, pno, sayac)
        reddedilen += ret
        page = doc[pno]
        for n, k in enumerate(sonuc, 1):
            ad = 'e%04d-%d.png' % (pno + 1, n)
            R = pymupdf.Rect(k['bolge'])
            page.get_pixmap(dpi=DPI_KIRP, clip=R).save(os.path.join(sekil_dir, ad))
            k['dosya'] = ad
            index.append({'dosya': ad, 'pdfSayfa': k['pdfSayfa'], 'sekil': k['sekil'], 'altyazi': k['altyazi'],
                          'etiketler': k['etiketler'], 'bolge': k['bolge'], 'yon': k['yon'],
                          'gorselAgirlikli': k['gorselAgirlikli']})
    with open(os.path.join(a.out, 'index.json'), 'w', encoding='utf-8') as fh:
        json.dump(index, fh, ensure_ascii=False, indent=1)
    with open(os.path.join(a.out, 'reddedilen.json'), 'w', encoding='utf-8') as fh:
        json.dump(reddedilen, fh, ensure_ascii=False, indent=1)
    ozet = {
        'sekil': len(index),
        'etiket': sum(len(k['etiketler']) for k in index),
        'reddedilenSekil': dict(Counter(r['sebep'] for r in reddedilen)),
        'atilanEtiket': {k: v for k, v in sayac.items() if k != 'gecerli'},
    }
    with open(os.path.join(a.out, 'ozet.json'), 'w', encoding='utf-8') as fh:
        json.dump(ozet, fh, ensure_ascii=False, indent=1)
    print(json.dumps(ozet, ensure_ascii=False))


if __name__ == '__main__':
    main()
