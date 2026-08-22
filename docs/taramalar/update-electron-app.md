# update-electron-app

## Depo
electron/update-electron-app · https://github.com/electron/update-electron-app · **MIT** · son etiketli sürüm v3.3.0 (2026-06-28), son push 2026-08-11 · 824 yıldız, 19 açık issue · ~1,7 MB depo, tek kaynak dosya `src/index.ts`, çalışma zamanı bağımlılığı iki paket (`github-url-to-object`, `ms`). Aranan adla mevcut, arşivlenmemiş. Lisans engeli yok.

## Ne için bakıldı
Quizloop üç platformda `electron-builder` ile paketleniyor ve dağıtım GitHub Releases üzerinden. Sorulan üç şey: (a) imzasız macOS paketiyle otomatik güncelleme olur mu, (b) tek akışla üç platform beslenir mi, (c) `electron-builder` ile birlikte mi çalışır.

Üçünün de cevabı olumsuz, gerekçeleri aşağıda. Modül Electron'un yerleşik `autoUpdater`'ını (Squirrel) sarar; `electron-builder`'ın kendi güncelleyicisi `electron-updater` ile aynı yeri doldurur, **yan yana değil yerine** geçer.

- **İmzasız macOS:** mümkün değil. Electron `autoUpdater` belgesi açık: "Your application must be signed for automatic updates on macOS. This is a requirement of `Squirrel.Mac`." Modül imzayı kendisi denetlemez, çalışma anında sessizce/hata ile düşer. Aynı kısıt `electron-updater` için de geçerli, çünkü macOS tarafında o da Squirrel.Mac kullanır — yani imzasızlık modül seçimiyle aşılabilecek bir şey değil, Apple Developer ID gerektirir.
- **Üç platform:** olmuyor. `src/index.ts` içinde `supportedPlatforms = ['darwin', 'win32']`; Linux'ta modül log basıp erken çıkıyor. Linux için ayrı bir yol (paket yöneticisi ya da pasif "yeni sürüm var" bildirimi) gerekir.
- **GitHub Releases beslemesi:** `update.electronjs.org` servisi yalnız geçerli SemVer etiketli, taslak/ön-sürüm olmayan yayınları toplar ve gerekli tüm ikilikleri içeren en yenisini hedef alır. Windows için her yayında `RELEASES`, `*-full.nupkg` ve `*.exe` bulunmalı — biri eksikse güncelleme **sessizce başarısız olur**. macOS için `.zip`.

## Alınacak fikirler
- **Güncelleme kaynağını tipli birlik olarak modellemek.** `UpdateSourceType` iki değer taşıyor: barındırılan servis ve statik depolama (S3 vb.). Quizloop'ta "nereden güncelleniyoruz" kararı tek bir yapılandırma nesnesinde toplanırsa, GitHub Releases'ten statik bir kovaya geçiş çağrı yerlerine dokunmadan yapılır. Maliyet sıfıra yakın, bu bir tip tanımı.
- **Desteklenmeyen ortamda sessizce değil, günlüğe yazarak devre dışı kalmak.** Modül geliştirme kipinde (`app.isPackaged` false) ve Linux'ta çalışmayı bırakıyor ama her ikisinde de neden durduğunu yazıyor ve **yine de geçerli bir durdurma kolu döndürüyor** — çağıran taraf dallanma yazmıyor. Quizloop'ta güncelleme katmanı aynı sözleşmeyi taşımalı: Linux'ta iş yapmayan ama aynı arayüzü sunan bir uygulama.
- **Periyodik denetimi durdurabilen bir kol döndürmek.** `updateElectronApp()` bir `stopUpdates` döndürüyor; her an, hazır olmadan önce bile çağrılabiliyor, ikinci çağrı zararsız. Quizloop'ta sınav oturumu sürerken "yeniden başlat" diyaloğunun ekrana düşmesi çalışmayı böler; oturum başında denetimi durdurup sonunda yeniden kurmak bu kolla mümkün. Maliyet: tek bir yaşam döngüsü bağlantısı.

## Kaçınılacaklar
- **Varsayılan davranışı olduğu gibi bırakmak.** Açılışta ve sonra her 10 dakikada bir denetim (asgari 5 dakika), indirme biter bitmez kullanıcıya yeniden başlatma diyaloğu. Ders çalışma uygulamasında bu ritim rahatsız edici; denetim günde bir, bildirim pasif olmalı.
- **Windows tarafını hafife almak.** Squirrel.Windows kurulum/güncelleme sırasında uygulamayı birden çok kez başlatır; `electron-squirrel-startup` benzeri bir olay işleyici yoksa kullanıcı çoklu pencere görür. Ayrıca `electron-builder`'ın varsayılan Windows hedefi NSIS'tir — bu modül için hedefi Squirrel'a çevirmek, yani paketleme kararını güncelleyici uğruna değiştirmek gerekir.
- **`update.electronjs.org`'a bağlanmak.** Ücretsiz ve Electron ekibinin ama üçüncü taraf bir çalışma zamanı servisi; kapanırsa/hız sınırlarsa güncelleme akışı bizim elimizde olmaz. Depo genel olmalı. Servisin çalışma süresi/kapasitesi hakkında bir taahhüt bulunamadı — **doğrulanamadı**.
- **Gizli maliyet:** macOS otomatik güncellemesi Apple Developer Program üyeliği ister (ücretli, yıllık). Bu modül o maliyeti kaldırmaz, yalnız ertelenmiş hâlde gösterir.

## Karar
`desen`. Bağımlılık olarak alınmıyor: Linux'u kapsamıyor ve `electron-builder`+`electron-updater` kararıyla aynı yeri doldurup paketleme hedefini değiştirmemizi istiyor.
Alınan şey üç desen: tipli güncelleme kaynağı, desteklenmeyen ortamda aynı arayüzü koruyan boş uygulama, sınav sırasında denetimi durduran kol.
İmzasız macOS için otomatik güncelleme hiçbir modülle mümkün değil — v1'de macOS'ta pasif bildirim, Windows'ta gerçek güncelleme, Linux'ta indirme bağlantısı.
