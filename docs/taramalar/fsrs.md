# FSRS ailesi — fsrs4anki, ts-fsrs, fsrs-rs

## Depolar
- **fsrs4anki** · https://github.com/open-spaced-repetition/fsrs4anki · MIT · son push 2026-08-14, son etiketli sürüm v6.1.3 (2025-09-08) · 4.048 yıldız, 8 açık issue, ~82 MB depo; içerik: tek dosya `fsrs4anki_scheduler.js`, iki Jupyter defteri (optimizer + simulator), `docs/tutorial.md`.
- **ts-fsrs** · https://github.com/open-spaced-repetition/ts-fsrs · MIT · son push 2026-08-22, npm `ts-fsrs@5.4.1` (2026-05-22) · 763 yıldız, 5 açık issue, ~4,8 MB; pnpm monorepo: `packages/fsrs` (zamanlayıcı, **npm bağımlılığı yok**, engines `node>=20`) ve `packages/binding` (optimizer, MIT, `fsrs-rs`'i napi-rs/WASI ile sarar, sürüm 0.5.0 ve README'sinde "public beta, API değişebilir" uyarısı var).
- **fsrs-rs** · https://github.com/open-spaced-repetition/fsrs-rs · **BSD-3-Clause** · son push 2026-08-06, v6.6.0 (2026-06-06) · 409 yıldız, 6 açık issue, ~1,2 MB; 15 kaynak dosya (`training.rs`, `inference.rs`, `simulation.rs`, `parameter_initialization.rs`, `parameter_clipper.rs`).

Üçü de aranan adla mevcut; depo değiştirmeye gerek olmadı. Lisans engeli yok: MIT + BSD-3-Clause, GPL/AGPL yok. BSD-3-Clause yalnız telif bildirimi taşımayı ister; MIT ürünle uyumlu. Ama BSD-3'ün "isim kullanmama" maddesi var, dağıtımda üçüncü taraf lisans dosyası tutmak gerekir.

## Alınacak fikirler
- **Dört dereceyi tek soruda kullanıcıya sormak yerine iki sinyalden türetmek.** ts-fsrs'te `Rating` = Manual 0 / Again 1 / Hard 2 / Good 3 / Easy 4, `Grade` tipi Manual'ı dışlar; `docs/tutorial.md` "Internally FSRS treats Again as 'fail' and Hard/Good/Easy as 'pass'" diyor. Quizloop'ta zaten iki bağımsız sinyal var: (a) ilk şık denemesi doğru mu, (b) anladım/kısmen/anlamadım. Önerilen eşleme — yanlış şık **veya** "anlamadım" → Again; ilk denemede doğru + "kısmen" → Hard; ilk denemede doğru + "anladım" → Good; Easy'yi ya hiç üretme ya da "anladım + hiç şık istemeden geçti" durumuna ayır. Değerli, çünkü kullanıcıya dördüncü bir buton koymadan FSRS'in beklediği geçti/kaldı ayrımını besler; oyun döngüsü değişmez.
- **Zamanlayıcı ile optimizer'ı ayrı paket tutmak.** ts-fsrs bu sınırı monorepo düzeyinde çizmiş: `ts-fsrs` saf hesap, `@open-spaced-repetition/binding` eğitim. Quizloop'ta aynı sınır `src/main` içinde bir `scheduler` modülü (saf fonksiyon, better-sqlite3'ü tanımaz) ve ileride opsiyonel bir "parametreleri optimize et" komutu olarak durmalı. Değerli, çünkü v1'de optimizer'ı hiç kurmadan çıkabiliriz ve zamanlayıcıyı sahte veriyle test etmek kolaylaşır.
- **`repeat` benzeri "tüm sonuçları önizle" API'si.** ts-fsrs `scheduler.repeat(card, date)` ile dört derecenin sonucunu tek seferde döner, `next(card, date, rating)` uygular. Quizloop'ta çözüm ekranında "anladım dersen 9 gün sonra, anlamadım dersen yarın" bilgisini butonların altına yazmak için birebir oturur. Değerli, çünkü öz-değerlendirmenin sonucu görünür olunca kullanıcı dürüst işaretler; maliyet sıfıra yakın, API zaten var.

## Kaçınılacaklar
- **fsrs4anki'nin optimizer'ını örnek almak.** O optimizer bir Jupyter defteri; Electron uygulamasına Python + PyTorch bağımlılığı sokmak paketleme maliyetini uygulamanın kendisinden büyük yapar. Optimizasyon gerekirse yol `@open-spaced-repetition/binding`.
- **binding'i erken bağımlılık yapmak.** 11 platforma ayrı native paket (`optionalDependencies`: win32-x64-msvc, darwin-arm64, linux-musl…) gelir; Electron'da native `.node` modülleri ABI'ye bağlıdır, `asar` dışına çıkarmak ve rebuild gerekir. WASI hedefi (`@open-spaced-repetition/binding-wasm32-wasi`) bu derdi kaldırır, üç platformda tek dosya çalışır — native yerine WASI yolunu seç. Ayrıca paket sürümü 0.5.0 ve README'de beta uyarısı var.
- **Anki'nin öğrenme adımlarını (`learning_steps` 1m/10m, `relearning_steps` 10m, fuzz, short-term modu) taklit etmek.** Bunlar gün-içi kart kuyruğu olan bir masaüstü uygulamasının mirası. Quizloop oturum tabanlı; "10 dakika sonra tekrar" kavramı bizim modül oturumunda karşılıksız kalır. Varsayılanları kabul edip gün granülerliğinde kal.
- **`desired_retention`'ı kullanıcı ayarı olarak açmak.** `docs/tutorial.md` bunu "the most important setting" diye anlatıp 0,70–0,97 aralığı veriyor; yanlış ayarlandığında günlük yükü katlar. 0,9 varsayılanında sabitle, ayarı v1'de gösterme.
- **`Rating.Manual` (0) ve `reschedule` yüzeyini kullanmak.** Anki'nin toplu yeniden zamanlama ihtiyacından doğmuş; bizde karşılığı yok, kullanılırsa kart durumu ile tekrar günlüğü arasında ikinci bir doğruluk kaynağı yaratır.
- **"FSRS varsayılan parametreler bile SM-2'den iyidir" cümlesini pazarlamaya taşımak.** Kaynak `docs/tutorial.md` (proje kendi iddiası); bizim tarafımızda **doğrulanamadı**. Aynı şekilde depo yıldız/indirme sayıları dışında bir kullanım rakamı doğrulanamadı.

## Karar önerisi
`ts-fsrs`'i doğrudan npm bağımlılığı al (MIT, sıfır npm bağımlılığı, ESM/CJS/UMD — Electron'un hem main hem renderer tarafında sorunsuz); FSRS motorunu kendimiz yazmayalım.
Üç seçenekli öz-değerlendirmeyi, şık denemesi sonucuyla birleştirip Again/Hard/Good'a eşle; Easy'yi başlangıçta hiç üretme — kullanılmayan derecenin parametreleri zaten optimize edilemez, `parameter_clipper.rs` onları sınıra sabitler (bu davranışın etkisi bizim tarafımızda **doğrulanamadı**).
Soğuk başlangıçta FSRS-6 varsayılanları yeterli: `default_w` 21 elemanlı (sonuncusu `FSRS6_DEFAULT_DECAY = 0.1542`), `request_retention` 0,9, `maximum_interval` 36500 gün, fuzz kapalı. Bunları modül ayarı değil uygulama sabiti olarak tut.
Optimizasyon eşiği: `docs/tutorial.md`'ye göre Anki 24.06+ için minimum tekrar sayısı yok, 24.04'te ≥400, daha eskisinde ≥1000 tekrar isteniyordu — yani düşük veriyle eğitim teknik olarak mümkün, anlamlı olması ayrı konu ve bizim ölçtüğümüz bir eşik yok.
V1'de optimizer'ı hiç kurma; yalnız `revlog` tablosunu (kart id, tarih, derece, önceki durum) baştan doğru topla — sonradan `convertCsvToFsrsItems` + `computeParameters` yoluna girmek ancak bu günlük varsa mümkün.

## Kaynaklar
- `gh api repos/open-spaced-repetition/{fsrs4anki,ts-fsrs,fsrs-rs}` ve `/releases` — 2026-08-22 çekimi (lisans, push, yıldız, açık issue, sürüm).
- `npm view ts-fsrs` / `npm view @open-spaced-repetition/binding` — sürüm, lisans, bağımlılıklar.
- ts-fsrs kaynak: `packages/fsrs/src/models.ts` (Rating/Grade), `packages/fsrs/src/constant.ts` (varsayılanlar), `packages/binding/README.md`.
- fsrs4anki `docs/tutorial.md` — derece anlamları, desired retention, optimizasyon eşikleri.
