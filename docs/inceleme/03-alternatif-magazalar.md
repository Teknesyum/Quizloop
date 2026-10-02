# Alternatif Mağazalar ve Android Geliştirici Doğrulaması

Tarih: 2026-10-02. Kapsam: QuizLoop APK'sını Google Play dışında dağıtma yolları. Web araması ile derlendi; doğrulanamayan yerler "doğrulanmadı" diye işaretlendi.

## Özet ve Öneri

1. Önce bir GitHub Releases akışı kur (kendi anahtarımızla imzalı APK + SHA-256). Bu, Obtainium ve IzzyOnDroid'in de temelidir.
2. Aynı gün Android Developer Console'da ücretsiz "Limited Distribution" hesabı aç, paket adını ve imza anahtarını kaydet (sonra 25 USD'lik tam hesaba yükseltilebilir, geri dönüş yok).
3. Sırayla yayın kanalları: GitHub Releases + Obtainium, IzzyOnDroid (hızlı), F-Droid ana depo (yavaş ama en geniş kitle), Accrescent (küçük kitle, isteğe bağlı).
4. Samsung Galaxy Store ve Huawei AppGallery ikinci dalga: Türkiye'de kitlesi var, ücretsiz, ama kimlik/banka/DUNS yükü ve inceleme riski taşır. Aptoide/APKPure/Uptodown düşük öncelik.
5. Doğrulama 2027'de Türkiye'yi de kapsarsa, doğrulanmamış bir uygulama yalnız "gelişmiş akış" (24 saat bekleme) veya ADB ile kurulabilir. Bu yüzden 20 cihaz sınırı olan ücretsiz hesap tek başına yetmez; geniş dağıtım için 25 USD + kimlik gerekir.

## Karşılaştırma Tablosu

| Kanal | Kayıt ücreti | Kimlik / doğrulama | İnceleme süresi | Format | İmza | Türkiye kitlesi | Telif / içe aktarma riski |
|---|---|---|---|---|---|---|---|
| GitHub Releases + Obtainium | Yok | Yok (Google doğrulaması ayrı) | Yok | APK | Kendi anahtarımız | Küçük, teknik | Yok |
| IzzyOnDroid | Yok | Yok | Günler (gönüllü) | APK | Kendi anahtarımız | Küçük | Yapay zekâ yazımı karşıtı politika |
| F-Droid ana depo | Yok | Yok | Haftalar, bazen aylar | Kaynaktan derleme | F-Droid anahtarı (veya yeniden üretilebilir derleme ile kendimiz) | Küçük, artıyor | Modül dosyaları uygulamada yok; sorun düşük |
| Accrescent | Yok | GitHub girişi, alan adı doğrulaması | Elle inceleme | APK seti (.apks) | Kendi anahtarımız | Çok küçük | Düşük |
| Samsung Galaxy Store | Yok | Ticari satıcı, DUNS veya eşdeğer belge | Günler; kayıt 10 iş gününe kadar | APK / AAB | Kendi anahtarımız | Büyük (Samsung payı yüksek) | Orta, içerik politikası belirsiz |
| Huawei AppGallery | Yok | Kimlik + banka belgesi, 1-2 iş günü | 1-5 iş günü | APK / AAB | Kendi anahtarımız | Orta, Huawei cihazlarda tek yol | Orta |
| Amazon Appstore | - | - | - | - | - | Telefonlarda kapandı | Uygun değil |
| Aptoide | Yok | Hesap | Otomatik tarama | APK | Kendi anahtarımız | Düşük | Düşük |
| APKPure | Yok | Hesap | 24-48 saat | APK | Kendi anahtarımız | Orta (APK sitesi) | Düşük |
| Uptodown | Yok | Hesap, hak sahipliği | Elle inceleme | APK | Kendi anahtarımız | Orta (Türkiye'de bilinir) | Düşük |
| Xiaomi GetApps | Yok | Mi hesabı, kimlik doğrulama | Günler | APK | Kendi anahtarımız | Xiaomi cihazlarda | Orta |
| OPPO / vivo / Honor | Yok (değişken) | Ülkeye göre değişir | Doğrulanmadı | APK | Kendi anahtarımız | Düşük | Doğrulanmadı |

## Google Android Geliştirici Doğrulaması (En Önemli Bölüm)

### Ne Getiriyor

Sertifikalı Android cihazlarda bir uygulama, Google'a kayıtlı (paket adı + imza anahtarı) bir geliştiriciye bağlı değilse normal yolla kurulamıyor. Bu, Play, üçüncü taraf mağaza ve doğrudan APK için aynı. Kayıt, paket adı ve imza anahtarının sunulmasını içeriyor; standart hesap için kimlik belgesi gerekiyor.

### Takvim

| Tarih | Olay |
|---|---|
| 30 Mart 2026 | Play Console ve yeni Android Developer Console herkese açıldı |
| Nisan 2026 | Android Developer Verifier sistem hizmeti telefonlarda görünür oldu |
| Haziran 2026 | Öğrenci/hobi (Limited Distribution) hesapları için erken erişim |
| Ağustos 2026 | Limited Distribution hesapları ve "gelişmiş akış" küresel açıldı |
| 30 Eylül 2026 | Koruma Brezilya, Endonezya, Singapur, Tayland'da devrede (Android 7+, sertifikalı cihaz) |
| 2027 ve sonrası | Küresel genişleme |

Türkiye için özel bir tarih yayımlanmamış. Resmî metinler yalnızca "2027 ve sonrası küresel" diyor. Türkiye'nin 2027 içinde olacağını varsaymak güvenli taraf, tam ay doğrulanmadı.

Önemli ayrıntı: ilk aşamada zorlama, yalnızca "katılımcı mağaza" listesinden gelen kurulumlarda uygulanıyor (Play, Samsung Galaxy Store, Honor, OPPO, Xiaomi GetApps, vivo, Transsion Palm Store). Haberlere göre bu mağazaların dışından yapılan kurulumlar için gelişmiş akış gerekiyor. Resmî SSS ise listede olmayan mağazalardaki uygulamaların bu aşamada zorlanmadığını söylüyor. İki kaynak arasında çelişki var; ayrıntı için kaynakları kontrol et.

### Seçenekler

| Hesap | Ücret | Kimlik | Sınır |
|---|---|---|---|
| Limited Distribution | Ücretsiz | Yok (yalnızca e-posta) | En çok 20 cihaz; tam hesaba yükseltilebilir, geri dönülemez |
| Full Distribution (Android Developer Console) | 25 USD, tek sefer | Resmî kimlik + telefon | Sınırsız |
| Play Console | 25 USD (Play'e yüklenecekse) | Zaten var | Play dışı uygulamaları da buradan kaydedebilirsin |

Gelişmiş akış (güçlü kullanıcılar için): Geliştirici Seçenekleri'nde etkinleştir, kimlik doğrula, yeniden başlat, 24 saat bekle, sonra yedi gün veya süresiz izin ver. ADB ile kurulum bu beklemeyi atlıyor.

### QuizLoop İçin Anlamı

- Yalnızca Play dışı dağıtıyoruz: yol Android Developer Console. Ücretsiz hesap 20 cihazla sınırlı olduğundan halka açık dağıtım için 25 USD'lik tam hesap ve kimlik gerekecek.
- Paket adı kaydı imza anahtarına bağlı. Anahtarı bir kez üretip her kanalda aynı kullanmak şart.
- F-Droid kendi anahtarıyla imzaladığı için ayrı bir paket kaydı sorunu doğuracak (aşağıya bak). F-Droid ve topluluk bu kurala açıkça karşı çıkıyor; sonuç belirsiz.
- Kanıt: kullanıcı tarafı etkisi 2027'de Türkiye'ye gelince Obtainium/GitHub kullanıcıları kayıtsız APK'yı gelişmiş akışla kuracak. Kayıtlı uygulama normal kurulur.

## Kanal Bölümleri

### F-Droid Ana Depo

- Kaynaktan derleme zorunlu; %100 özgür araç zinciri. Derleme betiği `fdroiddata` deposuna merge request ile verilir.
- Özgür olmayan bağımlılık, izleyici, Play Services/Firebase yasak. QuizLoop AGPL ve izleyicisiz olduğundan uygun. Capacitor çekirdeği MIT lisanslı; sorun npm ağacındaki eklentilerde çıkabilir (örnek: Capacitor barcode-scanner eklentisi ML Kit çekiyor ve yasak). Tüm Capacitor eklentilerini tek tek denetle.
- Capacitor/npm derlemesi için F-Droid'e özel bir belge bulunamadı; Node tabanlı derlemelerin `prebuild` ile yapılabildiği genel bilgidir, doğrulanmadı. İlk merge request'te deneme-yanılma beklenmeli.
- Anti-feature adayları: NonFreeAssets (içerik özgür değilse), NonFreeNet. Modül içerikleri APK'ya girmediği için büyük olasılıkla etiketsiz kalır. Telif içeren içerik ve "üçüncü taraf fikri mülkiyeti ihlali yok" kuralı nedeniyle `modules/_ornek` içeriği temiz olmalı.
- Süre: birkaç hafta ile 6 ay arası, gönüllü sırasına bağlı.
- Kendi imzamızla yayın için yeniden üretilebilir derleme (reproducible build) gerekir; zor.

### IzzyOnDroid

- Geliştiricinin kendi imzalı APK'sını GitHub Releases'ten çeker; imza ilk kayıtta kaydedilir, sonra karşılaştırılır. Fastlane üstverisi (kısa/uzun açıklama, ikon, ekran görüntüleri) gerekli. Debug işaretli APK olmaz.
- Risk: politikası, üretken yapay zekâ araçlarıyla yazılan uygulamalara açıkça karşı. QuizLoop büyük ölçüde Claude Code ile yazıldığı için reddedilme ihtimali yüksek. Başvuruda bunu dürüstçe değerlendir; riskli kanal.
- Oyunlar genelde reddediliyor; eğitim istisnası "nadir". Quiz uygulaması bir oyun değil, ama başvuruda eğitim aracı olduğunu vurgula.

### Obtainium (GitHub Releases)

- Kullanıcı uygulamada depo adresini ekler; güncellemeler doğrudan Releases'ten gelir. İmza doğrulama seçeneği var. Mağaza değil, sizden yapılan hiçbir başvuru yok.
- Her sürümde tutarlı APK adı (`quizloop-<sürüm>-arm64.apk` gibi) ve sürüm etiketi yeterli.
- Doğrulama 2027'de Türkiye'ye gelirse kayıtlı uygulama olmak şart olacak.

### Accrescent

- Yeni, güvenlik odaklı mağaza. GitHub ile giriş, APK seti (.apks) ve 512x512 ikon yüklenir; elle inceleme yapılır. Kendi anahtarımızla imzalarız.
- Kısıtlar: kendini güncelleme yok, `REQUEST_INSTALL_PACKAGES` kısıtlı, `MANAGE_EXTERNAL_STORAGE` yalnız dosya yöneticilerine. QuizLoop dosya içe almada depolama erişim çerçevesini (SAF) kullanırsa sorun çıkmaz. Hedef SDK Play kurallarını izlemeli. Alan adı doğrulaması gerektiği söyleniyor (kaynaklarda tutarsız); alan adı yoksa engel olabilir.
- Türkiye'de kitle çok küçük; yalnız gizlilik odaklı kullanıcılar için anlamlı.

### Samsung Galaxy Store

- Kayıt ve yayın ücretsiz. Samsung hesabı, Seller Portal, "ticari satıcı" durumu gerekir (ücretsiz uygulama için de). DUNS numarası veya eşdeğer belge, banka/PayPal bilgisi, belgeler İngilizce. Onay birkaç gün, DUNS/banka doğrulaması 10 iş gününe kadar.
- Gmail gibi genel e-posta ticari satıcı için önerilmiyor; kurumsal alan adlı e-posta daha kolay.
- Türkiye'de Samsung payı yüksek (kesin 2026 rakamı bulunamadı), en büyük gerçek kitle bu kanalda.
- Doğrulama zorlamasında Galaxy Store "katılımcı mağaza" listesinde; mağazadan kurulum sorun çıkarmaz.
- Telif: kullanıcının kendi dosyasını içe aktarması genel olarak kabul edilir, ama inceleme notunda "içerik uygulamayla gelmez" yaz. Kesin politika metni bulunamadı.

### Huawei AppGallery

- Ücretsiz bireysel hesap; kimlik + İngilizce tam adlı banka belgesi; doğrulama 1-2 iş günü, uygulama incelemesi 1-5 iş günü. APK en çok 4 GB, AAB 200 MB. Ülke ve hesap türü seçimi sonradan değişmez.
- Capacitor uygulaması AppGallery'de yayınlanabilir (Capawesome ve Capgo rehberleri var). Google hizmetlerine bağımlılığı olmayan QuizLoop için HMS gerekmiyor.
- Türkiye'de Huawei cihazı olanlar için Play yerine tek yol; kitle orta.
- İçe aktarma/telif: Huawei politikası içerik denetimine duyarlı; doğrulanmadı.

### Amazon Appstore

- Android telefonlar için 20 Ağustos 2025'te kapandı. Fire tablet ve Fire TV'de sürüyor. QuizLoop bir telefon uygulaması; Fire tablet hedeflenmedikçe kanal yok sayılmalı.

### Aptoide, APKPure, Uptodown

- Üçü de ücretsiz, hesapla APK yükleme. APKPure incelemesi 24-48 saat; Uptodown yazarlık/hak sahipliği ister ve ölçütle reddedebilir; Aptoide kendi mağazanı kurmana da izin verir.
- Risk: Bu siteler başkalarının APK'larını da barındırır; kopya veya imzası değiştirilmiş sürümlerin çıkması mümkün. Sadece resmî sürümü kendi hesabımızla yüklemek ve README'de resmî kaynağı belirtmek gerekir.
- Kitle: Uptodown Türkiye'de bilinen bir APK sitesi, dolaylı dağıtım için işe yarar. Öncelik düşük.

### Xiaomi GetApps, OPPO, vivo, Honor

- GetApps: Mi hesabı ve ülke seçimli kimlik doğrulama; 59 bölgede (hedef 100+); kitle Hindistan, Endonezya, Rusya, Avrupa. Türkiye'de Xiaomi cihazı yaygın ama GetApps kullanımı düşük; Türkiye'ye dağıtım uygunluğu doğrulanmadı.
- OPPO/vivo/Honor: ağırlıkla Çin, Hindistan ve Güneydoğu Asya odaklı; küresel geliştirici kayıt ayrıntıları doğrulanmadı. Hepsi doğrulama "katılımcı mağaza" listesinde. Türkiye için düşük öncelik.

### Türkiye'ye Özgü Mağaza

Anlamlı, geliştirici kaydı alan ve kitlesi olan Türkiye'ye özgü bir Android mağazası bulunamadı. Operatör mağazaları (Türk Telekom, Turkcell) iş ortağı odaklı ve bireysel hobi uygulaması için uygun değil. Türkiye'deki fiili alternatifler Samsung Galaxy Store, Huawei AppGallery ve Uptodown/APKPure gibi APK siteleridir.

## Riskler ve Açık Sorular

- Türkiye'nin kesin doğrulama tarihi yayımlanmamış; Google'ın duyurularını 2027 başında yeniden kontrol et.
- Katılımcı mağaza istisnasının kapsamı kaynaklar arasında çelişkili (ilk aşamada yalnız listedeki mağazalar zorlanıyor mu, yoksa listedekiler muaf mı). Resmî SSS ile haber siteleri farklı okuyor.
- F-Droid'in kendi anahtarıyla imzalaması ile Google paket-anahtar kaydı çakışması çözülmedi; F-Droid kampanya yürütüyor.
- IzzyOnDroid'in yapay zekâ politikası QuizLoop için engel olabilir.
- Mağazaların telif içerikli kullanıcı içe aktarmasına dair açık politika metni bulunamadı; çoğu platform "uygulama içeriği kendisi sağlamaz" diyorsa sorun görmüyor, ancak inceleme notu yazılmalı.

## Kaynak Bağlantıları

- Android Developer Verification: https://developer.android.com/developer-verification
- Doğrulama SSS: https://developer.android.com/developer-verification/guides/faq
- Tüm geliştiricilere açılış duyurusu: https://developer.android.com/blog/posts/android-developer-verification-rolling-out-to-all-developers-on-play-console-and-android-developer-console
- 9to5Google takvim: https://9to5google.com/2026/03/30/android-developer-verifier-app/
- Android Authority, ilk dalga: https://www.androidauthority.com/android-sideloading-developer-verification-first-wave-rollout-3717921/
- Nokiamob, 2 Ekim 2026: https://nokiamob.net/2026/10/02/android-sideloading-update-new-restrictions-hit-these-countries/
- F-Droid açık mektup: https://f-droid.org/2026/02/24/open-letter-opposing-developer-verification.html
- Keep Android Open: https://en.wikipedia.org/wiki/Keep_Android_Open
- F-Droid dahil etme politikası: https://f-droid.org/docs/Inclusion_Policy/
- F-Droid anti-feature'lar: https://f-droid.org/en/docs/Anti-Features/
- F-Droid hızlı başlangıç: https://f-droid.org/docs/Submitting_to_F-Droid_Quick_Start_Guide/
- F-Droid merge request bekleme süresi: https://forum.f-droid.org/t/merge-request-waiting-time-any-lmits/34691
- IzzyOnDroid politika: https://izzyondroid.org/docs/general/AppInclusionPolicy/
- IzzyOnDroid yeni uygulama: https://izzyondroid.org/contributing/NewAppInclusions/
- Obtainium: https://github.com/ImranR98/Obtainium
- Accrescent gereksinimler: https://accrescent.app/docs/guide/appendix/requirements/
- Accrescent yeni uygulama: https://accrescent.app/docs/guide/getting-started/new-app.html
- Samsung Galaxy Store başlangıç: https://developer.samsung.com/galaxy-store/prepare.html
- Huawei, Capacitor yayını: https://capawesome.io/blog/how-to-publish-a-capacitor-app-on-huawei-appgallery/
- Huawei AppGallery (özet): https://en.wikipedia.org/wiki/Huawei_AppGallery
- Amazon Appstore kapanışı: https://techcrunch.com/2025/02/20/amazon-is-shutting-down-its-app-store-on-android/
- Xiaomi Mi Developer: https://global.developer.mi.com/document?doc=accountRegistration.becomeADeveloper
- APKPure geliştirici: https://apkpure.com/developer.html
- Uptodown geliştirici: https://en.uptodown.com/developers-console
- Aptoide SSS: https://en.aptoide.com/company/faq/how-can-developers-publish-apps-on-aptoide
