# Quizloop — plan

Aralıklı-tekrar sınav motoru. İki ayrı yazılım tek depoda: **oynatıcı** (Electron
uygulaması) ve **üretici** (modül hattı CLI'ı). Bu ayrım planın belkemiği.

Plan iki bağımsız planner ajanının aynı brifingle ürettiği önerilerin ortak paydası
üzerine kuruldu, sonra `docs/taramalar/` altındaki depo incelemeleriyle düzeltildi.
Ayrışan yerler en altta, gerekçeleriyle.

---

## 0. Sabit kararlar

| Konu | Karar |
|---|---|
| İsim | Quizloop · depo `Quizloop` · paket `quizloop` |
| Yığın | Electron + React + TypeScript + Vite (`electron-vite`) |
| Platform | Windows · macOS · Linux, `electron-builder`, GitHub Actions üç-OS matrisi |
| Zamanlama | FSRS-6, `ts-fsrs` paketi, **ana süreçte** çalışır |
| Modül formatı | JSON dosyaları — SQLite değil |
| İlerleme | Ayrı SQLite veritabanı, kullanıcı veri klasöründe |
| Şema | `zod` v4 — `z.infer` + `safeParse` + `z.toJSONSchema` tek tanımdan |
| Üretim hattı | Ayrı CLI (`quizforge`), uygulamanın içinde değil |
| Lisans | MIT — **bağımlılıklarda AGPL yasak** |

---

## 1. Zamanlama

`ts-fsrs`. Tarama onayladı: MIT, npm bağımlılığı sıfır, ESM/CJS/UMD, Node 20+.
Doğrudan bağımlılık olarak alınabilir.

SM-2 elle yazmak reddedildi — Anki'nin bile terk ettiği model, "kısmen" için doğal
derece yok. Leitner kovası üçlü değerlendirmeye birebir oturur ve daha basittir ama
binlerce kartta kuyruk patlamasını yönetemez, aralık büyümesi sabittir ve kart başına
zorluk kavramı yoktur.

### Derece eşlemesi — iki sinyal

Kullanıcının öznel beyanı doğrudan FSRS'e verilmez. İki bağımsız sinyal birleştirilir:
**nesnel** (şıklar açılmadan bilindi mi, ilk denemede doğru mu, kaç yanlış eleme oldu)
ve **öznel** (anladım / kısmen / anlamadım).

| Öz-değerlendirme | Nesnel sonuç | FSRS notu |
|---|---|---|
| anlamadım | her koşulda | Again (1) |
| kısmen | yanlış eleme oldu | Again (1) |
| kısmen | ilk denemede doğru | Hard (2) |
| anladım | yanlış eleme oldu | Hard (2) |
| anladım | ilk denemede doğru | Good (3) |
| anladım | şıklar açılmadan bilindi | Easy (4) |

Bu eşleme şıksız bilme bonusuna gerçek bir işlev verir: Easy'yi hak etmenin tek yolu
odur. Mekanik kapalıysa Easy hiç üretilmez, FSRS bundan zarar görmez. Yanlış eleyip
"anladım" diyen iyimser kullanıcı nesnel veriyle otomatik düzeltilir.

### Emeklilik

Kullanıcı "anladım" dediği soruyu bir daha görmek istemiyor. Varsayılan davranış bunu
harfiyen uygular: `retired_at` damgalanır, kart kuyruktan çıkar, **silinmez** ve
istenirse geri getirilir. FSRS durumu yine kaydedilir.

Ayarlarda ikinci bir kip bulunur — *yumuşak emeklilik*: kart ancak `stability > 365 gün`
ve son üç tekrar Good/Easy ise emekli olur. Aralıklı tekrarın asıl davranışı budur;
tek "anladım" tıklamasıyla emekli olan kart altı ay sonra unutulmuş olabilir.
Varsayılan istenen davranış, ikincisi bir bayrak.

### Kuyruk politikası

Vadesi geçmiş ve `lapses >= 2` olanlar önce, sonra vadesi gelenler, sonra hiç
görülmemişler, en sona kısmen anlaşılanlar. **Kavram gömme**: aynı `conceptId`'den
günde en fazla bir soru — binlerce soruda aynı bilgiyi beş kez sormayı engeller.

Parametre optimizasyonu birinci sürümde yok. Tarama eşiği doğruladı: anlamlı
optimizasyon için birkaç yüz tekrar gerekiyor, soğuk başlangıçta FSRS-6 varsayılan
ağırlıkları yeterli. **Ama `review_log` ilk günden tam alanlarla açılmalı** — sonradan
eklenen alan geriye dönük doldurulamaz, optimizasyon imkânsız hale gelir.

---

## 2. Veri modeli

### Modül — salt okunur JSON

```
modules/<modul-adi>/
  module.json              meta, blok listesi, sha256
  blocks/0001.json         ~50 soru
  assets/img/ tbl/         PDF'ten sökülmüş görsel ve tablo
  build/checkpoint.json    üretim defteri, git'e gitmez
```

Soru kaydı:

```
id            kararlı kimlik, içerik hash'i değil
conceptId     kavram gömme ve tekrar denetimi için
stem          { md, imageRef? }
choices[]     { key, md, imageRef? }
correct       doğru şıkkın anahtarı
distractors   { key -> md }   her yanlış şık için ayrı açıklama
solution[]    sıralı bloklar: text | table | image | formula | hint
source        { file, pages, quote, chapter }
difficulty    tags[]     contentHash
```

JSON seçildi çünkü modül yapay zekâ üretimidir: artımlı yazılabilmeli, yarım hali
geçerli kalmalı, elle düzeltilebilmeli, `modules/_ornek/` git'te okunabilir olmalı.
SQLite modül formatı sorgu hızı kazandırırdı; bloklar tembel yüklendiği için gerek yok.

Format kendimizin. Tarama, şık başına açıklamayı kendi içinde taşıyan tek ailenin
GIFT / Moodle XML olduğunu gösterdi — QTI 3.0 ve Anki `.apkg` bunu doğal olarak
taşımıyor. **İlk dışa aktarma hedefi GIFT.**

Şık başına açıklama incelenen üç quiz uygulamasının **üçünde de birinci sınıf alan**
(Perseus `rationale`, Moodle `question_answers.feedback`, H5P `tipsAndFeedback`).
Sonradan eklenen bir alan değil — şemaya ilk günden zorunlu girer.

Dışa aktarma tarafında iki kapı kapandı: `genanki-js` AGPL-3.0, `qti-components`
GPL-3.0. İkisinden de yalnız desen alınabilir. Zaten ikisi de bizim şık başına
açıklamamızı doğal taşımıyor — Anki şablonu seçilen şıkkı kaydetmiyor, QTI'de her
çeldirici için ayrı işleme kuralı ve ayrı geri bildirim bloğu gerekiyor (soru başına
kırk satır XML). **GIFT birincil ve tek dışa aktarma hedefi kalıyor**; düz metin bir
biçim olduğu için kütüphane de gerektirmiyor.

Dağıtım: modül paketi **zip + METADATA** olarak taşınır, ilerleme paketin dışında
kalır ve kalıcı soru kimliğiyle bağlanır. Yazma tarafı `archiver`, **açma tarafı ayrı
kurulur** (`yauzl` + METADATA beyaz listesi) — `archiver` yalnız zip yazar, açmaz. Açma
sırasında arşiv içindeki yol hedef klasörün dışına çıkıyorsa dosya reddedilir. Obsidian'ın aralıklı tekrar eklentisi
zamanlama verisini içeriğin içine gömüp pişman olmuş; Mnemosyne kalıcı kimlikli kayıt
akışıyla doğru çözmüş. Bizim ayrımımız Mnemosyne'ninki.

### İlerleme — ayrı SQLite

Konum: kullanıcı veri klasöründe `quizloop.db`, WAL kipinde.

```
module       id, path, version
card         module_id, question_id, concept_id, content_hash,
             state, due, stability, difficulty, reps, lapses,
             last_review, retired_at
review_log   card_id, ts, rating, self_assess, revealed_choices,
             wrong_picks, duration_ms
session      setting
```

`review_log` asla özetlenmez, ham kalır.

### Türkçe arama — ölçülmüş tuzak

SQLite FTS5'in `unicode61` katlaması Türkçe'de bozuk: `IŞIK` → `isik`, ama `ışık` →
`ısık`. Aynı kelimenin büyük ve küçük hâli **iki ayrı belirteç** oluyor ve hiçbir ayarda
(`remove_diacritics 2` dahil) birleşmiyor.

Kural: **katlama TypeScript tarafında `tr` yerelinde yapılır**, SQLite'a hazır belirteç
verilir. Aynı normalizasyon `source.quote` doğrulamasında da kullanılır — noktalı ve
noktasız i, tire, satır sonu tiresi, NFC birleştirme.

### Veritabanı sürücüsü

Sorgu katmanı **`kysely`**. Sebep tek bir teknik ayrıntı: `MigrationProvider` bir
arayüz, göçler dosya sisteminden okunmak zorunda değil — statik bir nesne haritası
verilebilir. Drizzle'ın çalışma anındaki göç aracı ise göç klasörünü diskten okuyor
(`meta/_journal.json`), yani `asar` paketinde `extraResources` ayarlanmazsa üretimde
patlıyor ve `drizzle-kit` paketlenmiş uygulamada hiç koşmuyor. `kysely`'nin
`SqliteDatabase` tipi de yapısal bir arayüz — sürücüyü değiştirmek tek dosya.
*Uyarı*: `kysely` 0.29'dan beri `node >= 22` istiyor; Electron'un Node sürümüne göre
0.28.x'e sabitlemek gerekebilir.

Göç konusunda üç bağımsız tarama aynı yere çıktı: **göç dosyalarını çalışma zamanında
keşfetme, koda göm.** `asar` paketinde `glob` ve dizin taraması kırılır. `umzug`'un
"doğrudan göç listesi" kipi ile `kysely`'nin statik sağlayıcısı aynı şeyi söylüyor;
`kysely` zaten sorgu katmanı olduğu için göç de ondan alınır, `umzug` desen olarak kalır.

`better-sqlite3` **12.x'e sabitlenir**. 13.0.0 N-API'ye geçip önceden derlenmiş ikilileri
npm paketine gömdü — derleme zincirini elemenin yolu bu, ama sürüm bir aylık ve açık bir
segfault kaydı var. Yeniden derleme yalnız `electron-builder` aşamasında çalışır,
**çapraz derleme yok**: her işletim sistemi kendi artefaktını üretir.

### Kimlik ile içerik ayrı şeylerdir

Taramanın en keskin bulgusu bu. Anki notta `guid` (kalıcı kimlik) ile `csum` (ilk alanın
sağlaması) ayrı tutuyor ve içe aktarımda **önce `guid` eşleşmesi** arıyor. Sağlama
kimlik değil, yalnızca "bu soru değişti" sinyali.

Quizloop'ta aynısı: `id` modül üretilirken bir kez atanan kalıcı bir kimliktir, asla
içerikten türetilmez. `contentHash` yalnız değişim tespiti içindir.

Silinen soru **silinmez, işaretlenir** (Anki'nin `graves` deseni). Yoksa modül eski bir
sürüme dönerse ilerleme geri gelmez.

### Modül sürümlendiğinde

Kurulumda `moduleSync` çalışır:

- Kimlik aynı, hash aynı → dokunma.
- Hash değişti ama `stem` ve `correct` aynı (yalnız çözüm düzeltilmiş) → ilerleme korunur.
- `stem` veya `correct` değişti → yumuşak sıfırlama: `stability` yarıya çekilir, vade
  bugün, `review_log`'a `migration` kaydı düşer.
- Kimlik kayboldu → `orphaned`, kuyruktan çıkar, **silinmez**.

Kullanıcıya sonuç raporlanır: "12 kart güncellendi, 3 sıfırlandı".

---

## 3. Uygulama mimarisi

`contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.

**IPC fiil odaklıdır, CRUD değil**: `session:start|next|reveal|answer|solution|grade`,
`module:list|install|sync`, `stats:overview`. Kritik kural — **`correct` alanı soru
gösterilirken renderer'a gitmez**, yalnız `answer` yanıtında döner.

Varlık servisi: özel protokol `quizloop://module/<id>/assets/...`. `file://` açılmaz.
Handler'da yol geçişi reddi: çözülen yol modül kökünün dışına çıkıyorsa 403.

CSP: `default-src 'none'; script-src 'self'; img-src 'self' quizloop:;
style-src 'self' 'unsafe-inline'`.

Tarama bir karşı-örnek çıkardı: Logseq'in `assets://` işleyicisi mutlak yolu kök
denetimi olmadan servis ediyor ve şemayı `bypassCSP: true` ile kaydediyor. **Kopyalanacak
değil, kaçınılacak desen** — her istekte modül köküne göre kapsam denetimi zorunlu.

Markdown: `react-markdown` + `remark-gfm` + `rehype-katex`. **`rehype-raw` yok** —
içerik yapay zekâ üretimidir, ham HTML'e izin verilmez.

Formül: **KaTeX**, MathJax değil. Ölçüldü: `katex.min.js` 277 KB + 23 KB CSS,
MathJax'in `tex-mml-chtml.js` 1,17 MB. Masaüstü paketinde bu fark gereksiz.

Durum: yalnız `zustand`. **`@tanstack/react-query` elendi** — varsayılanlarının tamamı
HTTP dünyası için yazılmış (bayatlama süresi sıfır, odakta yeniden çekme, üç deneme) ve
IPC'de doğru kullanımı bunları tek tek kapatmak demek. Üstelik tek yazar ana süreç
olduğu için çözülecek bir önbellek geçersizleştirme sorunu yok.

Oturum makinesi ayrıştırıcı birleşim ile; XState gerekmiyor, beş durumluk bir makine.
Zustand'ın `set` işlevi tek seviye birleştirdiği için **birleşim kökte değil `phase`
alanında durur** — kökte durursa `set(x, true)` çağrısı aksiyonları siler ve tip sistemi
bunu yakalamaz.

Test `vitest`. FSRS'i sahte saatle değil **saat enjeksiyonuyla** test ederiz: `ts-fsrs`
zaten `now` parametresi alıyor, sistem saatini taklit etmeye gerek yok. Ana süreç ile
renderer testleri `test.projects` ile ayrılır.

### Typer efekti

İki ayrı sorun var, ikisinin de çözümü tarandı:

1. **Yarım Markdown.** Daktilo `**kalın` yazarken ayrıştırıcı bozuk girdi görür.
   Çözüm: ayrıştırma öncesi yarım etiketi kapatan saf bir onarım fonksiyonu
   (`streamdown`'ın `remend` deseni).
2. **Render maliyeti.** Her karakterde yeniden render etmemek için hedef metin ile
   görünen metin ayrı tutulur, `requestAnimationFrame` ile karakter kuyruğu işlenir.

Yalnız `text` ve `hint` blokları daktilo ile akar; tablo ve görsel belirerek gelir.
"Hepsini göster" tuşu ve `prefers-reduced-motion` zorunlu.

**`typed.js` kullanılmayacak — npm'de GPL-3.0.** Efekt zaten elli satırlık bir kanca.

### Klavye

Anki'nin deseni alındı: kısayol dizesi **tek kaynaktan** hem dinleyiciye hem ekranda
gösterilen etikete beslenir, iki yerde ayrı yazılmaz. Bağlama için `tinykeys`, odak ve
canlı bölge altyapısı için `react-aria`.

---

## 4. Üretim hattı — `quizforge`

Ayrı CLI, aynı depo, ayrı `package.json`: `tools/quizforge/`. Uygulamaya gömülmedi
çünkü iş saatler sürer, API anahtarı yönetimi ister ve sürekli tümleştirmede
koşabilmelidir. Uygulamaya sonradan "forge'u çağıran ince bir sekme" eklenebilir;
tersi mümkün değildir.

Komutlar: `init` · `plan` · `run` · `verify` · `pack`.

### Kural dosyası

`rules.yaml` — insan yazacak, yorum satırı gerekiyor, o yüzden YAML:

```
module:   ad, sürüm, dil
kaynak:   tip (pdf | web), yol, atlanacakBolumler[]
uretim:   parcaBasinaSoru, sikSayisi, zorlukDagilimi, cozumBloklari[], yasakli[]
stil:     ton, uzunluk
```

### PDF çıkarma katmanı — AGPL'siz zincir

Tarama net bir uyarı verdi: **PyMuPDF ve mupdf saf AGPL-3.0**, MIT dağıtım planıyla
bağdaşmıyor. Konumlu görsel çıkarmada en sağlamı o ama alınamaz.

Seçilen zincir:

- **`pypdfium2`** — sayfa render ve gömülü nesne çıkarma, Apache/BSD.
- **`pdfplumber`** — metin ve konum bilgisi, MIT.
- **`camelot-dev/camelot`** — tablo çıkarma, MIT, v2.0.0. *Not: görevde verilen
  `atlanhq/camelot` arşivlenmiş, bakımlı çatal budur.*
- **`docling`** (docling-project, MIT) — yapı katmanı: okuma sırası, tablo ve formül
  sınırları, etiketli blok JSON'u. GPU gerektirmiyor. Bu katman **OCR için değil**;
  metin katmanı zaten temiz, gereken şey yapı.
- `marker` ikinci geçiş olarak yedekte. `nougat` elendi — ağırlıkları CC-BY-NC.

Çıkarma işi **ayrı bir Python yan-sürecinde** çalışır, Electron'a gömülmez.

### Parçalama

Birim = **alt başlık**, sayfa değil. Sayfa sınırı kavramı ortadan böler. PDF'in
`/Outlines` ağacı okunur, tipik birim 3-8 sayfa. Görseller sökülüp `webp`'e çevrilir.

Görsel dönüştürme `sharp` ile yapılır ama **yalnız `quizforge` içinde kalır.** Deponun
kendisi Apache-2.0, fakat çalışması için gereken platform ikilileri
(`@img/sharp-libvips-*`) LGPL-3.0-or-later ve libvips'in kendisi LGPL-2.1. GPL değil
ama copyleft: Electron paketine gömülürse lisans metni iletme ve yeniden bağlama
yükümlülüğü doğar. Uygulama zaten üretilmiş `webp` dosyalarını okuyor — bu ayrım
`asarUnpack` derdini de baştan siliyor.

### Kontrol noktası

`build/checkpoint.json`, atomik yazım (`.tmp` sonra rename):

```
schemaVersion, rulesHash, sourceHash,
units: [ { unitId, pages, status, attempts, producedQuestionIds, blockFile, costTokens } ],
nextUnit, totals
```

Yarım blok `.partial` uzantısıyla yazılır, `run` başlangıcında temizlenir.

Tarama üç katmanda üç ayrı ders verdi:

- **İşin kimliği içerik hash'i olsun, sıra numarası değil** (Nextflow `-resume`). Kural
  dosyası veya kaynak değişirse hash değişir, o birim yeniden üretilir; değişmediyse
  asla iki kez modele gitmez.
- **Kısmi başarı adımın içinde yazılsın** (LangGraph bekleyen yazımları). Birim yarıda
  kesilirse o ana kadar üretilen sorular kaybolmaz.
- **İş kuyruğu motoru gereksiz.** BullMQ Redis şart koşuyor, graphile-worker Postgres.
  Tek kişilik masaüstü işi için **JSONL defter + atomik anlık görüntü** yeterli.
  Bu kasten böyle: aşırı mühendislik burada gerçek bir risk.

**Bağlam neden şişmez**: her birim temiz bağlamda işlenir. Modele giden şey kural
özeti, o birimin metni, JSON şeması ve tekrar önleme için daha önce üretilmiş
soruların **yalnız son 200 kökü**. Önceki çıktılar bağlama girmez.

### Doğrulama — model çağırmaz, deterministiktir

- şema geçiyor mu
- `correct` gerçekten şıklar arasında mı
- her yanlış şıkkın kendi açıklaması var mı
- **`source.quote` normalize edilmiş biçimde kaynak metinde geçiyor mu** — halüsinasyon
  denetiminin belkemiği bu. Türkçe İ/ı, tire, boşluk normalizasyonu uygulanır.
- sayfa aralığı tutuyor mu, varlık dosyaları diskte mi
- kökler arası üçlü-gram Jaccard > 0.8 ise tekrar uyarısı
- doğru cevap harf dağılımı χ² denetimi (model "C" şıkkını sever)

Rapor `build/verify-report.json`. `pack`, `verify` geçmeden çalışmaz.

### Modele bağlanma

`@anthropic-ai/sdk`. Yapılandırılmış çıktı `messages.parse()` + `zodOutputFormat()` ile
sunucu tarafında `json_schema` olarak zorlanıyor ve SDK içeride `zod/v4` kullanıyor —
şema kararımızla birebir örtüşüyor, araya ek bir katman girmiyor.

HTTP yeniden denemesi de SDK'nın içinde: `retry-after` başlığına uyuyor, üstel geri
çekilme ve dağıtım (jitter) uygulanmış. **`instructor-js` elendi** — OpenAI istemcisini
zorunlu eş bağımlılık yapıyor, tipleri zod v4'te olmayan bir isme dayanıyor ve
2025-01'den beri commit almamış. Onarım turu deseni alınır, paket alınmaz.

Şema uyumsuzluğunda onarım turu `p-retry` ile kurulur (`shouldRetry`,
`shouldConsumeRetry`, `onFailedAttempt`). Varsayılanları ezmek şart: on deneme ve
tavansız bekleme kabul edilemez. **Tek yeniden deneme katmanı olacak** — SDK'nınki ile
bizimki üst üste binerse hata bir yerine dört kez gider.

Akış (streaming) gerekmiyor: yalnız çok büyük yanıtlarda zorunlu hale geliyor, bizim
birim başına çıktımız o eşiğin çok altında.

### Kaynak sadakati — sıra önemli

Tarama tek cümlede topladı: **kaynak sadakati üretimden sonra eklenemez.** Çalışan tek
sıra şu — modelden **önce alıntıyı iste, sonra o alıntıdan soruyu üret**. Ters sırada
model soruyu uydurur, sonra ona uyan bir alıntı arar ve bulamazsa uydurur.

İkinci kural: sayfa üst verisi parçaya **doğduğu anda** iliştirilir, sonradan eşlenmez.

### PDF'siz kip

"İnterneti araştır ve şu konuda soru üret" denildiğinde çekilen metin
`build/cache/<url-hash>.txt` dosyasına yazılır — yoksa alıntı doğrulaması deterministik
kalmaz ve web kipi denetlenemez hale gelir.

---

## 5. Dalgalar

**Dalga 0 — iskelet ve dağıtım hattı.** `electron-vite`, TS strict, veritabanı katmanı,
şema, `ts-fsrs`. Üç-OS Actions matrisi **şimdi** kurulur, sonra değil.
*Kabul*: `npm run dev` pencere açar **ve paketlenmiş derlemede** veritabanı açma
denemesi geçer. *Ölçü*: üç platformda artefakt inip çalışıyor.

**Dalga 1 — dikey dilim.** Elle yazılmış beş soruluk `modules/_ornek/` uçtan uca
oynanır: soru göster, şık aç, yanlış eleme ve o şıkka özel daktilo, çözüm blokları,
üç dereceli işaretleme, veritabanına yazım, FSRS vadesi. Şemalar bu dalgada donar.
*Kabul*: uygulamayı kapat-aç, vadeler korunmuş. *Ölçü*: üç soruyu "anlamadım" işaretle,
üçü de aynı oturumda geri gelsin; "anladım"lar gelmesin.

**Dalga 2 — `quizforge`.** LANGE kitabının tek bölümünde (~40 sayfa) uçtan uca çalışır.
*Ölçü*: Ctrl+C ile kes ve yeniden başlat, aynı birim ikinci kez modele gitmesin;
alıntı doğrulamasında en az %95 geçiş; üretilen ilk 40 sorunun elle okunmasında en az
%85 kabul. **Bu eşik tutmadan Dalga 3'e geçilmez.**

**Dalga 3 — ölçek ve sürümleme.** Tüm kitap, 1500-3000 soru. Blok tembel yükleme,
kuyruk politikası, `moduleSync`. *Kabul*: 3000 kartlı modülde oturum başlatma 300 ms
altında, bellek 400 MB altında.

**Dalga 4 — deneyim.** Puan sistemi ve şıksız bilme bonusu, "çözümü tekrar anlat",
istatistik ekranı, **"bu soru bozuk" bayrağı** (`flags.json` → quizforge o birimi
yeniden üretir), klavye kısayolları, koyu tema.

Grafikler `visx`, altı paketle sınırlı. Primitifleri stilsiz SVG olduğu için renk
doğrudan tema değişkenlerimizden geçiyor, kütüphane kendi paletini dayatmıyor — ısı
haritası da hazır geliyor. `recharts` elendi: ısı haritası bileşeni yok ve tepki veren
kabı sabit ebeveynde küçülmüyor (2023'ten beri açık kayıt).

Uzun listeler (soru bankası, istatistik) `@tanstack/virtual` ile sanallaştırılır — sınav
ekranında değil, orada tek soru var. **Klavye gezinmesi indeks tabanlı yazılmalı**:
görünmeyen satır DOM'da olmadığı için seçim düğüme bağlanırsa Tab ve ekran okuyucu
bozulur.
*Kabul*: fare kullanmadan tam bir oturum tamamlanabiliyor.

**Dalga 5 — dağıtım.** `electron-builder` üç hedef, `electron-updater`, gömülü örnek
modül, GIFT dışa aktarma, İngilizce README, her ana klasöre yönlendirici `AGENTS.md`.
*Ölçü*: temiz bir Windows makinesinde kurulumdan ilk soruya 60 saniyeden az.

---

## 6. Riskler

**1. Üretim kalitesi — en kırılganı.** 3000 soru üretilir, bir kısmı bozuktur
(belirsiz kök, iki savunulabilir şık, zayıf çeldirici) ve bunu 200 soru çözdükten sonra
fark edersin. `verify` bunu yakalayamaz, sorun semantiktir. *Nasıl anlarız*: Dalga 2'de
ilk 40 sorunun elle okunması. *Ne yaparız*: "bozuk" bayrağı geri besleme halkasını
Dalga 4'e bırakmadan Dalga 1'de ucuza koy.

**2. Yerel veritabanı derlemesi.** Üç platform × Electron ABI × macOS arm64 klasik
acıdır; geliştirmede çalışır, **paketlide** kayıt hatası verir. Bu yüzden Dalga 0'ın
kabul kriteri paketlenmiş derlemedir. *Ne yaparız*: veritabanı erişimi bir arayüz
arkasına alınır, geçiş tek dosyayı değiştirmek olmalı. Yerleşik `node:sqlite`
seçeneğinin uygulanabilirliği `docs/taramalar/yerel-modul-paketleme.md` ile karara
bağlanacak.

**3. PDF varlık çıkarımı.** 1468 sayfalık çeviri kitapta şekiller çoğu zaman tek bir
gömülü nesne değil — parçalı vektör çizimi ya da sayfaya gömülü tarama. Çıkarım 5×5
piksellik çöp döker. *Nasıl anlarız*: `assets/img/` içinde 2 KB altındaki dosya oranı
%30'u geçiyorsa kırılmıştır. *Ne yaparız*: sayfayı 200 DPI render et, modelden şekil
sınır kutusunu iste, kırp. Pahalı ama her PDF'te çalışır. **Dalga 2 bu yedek denenmeden
kapatılmaz.**

**4. Lisans sızması.** MIT dağıtım planı, ekosistemin en iyi araçlarının AGPL olmasıyla
çatışıyor (PyMuPDF, mupdf, Anki). Kural: AGPL kodundan **desen alınır, kod alınmaz**;
bağımlılık listesine AGPL girmez.

---

## 7. Konsey ayrışması

**Derece eşlemesi.** Üye A üçlü beyanı doğrudan FSRS notuna eşledi. Üye B nesnel
sinyali de kattı. B'nin eşlemesi alındı: şıksız bilme bonusuna işlev kazandırıyor ve
öznel iyimserliği düzeltiyor. A'nın önerisi daha basit ve savunulabilir; karmaşıklık
sorun olursa geri dönülecek yer burasıdır. Tarama B'yi destekledi — üç seçenek tek
başına dört dereceye yetmiyor, şık denemesi sonucuyla birleşince yetiyor.

**Emeklilik.** A "anladım" der demez emekli ediyor, B `stability > 365g` şartı koyuyor.
İkisi de haklı — A istenen davranışı yapıyor, B aralıklı tekrarın doğrusunu. Varsayılan
A, ayarla açılan ikinci kip B.

**PDF kütüphanesi.** A `mupdf`, B `pdfjs-dist` önerdi. **İkisi de düşürüldü**, ama
gerekçeleri farklı: `mupdf` AGPL olduğu için alınamaz. `pdfjs-dist` ise lisans olarak
temiz ve `getOutline()` birinci sınıf, belgelenmiş bir API — zayıf olan yalnız görsel
çıkarma tarafı. Elenme sebebi ikinci bir PDF motorunu ayakta tutmanın maliyeti: zincir
zaten Python yan-sürecinde `pypdfium2` + `pdfplumber` + `camelot` + `docling` ile
kuruluyor, içindekiler ağacını da orası veriyor.

`pdf-lib` hiç değerlendirmeye girmedi: son yayını 2022, kendi belgeleri sayfa metni
çıkaramadığını söylüyor ve `/Outlines` API'si yok.

**Parçalama birimi.** A ~15 sayfalık sabit dilim, B alt başlık. B alındı: sabit sayfa
dilimi kavramı ortadan böler.

**Kural dosyası biçimi.** A Markdown şablon, B YAML. B alındı, yorum satırı gerekiyor.

**Şema doğrulayıcı.** İkisi de `zod` dedi, ama B 3000 kayıtta hızını ölçmediğini
belirtti ve JSON Schema üretme ihtiyacını hatırlattı. Tarama kararı verdi: **Zod v4**,
çünkü `z.toJSONSchema` aynı tanımdan yapay zekâya verilecek şemayı da üretiyor — üç iş
tek kaynaktan. `ajv` yalnız hız gerçekten ölçülüp sorun çıkarsa ikinci aşamada gelir.
TypeBox elendi: `sinclairzx81/typebox` 1.x hattına geçmiş ve TypeScript 6 + yalnız ESM
şartı koyuyor, eski `@sinclair/typebox` ayrı bir depoya taşınmış.

**Her iki üye de** brifingdeki "anladıkları bir daha gelmez" ifadesinin aralıklı
tekrarın tanımıyla çeliştiğini bağımsız olarak işaretledi. Yukarıdaki iki kipli çözüm
bu uyarıya cevaptır.
