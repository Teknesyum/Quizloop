# İş planı — kapak görselleri ve ilerleme yüzdesi

## İstek
- Modül kartının arka planı kitabın PDF'inin ilk sayfası olsun.
- Bölüm kartlarının arka planı o bölümün ilk sayfası olsun.
- İkisinde de görselin üst tarafına odaklanılsın.
- Modülün ve bölümlerin tamamlanma yüzdesi büyük ve okunur biçimde,
  şu an sürümün durduğu yerde gösterilsin; sürüm daha uygun bir köşeye taşınsın.

## Adımlar
1. `tools/quizforge/py/covers.py` — PDF'ten kapak ve 59 bölüm görseli üretir,
   sayfanın üst %62'sini kırpar, 760px genişlikte webp yazar.
   Çıktı: `modules/<id>/assets/kapak.webp`, `assets/bolum/<n>.webp`. (bitti: 60 görsel, 2825 KB)
2. `src/shared/ipc.ts` — `ModuleSummary` ve `ChapterSummary` alanlarına `assetBase` eklenir.
3. `src/main/ipc/handlers.ts` — iki listede `assetBase` doldurulur.
4. `src/renderer/src/screens/Library.tsx` — kart arka planı, büyük yüzde, sürüm alta.
5. `src/renderer/src/screens/Chapters.tsx` — aynısı bölüm kartları için.
6. `src/renderer/src/styles/app.css` — arka plan katmanı, üstten hizalama, okunurluk için
   token zeminli örtü; yüzde tipografisi.
7. `locale/tr.json` + `locale/en.json` — yüzde etiketi.

## Kısıt
Görseller modül klasöründe durur, git'e girmez. Kurulu modül `userData/modules`
altında olduğundan görseller oraya da kopyalanmalı (yeniden kurulum ya da kopyalama).
