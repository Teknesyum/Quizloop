import json, re, sys, hashlib
from collections import Counter
from pathlib import Path
import pypdf

pdf, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
r = pypdf.PdfReader(str(pdf))
pages = [(i + 1, p.extract_text() or "") for i, p in enumerate(r.pages)]
ch, offs = {}, []
for pg, t in pages:
    first = t.split("\n", 1)[0]
    m = re.match(r"\s*BÖLÜM\s+(\d{1,2})\s+(.+?)\s+(\d{1,4})\s*$", first)
    if m:
        c = int(m.group(1))
        ch.setdefault(c, [m.group(2).strip(), pg])
        offs.append(pg - int(m.group(3)))
    m2 = re.match(r"\s*(\d{1,4})\s+KISIM\b", first)
    if m2:
        offs.append(pg - int(m2.group(1)))
off = Counter(offs).most_common(1)[0][0] if offs else 0
keys = sorted(ch)
chapters = []
for i, k in enumerate(keys):
    start = ch[k][1] - 2
    end = ch[keys[i + 1]][1] - 3 if i + 1 < len(keys) else len(pages)
    chapters.append({"chapter": k, "title": ch[k][0], "pdfPages": [start, end], "bookPages": [start - off, end - off]})


def norm(t):
    t = t.replace("­\n", "").replace("­", "")
    return re.sub(r"(?<=[a-zçğıöşü])-\n(?=[a-zçğıöşü])", "", t)


with open(out / "pages.jsonl", "w", encoding="utf-8") as f:
    for pg, t in pages:
        c = next((x["chapter"] for x in chapters if x["pdfPages"][0] <= pg <= x["pdfPages"][1]), None)
        f.write(json.dumps({"pdfPage": pg, "bookPage": pg - off if pg > off else None, "chapter": c, "text": norm(t)}, ensure_ascii=False) + "\n")
sha = hashlib.sha256(pdf.read_bytes()).hexdigest()
json.dump({"file": pdf.name, "sha256": sha, "pageOffset": off, "pageCount": len(pages), "chapters": chapters}, open(out / "chapters.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({"pages": len(pages), "chapters": len(chapters), "offset": off, "sha256": sha}))
