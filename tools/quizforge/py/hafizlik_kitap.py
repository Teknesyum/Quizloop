import json
import sys
from pathlib import Path

from pypdf import PageObject, PdfReader, PdfWriter, Transformation

BEKLENEN = 605
CUZ_SAYFA = 20
CUZ = 30


def ilk_sayfa(okur: PdfReader) -> PageObject:
    fatiha = okur.pages[0]
    bakara = okur.pages[1]
    en = float(fatiha.mediabox.width)
    boy = float(fatiha.mediabox.height)
    sayfa = PageObject.create_blank_page(width=en, height=boy)
    alt = boy / 4
    sayfa.merge_transformed_page(bakara, Transformation().scale(0.5).translate(0, alt))
    sayfa.merge_transformed_page(fatiha, Transformation().scale(0.5).translate(en / 2, alt))
    return sayfa


def main() -> int:
    kaynak = Path(sys.argv[1])
    hedef = Path(sys.argv[2])
    okur = PdfReader(str(kaynak))
    if len(okur.pages) != BEKLENEN:
        print(f"sayfa sayisi {len(okur.pages)}, {BEKLENEN} olmali", file=sys.stderr)
        return 1
    hedef.mkdir(parents=True, exist_ok=True)
    son_basili = BEKLENEN - 1
    parcalar = []
    for cuz in range(1, CUZ + 1):
        ilk = (cuz - 1) * CUZ_SAYFA + 1
        son = son_basili if cuz == CUZ else cuz * CUZ_SAYFA
        yazar = PdfWriter()
        for basili in range(ilk, son + 1):
            yazar.add_page(ilk_sayfa(okur) if basili == 1 else okur.pages[basili])
        yazar.compress_identical_objects()
        ad = f"{cuz:02d}.pdf"
        with open(hedef / ad, "wb") as f:
            yazar.write(f)
        parcalar.append(
            {"bolum": cuz, "ilkSayfa": ilk, "sonSayfa": son, "ad": ad, "bayt": (hedef / ad).stat().st_size}
        )
    json.dump(parcalar, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
