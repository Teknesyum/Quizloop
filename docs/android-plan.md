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
- **Durum (2026-10-02): tamam.** Kütüphaneler kullanılmadı: `@capawesome/capacitor-file-picker`
  `content://` adresini verir, ama `@capgo/capacitor-zip` yalnız gerçek dosya yolu açar; paket
  önce önbelleğe kopyalanırdı (+650 MB, ilerleme yok). Yerine tek Java eklentisi
  `android/app/.../PaketPlugin.java` (Kotlin `build.gradle` değişikliği isterdi):
  `ACTION_OPEN_DOCUMENT` → `ContentResolver` akışı → `ZipInputStream` →
  `files/modules/.tmp-<id>/`; yol kaçışı denetimi, `StatFs` ile boş alan ≥ 2 × paket,
  `rename` ile atomik taşıma (eski sürüm `.old-*`), açılışta `.tmp-*`/`.old-*` süpürme.
  JS tarafı `src/android/paket.ts`: `checkFolder` → `commit` → `syncFolder`; ilerleme
  `work.onProgress`'e (`extract` MB, `verify`, `sync`). Bloklar `convertFileSrc` + `fetch` ile
  okunur; baytlar köprüden geçmez. Düğme `capabilities.packageImport` ile görünür.
- **Ölçüm (a8_test, Android 14, WebView 113, debug):** paket 648 MB (272 MB modül + 412 MB
  kitap PDF'i, 4462 dosya, 3761 soru).

  | | İlk kurulum | Üstüne kurulum |
  |---|---|---|
  | Açma (unzip) | 4,3 sn | 5,2 sn |
  | Doğrulama (`checkFolder`) | 1,5 sn | 1,2 sn |
  | `syncModule` | 4,3 sn | 2,1 sn |
  | Toplam | 10,1 sn | 8,6 sn |

  Tepe bellek: uygulama PSS ~109 MB (VmHWM 224 MB), WebView işlemi RSS en çok 217 MB.
  Geçici alan: yalnız açılmış ağaç (681 MB); paket kopyalanmaz, taşıma sonrası ek alan yok.
  Not: WebView işlemine `dumpsys meminfo <pid>` bir denemede onu çökertti; RSS `/proc`'tan okundu.
- `syncModule` ilk ölçümde 19,9 sn idi (kart başına bir köprü çağrısı). Yeni kartlar 40'lık
  çoklu `INSERT` ile yazılınca 4,3 sn; 10 sn eşiğinin altında, wa-sqlite gerekmez.
- Uygulama paket açılırken çökerse artık `.tmp-*` bir sonraki açılışta silinir (denendi).
- Açık: büyük modülde her açılıştaki `resyncFolders` 2,2 sn sürüyor (76 blok okunup
  özetleniyor); sürüm değişmediyse atlanabilir. Kitap PDF'i açılıyor ama Android'de
  gösterilmiyor (`books.path` null), A5'te. Veri tanımlayıcılı (bit 3) STORED girişli zip
  `ZipInputStream`'de açılmaz; `quizforge paket` ve Python `zipfile` bu biçimi üretmez.
  Gerçek telefonda ve release derlemesinde ölçüm yapılmadı.

### A5 — Kitap

- `quizforge paket`: qpdf `--pages` ile `chapters.json` aralıklarından bölüm PDF'leri,
  manifestte `{bolum, ilkSayfa, sonSayfa, dosya}`. Masaüstü tam PDF'i kullanmaya devam eder.
- Görüntüleyici: sayfa → bölüm eşlemesi, ofset; bölüm modunda tek parça açık; karışık
  modda bir sonraki sorunun bölümü önceden ısıtılır.
- pdf.js ölçeği `devicePixelRatio ≤ 2`; görünmeyen sayfanın canvas'ı bırakılır.
- Ölçüm: parçaların toplamı 412 MB'ı %20'den fazla aşarsa `--object-streams=generate`.

- **Durum (2026-10-02): tamam, gerçek telefon hariç.** Tasarım: ayrı Android paketi.
  `quizforge paket --android` → `dist-modules/<id>-<sürüm>-android.qlmod`; içinde tam PDF yok,
  yalnız `kaynak/bolum/NN.pdf` ve `source.bolumler`. Masaüstü paketi ve diskteki `module.json`
  değişmedi (`bolumler` yalnız Android paketindeki manifestte). Gerekçe: telefonda 412 MB
  kazanılır; Capacitor yerel sunucusu Range isteğine tüm dosyayı sahte `Content-Range` ile
  döndürdüğü için tam PDF parça parça okunamaz, tamamı da belleğe alınamaz. Bu yüzden Android'de
  tam PDF'e geri dönüş yok; masaüstü paketi telefona kurulursa yalnız kesit görselleri görünür.
  qpdf 12.4.2 winget ile makineye kuruldu; yol `QPDF`, `PATH` ya da `Program Files\qpdf*`;
  `quizforge doctor` gösterir. qpdf uyarı kodu 3 kabul edilir.
- Görüntüleyici: `bookTarget` sorunun PDF sayfasını içeren parçayı seçer; parça tümüyle
  `fetch` + `getDocument({data})` ile açılır, `openBook` tekil olduğu için aynı anda tek parça
  açıktır. PageFlip indeksi `shift` (bölüm başının çift hizası) kadar kaydırılır, yerel sayfa
  `kitap sayfası + ofset − (ilkSayfa − 1)`; folyo genel PDF sayfasını gösterir; Önceki/Sonraki
  bölüm sınırında kapanır. Isıtma: oturumda soru ekrandayken o sorunun parçası boşta açılır
  (`QuestionView.kaynak`); bir sonraki sorunun parçası önceden ısıtılmıyor. DPR ≤ 2; görünmeyen
  sayfanın canvas'ı 0×0 yapılır. İki parmak yakınlaştırma `capabilities.pinchZoom` ile açık;
  ilk parmak PageFlip'e çevirme olarak gitmesin diye çimdik başlayınca dokunuş sıfırlanır.
  Android'de "Kitabı seç" düğmesi `capabilities.folders` ile gizli.
- WebView 113 açıkları: pdf.js legacy derlemesi `Promise.withResolvers`,
  `ArrayBuffer.transferToFixedLength`, `ReadableStream` async yineleme ve `Response.bytes`
  için yama getirmiyor. Belirti: sayfa beyaz kalır, işaret çıkmaz. `src/android/polyfill.js`
  ana iş parçacığında yüklenir; işçi `pdfworker.ts` içinde blob modülünden önce yamayı sonra
  pdf.js işçisini içe aktarır (CSP `worker-src blob:`; yama `?url&no-inline` ile ayrı dosya).
- **Ölçüm (a8_test, Android 14, WebView 113, debug, 393×778 @ 2,75):**
  - Parçalar: 59 bölüm, 1,7–19,1 MB, toplam 406,7 MB = kitabın %98,7'si; eşik aşılmadı.
    `--object-streams=generate` denemesi 405,3 MB, fark önemsiz.
  - Android paketi 642,5 MB (masaüstü 647,6 MB). Kurulum: açma 7,2 sn, doğrulama 1,9 sn.
  - Parça açma (fetch + ayrıştırma + 786 px ilk sayfa): 1,7 MB 0,24 sn; 6,2 MB 0,19 sn;
    18,3 MB 0,40 sn; 19,1 MB 0,43 sn.
  - "Lange'de gör" → ilk çizilmiş canvas: 0,71–0,82 sn (parça ısıtılmış); canvas 726×1126.
  - Tepe bellek: WebView işlemi VmHWM 371 MB (RSS 317 MB, PSS 217 MB), uygulama VmHWM
    273 MB (PSS 115 MB); bölüm + karışık oturum, iki zoom, 4 parça art arda açıldıktan sonra.
- Denendi: Kütüphane → 6. bölüm → oturum → "Lange'de gör" doğru sayfa (113, 124, 115) ve
  alıntı altı çizili; bölüm başında Önceki, sonunda Sonraki kapalı; çimdikle %220 ve geri,
  sayfa kaymıyor. Karışık oturumda her soru yalnız kendi parçasını istedi (29, 45).
- Açık: gerçek telefon ve release derlemesi denenmedi. JBIG2 görselleri `wasmUrl` verilmediği
  için çözülmüyor (masaüstü de `wasmUrl` vermiyor; sayfa yine çiziliyor). Bir sonraki sorunun parçası
  önceden ısıtılmıyor.

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
- **Durum (2026-10-02): kısmen tamam.** `release` imzası ortam değişkenlerinden okunur
  (`QUIZLOOP_KEYSTORE`, `_KEY_ALIAS`, `_STORE_PASSWORD`, `_KEY_PASSWORD`); yoksa imzasız
  derlenir. `npm run android:release` APK + AAB üretir, şifreyi gizli girdiyle sorar. İmzasız
  `assembleRelease`/`bundleRelease` derlendi (APK 13,8 MB, AAB 10 MB); gerçek anahtarla imza
  sınanmadı. R8 kapalı, eklenti kuralları `proguard-rules.pro`'da hazır. Android'de GitHub
  sürüm denetimi (`src/android/update.ts`, `CapacitorHttp` + `@capacitor/browser`), Ayarlar'da
  lisans ve kaynak bağlantısı, `settingsFile` yeteneği ve göç öncesi `VACUUM INTO` yedeği
  (`files/backups/`, son 2) eklendi. Cihazda sınanmadı; GitHub Actions ve `sideload` flavor açık.

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
