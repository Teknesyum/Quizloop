# Türkçe metin işleme — arama, sıralama, normalizasyon

## Depolar

Seçim gerekçesi: sorun tek değil, üç katmanlı. Eşleşme/depolama (FTS5), harf semantiği
(ICU/Intl), kelime semantiği (Zemberek). Meilisearch/Typesense tipi arama motorları
elendi — Electron'un yanına ikinci bir çalışma zamanı ve süreç getiriyorlar.

- **SQLite FTS5** · https://github.com/sqlite/sqlite · public domain (GitHub API `NOASSERTION`) · son push 2026-08-22 · 10.317 yıldız, 22 açık issue, depo ~562 MB. Ölçümler yerel sqlite 3.50.4 ile yapıldı.
- **unicode-org/icu** (+ Node `Intl`) · Unicode License (GitHub API `NOASSERTION`) · son push 2026-08-22 · son etiket `release-78.3`, 2026-03-17 · 3.583 yıldız, 141 açık issue. Node v25.2.1 ICU 77.1 gömülü geliyor, `small-icu` değil (yerel ölçüm). Node belgesi: "full-icu is the default ... official binaries are also built in this mode".
- **ahmetaa/zemberek-nlp** · Apache-2.0 (LICENSE başlığı) · son commit 2026-04-28, içeriği protobuf CVE yaması · **GitHub'da hiç etiket/release yok** (API 404); README "latest version 0.17.1, July 2019" ve "This project is now in slow maintenance mode" diyor · 1.352 yıldız, 56 açık issue · Java, jar dağıtımı Maven + Google Drive.
- (yan bakılan) **snowballstem/snowball** · BSD-3-Clause · son push 2026-08-21 · `v3.1.1` · `algorithms/turkish.sbl` mevcut.

## Alınacak fikirler

**1. Katlama (fold) TypeScript'te yapılır, SQLite'a hazır verilir.** FTS5'in kendi
katlaması Türkçe'de bozuk: `unicode61` sözlük dökümü (yerel ölçüm) `İstanbul→istanbul`,
`GÜNEŞ→gunes`, `hâlâ→hala` veriyor ama `IŞIK→isik`, `ışık→ısık` — aynı kelimenin büyük ve
küçük hâli **iki ayrı token** oluyor, hiçbir zaman eşleşmiyorlar. `remove_diacritics 2`
bunu değiştirmiyor; `ı` diyakritik sayılmadığı için hiçbir ayarda `i`'ye katlanmıyor.
Doğru zincir: `toLocaleLowerCase('tr')` → NFKD → `\p{M}` işaretlerini at → `ı`→`i`.
Ölçümde bu zincir hem `IŞIK` hem `ışık` için `isik` üretiyor. Quizloop'ta yeri: PDF
alımı ve soru kaydında `search_text` sütunu; FTS5 bu sütunu indeksler, `text` sütunu
gösterim ve snippet için ham kalır. Değeri: eşleşme kuralı tek yerde, test edilebilir ve
şapka/aksan duyarsızlığı bedavaya geliyor (`â→a`, `ş→s`, `ğ→g`).

**2. Eklemeli yapı için stemming değil, prefix + trigram.** Türkçe ekleri sona
eklediğinden `anestezi*` prefix sorgusu `anestezinin/anesteziye/anestezisi`'ni yakalıyor;
FTS5 prefix sorgusu bunu indeksten karşılıyor. Kırıldığı yer ünsüz yumuşaması:
`ilaç→ilacı`, `böbrek→böbreği`. Bu azınlık için tam morfoloji yerine katlanmış sütun
üzerinde ikinci bir `trigram` indeksi yeterli — FTS5 belgesi trigram'ın
`remove_diacritics` verilmediği sürece `LIKE`/`GLOB`'u indeksten hızlandırdığını söylüyor.
Quizloop'ta yeri: arama kutusunun "geniş" modu. Değeri: Zemberek'in Java bağımlılığı ve
sözlük yükü hiç girmiyor.

**3. Sıralama ile arama iki ayrı yoldur.** `Intl.Collator('tr')` doğru çalışıyor (yerel
ölçüm: `adam ağrı çilek ıslak iş işlem oda Öz sıra soru şeker Ünlü zebra`; `'en'` locale
`ıslak`'ı `iş`'ten sonraya, `şeker`'i `sıra`'nın önüne atıyor). Ama `sensitivity:'base'`
ile bile `ı≠i` (ölçüm: -1), `hala==hâlâ` (0). Yani collator Türkçe'ye sadık, arama ise
sadakatsiz olmalı. Quizloop'ta yeri: liste sıralaması JS tarafında collator ile
(SQLite `ORDER BY` Türkçe bilmiyor), arama fold ile. Değeri: kullanıcı `isik` yazıp
`ışık` bulur ama etiket listesi alfabetik doğru dizilir.

## Kaçınılacaklar

- **SQLite `lower()`/`upper()`/`LIKE`** Türkçe için kullanılmaz. Ölçüm: `lower('İSTANBUL')` → `İstanbul` (değişmedi), `'IŞIK' LIKE 'ışık'` → 0, `'ISIK' LIKE 'isik'` → 1. ASCII dışına çıkmıyorlar.
- **JS'te locale'siz `toLowerCase()`**: `'İSTANBUL'.toLowerCase()` → `i̇stanbul`, 9 kod birimi, `'istanbul'` ile eşit değil (araya U+0307 giriyor). Alıntı karşılaştırmasında sessiz hata kaynağı.
- **ICU eklentisini SQLite'a derlemek**: Electron'un native modül yeniden derleme yüzeyini üç platforma yayıyor; kazanç (1) numaralı fikirle zaten alınıyor.
- **Zemberek'i gömmek**: JVM + jar, README'nin kendi ifadesiyle yavaş bakım, 2019'dan beri etiketli sürüm yok. Python portu `loodos/zemberek-python` (son push 2025-06-23, lisans `NOASSERTION`) da ikinci bir çalışma zamanı demek. Kök bulma gerçekten şart olursa önce Snowball `turkish.sbl` denenir; `node-snowball` native binding olduğu için saf JS üretimi tercih edilir.
- **Ham metni normalize edip saklamak**: NFKD + işaret atma geri döndürülemez, alıntının kaynaktaki gerçek hâlini kaybedersin. Normalize edilmiş metin ayrı sütunda tutulur.
- **PDF metnini temizlemeden indekslemek**: satır sonu tiresi (`-`, U+00AD soft hyphen), ligatür (`ﬁ` → NFKC ile `fi`), sert boşluk ve çift boşluk temizlenmezse hem token bölünür hem alıntı doğrulaması yanlış "bulunamadı" der. Bu temizlik alım (ingest) aşamasına aittir, sorgu aşamasına değil.

## Karar önerisi

1. Tek bir `fold(tr)` fonksiyonu: tr-locale küçültme → NFKD → işaret atma → `ı→i`. Tek kaynak, birim testli.
2. Şema: `text` (ham, gösterim) + `search_text` (katlanmış) + `search_text` üzerinde FTS5 `unicode61`; geniş arama için ikinci `trigram` indeksi.
3. Sıralama SQLite'ta değil, JS'te `Intl.Collator('tr', {numeric:true})` ile.
4. Alıntı doğrulaması: her iki tarafa fold + boşluk/tire tekilleştirme, sonra kaynak metinde arama; eşleşen aralık ham metinden gösterilir.
5. Zemberek/Snowball şimdilik dışarıda; prefix+trigram'ın yetmediği somut örnek biriktikten sonra yeniden bakılır.
