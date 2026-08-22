# recharts/recharts

## Depo
recharts · https://github.com/recharts/recharts · **MIT** (AGPL riski yok) · son sürüm `v3.10.1` (2026-07-25), son push 2026-08-22 · 27.517 yıldız · npm paketi 7,45 MB açılmış (`registry.npmjs.org`, `dist.unpackedSize`), 11 çalışma-zamanı bağımlılığı, 438 açık issue.

## Ne için bakıldı
visx'e alternatif olarak: istatistik ekranının üç çizimini (tutma eğrisi, günlük yük, tekrar ısı haritası) daha az kodla kurabilir miyiz. Sorular — visx'e göre net kazanç/kayıp, renkleri dışarıdan vermek kolay mı, masaüstü penceresi yeniden boyutlanırken responsive davranış sağlam mı.

## Alınacak fikirler
- **Bileşik grafik API'si — asıl kazanç bu.** `<AreaChart>` içine `<XAxis>`, `<Tooltip>`, `<CartesianGrid>`, `<Area>` çocuk olarak konuyor; eksen, tooltip, legend ve ölçek hesabı bedava geliyor. visx'te bunların hepsi elle bağlanır. Tutma eğrisi ve günlük yük sütunu Recharts'ta muhtemelen yarım günde, visx'te bir-iki günde biter. **Alınacak desen visx tarafında bile geçerli:** grafik yapılandırmasını prop nesnesi yerine bileşen ağacı olarak ifade etmek, istatistik ekranının okunabilirliğini artırır.
- **Renk dışarıdan vermek kolay ve token uyumlu.** README örneğindeki gibi `stroke`/`fill` prop olarak veriliyor ve SVG özniteliğine düşüyor; `stroke="var(--tkn-...)"` çalışır. Bu konuda visx'e karşı bir kayıp yok. Tema nesnesi dayatması da yok.
- **Kayıp tarafı net: ısı haritası yok.** Recharts'ta takvim/matris ısı haritası bileşeni bulunmuyor; `Scatter` üzerine kare şekil takarak taklit edilmesi gerekir. Quizloop'un üç çiziminden biri kütüphanenin kapsamı dışında kalıyor — bu tek başına elenme sebebi.

## Kaçınılacaklar
- **Bağımlılık zinciri.** v3 iç durumu redux'a taşımış: `@reduxjs/toolkit`, `react-redux`, `immer`, `reselect`, `use-sync-external-store`, `es-toolkit`, `victory-vendor` (yeniden paketlenmiş d3), `eventemitter3`, `decimal.js-light`, `clsx`, `tiny-invariant`; ayrıca `react-is` ayrı kurulmak zorunda. Uygulamada redux yoksa bunların tamamı grafik uğruna gelen ölü ağırlıktır. Alt bağımlılıkların lisansları tek tek doğrulanmadı — **doğrulanamadı**; recharts'ın kendisi MIT.
- **`ResponsiveContainer` masaüstü penceresinde tekinsiz.** ResizeObserver tabanlı ama ebeveyni sabit/esnek yükseklikli olduğunda küçülmediğine dair açık issue var: #3688 "ResponsiveContainer not working when a fixed parent is specified" (2023-08-07, hâlâ açık) ve v3'ün yeni `responsive` prop'u için #6496 (2025-10-23). "ResponsiveContainer" geçen açık issue sayısı 51 (GitHub arama). Electron penceresi serbestçe boyutlandığı için bu tam bizim kullanım biçimimiz; ebeveyne kesin piksel yükseklik vermek gerekiyor, yani "responsive" sözü tam karşılanmıyor.
- **438 açık issue.** Depo canlı (son push tarama günü) ama biriken sorun yükü yüksek; bulduğumuz bir kenar durumun kısa vadede çözülmesine güvenilmemeli.

## Karar
`elendi` — ısı haritası bileşeni yok ve redux merkezli bağımlılık zinciri tek bir istatistik ekranı için ağır.
Isı haritasını ayrı bir kütüphaneyle çözmek iki grafik kütüphanesi taşımak demek; visx tek başına üçünü de kapsıyor.
Alınan tek şey desen: bileşen ağacı biçiminde grafik yapılandırması.
