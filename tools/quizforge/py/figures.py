import argparse
import io
import json
import os
import re

import pymupdf

CAPTION = re.compile(r'(ŞEKİL|TABLO)\s+(\d+[-–]\d+)\s*(.*?)(?=(?:ŞEKİL|TABLO)\s+\d+[-–]\d+|\Z)', re.S)


def captions(text):
    out = []
    for kind, num, body in CAPTION.findall(text):
        body = ' '.join(body.split())
        out.append({'tur': kind, 'no': num.replace('–', '-'), 'metin': body[:600]})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', required=True)
    ap.add_argument('--corpus', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--first', type=int, required=True)
    ap.add_argument('--last', type=int, required=True)
    ap.add_argument('--min-side', type=int, default=150)
    a = ap.parse_args()

    text_by_page = {}
    with open(a.corpus, encoding='utf-8') as fh:
        for line in fh:
            if line.strip():
                rec = json.loads(line)
                text_by_page[rec['pdfPage']] = rec['text']

    os.makedirs(a.out, exist_ok=True)
    doc = pymupdf.open(a.pdf)
    index = []
    for pno in range(a.first - 1, a.last):
        page = doc[pno]
        rect = page.rect
        caps = captions(text_by_page.get(pno + 1, ''))
        seq = 0
        for info in page.get_image_info(xrefs=True):
            w, h = info['width'], info['height']
            if w < a.min_side or h < a.min_side:
                continue
            b = info['bbox']
            if (b[2] - b[0]) > rect.width * 0.95 and (b[3] - b[1]) > rect.height * 0.95:
                continue
            seq += 1
            name = 'p%04d-%d.png' % (pno + 1, seq)
            pix = pymupdf.Pixmap(doc, info['xref'])
            if pix.n - pix.alpha >= 4:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            pix.save(os.path.join(a.out, name))
            index.append({
                'dosya': name,
                'pdfSayfa': pno + 1,
                'sira': seq,
                'genislik': w,
                'yukseklik': h,
                'bbox': [round(v, 1) for v in b],
                'altyazilar': caps,
            })
    with open(os.path.join(a.out, 'index.json'), 'w', encoding='utf-8') as fh:
        json.dump(index, fh, ensure_ascii=False, indent=1)
    print('%d sekil -> %s' % (len(index), a.out))


if __name__ == '__main__':
    main()
