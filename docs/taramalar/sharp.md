# sharp

## Depo
lovell/sharp · https://github.com/lovell/sharp · Apache-2.0 · v0.35.3 (2026-07-01) · 32.6k yıldız · ~60 MB depo, 116 açık issue.

## Ne için bakıldı
quizforge'da PDF'ten sökülen yüzlerce görselin `webp`'e çevrilmesi, kırpılması ve yeniden
boyutlandırılması. Soru: Electron paketine mi girecek, yoksa yalnız CLI'da mı kalacak.

## Alınacak fikirler
- **Yalnız CLI bağımlılığı olarak kullan.** libvips tabanlı, toplu dönüştürmede Node'un
  saf-JS alternatiflerinden hızlı. quizforge modül üretimi zaten çevrimdışı ve tek makinede
  çalışıyor; oradaki yerel ikili maliyeti kabul edilebilir, Electron tarafında değil.
- **Streaming/pipeline API deseni.** Tek bir okuma zincirinden `resize → webp → toFile`
  akıyor; ara dosya yazılmıyor. quizforge'un kontrol noktalı üretim akışında her görsel
  bağımsız bir iş birimi olur, yarıda kesilen üretim baştan başlamaz.
- **Platform ikilisinin `optionalDependencies` ile dağıtılması.** sharp derleme yapmaz,
  `@img/sharp-<os>-<arch>` paketlerinden doğru olanı npm seçer; çapraz platform paketleme
  `npm install --cpu=... --os=...` ile yapılır. quizforge dağıtımı için aynı desen izlenebilir.

## Kaçınılacaklar
- **Lisans uyarısı: sharp'ın kendisi Apache-2.0 ama çalışması için gereken
  `@img/sharp-libvips-*` paketleri `LGPL-3.0-or-later`** (npm registry, 1.3.2). libvips'in
  kendi deposu LGPL-2.1. GPL/AGPL değil, ama copyleft: ikiliyi olduğu gibi dağıtırsan
  lisans metnini iletmen ve yeniden bağlamaya (relinking) izin vermen gerekir. MIT çekirdek
  için Electron paketine gömmek gereksiz hukuki yük — CLI'da tut.
- **Electron paketleme kırılganlığı.** `asarUnpack` ile `**/node_modules/sharp/**/*`
  açılmazsa çalışma zamanında patlar; ayrıca renderer'da değil yalnız main süreçte çalışır.
- **Boyut.** Tek platformun libvips paketi bile ~19 MB açılmış (win32-x64 1.3.2). Electron
  kurulumuna eklenmesi anlamsız; modüller zaten üretilmiş `webp` olarak geliyor.
- Node.js >= 20.9.0 şartı var; Electron'un gömülü Node sürümüyle Node-API uyumu ayrıca
  doğrulanmalı — doğrulanmadı.

## Karar
`bağımlılık` — ama **yalnız quizforge CLI'da**. Electron uygulaması `webp` dosyalarını
yalnız okur, sharp'ı hiç görmez. Böylece LGPL ikilisi son kullanıcı paketine girmez ve
`asarUnpack` sorunu hiç doğmaz.
