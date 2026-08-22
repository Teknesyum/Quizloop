# TanStack Query

## Depo
TanStack/query · https://github.com/TanStack/query · MIT · npm `@tanstack/react-query@5.101.4` (depo sürümleri tarih etiketli; API'nin verdiği son sürüm `release-2026-07-21-1305`) · 50.183 yıldız · ~113 MB monorepo, 126 açık issue. Runtime bağımlılığı tek: `@tanstack/query-core`; peer `react ^18 || ^19`. Lisans engeli yok.

## Ne için bakıldı
Renderer'ın gördüğü her veri (modül listesi, kart ilerlemesi, oturum özeti) main süreçten IPC ile geliyor. Soru: HTTP olmayan bir taşıma için sunucu-durumu kütüphanesi hâlâ değer katıyor mu, önbellek geçersizleştirme oturum akışına oturuyor mu.

## Alınacak fikirler
- **Hiyerarşik anahtar + önek ile geçersizleştirme.** `['module', id, 'progress']` biçiminde anahtar, mutation sonrası `['module', id]` önekiyle toptan tazeleme. Quizloop'ta oturum bitişi → ilerleme ekranı ve modül listesi aynı anda tazelenmeli; bu deseni IPC kanal adlarını aynı hiyerarşiyle adlandırıp tek bir "değişti" olayı yayınlayarak kütüphanesiz de kurabiliriz. Değerli: hangi ekranın neyi tazeleyeceğini tek yerde tanımlar.
- **Sunucu-durumu ile istemci-durumu ayrımı.** Kalıcı veri (SQLite + JSON modüller) ile geçici UI durumu (oturum makinesi) ayrı katmanlarda. Bizde karşılığı: kalıcı okumalar IPC sarmalayıcısında, oturum makinesi zustand'da — ikisi asla aynı store'da tutulmaz.
- **`networkMode: 'always'` gerekçesi.** `docs/framework/react/guides/network-mode.md` açıkça diyor: `queryFn`'de yerelden okuyorsan veya `Promise.resolve` dönüyorsan bu modu seç, yoksa sorgular `paused` durumunda takılır. Kütüphaneyi alırsak yapılandırmanın ilk satırı bu olur; almazsak da uyarı değerli — "çevrimdışı" kavramını yerel veriye bulaştırma.

## Kaçınılacaklar
- **Varsayılanları olduğu gibi kabul etmek.** `docs/.../important-defaults.md`: `staleTime: 0`, pencere odağı/yeniden bağlanma/mount'ta otomatik yeniden getirme, hatada 3 kez üstel geri çekilmeli retry, 5 dakika sonra çöp toplama. Electron penceresi her odaklandığında gereksiz SQLite okuması tetiklenir; deterministik bir IPC hatası üç kez tekrarlanıp kullanıcıya geç gösterilir. Doğru kullanım için `staleTime: 'static'` veya `Infinity` + manuel invalidate, `retry: false`, `networkMode: 'always'` — yani kütüphanenin asıl işini kapatarak.
- **Önbellek geçersizleştirmeyi kütüphaneye devretmek.** Query'nin çözdüğü problem "veriyi benden başkası da değiştiriyor". Quizloop'ta tek yazar var: kendi main sürecimiz. Gerçek geçersizleştirme sorunu olmadığı için katman sorunu çözmez, yeni bir eşzamanlılık yüzeyi ekler.
- **Oturum akışını sorgu önbelleğine oturtmak.** Sınav oturumu bir durum makinesi; `gcTime` dolduğunda veya bileşen unmount olduğunda akış sessizce kaybolabilir. Oturum verisi önbellekte değil, açık bir store'da yaşamalı.
- **Sürüm hattı.** npm `latest` 5.101.4 iken depoda 6.0.0-rc etiketleri dönüyor (solid-query 6.0.0-rc.0, 2026-08-12). Majör geçiş yolda; v1'de bağlanmak erken.

## Karar
`desen` — paket alınmıyor. Alınan: hiyerarşik anahtar/önek geçersizleştirme fikri ve sunucu-durumu/istemci-durumu ayrımı; ikisi de birkaç düzine satırlık bir IPC sarmalayıcısıyla karşılanır.
Yeniden değerlendirme eşiği: main süreç dışından (dosya izleyici, arka plan modül güncellemesi) veri değişmeye başlarsa Query'nin çözdüğü problem gerçekten doğar.
Alınırsa zorunlu yapılandırma: `networkMode: 'always'`, `staleTime: 'static'`, `retry: false`, `refetchOnWindowFocus: false`.

## Kaynaklar
`gh api repos/TanStack/query` + `/releases` (2026-08-22) · `npm view @tanstack/react-query dist-tags/dependencies` · `docs/framework/react/guides/important-defaults.md` · `docs/framework/react/guides/network-mode.md`.
