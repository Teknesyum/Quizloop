# electron-store

## Depo
sindresorhus/electron-store · https://github.com/sindresorhus/electron-store · **MIT** · son etiketli sürüm v11.0.2 (2025-10-05), son push 2026-03-12 · 5.015 yıldız, **77 açık issue** · ~87 KB, ince bir sarmalayıcı: gerçek iş `conf` paketinde (sindresorhus/conf, MIT, v15.1.0 · 2026-02-04, son push 2026-07-21, 5 açık issue). Çalışma zamanı bağımlılığı `conf` + `type-fest`; `conf` üzerinden `ajv` gelir. **Saf ESM**, CommonJS dışa aktarımı yok; Electron 30+ ve Node 20+ ister. Lisans engeli yok.

## Ne için bakıldı
Quizloop'ta ilerleme verisi ayrı bir SQLite'ta duruyor. Soru: emeklilik kipi, kısayollar, tema gibi kullanıcı ayarları da aynı veritabanına mı girsin, yoksa ayrı bir dosyaya mı. Yan sorular: şema göçü nasıl yürüyor ve dosya bozulursa uygulama ne yapıyor.

README'nin kendisi sınırı çiziyor: "This is not a database. The entire JSON file is read and written on every change... For large data, use SQLite or similar." Yani ikisi rakip değil, ayrı işler. Ayarlar `app.getPath('userData')` altında adı verilebilen bir JSON dosyasına yazılıyor.

## Alınacak fikirler
- **Ayarları ilerlemeden ayrı dosyada tutmak.** `name` seçeneğiyle dosya adı belirlenir (`config` varsayılan); ayarlar `settings.json`, ilerleme `progress.sqlite` olarak yan yana durur. Quizloop'ta değerli, çünkü "ayarları sıfırla" ile "ilerlemeyi sıfırla" **farklı ağırlıkta** işler: ilki tek dosya silmek, ikincisi kullanıcının aylarca biriktirdiği veriyi yok etmek. Ayrı dosya bu iki eylemi kazara birbirine karışmaz hâle getirir. Ayrıca yedekleme talimatı iki satıra iner. Maliyet: sıfır, zaten ayrı tutuyoruz — bu yalnız kararı sağlamlaştırır.
- **Ayar şemasını tek tanımdan üretip yazma anında doğrulatmak.** Modül `ajv` ile JSON Schema draft-2020-12 doğruluyor ve şemadaki `default` değerlerini okuma anında dolduruyor. Quizloop'ta ayar tipleri zaten `zod` v4 ile tanımlı ve `z.toJSONSchema` aynı taslağı üretiyor — tek tanımdan hem TypeScript tipi hem çalışma zamanı doğrulaması çıkar. Değerli, çünkü elle düzenlenmiş ya da eski sürümden kalmış bir ayar dosyası arayüzü bozmak yerine varsayılana düşer. Maliyet: küçük bir dönüştürme adımı, yeni bağımlılık yok.
- **Bozuk dosya politikasını bilinçli seçmek.** Yazma işlemleri atomik ("if the process crashes during a write, it will not corrupt the existing config"), ama okuma anında `SyntaxError` çıkarsa varsayılan davranış hata fırlatmaktır; `clearInvalidConfig: true` dosyayı temizler. Quizloop için doğrusu temizlemek **ve kullanıcıya söylemek**: "ayarların sıfırlandı, ilerlemen duruyor". Değerli, çünkü açılışta çöken bir uygulamayla kullanıcının yapabileceği hiçbir şey yok. Maliyet: bir seçenek + bir bildirim.

## Kaçınılacaklar
- **`migrations` özelliğine yaslanmak.** README'de bakımcının kendi uyarısı var: "I cannot provide support for this feature. It has some known bugs. I have no plans to work on it." Ayar göçü kendi elimizde olmalı — dosyada bir `schemaVersion` alanı ve açılışta çalışan kendi dönüştürücümüz. `beforeEachMigration` de aynı mekanizmanın parçası, aynı uyarı kapsamında.
- **`encryptionKey`'i güvenlik sanmak.** README açıkça "not intended for security purposes" diyor; anahtar düz metin uygulamanın içinde. Quizloop'ta saklanacak bir sır yok, kullanmaya gerek de yok. Ayrıca algoritma değiştirmek mevcut veriyi okunamaz kılıyor.
- **Renderer'dan doğrudan kullanmak.** Modül renderer'da çalışabiliyor (`Store.initRenderer()` ile), ama `docs/taramalar/electron-guvenlik.md`'deki hatla çelişir: ayarlar ana süreçte durmalı, renderer'a IPC ile açılmalı. Kolaylık uğruna izolasyonu delmeye değmez.
- **Bakım ritmi ve ESM.** Son etiketli sürüm yaklaşık on ay önce, 77 açık issue birikmiş — `conf` daha canlı görünüyor. Saf ESM olması `electron-vite` ile sorun değil ama ana süreci CJS derleyen bir yapılandırmada duvara toslar; bu karar önceden verilmeli.

## Karar
`bağımlılık` — yalnız kullanıcı ayarları için, ana süreçte, IPC arkasında. İlerleme SQLite'ta kalıyor; bu modül oraya hiç dokunmuyor.
`migrations` kullanılmıyor, kendi sürüm alanımız ve dönüştürücümüz yazılıyor. `clearInvalidConfig: true` + kullanıcıya bildirim.
Şema `zod`'dan üretiliyor; ikinci bir şema dili girmiyor projeye.
