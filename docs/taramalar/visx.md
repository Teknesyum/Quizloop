# airbnb/visx

## Depo
visx · https://github.com/airbnb/visx · **MIT** (AGPL riski yok) · son sürüm `v4.0.0` (2026-06-11), son push 2026-06-22 · 21.016 yıldız · 44 paketlik monorepo, ~16 MB depo, 148 açık issue. React 18 veya 19 zorunlu, `prop-types` v4'te kaldırıldı.

## Ne için bakıldı
İstatistik ekranında üç çizim var: tutma eğrisi (alan/çizgi), günlük yük tahmini (sütun), tekrar geçmişi ısı haritası (takvim ızgarası). Renk ve ölçü uydurulmayacağı için soru "kendi tokenlarımızla çizdirebilir miyiz, yoksa kütüphane kendi stilini mi dayatıyor".

## Alınacak fikirler
- **Primitifler stilsiz SVG; renk prop olarak dışarıdan gelir.** `Bar`, `AreaClosed`, `LinePath`, `HeatmapRect` gibi bileşenler `fill`/`stroke`/`className` alır ve doğrudan SVG'ye yazar. SVG özniteliği olduğu için `fill="var(--tkn-neon-...)"` biçiminde CSS değişkeni geçirmek çalışır — teknesyum tokenları hiç dönüştürülmeden kullanılabilir. Kütüphanenin kendi renk kararı yoktur; bizim ihtiyacımız tam olarak bu.
- **`@visx/theme` isteğe bağlı ve ayrı paket.** `src/tokens/cssVar.ts` `var(--ad, fallback)` dizesi üreten üç satırlık bir yardımcıdan ibaret; tema sistemi light/dark/categorical token setleri olarak kurulmuş. Yani visx'in kendi teması bile CSS değişkeni üzerinden çalışıyor. Alınacak desen: grafik renklerini bileşene gömmek yerine tek bir token haritasından okumak; paketi almak zorunlu değil, kurgusu kopyalanabilir.
- **Isı haritası ve alan grafiği için hazır parça var, ama küçük parçalar.** `@visx/heatmap` yalnız `HeatmapRect` ve `HeatmapCircle` içeriyor (ESM 3.496 bayt) — takvim ızgarası için ölçek ve etiketleri biz kuracağız. Alan grafiği `@visx/shape` içinde (`AreaClosed`, `AreaStack`, `LinePath`, `Bar`; ESM 52.847 bayt). Yardımcılar: `@visx/scale` 19.357, `@visx/axis` 14.072, `@visx/group` 502, `@visx/responsive` 11.775, `@visx/tooltip` 38.153 bayt. Bu sayılar depodaki `packages/sizes.json` dosyasından; ölçüm yönteminin sıkıştırılmış mı ham mı olduğu belgede yazmıyor — **doğrulanamadı**. İhtiyacımız olan altı paketin toplamı yine de 150 KB mertebesinde ve tree-shaking'e açık.

## Kaçınılacaklar
- **`@visx/xychart`.** ESM 126.022 bayt (`sizes.json`), kendi tema nesnesi + bileşen registry'si ile geliyor; "hazır grafik" katmanı olduğu için stil kararlarını geri alıyor. Tokenlarımızla çizmek istiyorsak yanlış katman.
- **`@visx/mock-data`.** ESM 325.698 bayt, README örneklerinde ilk kurulan paket. Örnekten kopyalanıp üretim paketine sızarsa tek başına diğer her şeyden büyük olur.
- **"Kurulum ucuz" beklentisi.** visx eksen, ızgara, tooltip, legend ve ölçekleri elle bağlamayı gerektirir; ilk grafik Recharts'takinden belirgin şekilde uzun sürer. Gizli maliyet paket boyutunda değil, geliştirme saatinde.
- **Bakım hızı.** 148 açık issue ve son push tarama günü itibarıyla ~2 ay öncesi. Terk edilmiş değil ama v4 yeni ve göç kılavuzu (`MIGRATION.md`) gerektiren kırıcı bir sürüm; React sürümü yükseltilirken ikinci kez ödeme çıkabilir.

## Karar
`bağımlılık` — yalnız `@visx/heatmap`, `@visx/shape`, `@visx/scale`, `@visx/axis`, `@visx/group`, `@visx/responsive`.
Gerekçe: renk kararı bizde kalıyor, ısı haritası için gerçek bir parça var, MIT ve tek tek paket alınabiliyor.
Bedeli kabul edilen: eksen/tooltip iskeletini kendimiz yazacağız.
