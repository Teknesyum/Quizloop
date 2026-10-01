# Danışma 001: Quizloop Android (Capacitor) Geçişi — Görüş İsteği

claude-fable-5-1, 7.898 çıktı token, 148 sn. Girdi: [001-fable-android-capacitor-girdi.md](001-fable-android-capacitor-girdi.md). Cevap olduğu gibi:

---

# Danışma 001 — Görüş: Quizloop Android (Capacitor)

Girdi dosyasını, `docs/inceleme/01` ve `02`'yi, `src/main` içindeki bağımlılıkları (`machine.ts`, `fsrs.ts`, `queue.ts`, `sync.ts`, `loader.ts`, `install.ts`, `db/index.ts`, `protocol.ts`) ve `bookdoc.ts`'yi okudum. Her soruya bir öneri, gerekçe, risk.

## 1. Platform katmanı: `src/core` + iki ince adaptör

**Öneri.** `src/main`'in saf kısmını yeni bir `src/core`'a taşı: `session/machine`, `scheduler/fsrs`, `scheduler/queue`, `modules/sync`, `db/migrations`, `db/types`. Hepsi zaten yalnızca `Kysely<Database>` tipine ve `@shared`'e bağlı; tek Node sızıntısı `machine.ts`'teki `node:crypto` `randomUUID` — `globalThis.crypto.randomUUID()` ile değişir, iki yerde de çalışır. `loader.ts` ise `node:fs` + `createHash` kullanıyor; onu core'a alırken `readText(path)`, `exists(path)`, `sha256(bytes)` üçlüsünü port olarak enjekte et. Ayrı bir `src/android` kabuğu yalnızca `window.quizloop`'u dolduran adaptörü ve Capacitor eklenti çağrılarını (dosya seçici, zip, SQLite sürücüsü, `convertFileSrc`) taşır; `src/main` Electron kabuğu olarak kalır ve core'u çağırır. `handlers.ts` (362 satır) ad alanı başına bölünüp "kabuktan bağımsız komut" + "kabuk" diye ikiye ayrılırsa adaptör de onu yeniden kullanır.

**Gerekçe.** Sözleşme fiil odaklı ve tek dosyada (`ipc.ts`), inceleme 02'nin "bayrak değil sözleşme" bulgusu bunu doğruluyor. Core, Node'da `vitest` ile test edilir; Android'de WebView içinde aynı kod koşar. `capacitor-community/electron` gibi Electron'u Capacitor'a sokma yoluna girme.

**Risk.** `PLAN.md`'deki "FSRS ana süreçte" cümlesi geçersiz olur; karar kaydı gerekir (`docs/kararlar/`). Core Android'de ana iş parçacığında (WebView) koşacağı için uzun `syncModule` döngüleri arayüzü kilitler; ya Web Worker'a al ya da `await` ile parçala. Rende'rın `platform === 'android'` dallanmaları çoğalırsa `capabilities` nesnesiyle (`hasWindowChrome`, `hasShortcuts`, `pinchZoom`) yönet.

## 2. SQLite: native eklenti, kendi Kysely diyalekti

**Öneri.** `@capacitor-community/sqlite` + ~100 satırlık kendi `Dialect` (Kysely'nin hazır `SqliteAdapter`/`SqliteQueryCompiler`/`SqliteIntrospector`, yalnızca `Driver` sınıfı yeni). `Migrator` + mevcut statik `provider` aynen kalır; eklentinin `addUpgradeStatement`'ı kullanılmaz.

**Gerekçe.** Veri uygulama özel dizininde gerçek dosya olur; Android WebView'in OPFS/IndexedDB'sini silebildiği belgeli (SP #7892). Kysely zaten asenkron arayüz, better-sqlite3'ün senkronluğu kod şeklini değiştirmemiş; köprü gecikmesi yalnızca çok sayıda küçük sorgu yapan yerlerde hissedilir.

**Risk.** Üç bilinen tuzak: `RETURNING` bozuk (#670) — `insert` sonrası ayrı `select`; WebView yeniden yüklenince bağlantı kilidi (#659) — bağlantı nesil sayacı + arka plandan dönüşte yeniden aç; WAL anahtarı belgesiz — `PRAGMA journal_mode=WAL` dene, olmuyorsa `DELETE` modunda kal, kayıp olmaz. Ölçüm: `syncModule`'ün 9 MB JSON'u tek transaction'da kaç saniyede yazdığı. 10 saniyeyi geçerse ikinci yol wa-sqlite/OPFS, ama ancak ölçümden sonra.

## 3. 650 MB `.qlmod`: yol geçir, native aç, geçici dizine aç-sonra-taşı

**Öneri.** Akış: `@capawesome/capacitor-file-picker` (`readData: false`, sadece `path`) → `@capgo/capacitor-zip` ile `files/modules/.tmp-<id>/` altına açma (ilerleme olayı → mevcut `WorkProgress` kanalı) → `readMeta` + `validateModule` → atomik `rename` ile `files/modules/<id>/` → `syncModule`. Başlamadan `StatFs` ile boş alan kontrolü (en az 2× paket boyutu). Byte'lar WebView'dan geçmez; `fflate` Android'de kullanılmaz.

**Gerekçe.** `Filesystem.readFile/writeFile` base64 köprüsü 26 MB civarında çöküyor; zip4j native ve streaming. `.tmp-` kalıbı mevcut `paket.ts`'nin `mkdtemp` yaklaşımına denk düşer; yarım kurulum açılışta `.tmp-*` süpürülerek temizlenir, bu da kesinti dayanıklılığını verir.

**Risk.** İki açık soru ölçülmeli: Capgo zip'in 650 MB'ta gerçek davranışı ve seçicinin SAF `content://` dosyasını önbelleğe kopyalayıp kopyalamadığı (kopyalıyorsa 1.3 GB geçici alan ve ekstra dakikalar). Kopyalıyorsa Capgo zip'e `content://` URI'yi doğrudan verebilen 60 satırlık kendi Kotlin eklentini yaz; bu zaten inceleme 02'nin önerisi. Ayrıca `backup_rules.xml` ile `modules/` yedeklemeden hariç tut, yoksa Auto Backup 25 MB'ta sessizce vazgeçer ve ilerleme veritabanı da yedeklenmez.

## 4. PDF bölme: paketleme aşamasında, masaüstünde

**Öneri.** `quizforge paket`'te qpdf (`--pages`) ile `chapters.json`'daki aralıklara göre bölüm başına PDF üret: `sources/<kitap>/parts/<bolum>.pdf`; manifeste `{bolum, ilkSayfa, sonSayfa, dosya}` yaz. Rastgele modda sayfa → bölüm eşlemesi manifestten bulunur, o bölümün PDF'i açılır, `pageNumber - ilkSayfa + 1` ile sayfaya gidilir. Mevcut `kaynak` kayıtlarındaki sayfa numaraları değişmez; yalnızca görüntüleyici ofset uygular. Masaüstü isterse tam PDF'i kullanmaya devam eder (iki yol da `SourceBook` sözleşmesine sığar: `url` + `offset`).

**Gerekçe.** `bookdoc.ts` bugün özel protokol üzerinden Range (206) ve `?r=` çoklu aralık uç noktasına dayanıyor; Capacitor'ın `convertFileSrc` sunucusunun Range'i güvenilir verdiği teyit edilmedi (video sorunları #6021). Bölünmüş dosyalarda Range gerekmez: 412 MB / ~40 bölüm ≈ 10 MB, pdf.js bunu `data` olarak yükler. Telefonda bölme işi (pdf-lib ile 412 MB'ı WebView'da) bellek açısından yapılamaz.

**Risk.** qpdf bölme paylaşılan kaynakları (yazı tipi, görseller) her parçaya kopyalar; toplam boyut 412 MB'tan büyüyebilir — paketleme sonunda ölç, `%20`'yi geçerse `--object-streams=generate` dene. Rastgele modda "biraz geç" açılışı 10 MB'lık dosyada 1–2 saniye; bir sonraki sorunun bölümünü `warmBook` ile önceden ısıt. pdf.js render ölçeğini `devicePixelRatio` ≤ 2'ye bağla, geçilen sayfanın canvas'ını serbest bırak.

## 5. İlk ince dilim: beş adım, her biri cihazda ölçülür

1. **İskelet** (1 gün): `src/core` ayrımı + `randomUUID` düzeltmesi; Node testleri yeşil; Electron değişmeden çalışır. Bu adım Android'den bağımsız kazanç ve en düşük risk.
2. **Boş kabuk** (1 gün): Capacitor 8, ayrı Vite girişi (`src/renderer` aynı, `index.android.html` + `android-shell.ts`), `window.quizloop`'un `app/settings/window` ad alanları; `_ornek` modülü APK assets'inden kurulu gelir. Emülatörde Library ekranı açılır.
3. **Veritabanı** (1–2 gün): SQLite eklentisi + diyalekt + `Migrator`; `_ornek` ile oturum tamamlanır, ilerleme yazılır. **Kabul testi gerçek cihazda:** arka plana al → zorla durdur → yeniden aç → ilerleme yerinde; işlem ortasında öldür → `quick_check` ok.
4. **Büyük paket** (2 gün): seçici + zip + atomik taşıma; 686 MB paketle süre ve bellek ölçümü. En büyük bilinmeyen burada; 2. adımdan hemen sonra bir "yalnızca unzip" prototipi ile öne çekilebilir.
5. **Kitap** (2 gün): paketlemede bölme + görüntüleyicide ofset + iki parmak zoom. Dokunmatik yerleşim ve geri tuşu yöneticisi bu adımla gelir.

Sonra: GitHub Releases'te imzalı APK + uygulama içi "yeni sürüm var" denetimi (mevcut `UpdateStatus` kalıbı); Play için 12 kişi / 14 gün sayacı kapalı testte erkenden başlasın.

**En büyük üç risk, sırayla:** (a) 650 MB içeri alma süresi ve çift disk alanı; (b) WebView arka plan/yeniden yükleme sonrası SQLite kilidi; (c) release derlemesinde R8'in eklenti sınıflarını kırpması — `assembleRelease` çıktısı her dilimde cihazda açılmalı, debug'a güvenme.

## 6. Gözden kaçan tuzaklar

- **`androidScheme`** baştan kararlaştırılır (`https` öner), sonradan değişmez; değişirse WebView yerel deposu kaybolur. SQLite dosya tabanlı olduğu için ilerleme etkilenmez ama ayarlar etkilenir — ayarları da SQLite'a ya da `Preferences` eklentisine koy, `localStorage`'a değil.
- **WebView sürümü:** asgari 111 (View Transitions, Highlight API, `:has()`). Açılışta `@capgo/capacitor-webview-version-checker` ile uyar; `CSS.highlights` ve `document.startViewTransition` için özellik algılama + geri düşme, yoksa daktilo tamamen kaybolur.
- **Bellek:** WebView süreci düşük bellekli telefonda ~300–500 MB'ta öldürülür. 210 MB görsel dizini sorun değil (diskten `convertFileSrc`), sorun pdf.js canvas'ları ve `syncModule` sırasında 9 MB JSON'un `JSON.parse` ikizi. Blokları tek tek parse et, tutma.
- **Varlık adları:** APK'ya gömülen `_ornek` içinde `.gz` ve `.mjs` uzantısı kullanma (aapt2 ve WebView MIME tuzakları). pdf.js worker'ı Vite üzerinden `?url` ile geliyor, derlemede `.mjs` olarak çıkıyorsa `.js`'e yeniden adlandır.
- **Play politikaları:** `REQUEST_INSTALL_PACKAGES` Play sürümüne girmesin (ayrı `sideload` flavor); `targetSdk 36`; yeni uygulamalar AAB + Play App Signing. Sideload için Google'ın geliştirici doğrulaması 2027'de küresel oluyor; GitHub APK yolu zamanla sürtünmeli, Play'i erteleme.
- **AGPL:** Play'de sorun değil, ama uygulama içinde lisans ve kaynak bağlantısı görünür olsun (Ayarlar'da). `@capacitor-community/sqlite` MIT, SQLCipher BSD; ihracat sınıflandırma notu Play Console'da "şifreleme kullanıyor mu" sorusuna "evet, yalnızca açık kaynak standart" cevabı demektir.
- **İmzalama:** yükleme anahtarı CI gizlisi olarak base64; `*.jks`, `keystore.properties` `.gitignore`'a ilk commit'te. Anahtar kaybı Play'de kurtarılır (App Signing), GitHub APK'da kurtarılmaz — yedeğini şifreli sakla.
- **Depolama izni:** SAF seçici izin istemez; `MANAGE_EXTERNAL_STORAGE` isteme (Play reddeder). Dışa aktarma (`transfer`) için de SAF `createDocument` yolu, doğrudan `Downloads/` yazma değil.
- **Geri tuşu:** `@capacitor/app` varsayılanı uygulamayı kapatır; Session → Chapters → Library yığınını kendi yöneticinle ele al, Session içinde geri = "oturumu bırak" onayı.
- **Zaman:** `dayStart` ve FSRS günü cihaz saat dilimine bağlı; telefon ile masaüstü farklı dilimdeyse kart "bugün" sınırı kayar. Core'a `now()` ve `timezone` port olarak gir, UTC'de sakla.

## Tek cümlelik karar

Core'u çıkar, Electron'a dokunma, Android'e ince bir kabuk + native SQLite + native unzip ekle, PDF'i masaüstünde böl, ilk dilimi 650 MB paket ölçümüyle sına.
