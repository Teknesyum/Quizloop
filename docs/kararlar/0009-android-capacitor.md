# 0009 — Android Capacitor İle Gelir

Tarih: 2026-10-02. `PLAN.md`'deki "FSRS ana süreçte çalışır" satırını değiştirir.

**Karar.** Android sürümü Capacitor 8 ile yapılır. Ekran (`src/renderer`) iki platformda
ortaktır. Ana süreçteki saf mantık (oturum makinesi, FSRS, kuyruk, eşitleme, göçler) yeni
`src/core` katmanına taşınır ve iki kabuk onu çağırır: `src/main` (Electron, değişmez) ve
`src/android` (Capacitor). İki kabuk da aynı `window.quizloop` sözleşmesini (`shared/ipc.ts`)
doldurur; ekranda platform dalı yerine yetenek nesnesi kullanılır.

- Veritabanı: `@capacitor-community/sqlite` + kendi Kysely sürücüsü. Eklentinin
  `addUpgradeStatement` yolu kullanılmaz, göçleri `Migrator` yürütür. İlerleme ve ayarlar
  IndexedDB, OPFS ya da `localStorage`'da tutulmaz.
- Modül APK'ya girmez. Kullanıcı tek parça `.qlmod`'u dosya seçiciyle verir, native unzip
  geçici dizine açar, doğrulanınca atomik taşınır. Baytlar WebView'dan geçmez.
- Kitap PDF'i `quizforge paket` aşamasında bölüm bölüm ayrılır. Bölüm çalışırken yalnız o
  bölümün PDF'i açıktır; karışık modda soru sayfasının bölümü açılır.
- Güncelleme: önce GitHub Releases'te imzalı APK, sonra Play Store (AAB, App Signing).
- Electron'u Capacitor'a sokan `capacitor-community/electron` kullanılmaz.

**Neden.** Ekran zaten tek sözleşmeyle konuşuyor; React Native ya da Tauri ekranı veya arka
yüzü baştan yazdırırdı. Saf mantığı ortak çekirdeğe almak masaüstüne de test kazancı verir.
Native SQLite verinin gerçek dosyada durmasını sağlar; Android WebView deposunu silebiliyor
(Super Productivity #7892). Capacitor Filesystem base64 köprüsü yüzlerce MB'ta kullanılamaz.
Telefonda 412 MB PDF'i bölmek bellek sınırını aşar.

Kaynaklar: `docs/inceleme/01-capacitor-teknik.md`, `docs/inceleme/02-acik-kaynak.md`
(31 repo), `docs/danisma/001-fable-android-capacitor.md`.
