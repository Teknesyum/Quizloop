# kysely

## Depo
`kysely-org/kysely` · https://github.com/kysely-org/kysely · **MIT** · son etiketli sürüm **v0.29.5, 10.08.2026** (npm aynı) · 14.154 yıldız · 142 açık issue · son push 17.08.2026 · npm paketi ~1,7 MB açılmış, **sıfır bağımlılık**, `engines: node >= 22`.

## Ne için bakıldı
Drizzle'a alternatif tip güvenli sorgu kurucusu. Sorular: farkı ne, göç aracı var mı, `better-sqlite3` yedeğe alınabilsin diye sürücüyü arayüz arkasına almak hangisinde kolay.

## Alınacak fikirler
- **Sürücü yapısal arayüzün arkasında.** `src/dialect/sqlite/sqlite-dialect-config.ts` içinde `SqliteDatabase`/`SqliteStatement` arayüzleri "better-sqlite3'ün `Database` sınıfının alt kümesi" olarak tanımlı — pakete sert bağımlılık yok, `import type` bile yok. `better-sqlite3` 12.x'e sabitlenmişken (PLAN.md satır 152) `node:sqlite`'a geçmek, aynı biçimi taşıyan bir nesne vermekten ibaret. Drizzle'da bu geçiş ayrı bir sürücü modülü (`drizzle-orm/better-sqlite3` → başkası) demek. Bizim veri katmanımız da tam olarak bu daraltılmış arayüzü tanımlamalı: `prepare`, `close`, iterasyon — fazlası değil.
- **Göç motoru çekirdekte, dosya sağlayıcısı takılabilir.** `src/migration/` içinde `Migrator` + `MigrationProvider` arayüzü + isteğe bağlı `FileMigrationProvider` var. Sağlayıcı arayüzü sayesinde göçler diskten okunmak zorunda değil; kaynakta statik olarak `import` edilmiş bir nesne haritası da sağlayıcı olabilir. Bu, Drizzle'ın çalışma anında `fs` ile göç klasörü araması sorununu (bkz. `drizzle-orm.md`) kökten ortadan kaldırır — asar/bundler ile derdi yok. **Bu taramanın en değerli tek bulgusu.**
- **Sorgu kurucu, ORM değil.** Varlık haritalama, ilişki yükleme, birim-iş katmanı yok; SQL'i sen yazıyorsun, tipler tablo tanımından geliyor. Ham SQL'den kaçış maliyeti düşük: istediğin yerde `sql` şablonuna düşüp geri çıkabiliyorsun. 5 tablolu sabit şemada Drizzle'ın soyutlama yükü olmadan tip güvenliği alınıyor.

## Kaçınılacaklar
- **`engines: node >= 22`** (0.29.0'dan beri; 0.28.7 `>=20`, 0.27.x `>=14`). Electron'un gömülü Node sürümü 22'nin altındaysa 0.28.x'e sabitlenmeli. Sürüm seçimi Electron sürümüne bağlanmalı, körlemesine `latest` alınmamalı.
- **1.0 öncesi.** 0.x'te küçük sürüm kırabilir; kesin sürüm sabitle.
- **Resmî CLI çekirdekte yok.** `kysely-ctl` ayrı topluluk deposu (MIT, 316 yıldız, npm 0.21.0 / 10.05.2026, son push 06.08.2026) ve yalnız geliştirme aracı. Yani "otomatik göç üretimi" yok — göç SQL'ini elle yazacağız. Drizzle'ın `generate` avantajı burada kaybediliyor; bilinçli bir takas.
- SQLite'ta `ALTER TABLE` sınırlı; sütun tipi/kısıtı değişimi "yeni tablo + kopyala + değiştir" ile elle yazılır. Kütüphane bunu kolaylaştırmıyor.

## Karar
`bağımlılık` (koşullu). MIT, sıfır bağımlılık, 1,7 MB — AGPL yasağıyla ve kod tabanının ölçeğiyle uyumlu; sorgu tipi güvenliği ve göç motoru tek pakette geliyor.
Koşul: sürüm Electron'un Node sürümüne göre sabitlenir; göçler `FileMigrationProvider` yerine statik sağlayıcıyla verilir.
Sorgu kurucusuna hiç girilmeyecekse yalnız `Migrator` deseni alınıp paket elenebilir — o zaman karar `desen`e döner.
