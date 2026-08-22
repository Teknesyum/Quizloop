# drizzle-orm

## Depo
`drizzle-team/drizzle-orm` · https://github.com/drizzle-team/drizzle-orm · **Apache-2.0** · son etiketli sürüm **0.45.2, 27.03.2026** · 35.551 yıldız · 1.385 açık issue (arama API'si; depo sayacı PR'larla 1.977) · son push 19.08.2026 · npm paketi ~10,4 MB açılmış, runtime bağımlılığı yok. Göç aracı ayrı paket: `drizzle-kit` MIT, 0.31.10 (17.03.2026), `tsx`+`esbuild` bağımlı.

## Ne için bakıldı
`card`, `review_log`, `module`, `session`, `setting` tabloları için tip güvenli sorgu ve — asıl mesele — şema göçü. Sorular: `better-sqlite3` üstünde çalışıyor mu, `drizzle-kit` göçleri Electron paketinde nasıl koşar, ham SQL'e göre kazanç maliyeti karşılıyor mu.

## Alınacak fikirler
- **Göç klasörü düzeni: `meta/_journal.json` + numaralı `.sql` + her göçün hash'i.** `drizzle-orm/src/migrator.ts` çalışma anında bu günlüğü okuyup uygulanmışları `__drizzle_migrations` tablosundan eleyerek ilerliyor. Quizloop'un kendi göç koşucusu bu deseni birebir taklit edebilir: sıralı SQL dosyası + uygulanmış göç tablosu + dosya hash'i ile "değiştirilmiş göç" tespiti. Paket almadan alınacak asıl şey bu.
- **Şemadan göç üretme (`drizzle-kit generate`).** TS şema tanımı ile veritabanı arasındaki farkı SQL'e çeviriyor. El yazımı göçte en sık kaçan şey unutulan sütun/indeks; üretim adımını derleme zamanına taşımak bu riski kapatıyor. Bizde şema küçük olduğu için kazanç sınırlı, ama fikir kayda değer.
- **Sürücüyü sarmalamama.** `drizzle-orm/better-sqlite3` doğrudan hazır `Database` örneği alıyor; bağlantı ömrü, WAL, pragma ayarları bizde kalıyor. Kütüphanenin veritabanı açma işine karışmaması iyi bir sınır — kendi veri katmanımızda da aynısını yapalım.

## Kaçınılacaklar
- **`drizzle-kit` paketlenmiş uygulamada çalışmaz** — `tsx`/`esbuild` taşıyan bir geliştirme aracı. Üretimde yalnız `migrate()` koşar ve o da `fs.existsSync(<klasör>/meta/_journal.json)` ile **diskten okur**. Göç klasörü `extraResources`/asar-unpack ile paketlenmezse üretimde `Can't find meta/_journal.json` hatası verir. Gizli kurulum maliyeti burada.
- **1.0 öncesi sürüm (0.45.x).** Küçük sürüm atlamalarında kırıcı değişiklik olağan; 1.385 açık issue bakım yükünün göstergesi.
- **Ölçek uyumsuzluğu.** 10 MB'lık paket ve ağır tip düzeyi kurulum, 5 tablolu sabit bir şema için orantısız; TS derleme süresi bedeli de var.
- Lisans Apache-2.0 — MIT projede sorun değil, AGPL/GPL yasağını ihlal etmiyor. `drizzle-kit` ise MIT.

## Karar
`desen`. Göç günlüğü + uygulanmış-göç tablosu + göç hash'i deseni alınır, paket alınmaz.
Şema bu boyutta kaldığı sürece ham SQL + 30 satırlık göç koşucusu daha ucuz; tablo sayısı ikiye katlanırsa yeniden bakılır.
