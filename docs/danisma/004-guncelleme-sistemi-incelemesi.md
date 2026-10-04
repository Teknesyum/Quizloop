# 004 — Asistan Ve AmeliyatListe Güncelleme Sistemi İncelemesi

Tarih: 2026-10-04. İnceleyen: Explore alt ajanı (salt okunur).

## Soru

Quizloop (Electron + electron-updater + NSIS) güncellerken kurulum penceresi gösteriyor ve yavaş.
Asistan (`Projeler\!Tamamlandı\Asistan`) ve AmeliyatListe (`Projeler\!Arşivlendi\AmeliyatListe`)
güncellemeyi "tak diye" yapıyor. Fark ne? Çatı, paketleme, güncelleme kodu, inen şey, uygulanışı,
yayın akışı dosya ve satır numarasıyla istendi.

## Gelen Rapor

**Kısa cevap:** İki uygulamada da güncelleme sırasında hiçbir kurucu çalışmıyor. Uygulama arka planda
`git` ile depoyu çekiyor, sonra kendini yeniden başlatıyor. İkisinde de electron-updater,
tauri-plugin-updater, `quitAndInstall`, `latest.yml` ve `.github` klasörü bulunamadı.

### Asistan (Electron 44.2.0, JavaScript)

- Paketleme (`Kurucu\package.json`): electron-builder `^26.0.12`, hedef NSIS, `"oneClick": true`,
  `"perMachine": false`. Kurucu yalnız Electron'u ve başlatıcıyı taşıyor; araçların kodu git deposunda
  (`Kurucu\AGENTS.md:3-4`). Başlatıcı aracı depodan yüklüyor (`Kurucu\baslatici.js:30`):
  `require(path.join(dizin, "main.js"));`
- Güncelleme elle yazılmış: `Görevlendirme\senkron.js`.
  - Satır 112: `gitSessiz(["pull", "--no-rebase", "--no-edit", "-X", "ours", "origin", "HEAD"], { timeout: 45000 })`
  - Satır 35: `windowsHide: true`
  - Açılışta (`Görevlendirme\main.js:135-138`): `if (g.ok && g.kodDegisti) { ... app.relaunch(); app.exit(0);`
  - Çalışırken dakikada bir (`main.js:210-214`): `senkron.izle(60000, ...)`, sonra
    `setTimeout(() => { app.relaunch(); app.exit(0); }, 2500);`
  - Kullanıcı yalnız bildirim görüyor (`uygulama.js:2385`): "Yeni sürüm geldi, program yenileniyor…"
- Yayın (`Kurucu\yayinla.js:31`): `gh release create` ile kurucu yalnız ilk kurulum için; kod `git push` ile gidiyor.

### AmeliyatListe (Tauri 2.11.6, React 19, TypeScript)

- Paketleme: `tauri.conf.json:37` `"targets": ["nsis"]` ama yayın betiği paketlemeyi atlıyor
  (`kurulum\yayinla.ps1:26`): `npm run tauri build -- --no-bundle`. Tek exe depoya
  `release\ameliyat-listesi.exe` olarak commit ediliyor.
- Güncelleme elle yazılmış: `app\src-tauri\src\sync.rs`.
  - Satır 10: `const ARALIK: Duration = Duration::from_secs(60);`
  - Satır 142, 156: `fetch --quiet --depth 1 origin main`, sonra `reset --quiet --hard FETCH_HEAD`
    (inen şey yaklaşık 9,8 MB tam exe).
  - Satır 107-110: çalışan exe `.old` diye yeniden adlandırılıp yenisi yerine kopyalanıyor.
  - Satır 165-167: 0,6-3 sn bekleyip `app.restart();`
- Yayın (`yayinla.ps1`): derleme, `git push origin main`, sonra `gh release create`.

### Karşılaştırma

| | Asistan | AmeliyatListe | Quizloop |
|---|---|---|---|
| Güncellemede kurucu | Yok | Yok | NSIS çalışıyor |
| İnen şey | Değişen kaynak dosyaları | Tek exe | Tam kurucu |
| Uygulama | `app.relaunch()` | exe değiştir, `app.restart()` | Kur, sonra aç |

Hızın nedeni: güncelleme yolunda NSIS hiç yok. Ön koşul: iki uygulama da kullanıcı makinesinde git ve
depoya erişim anahtarı gerektiriyor. Asistan'da Electron sürümünü bu yolla güncelleyen kod bulunamadı.

## Çıkarım (Claude)

Quizloop herkese açık dağıtılıyor; kullanıcıda git ya da anahtar şart koşulamaz. Aynı hız, kurucusuz
bir "kod paketi" güncellemesiyle alınır: sürümle birlikte yalnız uygulama kodu (`out/` derlemesi)
özetiyle yayımlanır, uygulama onu indirip doğrular, yerine koyar ve yeniden açılır. Electron ya da
yerel modül (better-sqlite3) değiştiğinde eski yol (NSIS, sessiz) kullanılır.
