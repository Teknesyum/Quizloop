# Quizloop Android — Plan

Karar: `docs/kararlar/0009-android-capacitor.md`. Kaynaklar: 31 repo
(`docs/inceleme/01-capacitor-teknik.md`, `docs/inceleme/02-acik-kaynak.md`), Fable görüşü
`docs/danisma/001-fable-android-capacitor.md`.

## Kullanıcının Kuralları

1. Modül APK'ya girmez, sonradan içeri alınır.
2. 650 MB tek parça `.qlmod` sorun değil.
3. Veritabanı Android'e uygun SQLite.
4. Dokunmatik arayüz: kısayol yerine dokunma, pencere düğmesi yok, kitapta iki parmak
   yakınlaştırma, telefon yerleşimi.
5. Kitap: bölüm çalışırken yalnız o bölümün PDF parçası açık; karışık modda sorunun
   sayfası biraz geç açılabilir.
6. Güncelleme: electron-updater gider; GitHub APK, sonra Play Store (25 $ hesap).
7. Daktilo ve geçiş animasyonları korunur.

## Mimari

```
src/shared    tipler, zod, ipc sözleşmesi             (değişmez)
src/core      oturum, FSRS, kuyruk, eşitleme, göçler   (yeni, src/main'den taşınır)
src/main      Electron kabuğu: fs, better-sqlite3, protokol, updater
src/android   Capacitor kabuğu: SQLite sürücüsü, seçici, unzip, convertFileSrc
src/renderer  ortak ekran; platform dalı yerine `capabilities`
android/      Capacitor'ın ürettiği Gradle projesi
```

- Core yalnız `Kysely<Database>` ve port arayüzleri görür: `readText`, `exists`, `sha256`,
  `now`, `randomUUID`. Node'a ya da Capacitor'a doğrudan dokunmaz.
- `handlers.ts` ad alanı başına "komut" (core) ve "kabuk" diye ikiye ayrılır.
- `capabilities`: `windowChrome`, `shortcuts`, `pinchZoom`, `backButton`, `updater`.

## Aşamalar

Her aşama emülatörde ve gerçek telefonda **release** derlemesiyle denenir; debug'a
güvenilmez (R8 eklenti sınıflarını kırpabilir).

### A1 — Çekirdek Ayrımı (Android'e Dokunmaz)

- `src/core` kurulur; `session/machine`, `scheduler/*`, `modules/sync`, `db/migrations`,
  `db/types` taşınır. `node:crypto` yerine `globalThis.crypto.randomUUID()`.
- `loader.ts` port alır.
- Kabul: `npm test`, typecheck, lint, ui:scan yeşil; Electron uygulaması aynen çalışır.

### A2 — Boş Kabuk

- Capacitor 8 (`@capacitor/core`, `cli`, `android`), `appId: com.teknesyum.quizloop`,
  `androidScheme: https` (sonradan değişmez).
- Ayrı Vite girişi: `index.android.html` + `src/android/shell.ts`; `window.quizloop`'un
  `app`, `settings`, `window`, `flags` ad alanları.
- `_ornek` modülü APK assets'inden gelir; `.gz` ve `.mjs` uzantısı yok.
- Kabul: emülatörde Kütüphane ekranı açılır.
- **Durum (2026-10-02): tamam.** Giriş `src/android/index.html` + `boot.ts` + `shell.ts`;
  `npm run android:apk` → `dist-android/QuizLoop-0.6.0-debug.apk` (15,4 MB). a8_test
  (Android 14, WebView 113) üzerinde açıldı. pdf.js Android derlemesinde `legacy` sürümüne
  bağlandı (WebView < 122'de `Iterator` yok). `capabilities` ile masaüstü bölümleri gizli;
  geri tuşu Oturum → Bölümler → Kütüphane, oturumda bitirme onayı sorar.

### A3 — Veritabanı

- `@capacitor-community/sqlite` + kendi Kysely `Driver`'ı; `RETURNING` kullanılmaz.
- Bağlantı nesil sayacı; arka plandan dönüşte yeniden açma; açılışta `quick_check`.
- `PRAGMA journal_mode=WAL` denenir, olmazsa `DELETE`.
- `backup_rules.xml`: `modules/` yedeklemeden hariç, veritabanı dahil.
- Kabul: `_ornek` ile oturum biter, ilerleme yazılır. Zorla durdur → aç → ilerleme yerinde.
- Ölçüm: `syncModule` 9 MB JSON'u kaç sn'de yazıyor. 10 sn üstü → wa-sqlite yeniden
  değerlendirilir.
- **Durum (2026-10-02): tamam, ölçüm hariç.** WAL açıldı, `quick_check` ok. İlk açılış
  412 ms (DB 256, `_ornek` eşitleme 147), sonraki açılışlar ~250 ms. Oturum bitti, zorla
  durdurup açınca ilerleme yerinde (%13, 1 emekli). Android'de göç öncesi yedek yok.
  9 MB `syncModule` ölçümü gerçek modülle A4'e kaldı.

### A4 — Büyük Paket

- `@capawesome/capacitor-file-picker` (`readData: false`) → `@capgo/capacitor-zip` ile
  `files/modules/.tmp-<id>/` → doğrula → atomik taşı → `syncModule`.
- Başlamadan boş alan ≥ 2 × paket. Açılışta artık `.tmp-*` süpürülür.
- İlerleme mevcut `work:progress` kanalına bağlanır.
- Seçici `content://` dosyasını önbelleğe kopyalıyorsa: küçük Kotlin eklentisi URI'den
  doğrudan akıtır.
- Kabul ve ölçüm: 686 MB paket; süre, tepe bellek, geçici alan.
- **En büyük bilinmeyen.** A2 biter bitmez yalnız-unzip prototipiyle öne çekilir.

### A5 — Kitap

- `quizforge paket`: qpdf `--pages` ile `chapters.json` aralıklarından bölüm PDF'leri,
  manifestte `{bolum, ilkSayfa, sonSayfa, dosya}`. Masaüstü tam PDF'i kullanmaya devam eder.
- Görüntüleyici: sayfa → bölüm eşlemesi, ofset; bölüm modunda tek parça açık; karışık
  modda bir sonraki sorunun bölümü önceden ısıtılır.
- pdf.js ölçeği `devicePixelRatio ≤ 2`; görünmeyen sayfanın canvas'ı bırakılır.
- Ölçüm: parçaların toplamı 412 MB'ı %20'den fazla aşarsa `--object-streams=generate`.

### A6 — Dokunmatik Ve Telefon Yerleşimi

- Şıklara dokunma, alt eylem çubuğu, pencere düğmeleri yok, güvenli alan boşlukları.
- Geri tuşu yığını: Oturum → Bölümler → Kütüphane; oturumda geri = bırakma onayı.
- İki parmak yakınlaştırma; teknesyum-ui tokenları dışına çıkılmaz, `ui:scan` geçer.
- WebView ≥ 111 denetimi; `CSS.highlights` ve `startViewTransition` yoksa geri düşme.

### A7 — Dağıtım

- İmza: yükleme anahtarı CI gizlisi (base64); `*.jks`, `keystore.properties` gitignore'da;
  şifreli yedek.
- GitHub Actions: `assembleRelease` (APK) + `bundleRelease` (AAB), release'e eklenir.
- GitHub APK için "yeni sürüm var" denetimi (mevcut `UpdateStatus` kalıbı); kurulum
  ayrı `sideload` flavor'ında, Play sürümüne `REQUEST_INSTALL_PACKAGES` girmez.
- Play: `targetSdk 36`, AAB + App Signing, kapalı testte 12 kişi / 14 gün sayacı **A3
  biter bitmez** başlatılır. Ayarlar'da AGPL lisansı ve kaynak bağlantısı görünür.

## Riskler

| Risk | Erken sınama |
|---|---|
| 650 MB içeri alma süresi ve çift disk alanı | A4 prototipi A2'den hemen sonra |
| Yeniden yükleme sonrası SQLite kilidi (#659) | A3 kabul testi, zorla durdurma |
| R8'in eklentileri kırpması | Her aşama release derlemesiyle |
| Düşük bellekli telefonda WebView ölümü | pdf.js canvas sınırı, blokları tek tek parse |
| Saat dilimi farkıyla "bugün" kayması | Core'a `now` ve `timezone` port, UTC sakla |
| Sideload doğrulaması 2027'de küresel | Play yolunu erteleme |

## Kullanıcıdan Gerekenler

- Play Console geliştirici hesabı (25 $), A3 bitince.
- Kapalı test için 12 test kullanıcısı (e-posta listesi).
- Gerçek bir Android telefon, USB hata ayıklama açık.
