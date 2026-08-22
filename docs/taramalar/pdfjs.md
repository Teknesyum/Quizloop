# pdf.js

## Depo
mozilla/pdf.js · https://github.com/mozilla/pdf.js · **Apache-2.0** · v6.2.108, 2026-07-28 · 53.8k yıldız · depo ~194 MB; npm `pdfjs-dist` açılmış hâlde ~34,5 MB, çalışma-zamanı bağımlılığı yok, `@napi-rs/canvas` isteğe bağlı. Node ≥22.13 gerekiyor.

## Ne için bakıldı
Plan (`docs/PLAN.md` sonu) `pdfjs-dist`'i "görsel ve `/Outlines` çıkarımında zayıf" diye elemişti. Bu tarama o kararın iki ayağını ayırıyor: outline gerçekten zayıf mı, görsel gerçekten çıkmıyor mu.

## Alınacak fikirler
- **`getOutline()` birinci sınıf API.** `src/display/api.js` içinde tanımlı, worker tarafında karşılığı var; başlık, iç içe `items` ağacı ve `dest` döner. **Outline okumada zayıf değil** — plandaki gerekçenin bu yarısı düzeltilmeli. `dest` → sayfa indeksi çevrimi için ayrıca `getDestination` / `getPageIndex` çağrıları gerekir, tek adım değil.
- **Tarayıcısız Node kullanımı desteklenen bir yol.** `pdfjs-dist/legacy/build/pdf.mjs` içe aktarılıp `getDocument` ile dosya açılıyor; `examples/node/` altında resmi örnekler var. `getOutline` ve `getTextContent` için canvas'a hiç gerek yok — canvas yalnız sayfa render'ında devreye giriyor. Yani outline okumak için Electron ana sürecine düşük maliyetle girebilir.
- **Metin katmanı konumlu geliyor.** `getTextContent()` her parça için dönüşüm matrisi ve genişlik veriyor; okuma sırası değil, yerleşim veriyor. Quizloop'un ihtiyacı olan "okuma sırası + tablo yapısı" katmanını `docling` sağlıyor — pdf.js bunu ikame etmez, tamamlar.

## Kaçınılacaklar
- **Gömülü görsel çıkarma için genel API yok.** Görseller `getOperatorList()` içindeki `paintImageXObject` işlemleri ve `page.objs` deposu üzerinden dolaylı toplanır; bu iç API'dir, sürümler arası değişir ve maskeli/JPX/CMYK görsellerde ham piksel çözme işi bize kalır. Görsel sökme için `pypdfium2` kararı yerinde.
- **Sürüm hızı yüksek.** v6.2.108 gibi çok sık artan yama numaraları, 417 açık issue; iç API'ye dayanan kod her yükseltmede kırılır. Yalnız belgelenmiş API'ye (`getOutline`, `getTextContent`, `getPage`) dayanılmalı.
- **Boyut ve ortam.** 34,5 MB'lık paket + Node ≥22.13 kısıtı, Electron sürümüyle uyum gerektirir. Sadece outline için taşınacak yük olarak fazla; iki motoru birden (pypdfium2 + pdfjs) taşımanın maliyeti tartılmalı.
- Lisans tarafında sorun yok: Apache-2.0, patent hükmüyle birlikte MIT ürüne uygun; AGPL/GPL riski yok.

## Karar
`desen` — outline okuma sırası (`getOutline` → `getDestination` → `getPageIndex`) referans alınır, aynı üçlü Python tarafında `pypdfium2`/`pdfplumber` ile kurulur.
Bağımlılık yapılmaz: görsel çıkarma yine de dışarıda kaldığı için ikinci bir motor taşımaya değmiyor.
Not: PLAN.md'deki "`/Outlines` çıkarımında zayıf" ifadesi yanlış, gerekçe "ikinci motor maliyeti" olarak düzeltilmeli.
