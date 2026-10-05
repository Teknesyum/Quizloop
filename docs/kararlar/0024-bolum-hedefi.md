# 0024 — Bölüm Hedefi

Tarih: 2026-10-05

## Sorun

Sahibinin sözü: "hedef bölümlere de eklenebilsin", "hedef le alakalı bilgi bölüm seçim
ekranında da gözüksün %3 diyen bir progress bar olsun mesela". Hedef yalnızca modüle
konabiliyordu ve bölüm ekranında hiç görünmüyordu.

## Karar

- Bölüm hedefi aynı ayar alanında durur (`goals`). Anahtar `goalKey(modül, bölüm)` ile
  üretilir: modül hedefi `modül`, bölüm hedefi `modül/bölüm`. Yeni tablo ya da göç yok.
- Günlük sayı modülle aynı hesapla çıkar (`goalOf`): bölümün açık sorusu, kalan güne bölünür.
- Bölüm ekranının üstünde modül hedefi, hedefi olan bölüm kartında bölüm hedefi görünür:
  "Hedef: Bugün x/y" satırı, yüzde ve ilerleme çubuğu (`GoalMeter`).
- Bölüm kartında süre açılır menüden seçilir; altı düğmelik seçim yalnızca Hedefler
  ekranındadır (kart dar, bölüm sayısı çok).

## Kapsam Dışı

Bölüm hedefleri Hedefler ekranındaki toplam sayıya ve akşam bildirimine katılmaz; ikisi de
modül hedeflerini sayar.
