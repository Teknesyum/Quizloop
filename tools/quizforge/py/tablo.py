import argparse
import json
import os
import re
import sys

import pymupdf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from etiket import (BASLIK_UST, SEKIL, SUTUN, TABLO, altyazi_paragrafi, duzelt, govde_isaretle,
                    ocr_satirlari, x_ortusme)

DPI_SAYFA = 150
TABLO_ARA = re.compile(r'TABLO\s*(\d+)\s*[-–—]\s*(\d+)')


def satir_grupla(satirlar):
    satirlar = sorted(satirlar, key=lambda s: (s['bbox'][1], s['bbox'][0]))
    sira = []
    for s in satirlar:
        orta = (s['bbox'][1] + s['bbox'][3]) / 2
        if sira and sira[-1]['y0'] - 1 <= orta <= sira[-1]['y1'] + 1:
            sira[-1]['ogeler'].append(s)
            sira[-1]['y1'] = max(sira[-1]['y1'], s['bbox'][3])
        else:
            sira.append({'y0': s['bbox'][1], 'y1': s['bbox'][3], 'ogeler': [s]})
    return [' | '.join(o['text'] for o in sorted(r['ogeler'], key=lambda o: o['bbox'][0])) for r in sira]


def sayfa_satirlari(page):
    satirlar = ocr_satirlari(page.get_text('words'))
    for s in satirlar:
        if s['bbox'][1] < 45 and (BASLIK_UST.search(s['text']) or re.fullmatch(r'\d{1,4}', s['text'].strip())):
            s['tur'] = 'ust'
    for s in satirlar:
        if s['tur'] != 'ust' and any(u['tur'] == 'ust' and abs(u['bbox'][1] - s['bbox'][1]) < 4 for u in satirlar):
            s['tur'] = 'ust'
    return satirlar


def baslik_kes(grup, sag):
    out = [grup[0]]
    for s in grup[1:]:
        onceki = out[-1]['text'].rstrip()
        t = s['text'].lstrip()
        if re.search(r'\.\s*\d{0,2}$', onceki):
            break
        if t[:1].islower() or t[:1] == '(' or re.search(r'([,\-–/]|\bve|\bveya|\bile)$', onceki) \
                or out[-1]['bbox'][2] >= sag - 30:
            out.append(s)
        else:
            break
    return out


def tablo_metni(page, satirlar, i):
    rect = page.rect
    bas = satirlar[i]
    orta = rect.width / 2
    sag = rect.width - 30 if bas['bbox'][2] - bas['bbox'][0] > SUTUN + 20 or bas['bbox'][0] >= orta - 20 else orta - 7
    grup = baslik_kes(altyazi_paragrafi(satirlar, i, rect), sag)
    for g in grup:
        g['tur'] = 'altyazi'
    govde_isaretle(satirlar)
    baslik = duzelt(' '.join(g['text'] for g in grup))
    if bas['bbox'][2] - bas['bbox'][0] > SUTUN + 20:
        xr = [0, rect.width]
    elif bas['bbox'][0] < orta - 20:
        xr = [0, orta + 7]
    else:
        xr = [orta - 7, rect.width]
    alt = max(g['bbox'][3] for g in grup)
    yakin = [s for s in satirlar if s['tur'] is None and 0 <= s['bbox'][1] - alt <= 40]
    if any(s['bbox'][2] > xr[1] + 5 or s['bbox'][0] < xr[0] - 5 for s in yakin):
        xr = [0, rect.width]
    kutu = [xr[0], 0, xr[1], 0]
    secilen = []
    son = alt
    ardisik = 0
    for s in sorted(satirlar, key=lambda s: (s['bbox'][1], s['bbox'][0])):
        if s['bbox'][1] < alt - 2 or s['tur'] in ('altyazi', 'ust'):
            continue
        kutu[1], kutu[3] = s['bbox'][1], s['bbox'][3]
        if x_ortusme(s['bbox'], kutu) <= 0:
            continue
        if SEKIL.match(s['text']) or TABLO.match(s['text']):
            break
        if s['bbox'][1] - son > 40:
            break
        if s['tur'] == 'govde':
            ardisik += 1
            if ardisik >= 2:
                while secilen and secilen[-1]['tur'] == 'govde':
                    secilen.pop()
                break
        else:
            ardisik = 0
        secilen.append(s)
        son = max(son, s['bbox'][3])
    metin = '\n'.join(satir_grupla(secilen))
    tam = False
    if len(metin) < 40:
        metin = page.get_text('text').strip()
        tam = True
    return baslik, metin, tam


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', required=True)
    ap.add_argument('--corpus', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--first', type=int, required=True)
    ap.add_argument('--last', type=int, required=True)
    ap.add_argument('--dpi', type=int, default=DPI_SAYFA)
    a = ap.parse_args()

    metinler = {}
    with open(a.corpus, encoding='utf-8') as fh:
        for line in fh:
            if line.strip():
                r = json.loads(line)
                metinler[r['pdfPage']] = r['text']
    sayfalar = set(metinler)

    os.makedirs(a.out, exist_ok=True)
    out_abs = os.path.abspath(a.out)
    doc = pymupdf.open(a.pdf)
    tablolar = {}
    sira = []
    tam_sayfa = 0
    for pno in range(a.first - 1, a.last):
        if sayfalar and pno + 1 not in sayfalar:
            continue
        page = doc[pno]
        ilk = sayfa_satirlari(page)
        adaylar = []
        for i, s in enumerate(ilk):
            m = TABLO_ARA.search(s['text'])
            if m and s['tur'] != 'ust' and (TABLO.match(s['text']) or not s['text'][:1].islower()):
                adaylar.append((i, m))
        for i, m in adaylar:
            satirlar = sayfa_satirlari(page)
            s = satirlar[i]
            no = '%s-%s' % (m.group(1), m.group(2))
            t = tablolar.get(no)
            if t:
                if pno + 1 == t['sayfalar'][-1] + 1:
                    _, metin, _ = tablo_metni(page, satirlar, i)
                    t['sayfalar'].append(pno + 1)
                    t['metin'] += '\n' + metin
                continue
            baslik, metin, tam = tablo_metni(page, satirlar, i)
            baslik = re.sub(r'^\s*TABLO\s*\d+\s*[-–—]\s*\d+\s*', '', baslik).strip()
            if not TABLO.match(s['text']):
                k = re.search(r'TABLO\s*' + m.group(1) + r'\s*[-–—]\s*' + m.group(2) + r'\s*(.{3,240}?\.)',
                              metinler.get(pno + 1, ''), re.S)
                if k:
                    baslik = duzelt(' '.join(k.group(1).split()))
            tam_sayfa += tam
            t = {'no': no, 'pdfSayfa': pno + 1, 'baslik': baslik, 'sayfalar': [pno + 1], 'metin': metin}
            tablolar[no] = t
            sira.append(t)

    for p in sorted(metinler):
        if not a.first <= p <= a.last:
            continue
        for k in re.finditer(r'TABLO\s*(\d+)\s*[-–—]\s*(\d+)\s*(.{3,240}?\.)', metinler[p], re.S):
            no = '%s-%s' % (k.group(1), k.group(2))
            if no in tablolar:
                continue
            t = {'no': no, 'pdfSayfa': p, 'baslik': duzelt(' '.join(k.group(3).split())), 'sayfalar': [p],
                 'metin': doc[p - 1].get_text('text').strip()}
            tam_sayfa += 1
            tablolar[no] = t
            sira.append(t)
    sira.sort(key=lambda t: (t['pdfSayfa'], [int(x) for x in t['no'].split('-')]))

    index = []
    for t in sira:
        for p in t['sayfalar']:
            yol = os.path.join(out_abs, 'p%04d.png' % p)
            if not os.path.exists(yol):
                doc[p - 1].get_pixmap(dpi=a.dpi).save(yol)
        index.append({'no': t['no'], 'pdfSayfa': t['pdfSayfa'], 'baslik': t['baslik'],
                      'sayfaGorseli': os.path.join(out_abs, 'p%04d.png' % t['pdfSayfa']),
                      'sayfalar': t['sayfalar'], 'metin': t['metin']})
    with open(os.path.join(a.out, 'index.json'), 'w', encoding='utf-8') as fh:
        json.dump(index, fh, ensure_ascii=False, indent=1)
    print(json.dumps({'tablo': len(index), 'devamli': sum(len(t['sayfalar']) > 1 for t in index),
                      'tamSayfaMetni': tam_sayfa, 'gorsel': len({p for t in index for p in t['sayfalar']})},
                     ensure_ascii=False))


if __name__ == '__main__':
    main()
