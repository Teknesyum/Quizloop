# Capacitor Android Taşıma: Teknik İnceleme

Tarih: 2026-10-02. Yöntem: web araması ve resmi belgeler. "Doğrulanmadı" yazan satırlar kaynaktan teyit edilemeyen veya bilgi birikimine dayanan noktalardır.

## 1. Capacitor Sürümü ve Kurulum

**Bulgu**
- Güncel kararlı ana sürüm Capacitor 8 (8 Aralık 2025). v7 uzatılmış destekte, 8 Haziran 2026'da bakım bitti.
- v8 asgari gereksinimleri: Node 22, Android Studio 2025.2.1, Android 7.0 (API 24). Quizloop zaten `node >=22` istiyor.
- Capacitor, Chrome 60+ sürümlü bir Android WebView ister. Kullanılacak web özellikleri (bölüm 6) pratikte bunu çok yukarı çeker.
- Emülatörde System WebView otomatik güncellenmez; gerçek cihazda güncellenir.
- Kurulum sırası: `npm i @capacitor/core @capacitor/cli @capacitor/android`, `npx cap init`, web derlemesi, `npx cap add android`, `npx cap sync`, `npx cap open android` veya `npx cap run android`. `webDir` Vite çıktısı olmalı; electron-vite renderer çıktısı yerine ayrı bir Vite web hedefi gerekecek.
- JDK/Gradle: okuduğum belgede açık JDK sürümü yok. Capacitor 8 şablonunun Java 21 istediği bilgi birikimime dayanıyor, doğrulanmadı; makinedeki JDK 21 ve SDK 36 uyumlu görünüyor. Gradle sarmalayıcı (`gradlew`) projeyle gelir, ayrıca kurulum gerekmez.

**Öneri**
- Capacitor 8 ile başla. Renderer'ı ayrı bir Vite girişiyle derle; `window.quizloop` sözleşmesini (`src/shared/ipc.ts`) Capacitor'a özel bir adaptörle uygula. Sözleşme aynı kalsın.

**Kaynaklar**
- https://capacitorjs.com/docs/main/reference/support-policy
- https://capacitorjs.com/docs/android

## 2. SQLite

**Bulgu**
- `@capacitor-community/sqlite`: ücretsiz topluluk eklentisi, 663 yıldız, 823 commit, Android/iOS/Electron/Web. Android'de SQLCipher kullanır (şifresiz veritabanında bile); yıllık ihracat sınıflandırma notu var. Transaction ve toplu çalıştırma desteği var.
- `@capawesome/capacitor-sqlite`: yalnızca Capawesome Insiders (ücretli, özel npm kaydı). Sürüm 0.4.x, Capacitor 8 destekli. Android'de sistem SQLite'ı veya requery/sqlite-android, isteğe bağlı SQLCipher. Çağrı başına tek SQL ifadesi sınırı var. WAL ayarı belgede yok.
- Kysely diyalektleri: (a) `@capawesome/capacitor-sqlite-kysely` (Eylül 2026 blog yazısı; capawesome eklentisine bağlı, yani ücretli); (b) `capacitor-sqlite-kysely` (DawidWetzler, MIT, 19 yıldız, 7 commit, topluluk eklentisine bağlı; çok küçük, az bakımlı).
- Kysely transaction'ı BEGIN/COMMIT/ROLLBACK'i otomatik yönetir. Ama eklenti köprüsü her sorguyu WebView-native arası asenkron çağırır; masaüstündeki senkron better-sqlite3 kalıbı (çok sayıda hızlı sorgu) mobilde yavaşlar.
- WASM alternatifi (wa-sqlite / SQLite WASM + OPFS): OPFS Android WebView'da Chrome 107'den beri var. Worker içinde OPFS arka ucu IndexedDB arka ucundan yaklaşık 5 kat hızlı yazma verdi (masaüstü ölçümü). Tek transaction'da toplu yazma hızlı, çok sayıda küçük transaction yavaş. sql.js veritabanını bellekte tutar, büyük veri için uygun değil.
- WAL: topluluk eklentisinde belgelenmiş bir WAL anahtarı bulamadım; `PRAGMA journal_mode=WAL` denenebilir, doğrulanmadı. Android WebView'da OPFS VFS performansı ölçülmedi.

**Öneri**
- Birincil yol: `@capacitor-community/sqlite` (ücretsiz, yerel SQLite) + kendi yazacağımız ince Kysely diyalekti. Diyalekt kısa bir iş (sürücü, bağlantı, derleyici; SQLite için Kysely'nin hazır sınıfları kullanılır); az bakımlı üçüncü taraf pakete bağlanmaktan güvenli.
- Oturum ve FSRS güncellemeleri gibi toplu yazmaları tek transaction'da topla.
- OPFS + wa-sqlite yalnızca yerel eklenti darboğaz çıkarırsa ikinci seçenek. Karar için prototipte kendi veriyle ölçüm yap.

**Kaynaklar**
- https://github.com/capacitor-community/sqlite
- https://capawesome.io/docs/sdks/capacitor/sqlite/
- https://capawesome.io/blog/how-to-use-kysely-with-capacitor-and-sqlite/
- https://github.com/DawidWetzler/capacitor-sqlite-kysely
- https://capgo.app/blog/kysely-capacitor-sqlite/
- https://sqlite.org/wasm/doc/trunk/persistence.md
- https://github.com/rhashimoto/wa-sqlite/discussions/23
- https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html

## 3. Büyük Dosyalar (650 MB .qlmod)

**Bulgu**
- `Filesystem.readFile` / `writeFile` veriyi base64 dizgesi olarak WebView belleğine alır; Android 13'te büyük blob yazarken bellek taşması raporlandı (yaklaşık 26 MB civarında). 650 MB için kullanılamaz.
- Okuma için doğru kalıp: bayt değil yol geçir. `fetch(Capacitor.convertFileSrc(path)).then(r => r.blob())`; blob bellek dolunca diske taşar. Yazma için `capacitor-blob-writer` (MIT, v1.1.20, Capacitor 8 destekli): rastgele portlu yerel HTTP sunucusuna PUT akışı; Android'de 512 MB'ı yazdı, `Filesystem.writeFile` aynı boyutta çöktü. Ama bu ZIP açmayı çözmez.
- `@capawesome/capacitor-file-manager`: `readFileAsBlob`, ofsetli/uzunluklu `readFile`, `appendFile`, `copyFile`, SAF ile kalıcı klasör erişimi, sabit bellek. Yalnızca Insiders (ücretli).
- Dosya seçici: `@capawesome/capacitor-file-picker` (MIT). `readData: true` büyük dosyada çöktürür, kullanılmamalı. Dönen `path` yerel bir yoldur. Belgede "limit / önbelleğe kopyalama / pickDirectory" teyit edilemedi; eski depo arşivlendi, güncel kod capawesome-team/capacitor-plugins monoreposunda. Seçilen dosyanın önbelleğe kopyalanıp kopyalanmadığı doğrulanmadı; kopyalanıyorsa 650 MB geçici çift disk alanı gerekir.
- Açma: `@capgo/capacitor-zip` (ücretsiz, Android'de zip4j, AES parola, zip-slip koruması, ilerleme olayı). `unzip({source, destination})` yerel yoldan yerel klasöre açar; bayt WebView'dan geçmez. Alternatif: JS tarafında fflate akışlı açma + blob-writer (yavaş ve karmaşık).
- Uygulama dizinindeki dosyayı gösterme: Android'de `Capacitor.convertFileSrc(path)` sonucu `https://localhost/_capacitor_file_/...` olur ve WebViewAssetLoader ile sunulur; `<img src>` için çalışır. Büyük video dosyalarında aralıklı hata ve Range sorunları bildirildi (Capacitor issue 6021); görseller etkilenmez.

**Öneri**
- Akış: File Picker (yalnızca yol, `readData` yok) → `@capgo/capacitor-zip` ile uygulama veri dizinine açma (ilerleme olayı mevcut `WorkProgress` sözleşmesine bağlanır) → geçici kopyayı sil.
- Paket içindeki görseller `<img src={convertFileSrc(...)}>`; PDF için bölüm 4.
- Kurulum öncesi boş alan kontrolü ekle.
- Doğrulama gerekli: Capgo zip'in 650 MB'ta gerçek davranışı ve seçicinin SAF'ten kopyalama süresi. İlk iş prototip ölçümü.

**Kaynaklar**
- https://capawesome.io/blog/the-file-handling-guide-for-capacitor/
- https://github.com/ionic-team/capacitor/issues/6624
- https://github.com/diachedelic/capacitor-blob-writer
- https://capawesome.io/docs/sdks/capacitor/file-manager/
- https://github.com/capawesome-team/capacitor-file-picker
- https://github.com/Cap-go/capacitor-zip
- https://capgo.app/docs/plugins/zip/getting-started/
- https://capacitorjs.com/docs/core-apis/web
- https://github.com/ionic-team/capacitor/issues/6021

## 4. PDF

**Bulgu**
- pdf.js bellek tüketimi esas olarak canvas'tan gelir: cihaz piksel oranı 3 ise 800 piksellik sayfa yaklaşık 30 MB. Mobilde sayfa sanallaştırma ve geçilen sayfanın canvas'ını serbest bırakma şart. iOS'ta 384 MB canvas sınırı var; Android WebView için belgelenmiş sabit sınır bulamadım.
- Aralık istekleri (HTTP 206) ile pdf.js yalnızca gereken bayt aralıklarını okur; `disableAutoFetch: true` bellek ve okumayı görüntülenen sayfalara bağlar. `convertFileSrc` altındaki yerel sunucunun 206'yı güvenilir verdiği teyit edilemedi (video Range sorunları nedeniyle şüpheli).

**Öneri**
- Önceden bölümlere bölmek iyi fikir: masaüstünde qpdf (`--pages`) veya pdf-lib ile bölüm başına küçük PDF üret, `.qlmod` içine koy. Range'e bağımlılık kalmaz, açılış hızlı, bellek sınırlı olur. Kaynak kaydındaki (dosya, sayfa, alıntı) sayfa numaraları için bölüm ofsetini manifestte tut. Büyük tek PDF mobilde doğrudan yüklenmemeli.
- Render ölçeğini `devicePixelRatio` en fazla 2 ile sınırla; `disableAutoFetch` etkisini kendi cihazında ölç.

**Kaynaklar**
- https://www.nutrient.io/blog/react-pdf-performance-optimization/
- https://github.com/wojtekmaj/react-pdf/issues/1020
- https://github.com/mozilla/pdf.js/issues/2183
- https://joyfill.io/blog/optimizing-in-browser-pdf-rendering-viewing

## 5. Güncelleme ve Dağıtım

**Bulgu (Play dışı APK)**
- Hazır, bakımlı bir "APK indir ve kur" eklentisi bulamadım. `@capawesome/capacitor-app-update` Play'in uygulama içi güncellemesini kullanır, yan yükleme APK'sı kurmaz. `@capgo/capacitor-updater` yalnızca web paketini (JS/CSS) canlı günceller, native APK'yı değil.
- Yan yükleme için kendi küçük eklentin gerekir: DownloadManager ile indirme + FileProvider URI ile paket yükleyici niyeti + `REQUEST_INSTALL_PACKAGES` izni. Bu izin Play politikasında deklarasyon gerektirir; Play'e de çıkacaksan ayrı bir "sideload" flavor'ı gerekir.
- Önemli: Google yan yüklenen uygulamalar için geliştirici doğrulamasını başlatıyor. 30 Eylül 2026'da Brezilya, Endonezya, Singapur ve Tayland'da zorunlu; 2027'den itibaren küresel. Doğrulanmamış uygulama için "gelişmiş yan yükleme" akışı (ek adım ve bekleme) veya ADB gerekir. Öğrenci/hobi hesabı ücretsiz, 20 cihaza kadar. Play dışı APK dağıtımı zamanla sürtünmeli olacak.

**Bulgu (Play)**
- Kayıt 25 USD, tek sefer. Yeni uygulamalar AAB olmalı ve Play App Signing kullanmalı (Google uygulama imza anahtarını tutar, sen yükleme anahtarıyla imzalarsın).
- 13 Kasım 2023 sonrası açılan KİŞİSEL hesaplarda: üretim erişimi için en az 12 test kullanıcısı, kesintisiz 14 gün kapalı test; ardından Konsolda üretim erişimi başvurusu (genellikle 7 gün veya daha kısa). Şart hâlâ geçerli; kurumsal hesaplar muaf.
- Hedef API: 31 Ağustos 2026'dan itibaren yeni uygulama ve güncellemeler API 36 (Android 16) hedeflemeli; 1 Kasım 2026'ya kadar uzatma istenebilir. Makinedeki SDK 36 yeterli; `targetSdk 36` ayarla.

**Öneri**
- Aşama 1: GitHub Releases'te imzalı APK + uygulama içi "yeni sürüm var" denetimi ve indirme bağlantısı (mevcut `UpdateStatus` kalıbına uyar); otomatik kurulum eklentisi sonraya.
- Aşama 2: Play'e AAB ile çıkış; 12 test kullanıcısı ve 14 gün takvime erken yazılsın. Proje AGPL olduğundan F-Droid de bir seçenek (bu incelemede araştırılmadı).

**Kaynaklar**
- https://capawesome.io/plugins/app-update/
- https://github.com/Cap-go/capacitor-updater
- https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- https://android-developers.googleblog.com/2026/06/android-developer-verification.html
- https://www.androidauthority.com/android-developer-verification-rollout-sideloading-flow-3653395/
- https://www.iconikai.com/blog/google-play-developer-account-fee-2026

## 6. WebView Özellik Desteği

Android System WebView, Chrome ile aynı sürüm numarasını izler.

| Özellik | Asgari WebView/Chrome | Not |
|---|---|---|
| `:has()` | 105 | caniuse |
| CSS Custom Highlight API | 105 | MDN: tüm büyük tarayıcılarda Haziran 2025'ten beri; Chrome sürümü bilgi birikimime dayanıyor, doğrulanmadı |
| View Transitions (tek belge) | 111 | caniuse / testmuai |
| OPFS (Android Chrome + WebView) | 107 | blink-dev "Intent to Ship" |

**Öneri:** Hepsini 111 karşılar. Capacitor'ın "Chrome 60" alt sınırına güvenme; asgari olarak 111 kabul et ve eski WebView için uyarı göster (`@capgo/capacitor-webview-version-checker`). Özellik algılama ile geri düşme ekle (`CSS.highlights`, `document.startViewTransition`).

**Kaynaklar**
- https://caniuse.com/css-has
- https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API
- https://caniuse.com/view-transitions
- https://caniwebview.com/clients/androidwebview/
- https://groups.google.com/a/chromium.org/g/blink-dev/c/GyxqF8ZDK5Q
- https://github.com/Cap-go/capacitor-webview-version-checker

## 7. GitHub Actions ile Derleme ve İmzalama

**Bulgu**
- Yaygın kalıp: gizli anahtarlar `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Anahtar deposu çalışma sırasında `base64 -d` ile dosyaya yazılır; depoya imza malzemesi girmez.
- Adımlar: checkout, `actions/setup-java` (örneklerde 17; Capacitor 8 için 21 kullan, doğrulanmadı), Node 22, `npm ci`, web derlemesi, `npx cap sync android`, `./gradlew assembleRelease bundleRelease`, imzalama (Gradle `signingConfigs` veya jarsigner/apksigner), artifact/Release yükleme.
- `versionName` etiketten, `versionCode` tekdüze türetilir (örn. run number).

**Örnek iskelet** (doğrulanmadı; `signingConfigs.release` bloğu `android/app/build.gradle` içinde ortam değişkenlerini okumalı)
```yaml
name: android
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build:mobile
      - run: npx cap sync android
      - run: echo "$KEYSTORE_B64" | base64 -d > android/app/release.jks
        env: { KEYSTORE_B64: '${{ secrets.ANDROID_KEYSTORE_BASE64 }}' }
      - run: cd android && ./gradlew assembleRelease bundleRelease
        env:
          KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          path: |
            android/app/build/outputs/apk/release/*.apk
            android/app/build/outputs/bundle/release/*.aab
```

**Kaynaklar**
- https://khromov.se/build-your-capacitor-android-app-bundle-using-github-actions/
- https://github.com/marketplace/actions/capacitor-android-action
- https://github.com/marketplace/actions/sign-android-release
- https://github.com/KhaosDE/RespecYou/pull/4

## Genel Öneri Sırası

1. Prototip: Capacitor 8 + `@capacitor-community/sqlite` + kendi Kysely diyalekti + File Picker + `@capgo/capacitor-zip`; 650 MB paketle ölç.
2. PDF'i masaüstünde bölümlere böl; pdf.js'i sanallaştır.
3. Önce GitHub Releases APK, ardından Play (12 kişilik 14 günlük test sayacını erken başlat).
4. Ücretli Insiders eklentileri (capawesome sqlite, file-manager) yalnızca ücretsiz yol yetersiz kalırsa.
