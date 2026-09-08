[[netlestirme:002]]

# Netleştirme: LANGE modülünde görsel/şekil soruları şart. İki yol var: (a) şimdi durup hattı g

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

LANGE modülünde görsel/şekil soruları şart. İki yol var: (a) şimdi durup hattı görsel destekli hale getirmek, (b) metin modülünü 322 birimde bitirip görselleri ikinci geçişte eklemek. Hangisi? Ayrıca soru şemasında görselin yeri ne olmalı — stem'e bir görsel alanı mı eklenmeli, yoksa mevcut solution image bloğu yeter mi? Görselleri PDF'ten çıkarıp birime ve şekil altyazısına bağlamanın deterministik yolu ne olur, hangi kusur sınıflarını beklemeliyim?

## Elde olan olgular

# Olgular — Quizloop / LANGE görsel sorusu

## Ürün
Quizloop: Electron + React + TypeScript aralıklı tekrar sınav motoru. Modüller
`modules/<id>/blocks/NNNN.json` (50'lik bloklar) + `module.json`. AGPL-3.0-or-later.
Telifli kaynak PDF ve türetilen külliyat git'e girmiyor, modüller de girmiyor.

## Kaynak
LANGE Klinik Anesteziyoloji 7. baskı, 1465 PDF sayfası, gövde 22-1411 (kitap 1-1390).
Metin katmanı pypdf ile `pages.jsonl` olarak çıkarıldı; satır sonu tireleri külliyata
işlendi. Bölüm haritası `chapters.json`, 59 bölüm.

## Hat (tools/quizforge)
Komutlar: init | plan | brief | ingest | run | verify | pack | doctor.
Plan 322 birim çıkardı (alt başlık sınırları, 3-8 sayfa, ortalama 4.3 sayfa).
Üretim yolu: `brief` birim istemini dosyaya yazar; oturum içi Sonnet alt ajanı
JSON'u `build/raw/<birim>.json` içine yazar; `ingest` doğrular ve şemaya çevirir.
İkinci yol: `run` doğrudan API (ANTHROPIC_API_KEY + --max-usd), tahmini ~$15.

Deterministik denetimler `ingest`/`verify` içinde:
- `quote` külliyatta bulunmalı (tire toleranslı); bulunamayan soru düşer.
- Modelin bildirdiği sayfa yok sayılır, alıntı külliyatta aranarak sayfa bulunur.
- Doğru şık harfi kodda dengelenir; çözüm metnindeki harf atıfları düzeltilir.
- Trigram Jaccard yakın-kopya uyarısı, χ² harf yanlılığı denetimi.
- `image` bloğu için referans verilen varlık diskte yoksa hata.

## Şu anki durum (2026-09-09)
53 birim işlendi, 389 soru, 35 düşen (%8), 0 hata, 3 uyarı.
Birim başına ~85-95k Sonnet token, ~2.5 dakika; 8-9'lu paralel koşuyor.
Kalan 269 birim.

## Soru şeması (zod, src/shared/schema/question.ts)
id, conceptId, stem{md}, choices[{key A-E, md}], correct, distractors (her yanlış
şık için açıklama zorunlu), solution: SolutionBlock[], source{file, pages:[a,b],
quote, chapter}, difficulty, tags, contentHash, deleted.
SolutionBlock türleri: text{md} | hint{md} | formula{tex} | image{ref} | table{header,rows}.
`stem` yalnız markdown; **gövdeye görsel iliştirmek için ayrı bir alan yok**, görsel
şu an sadece çözüm bloğu olarak durabiliyor.

## Karar 0004 (yürürlükte)
`uretim.yasakli: [table, image]` — v1'de tablo ve görsel kapsam dışı. Ajanlara
"şekle, tabloya, görsele atıf yapan soru yazma" deniyor. `source.pages` kitap
sayfası taşır, ofset 21.

## Kullanıcının yeni isteği
"resimler de alınmalı, şart; ancak sonradan mı eklenmeli orasını düşünebiliriz."

## Bilinenler / bilinmeyenler
- pypdf görsel çıkarabilir; sayfa başına gömülü XObject sayısı ölçülmedi.
- Şekil altyazıları ("Şekil 3-2 ...") metin katmanında var, ama görsel-altyazı
  eşleşmesi henüz kurulmadı.
- Görsel soru üretimi ajana görüntü okutmayı gerektirir; token maliyeti ~2 kat.
- Telif: kitabın şekilleri telifli; modüller zaten dağıtılmıyor, git'e girmiyor.
