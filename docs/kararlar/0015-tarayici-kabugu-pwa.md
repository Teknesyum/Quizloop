# 0015 — Tarayıcı Kabuğu (PWA)

Tarih: 2026-10-04. Sahibin sözü: "pwa yöntemine girişelim ama sitem olmasa da olur
değil mi."

**Karar.** Uygulama üçüncü bir kabukla tarayıcıda da çalışır ve iPhone'da "Ana Ekrana
Ekle" ile kurulur. Site GitHub Pages'te durur; ayrı alan adı ve sunucu gerekmez.

PWA: tarayıcıdan açılan, ana ekrana eklenince uygulama gibi duran, internetsiz de çalışan
web sayfası. App Store hesabı ve Mac gerektirmez.

## Ne Nerede Durur

| Parça | Çözüm | Neden |
|---|---|---|
| Kabuk | `src/web/`, `vite.web.config.ts`, çıktı `out/web` | Android kabuğuyla aynı çekirdek, Capacitor yok |
| Veritabanı | `@sqlite.org/sqlite-wasm`, bir işçide, `opfs-sahpool` | Kalıcı; Pages'in veremediği COOP/COEP başlıklarını istemez |
| Modül dosyaları | Cache Storage, modül başına bir önbellek (`ql-mod-…`) | Silmek tek çağrı; resim ve PDF düz adresle açılır |
| Dosya servisi | `sw.js` (service worker) | Modül adreslerini önbellekten verir, uygulamayı internetsiz açar |
| Paket açma | `fflate` akışlı `Unzip`, dosya dosya | 670 MB'lık paket belleğe sığmaz |
| Ayarlar | `localStorage` | Küçük, eşzamanlı |
| Yayın | `.github/workflows/pages.yml`, sürüm etiketiyle | Site hep yayımlanmış sürümü gösterir |

`@sqlite.org/sqlite-wasm` geliştirme bağımlılığıdır; kabuk anahtarı değişmez (ölçüldü:
`a9cdb8ede97f18df`, öncesi ve sonrası aynı).

## Sınırlar

- Veri tarayıcının o siteye ayırdığı alanda durur. Site verisi silinirse ilerleme de gider.
  iPhone, ana ekrana eklenmemiş siteyi uzun süre açılmazsa temizleyebilir; ana ekrana
  eklemek bunu önler. Açılışta `navigator.storage.persist()` istenir.
- Tek sekme: veritabanı aynı anda bir sekmede açılır. İkincisi açık bir hata yazar.
- Güncelleme: yeni sürüm arka planda iner, uygulama bir sonraki açılışta yenilenir.
  Uygulama içi güncelleme paneli kapalıdır.
- Yedek alma ve geri yükleme bu kabukta yok (Android'de de yok).
- Gerçek modüller siteye konmaz; kullanıcı `.qlmod` dosyasını kendi cihazından seçer.

## Sıra

1. Kabuk: veritabanı işçisi, Kysely sürücüsü, modül deposu, ayarlar, `shell.ts`.
2. `sw.js`, `manifest.webmanifest`, simgeler, iPhone meta etiketleri.
3. Yerelde derleyip tarayıcıda dene: açılış, örnek modüller, oturum, `.qlmod` kurma,
   internetsiz açılış.
4. Pages iş akışı, yayın, README ve PRIVACY.
