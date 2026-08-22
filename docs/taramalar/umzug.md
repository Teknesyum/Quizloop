# sequelize/umzug

## Depo
umzug · https://github.com/sequelize/umzug · **MIT** (AGPL riski yok) · son sürüm `v3.8.3` (2026-05-01), son push 2026-08-14 · 2.208 yıldız · npm paketi 139 KB açılmış, 5 çalışma-zamanı bağımlılığı (`@rushstack/ts-command-line`, `emittery`, `pony-cause`, `tinyglobby`, `type-fest`), 29 açık issue.

## Ne için bakıldı
İlerleme SQLite'ı zamanla şema değiştirecek: yeni sütun, yeni tablo, `review_log` alanı. Sorulan üç şey — sürümleme uygun mu, Electron paketinde göç dosyaları bulunur mu, Anki'nin `schema upgrade/downgrade` deseninden farkı ne.

## Alınacak fikirler
- **Sürüm numarası değil, çalıştırılmış göç adlarının defteri.** Umzug tek bir tamsayı tutmaz; storage'a uygulanmış göç adlarını yazar, `pending` = dosyadaki liste eksi defterdeki liste. Adlar leksikografik sıralanabilir olmak zorunda (bu yüzden zaman damgası öneki). Quizloop'ta `sema_gocleri(ad, uygulandi_at)` tablosu bu desendir; `PRAGMA user_version` tek sayısına göre üstünlüğü, sürüm atlayan/yan dal gelen kurulumu da doğru çözmesi.
- **Göçler dosya değil, koda gömülü dizi olabilir.** README'nin "Direct migrations list" bölümü `migrations` alanına doğrudan `{name, up, down}` nesneleri verilmesine izin veriyor. Electron için doğru yol budur: `migrations/*.js` glob'u `app.asar` içinde ve bundle sonrası kırılır, dizi kırılmaz. Göçler `src/main/db/gocler/` altında ayrı dosyalar olarak yazılır ama bir `index.ts` içinde import edilip sıralı dizi hâline getirilir — keşif derleme zamanında olur, çalışma zamanında değil.
- **Storage arayüzü ayrı bir sınır.** `JSONStorage`, `memoryStorage`, sequelize, mongodb ve "custom" — defterin nereye yazıldığı göç mantığından tamamen ayrık. Quizloop'ta defter aynı SQLite dosyasında kendi tablomuzda durur (yedek alındığında ilerleme ile birlikte gider); `memoryStorage` karşılığı testte sıfırdan şema kurup göçleri koşmak için birebir işe yarar.

- **Anki deseninden farkı — kayda değer.** Anki tek tamsayı `schema version` tutar ve gövdede sürümden sürüme switch yapar; `downgrade` orada geliştirici aracı değil, **eski istemciyle paylaşım için dışa aktarma** yolu. Umzug'da `down` yalnız geri alma. Quizloop'ta downgrade'e ürün gereksinimi yok — `down` yazılırsa geliştirme kolaylığı içindir, sözleşme değil.

## Kaçınılacaklar
- **CLI'ı kullanmak.** `@rushstack/ts-command-line` paketle birlikte gelir; `migrator create` masaüstü uygulamasında karşılığı olmayan bir geliştirici akışı. Kullanılmazsa bile bağımlılık yüzeyinde durur.
- **`down`'a güvenmek.** SQLite'ta `ALTER TABLE` kısıtlıdır; gerçek geri alma çoğu zaman tabloyu yeniden yaratıp veri kopyalamaktır. Umzug bunu kolaylaştırmaz, sadece çağırır. Göç öncesi veritabanı dosyasının kopyasını almak `down` yazmaktan daha güvenilir.
- **Göçü transaction dışında koşmak.** Umzug transaction yönetmez, `context`e ne verirsen onu geçirir. Yarıda kalan göç bozuk şema bırakır; sarmalama bizim sorumluluğumuz.
- Son etiketli sürüm ile son push arası ~3,5 ay; bakım yavaş ama depo canlı ve açık issue sayısı düşük (29).

## Karar
`desen` — Electron'da glob kullanılamayacağı için umzug'un asıl kazandırdığı iki şey (dosya keşfi, CLI) düşüyor. Geriye kalan "sıralı ad listesi + defter tablosu + transaction sarmalı" ana süreçte ~50 satır.
Lisans engel değil; göç sayısı büyür veya şablon üretimi istenirse bağımlılığa dönmek serbest.
