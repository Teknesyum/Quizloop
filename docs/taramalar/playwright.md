# Playwright — `_electron`

## Depo
microsoft/playwright · https://github.com/microsoft/playwright · **Apache-2.0** · son etiketli sürüm v1.62.1 (2026-07-30), son push 2026-08-22 · 94.958 yıldız, 156 açık issue · ~240 MB monorepo (`packages/`, `tests/`, `docs/`, `browser_patches/`). Electron desteği ayrı bir paket değil, ana paketin içinde: `docs/src/electron-api/class-electron.md` ve `class-electronapplication.md`. Lisans engeli yok, marka ayrı (Microsoft).

## Ne için bakıldı
Quizloop'un uçtan uca testi: uygulama açılıyor mu, modül yükleniyor mu, bir soru çözülüp FSRS durumu diske yazılıyor mu. Sorulan üç şey: `_electron` desteği hangi durumda, paketlenmiş derleme test edilebilir mi, CI'da üç platformda koşar mı.

Destek v1.9'dan beri var ama belgede hâlâ **"experimental"** yazıyor ve API alt çizgiyle sunuluyor (`const { _electron } = require('playwright')`). Desteklenen Electron sürümleri v12.2.0+/v13.4.0+/v14+ — Quizloop'un sürümü fazlasıyla içeride.

## Alınacak fikirler
- **Ana sürece doğrudan girip yerli diyalogları taklit etmek.** `electronApp.evaluate` verilen işlevi ana süreçte çalıştırıyor ve parametresi orada `require('electron')` ne dönerse o. Belge bunu isimlendirilmiş bir kullanım olarak veriyor: Playwright yerli `dialog` API'sini yakalayamaz, çünkü çağrı ana süreçte olup doğrudan işletim sistemine gider — çözüm `dialog.showOpenDialog`'u test içinde değiştirmek. Quizloop'ta modül içe aktarma akışı tam olarak bir dosya seçici; bu olmadan o akış otomatik test edilemez. Aynı kapı FSRS durumunu ana süreçten okuyup doğrulamak için de kullanılır — arayüzden dolambaçlı yol aramaya gerek kalmaz. Maliyet: küçük, birkaç yardımcı işlev.
- **Paketlenmiş derlemeyi `executablePath` ile test etmek.** `electron.launch` varsayılan olarak paketle gelen Electron'u başlatır, `executablePath` verilirse kullanıcının indireceği ikiliği. Quizloop için değerli olan kısım şu: geliştirme kipindeki testler `better-sqlite3` gibi yerli modüllerin paketleme/asar hatalarını **hiç görmez**; `docs/taramalar/yerel-modul-paketleme.md`'nin işaret ettiği kırılma sınıfı ancak üretilen dosya üzerinde açığa çıkar. Üç-OS matrisinde derleme sonrası tek bir duman testi (açıl, pencere gel, bir modül yükle, kapan) bu sınıfı yakalar. Maliyet: CI'da derleme adımının testten önce gelmesi.
- **Her test için temiz bir kullanıcı veri klasörü.** `launch` `args`, `cwd` ve `env` alıyor; uygulamaya `--user-data-dir` benzeri bir yol ya da ortam değişkeni geçirip her testi boş bir profille başlatmak mümkün. Quizloop'ta değerli, çünkü SRS testleri geçmişe bağımlı: aynı kartı iki kez gören bir profil ikinci koşuda farklı aralık üretir ve test rastgele düşer. Maliyet: uygulamada veri klasörünü dışarıdan geçirilebilir kılmak — zaten test edilebilirlik için istenen bir şey.

## Kaçınılacaklar
- **API'yi kararlı saymak.** Alt çizgi öneki ve belgedeki "experimental" etiketi bilinçli; küçük sürümler arasında değişebilir. Playwright sürümü sabitlenmeli, yükseltme testlerin kırılabileceği varsayımıyla yapılmalı.
- **Test koşucusundan yerleşik destek beklemek.** "[Feature] Support @playwright/test in electron" issue'su (#8208) **2021-08-16'da açılmış ve hâlâ açık** — hazır bir fixture yok, launch/close yaşam döngüsünü kendin yazarsın. `electronApp.close()` için zorla-kapat zaman aşımı öneren PR (#40586, 2026-05-03) de açık; kapanmayan uygulama CI'ı kilitleyebilir, testin kendi zaman aşımı konmalı.
- **Linux CI'da başsız çalıştığını varsaymak.** Playwright'ın headless kipi tarayıcılar içindir; Electron uygulaması gerçek bir pencere açar, Linux koşucusunda `xvfb` benzeri sanal ekran gerekir. Windows ve macOS koşucularında bu sorun yok. Bu ek adımın maliyeti küçük ama unutulursa üç-OS matrisi tek kolda kırmızı kalır.
- **Fuse tuzağı.** Belgenin "known issues" bölümü tek bir madde veriyor: `nodeCliInspect` fuse'u `false` yapılmışsa başlatma zaman aşımına düşer. Quizloop güvenlik sertleştirmesi için fuse kapatmaya kalkarsa e2e testleri sessizce ölür — iki karar birbirine bağlı.
- **Kurulum yüzeyi.** Paket tarayıcı ikiliklerini ayrıca indirir; `_electron` için tarayıcı indirmesinin gerekip gerekmediği belgeden netleşmedi — **doğrulanamadı**, CI'da `--with-deps` olmadan denenip ölçülmeli.

## Karar
`bağımlılık` — yalnız `devDependency`, uçtan uca duman testi için. Apache-2.0, AGPL sorunu yok.
Kullanım dar tutulur: üç-OS matrisinde paketlenmiş derleme üzerinde açılış + modül yükleme + tek soru çözme. Birim testler bunun yerine geçmez.
Deneysel API olduğu için sürüm sabitlenir ve testler CI'ı bloke etmeyecek şekilde kendi zaman aşımıyla koşar.
