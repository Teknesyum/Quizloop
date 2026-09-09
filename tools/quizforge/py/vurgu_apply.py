import hashlib
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from vurgu_suzgec import temiz

MAX_WORDS = 3


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def apply_one(block_path, phrases):
    data = load(block_path)
    questions = data["questions"] if isinstance(data, dict) else data
    written = 0
    dropped = 0
    for q in questions:
        got = phrases.get(q["id"], [])
        keep = []
        for p in got:
            p = p.strip()
            if not p or p not in q["stem"]["md"] or len(p.split()) > MAX_WORDS or not temiz(p):
                dropped += 1
                continue
            if p not in keep:
                keep.append(p)
        q["vurgu"] = keep
        written += len(keep)
    text = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
    io.open(block_path, "w", encoding="utf-8", newline="").write(text)
    return len(questions), written, dropped


def resync(module_dir):
    meta_path = Path(module_dir) / "module.json"
    meta = load(meta_path)
    for ref in meta["blocks"]:
        raw = (Path(module_dir) / ref["file"]).read_bytes()
        ref["sha256"] = hashlib.sha256(raw).hexdigest()
    text = json.dumps(meta, ensure_ascii=False, indent=1) + "\n"
    io.open(meta_path, "w", encoding="utf-8", newline="").write(text)
    return len(meta["blocks"])


def main(module_dir, phrase_dir):
    total = written = dropped = 0
    for pf in sorted(Path(phrase_dir).glob("vurgu-*.json")):
        block = Path(module_dir) / "blocks" / (pf.stem.split("-", 1)[1] + ".json")
        if not block.exists():
            print(f"atlandi: {block.name}")
            continue
        n, w, d = apply_one(block, load(pf))
        total += n
        written += w
        dropped += d
    blocks = resync(module_dir)
    print(f"{total} soru, {written} ifade, {dropped} elendi, {blocks} blok ozeti yenilendi")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
