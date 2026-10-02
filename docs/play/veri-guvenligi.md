# Play Veri Güvenliği Formu — Önerilen Yanıtlar

Sürüm: 0.6.0, Android. Kanıtlar `dosya:satır` biçimindedir; satır numaraları 2026-10-02
tarihli ağaca göredir. Gizlilik politikası: `PRIVACY.md`.

## Özet

Veri toplanmaz, paylaşılmaz. Tüm kullanıcı verisi cihazda kalır.

## Form, soru soru

| # | Play sorusu | Önerilen yanıt | Kanıt |
|---|---|---|---|
| 1 | Uygulamanız kullanıcı verisi topluyor mu veya paylaşıyor mu? | **Hayır** | Aşağıdaki 2-7 |
| 2 | Toplanan verilerin tümü aktarım sırasında şifreleniyor mu? | Gösterilmez (veri toplanmadığı için soru çıkmaz). Çıkarsa: Evet; tek istek HTTPS | `src/android/update.ts:8-9` (`https://`) |
| 3 | Kullanıcılara verilerinin silinmesini isteme yolu sunuyor musunuz? | Gösterilmez. Çıkarsa: veri yalnız cihazda; Sıfırla / Modülü kaldır / kaldırma ile silinir; sunucuda veri yok | `src/android/db/open.ts:60` (yerel SQLite), `src/android/settings.ts` |
| 4 | Güvenlik uygulamaları: bağımsız güvenlik incelemesi, vb. | Yok, işaretlenmez | - |

### Neden "veri toplanmıyor"

Play'in tanımı: verinin cihazdan **sunucuya** çıkması. Uygulamanın bunu yapan hiçbir yolu yok.

| Veri türü | Durum | Kanıt |
|---|---|---|
| Konum | Toplanmaz | Manifestte konum izni yok: `android/app/src/main/AndroidManifest.xml:42` yalnız `INTERNET`; birleşik manifest de aynı (`USE_BIOMETRIC`/`USE_FINGERPRINT` eklenti kalıntısı, aşağıda not) |
| Kişisel bilgi (ad, e-posta, kullanıcı kimliği, adres, telefon) | Toplanmaz; hesap yok | Hesap/oturum kodu yok: `src/android/` yalnız `db/`, `paket.ts`, `settings.ts`, `update.ts`, `ports.ts`, `shell.ts`, `work.ts` |
| Finansal bilgi | Toplanmaz; satın alma yok | `package.json` ve `android/app/build.gradle` içinde faturalama/ödeme bağımlılığı yok |
| Sağlık ve fitness | Toplanmaz | - |
| Mesajlar, kişiler, takvim | Toplanmaz; izin yok | AndroidManifest |
| Fotoğraf/video, ses | Toplanmaz; kamera/mikrofon izni yok | AndroidManifest |
| Dosyalar ve belgeler | Cihazda okunur, **gönderilmez**. Kullanıcı sistem seçicisiyle bir `.qlmod` seçer, yerelde açılır | `android/app/src/main/java/com/teknesyum/quizloop/PaketPlugin.java:90-91` (`ACTION_OPEN_DOCUMENT`), `src/android/paket.ts:66` (yerel dosya adresi) |
| Uygulama etkinliği (ilerleme, cevaplar) | **Yalnız cihazda** SQLite'ta; ağa yazılmaz | `src/android/db/open.ts:14,60` (veritabanı `quizloop`, şifresiz, yerel); `capacitor.config.json` |
| Uygulama bilgisi ve performans (çökme günlüğü, tanılama) | Toplanmaz; çökme raporlama kitaplığı yok | `package.json` bağımlılıkları (Sentry, Firebase, Crashlytics, analytics yok); `rg "analytics\|telemetry\|sentry\|firebase" src` boş |
| Cihaz veya diğer kimlikler (reklam kimliği, Android ID) | Toplanmaz | Aynı arama; reklam SDK'sı yok |
| Web gezinme geçmişi | Toplanmaz | - |

### Ağ isteği

Tek istek: Ayarlar'da **Güncellemeleri denetle** düğmesi. `GET api.github.com/repos/Teknesyum/Quizloop/releases/latest`;
gövde ve kimlik bilgisi gönderilmez; yalnızca kullanıcı basınca çalışır.
Kanıt: `src/android/update.ts:9` (adres), `:31` (`CapacitorHttp.get`), çağıran yalnız
`src/renderer/src/screens/Settings.tsx:265` ve `src/renderer/src/components/UpdateTools.tsx:71,130`
(tıklamayla). Başlangıçta otomatik çağrı yok (`rg "update.check" src` yalnız bu yerleri verir).
Bu istek kullanıcı verisi içermediğinden "toplama" sayılmaz; Play'in "paylaşma" tanımına girmez
(GitHub bir hizmet sağlayıcıya aktarım değil, kullanıcının başlattığı genel API isteğidir).
Bu yorum Google'ın yanıtına bağlı bir gri alandır: form incelemesinde sorulursa, açıklama
yukarıdaki cümledir.

### Dış bağlantılar

`@capacitor/browser` ile kaynak kod ve sürüm sayfası açılır (`src/android/shell.ts:132`,
`src/android/update.ts:55`). Sistem tarayıcısı/Custom Tabs'ta açılır, uygulama veri göndermez.

### Yedekleme (Auto Backup)

`allowBackup="true"` (`AndroidManifest.xml:5`); veritabanı, sharedpref ve `files/` dahil,
`modules/` ve `backups/` hariç (`android/app/src/main/res/xml/backup_rules.xml:3-7`,
`data_extraction_rules.xml:3-9`). Bu, kullanıcının kendi Google hesabına Android'in yaptığı
sistem yedeğidir; geliştirici sunucusuna gitmez. Play formunda "toplama" sayılmaz
(Google, sistem Auto Backup'ını geliştirici toplaması saymaz). Politikada açıkça yazıldı
(`PRIVACY.md`, "Backups").

## Form beyanı ve politika

- Gizlilik politikası URL'si zorunlu: `PRIVACY.md` GitHub bağlantısı (commit/push sonrası).
- Uygulama reklam içermez: "Reklam içeriyor mu?" = Hayır.
- Hesap yok: "Hesap silme" (Uygulama içeriği altında) = Uygulama hesap oluşturmaz.
  Hesap oluşturma yok olduğu için hesap silme URL'si istenmez.

## Dikkat: birleşik manifestteki ek izinler

`android/app/build/intermediates/merged_manifest/release/.../AndroidManifest.xml:21-22`:
`USE_BIOMETRIC` ve `USE_FINGERPRINT`, `@capacitor-community/sqlite` eklentisinden gelir
(biyometri kapalı: `capacitor.config.json` `androidBiometric.biometricAuth=false`).
Play Console'da "izinler" altında görünür; kullanıcıya hiçbir şey sormaz. İstenirse
`AndroidManifest.xml`'e `tools:node="remove"` ile iki satır eklenerek kaldırılır.
Bu işlem kod değişikliğidir; bu iş kapsamında yapılmadı.
