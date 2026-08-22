# archiverjs/node-archiver

## Depo
`archiver` · https://github.com/archiverjs/node-archiver · MIT · son sürüm `8.0.0` (2026-05-08, npm 8.0.0 aynı tarih) · son commit 2026-05-08 · ★2.974 · 172 açık issue · depo ~1,2 MB, 9 çalışma-zamanı bağımlılığı (`zip-stream`, `tar-stream`, `async`, `readable-stream`…), `type: module` (ESM-only), `engines.node >=18`.

## Ne için bakıldı
Modül paketinin **zip + METADATA** olarak dağıtılması. İki ayrı iş var: `quizforge`'un paketi *yazması* ve oynatıcının paketi *açması*. Paketin içinde yüzlerce görsel olabilir; akış davranışı ve açma tarafındaki yol geçişi (zip slip) riski belirleyici.

## Alınacak fikirler
- **Yazma tarafı akışla, belleğe toplamadan.** `append(stream, {name})`, `file()`, `directory()`, `glob()` girdileri okundukça zip'e akıtır; `pipe(output)` Node stream backpressure'ını kullanır, `finalize()` sonrası **`close`** olayı beklenir (`finish` değil — dosya tanımlayıcısı o zaman kapanır), `pointer()` yazılan bayt sayısını verir. Yeri: `quizforge` paketleme adımı. Değeri: 500 görselli modülde tepe bellek dosya sayısından bağımsız kalır.
- **`warning` ile `error` ayrı olaylar.** `ENOENT`/stat hataları `warning` olarak gelir ve akış devam eder. Yeri: quizforge'da bu ayrım tersine çevrilmeli — manifestte yazan bir görsel diskte yoksa paket üretimi **durmalı**, uyarı olarak geçilmemeli. Değeri: yarım paket üretip kullanıcıya göndermeyi engeller.
- **METADATA'yı whitelist olarak kullanmak.** METADATA zip'in ilk girişi olarak yazılır, içinde dosya listesi + her dosyanın sha256'sı bulunur. Açma tarafında manifestte adı geçmeyen giriş hiç açılmaz. Değeri: zip slip savunmasını "kötü adı yakala" (kara liste) yerine "iyi adı tanı" (beyaz liste) hâline getirir; bozuk/oynanmış paket de aynı kontrolde yakalanır. Maliyet: manifest üretimi zaten planlı.

## Kaçınılacaklar
- **archiver'ı açma tarafında beklemek.** Depo tanımı "a streaming interface for archive **generation**" — okuma/çıkarma API'si yok. Açma için ayrı paket şart; `yauzl` (MIT, npm 3.4.0 / 2026-06-07, ★822, GitHub'da etiketli sürüm yok, 12 açık issue) `validateFileName()` ile `/` veya `X:\` ile başlayan, `..` segmenti içeren ve `\` içeren adları reddeder — **ama** `decodeStrings: false` kullanılırsa bu kontrol otomatik yapılmaz, elle çağrılmalı. Üstüne kendi tarafımızda `path.resolve` sonucu hedef kökün altında mı diye bakılmalı ve dış-öznitelikte symlink işaretli girişler atılmalı.
- **`adm-zip`.** İki güvenlik danışması: GHSA-3v6h-hqm4-2rg6 (2018, keyfi dosya yazma — zip slip'in ta kendisi) ve GHSA-xcpc-8h2w-3j85 (2026-07-10, "high": hazırlanmış zip 4 GB bellek ayırtıyor). Ayrıca senkron API Electron ana sürecini bloklar.
- **`fflate`** (MIT, v0.8.3 / 2026-05-16). Hızlı ve saf JS, ama çıkarma API'si girişleri `Uint8Array` olarak belleğe açar; yüzlerce görselli pakette tepe bellek dosya boyutlarının toplamına yaklaşır. Tarayıcı/worker tarafı için doğru araç, ana süreçte dosyaya akıtmak için değil.
- **ESM-only sürüm ve bağımlılık yüzeyi.** 8.0.0 `type: module`; CJS derleyen bir yapılandırmada 7.x'e düşmek gerekir. 9 geçişli bağımlılık ve 172 açık issue, tek işlevli `zip-stream`'e göre daha geniş bir yüzey — dizin/glob kolaylığı gerekmiyorsa `zip-stream` doğrudan kullanılabilir.

## Karar
`bağımlılık` — yalnız **üretici** (`quizforge`) tarafında, zip yazmak için. Oynatıcı tarafı archiver'ı hiç görmez; açma `yauzl` + METADATA whitelist ile yapılır. Lisans MIT, engel yok.
