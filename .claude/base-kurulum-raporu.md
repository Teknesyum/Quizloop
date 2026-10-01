# Base Kurulum Raporu (Explore Ajanı, 2026-10-01)

Kod okunarak çıkarıldı; gerçek kurulum çalıştırılmadı.

## Kurulum Akışı
- Asset seçimi: manifestte `asset` varsa glob ile, büyük/küçük harf duyarsız (`logic.rs:104-153`). Yoksa zip > portable exe > msi > setup exe (`logic.rs:155-184`). Adında setup/install/kurulum geçen `.exe` Setup sayılır (`logic.rs:41,78-83`).
- v0.4.0: `quizloop-0.4.0-unsigned.zip` "unsigned" ve Windows işareti olmadığı için elenir (`logic.rs:71`); dmg, blockmap, yml de elenir. Kalan `quizloop-0.4.0-setup.exe` (test: `logic.rs:778-781`).
- Çalıştırma: ilk 16 MB'ta "Nullsoft" aranır, bulunursa `/S` ile sessiz (`detect.rs:333`, `logic.rs:565-586`, `installer.rs:651-673`). Çıkış kodu 0 değilse hata (`installer.rs:670`).
- Yetki: kendisi istemez; kurucu 740 dönerse UAC açılır (`installer.rs:397-416`). Quizloop kullanıcı başına kurulur, UAC çıkmaz.
- Doğrulama: kayıt defteri değil, `%LOCALAPPDATA%\Programs\<Quizloop|quizloop>` altında exe aranır (`paths.rs:54`, `detect.rs:56-78`, `installer.rs:676`). Bulamazsa yalnız günlüğe yazar (`installer.rs:682`).
- Kaldırma: `unins*` exe aranır; `Uninstall Quizloop.exe` uyar, `/S _?=<dir>` ile çalışır (`detect.rs:344`, `installer.rs:764-796`). İndirilen setup klasörü de silinir (`installer.rs:849`).
- Güncelleme: aynı akış, NSIS üstüne yazar.
- Setup exe (~100 MB) `%LOCALAPPDATA%\Teknesyum\apps\Quizloop\` altında kalır (`installer.rs:647-650`).

## Manifest Şeması (`model.rs:32-55`, `docs/plan.md:64-88`)
- Alanlar: name, category, asset, method (zip|msi|exe|portable|clone|external), run, silentArgs[], icon, screenshot, full, requires[], catalog. Hiçbiri zorunlu değil.
- requires: webview2, dotnet-desktop-8, vcredist-x64, git, node-lts (`prereq.rs:28-70`).
- Okuma sırası: `.teknesyum/teknesyum.json`, sonra kökteki `teknesyum.json` (`github.rs:27,667`). Bozuk JSON → manifest yokmuş gibi (`github.rs:292`).
- Tuzak: `silentArgs` yazılırsa kurucu görünür çalışır ve kurulan exe aranmaz (`installer.rs:652-656, 684-703`). Eklenmemeli.

## Uygulanan
`.teknesyum/teknesyum.json` başına `name: Quizloop`, `asset: quizloop-*-setup.exe`, `method: exe` eklendi (v0.4.1).

## Boş Windows Riskleri
- Base WebView2'yi kendi kurucusuyla indirir (`tauri.conf.json:47`); Windows 10'da ilk kurulumda internet gerekir. VC++ runtime'ın gömülü olduğu tahmin, doğrulanmadı.
- Quizloop: Electron kendi Chromium/Node'unu taşır; better-sqlite3 `.node` CRT'yi statik bağlar (bilgiye dayalı, dosya incelenmedi). `**/*.node` asarUnpack doğru.
- Derleme: `npmRebuild: false`; doğru ABI `scripts/abi.mjs electron` ile. `npm test` sonrası doğrudan electron-builder çalışırsa Node ABI'li binary pakete girer.
- İmzasız exe: Base indirdiği dosyaya internet işareti koymaz, SmartScreen muhtemelen çıkmaz. Asıl risk Smart App Control: açıksa imzasız setup ve quizloop.exe engellenebilir. Base'in kendisi de imzasız (README:60).
- Quizloop kendini electron-updater ile güncellerse Base'teki sürüm kaydı eski kalabilir (doğrulanmadı).
