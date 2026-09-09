import io
import json
import re
import sys
from pathlib import Path

import pymupdf

WIDTH = 760
TOP = 0.62


def render(doc, page_no, out):
    page = doc[page_no - 1]
    rect = page.rect
    clip = pymupdf.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + rect.height * TOP)
    zoom = WIDTH / rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(pix.pil_tobytes(format="WEBP", quality=72))


def main(pdf_path, module_dir):
    module_dir = Path(module_dir)
    meta = json.loads((module_dir / "module.json").read_text(encoding="utf-8"))
    starts = {}
    for block in meta["blocks"]:
        data = json.loads((module_dir / block["file"]).read_text(encoding="utf-8"))
        for q in data["questions"] if isinstance(data, dict) else data:
            src = q["source"]
            chapter = src.get("chapter")
            if not chapter:
                continue
            m = re.match(r"\s*(\d+)", chapter)
            if not m:
                continue
            n = int(m.group(1))
            page = src["pages"][0]
            if n not in starts or page < starts[n]:
                starts[n] = page

    doc = pymupdf.open(pdf_path)
    assets = module_dir / "assets"
    render(doc, 1, assets / "kapak.webp")
    for n, page in sorted(starts.items()):
        render(doc, page, assets / "bolum" / f"{n}.webp")
    total = sum(f.stat().st_size for f in assets.rglob("*.webp"))
    print(f"{1 + len(starts)} gorsel, {total // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
