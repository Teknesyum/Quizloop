import re
import sys

FIIL = re.compile(
    r"(?:"
    r"[iıuü]yor|"
    r"m[ıiuü][şs]t?[ıiuü]r|"
    r"[dt][ıiuü]r?(?:l[ıiuü])?$|"
    r"[ae]c[ae][kğ]|"
    r"m[ae]kt[ae]|"
    r"[ıiuü]l[ıiuü]r$|"
    r"[ae]r[ae]k$|"
    r"m[ae]d[ae]n$|"
    r"[ıiuü]nc[ae]$|"
    r"[dt][ıiuü][ğk][ıiuü]"
    r")",
    re.IGNORECASE,
)

MUAF_KOK = {
    "alan",
    "oran",
    "uzman",
    "organ",
    "plan",
    "zaman",
    "insan",
    "ortam",
    "kan",
    "can",
    "yan",
    "ton",
    "tan",
    "beyin",
    "derin",
    "burun",
    "hasta",
    "solunum",
    "yoğun",
    "kadın",
    "ölçüm",
    "bakım",
    "kalıtsal",
    "uygulama",
    "damar",
    "oksijen",
    "doğum",
}

EK = ("ı", "i", "u", "ü", "ın", "in", "un", "ün", "ları", "leri", "lar", "ler", "sı", "si")


def muaf(low: str) -> bool:
    if low in MUAF_KOK:
        return True
    for e in EK:
        if low.endswith(e) and low[: -len(e)] in MUAF_KOK:
            return True
    return False



SIFAT_FIIL = re.compile(r"[ae]n[ıiuü]?$", re.IGNORECASE)


def fiilli(word: str, son: bool) -> bool:
    low = word.lower()
    if muaf(low):
        return False
    if FIIL.search(low):
        return True
    return len(low) >= (5 if son else 6) and bool(SIFAT_FIIL.search(low))


def temiz(phrase: str) -> bool:
    words = phrase.split()
    if not words or len(words) > 3:
        return False
    return not any(fiilli(w, i == len(words) - 1) for i, w in enumerate(words))


def main():
    for line in sys.stdin:
        p = line.rstrip("\n")
        if p and temiz(p):
            print(p)


if __name__ == "__main__":
    main()
