# 0003 — Dağıtım lisansı AGPL-3.0-or-later

Tarih: 2026-09-08 · Durum: kabul edildi · 0001'in lisans maddesini geçersiz kılar

## Karar

Quizloop **AGPL-3.0-or-later** ile dağıtılır. `LICENSE` dosyası, `package.json`
`license` alanı ve README aynı dizeyi taşır.

## Gerekçe

0001, MIT seçmiş ve bunun bedelini bağımlılık tarafında ödemişti: ekosistemin en iyi
PDF ve tekrar araçları copyleft olduğu için (PyMuPDF, mupdf, Anki, `genanki-js`)
tarama bunları tek tek elemek zorunda kaldı ve yerlerine ikinci sınıf paketler kondu.

Bedelin karşılığı yoktu. Quizloop kapalı bir türevinden gelir beklemiyor; MIT'in
sağladığı tek avantaj olan "kapatılabilirlik" bu projede kullanılmayacak bir hak.
AGPL bunun yerine ağ üzerinden sunulan türevleri de kaynak açmaya zorlar, ki tek
kullanıcılık masaüstü uygulamasında kullanıcıya zararı yok.

## Sonuçları

- Copyleft bağımlılık yasağı kalkar. Dalga 2'de PyMuPDF doğrudan kullanılabilir.
- Yeni yasak: **AGPL ile uyumsuz** lisanslar. Özel/ticari kısıtlı paketler, yalnız
  GPLv2 ("or later" olmayan) paketler ve reklam maddeli eski BSD girmez.
- Her copyleft bağımlılığın lisans metni dağıtım paketine iletilir.
- `docs/PLAN.md` içinde "AGPL yasak" diyen satırlar bu karara göre düzeltildi;
  `docs/taramalar/` tarihsel kayıt olduğu için olduğu gibi bırakıldı.
