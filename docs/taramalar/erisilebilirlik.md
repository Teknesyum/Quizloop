# Klavyeyle sürülen, uzun oturuma dayanan arayüzler

Seçim gerekçesi: üç ayrı katman. **Anki** aynı problemi (saatlerce kart çözme) üründe
çözmüş; **react-aria** odak ve ekran okuyucu altyapısını hazır veriyor; **tinykeys**
kısayol haritasının en küçük, en denetlenebilir hâli. cmdk ve hotkeys-js elendi (§Kaçınılacaklar).

## Depolar
- **ankitects/anki** · https://github.com/ankitects/anki · AGPL-3.0+ (GitHub `NOASSERTION`, LICENSE dosyası AGPL3 diyor, parçalar BSD/MIT) · son push 2026-08-22, son sürüm `26.08.1` (2026-08-05) · ~53 MB, 447 açık issue, 29.961 yıldız.
- **adobe/react-spectrum** (react-aria) · https://github.com/adobe/react-spectrum · Apache-2.0 · son push 2026-08-21, son sürüm `react-aria-components@1.20.0` (2026-07-31) · ~250 MB monorepo, 584 açık issue, 15.811 yıldız.
- **jamiebuilds/tinykeys** · https://github.com/jamiebuilds/tinykeys · MIT · son commit 2026-05-20, son etiket `v4.0.0` (npm 4.0.0, 2026-05-20; GitHub Releases boş) · 4.098 yıldız, 6 açık issue.

## Alınacak fikirler

- **Kısayol dizesi tek kaynak: hem dinleyiciyi kurar hem etiketi basar.** Anki'nin
  `ts/lib/tslib/shortcuts.ts` dosyasında `registerShortcut` ile `getPlatformString` aynı
  kombinasyon dizesini yer: biri olayı eşler, diğeri platforma uygun görünen etiketi üretir.
  Quizloop'ta: tek `shortcuts.ts` haritası → hem `tinykeys` bağlaması hem butonların yanındaki
  rozet hem `?` yardım listesi. Değerli, çünkü kısayol ile ekranda yazan etiketin ayrışması
  uzun oturumda kullanıcının güvenini bitiren sessiz hatadır.
- **Kısayolu kullanıcıya yerinde göster, ayrı bir sayfada değil.** Anki el kitabı kısayolların
  "arayüzde keşfedilebilir" olduğunu söylüyor: menü öğesi kısayolu yanında yazar, butonda
  ipucu olarak çıkar, `?` tuşu listeyi açar (docs.ankiweb.net/studying.html). Quizloop'ta:
  "Şıkları göster" butonunun üstünde `Space`, derece butonlarında `1/2/3`, `?` ile katman.
  Değerli, çünkü ayrı kısayol sayfası bir kez okunur, buton üstündeki rozet her turda öğretir.
- **Odak ve duyuru işini kütüphaneye devret.** react-aria'da `FocusScope` (`contain`,
  `restoreFocus`, `autoFocus`) ve `useFocusManager` odağı bir bölgede tutup ayrılırken geri
  verir; `@react-aria/live-announcer` (`announce`, `clearAnnouncer`) DOM'a canlı bölge
  enjekte edip metni okutur. Quizloop'ta: her yeni soruda odak soru gövdesine, açıklama
  açılınca `announce(...)` ile "yanlış — açıklama açıldı"; modal/çözüm katmanında `contain`,
  kapanınca odak son basılan derece butonuna döner. Değerli, çünkü soru geçişinde odağın
  `<body>`'ye düşmesi klavye akışını her turda kırar; bunu elle çözmek en pahalı kısım.

## Kaçınılacaklar
- **hotkeys-js** (7.122 yıldız, 160 açık issue, `v4.0.5` 2026-08-14): global tek kayıt defteri
  ve string tabanlı "scope" modeli var; React'ta bileşen ömrüyle bağ kurmak elle temizlik
  gerektiriyor. tinykeys'in `unsubscribe` dönen çağrısı `useEffect` ile birebir örtüşüyor.
- **pacocoursey/cmdk**: depo `dip/cmdk`'ya taşınmış (GitHub API `full_name` bunu döndürüyor),
  son etiketli sürüm `v1.1.1` (2025-03-14), 73 açık issue, son push 2025-10-29. Komut paleti
  Quizloop'un ana döngüsü değil — çözüm arama gibi ikincil bir yüzey için sonra bakılır.
- **Kısayolları başlangıçta yeniden atanabilir yapmak.** Anki de çekirdekte bunu vermiyor;
  yeniden atama add-on işi (doğrulanamadı: çekirdekte remap arayüzü bulunamadı, el kitabında
  geçmiyor). Maliyeti çakışma çözümü + kalıcılık + yardım ekranının dinamikleşmesi. Önce
  sabit harita, sonra tek bir "sol el / sağ el" ön ayarı.
- **tinykeys boyut iddiası**: depo açıklaması "~650 B", README "~1KB" diyor; npm paketinin
  `unpackedSize` değeri 76 KB (kaynak+tipler dahil). Gerçek gzip boyutu doğrulanamadı — küçük
  olduğu kesin, rakam pazarlama.
- **react-spectrum'un tamamını almak.** ~250 MB monorepo; `react-aria-components` tüm görsel
  kabuğu getirir. Sadece `@react-aria/focus` + `@react-aria/live-announcer` + `visually-hidden`
  alınmalı. Aksi hâlde Quizloop'un kendi tipografisi kütüphanenin varsayımlarıyla çarpışır.
- **`prefers-reduced-motion`'ı yalnız CSS'e bırakmak.** Anki bunu bir *tercihe* çevirmiş:
  Preferences'ta "Reduce motion", "Minimalist mode", tema için "follow system / light / dark"
  (qt/aqt/preferences.py). Sistem sorgusu varsayılanı belirlemeli, kullanıcı ayarı ezebilmeli.

## Karar önerisi
1. Kısayol katmanı: **tinykeys**, tek `shortcuts.ts` haritası; `registerShortcut`/`getPlatformString`
   ikilisinin Anki'deki ayrımı örnek alınır — dinleyici ve etiket aynı dizeden üretilir.
2. Erişilebilirlik: react-aria'dan yalnız `focus` + `live-announcer`; bileşen kütüphanesi alınmaz.
3. Keşif: `?` yardım katmanı + buton üstü rozet. Yeniden atama v1'de yok.
4. Ayarlar: reduced-motion, tema ve "Space kartı da cevaplar" benzeri koruma anahtarı tercih olarak
   tutulur; sistem sorgusu yalnız varsayılanı verir.
