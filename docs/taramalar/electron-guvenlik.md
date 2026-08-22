# Electron güvenlik duruşu ve yerel varlık servisi

Seçilen üç kaynak: birincil norm olarak Electron'un kendi güvenlik ve `protocol` belgesi; o normu
makineyle denetleyen Electronegativity; bizim problemimizi (yüzlerce yerel görseli renderer'a servis
etmek) üretimde çözmüş Logseq. Standard Notes varlıkları özel şema yerine yerel HTTP sunucusuyla
verdiği için, MarkText son etiketli sürümü eski olduğu için elendi; Standard Notes'un pencere ve
preload ayarı karşılaştırma olarak aşağıda geçiyor.

## Depolar
- electron/electron · https://github.com/electron/electron · MIT · push 2026-08-22, sürüm v43.4.1 (2026-08-19) · 122.6k yıldız, 812 açık issue · ~214k KB
- doyensec/electronegativity · https://github.com/doyensec/electronegativity · Apache-2.0 · push 2025-08-23, son sürüm v1.10.0 (2022-12-07) · 1.05k yıldız, 14 açık issue · ~10k KB · README'de "artık aktif geliştirmiyoruz"
- logseq/logseq · https://github.com/logseq/logseq · AGPL-3.0 · push 2026-08-22, sürüm 2.0.1 (2026-07-13) · 44.5k yıldız, 958 açık issue · ~179k KB
- (yardımcı) cure53/DOMPurify · Apache-2.0 / MPL-2.0 · sürüm 3.4.14 (2026-08-19) · 17.3k yıldız, 2 açık issue

## Alınacak fikirler
- **`file://` yerine özel şema + kök içinde kalma kontrolü.** Electron güvenlik listesi madde 18
  `file://`'yi açıkça reddediyor: `file://` sayfası makinedeki her dosyaya erişebilir, XSS doğrudan
  dosya sızmasına döner. `docs/api/protocol.md` içindeki `protocol.handle` örneği çözümü de veriyor:
  URL'den çıkarılan yol çözümlendikten sonra kök klasöre göre göreli yol hesaplanıyor, `..` ile
  başlıyorsa veya mutlaksa istek reddediliyor. Quizloop'ta bu, `quizloop-asset://<modül>/<dosya>`
  şemasının tek giriş noktası olur; path traversal savunması ayrı bir katman değil, servis eden
  fonksiyonun ilk üç satırı olur. Değeri: modül klasörü dışına çıkan hiçbir istek tek yerde durur.
- **Şemayı `standard: true, secure: true, supportFetchAPI: true` ile ayrıcalıklı kaydetmek, `bypassCSP`
  vermemek.** Standard olmayan şema göreli URL çözemez — görsellerin `<img src>`'i göreli yazılacaksa
  bu zorunlu; `secure` olmadan şema CSP'de güvenli köken sayılmaz. Çağrı `app.whenReady`'den önce.
- **IPC yüzeyini isimli fiiller olarak açmak, `ipcRenderer`'ı asla geçirmemek.** Güvenlik listesi
  madde 20: `ipcRenderer.on`'u veya callback'i doğrudan köprüden geçirmek renderer'a `IpcRendererEvent`
  üzerinden tüm IPC sistemini verir; olay nesnesi soyulup yalnız veri iletilmeli. Madde 17 ise her
  `ipcMain.handle` içinde `event.senderFrame` doğrulamasını istiyor. Quizloop'un preload'ı bu ikisiyle
  birkaç fiile iner: modül listesi, soru getir, cevap kaydet, varlık yolu çöz. Maliyeti düşük çünkü
  yüzey daha kurulmadı — sonradan daraltmak çok daha pahalı.
- **AI üretimi Markdown/HTML'i basmadan önce DOMPurify'dan geçirmek.** Modül içeriği model çıktısı;
  `dangerouslySetInnerHTML` ile doğrudan basmak XSS'i Electron'da RCE denemesine çevirir. CSP ikinci
  duvardır, birincisi değil. DOMPurify aktif bakımlı, açık issue sayısı 2.

## Kaçınılacaklar
- **Logseq'in `assets://` işleyicisi bir örnek değil, uyarıdır.** `core.cljs` içindeki handler URL'den
  şemayı kırpıp yolu decode ediyor ve yol mutlaksa (`/` ile veya `X:` ile başlıyorsa) doğrudan
  `callback` ile dosyayı veriyor — hiçbir kök klasör içinde kalma kontrolü yok. Bir XSS,
  `assets:///etc/passwd` veya `assets:///C:/Users/.../id_rsa` ile keyfi dosya okuyabilir. Aynı dosyada
  `assets` şeması `bypassCSP: true` ile ayrıcalıklandırılmış, yani CSP bu içerik için devre dışı.
  Quizloop'ta bunun tersini yap: yol her zaman modül köküne göre çözülür, `bypassCSP` verilmez.
- **`sandbox: false` normalleştirmesi.** Logseq penceresi `contextIsolation: true` ama `sandbox: false`
  ve `webSecurity: (not dev?)` ile açılıyor — geliştirmede web güvenliği kapalı. Standard Notes ise
  `sandbox: true` kullanıyor. Sandbox'ı sonradan açmak preload'daki Node kullanımını kırar.
- **`@electron/remote`.** Standard Notes preload'ı `@electron/remote` ile ana süreçteki bir köprü
  nesnesini `contextBridge`'e veriyor ve `ipcRenderer.on` handler'larını doğrudan geçiriyor. Üretimde
  çalışan bir uygulamada duruyor olması onu doğru yapmıyor; Electron'un kendi madde 20'siyle çelişiyor.
- **Electronegativity'ye bağımlılık kurmak.** Son etiketli sürüm 2022-12-07, README aktif bakımın
  bittiğini söylüyor ve ücretli halefi ElectroNG'ye yönlendiriyor; yeni Electron ayarlarını
  tanımayabilir. Tek seferlik denetim aracı olarak çalıştırılır, CI pipeline'ına bağlanmaz.
- **Doğrulanamayan iddia:** Doyensec'in BlackHat 2017 bildirisindeki tarama isabet/kapsam oranları
  bu taramada doğrulanmadı — README'nin işaret ettiği PDF dışında bağımsız kaynak görülmedi.

## Karar önerisi
1. Pencere: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity` her ortamda açık.
2. Varlıklar: `quizloop-asset://` özel şeması, `protocol.handle` + `net.fetch`, her istekte modül köküne göre kapsama kontrolü; `file://` ve data URI yok.
3. CSP: `default-src 'none'`, `script-src 'self'`, `img-src 'self' quizloop-asset:`, `style-src 'self'`; şemaya `bypassCSP` verilmez.
4. IPC: preload'da sayılı isimli fiil, olay nesnesi soyulur, her handler'da `senderFrame` doğrulaması.
5. AI içeriği: DOMPurify sanitizasyonu render yolunda zorunlu; Electronegativity sürüm öncesi tek seferlik denetim olarak çalıştırılır.
