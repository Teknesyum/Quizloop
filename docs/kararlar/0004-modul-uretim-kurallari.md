# 0004 — Modül üretim kuralları (LANGE 7. baskı)

- tarih: 2026-09-09
- durum: kabul
- kaynak: docs/netlestirme/001-lange-7-baski-pdf-ini-quizloop-modulu-ic.md

Netleştirmede sorulan beş soruyu kapatır.

## 1. Kapsam

"Uygun hale getirme" = kaynak hazırlığı **ve** üretim hattı. Bitince elde şunlar olur:
külliyat (`pages.jsonl`), bölüm haritası (`chapters.json`), `rules.yaml`, `tools/quizforge/`
CLI'ı ve `modules/lange-anestezi-7/` altında paketlenmiş sorular.

## 2. Külliyatın yeri ve biçimi

`sources/<modul-id>/pages.jsonl`, sayfa başına bir satır:
`{pdfPage, bookPage, chapter, text}`. Yumuşak tire birleştirme **külliyata işlenir**
(18 867 tire), böylece üretim ve `verify` aynı metni görür. Ham PDF `database/` altında
kalır ve git'e girmez; `pages.jsonl` de girmez, `rules.yaml` ve `chapters.json` girer.

## 3. Sayfa numarası — kritik

`source.pages` **kitap sayfasını** taşır. Gerekçe: soru kaydı insanın kitaptan
doğrulayacağı kayıttır, elindeki baskıda 22. PDF sayfası "1" yazar. Dönüşüm sabittir
(`sayfaOfseti: 21`, `chapters.json` içinde de var), bu yüzden `verify` alıntıyı ararken
kitap sayfasını PDF sayfasına çevirir ve determinizm bozulmaz. Modele verilen parçada
`[[sayfa N]]` işaretleri de kitap sayfasıdır.

`source.file` **telifli PDF'in adıdır** (`LANGE 7. BASKI.pdf`), külliyat dosyası değil.
İz sürülen şey kitaptır; külliyat türev bir ara üründür ve yeniden üretilebilir.

## 4. Parça birimi, tablo ve görsel

Birim = alt başlık. Alt başlık kuralı: satırın tamamı büyük harf, en çok 8 kelime,
nokta ile bitmiyor, en az 6 harf. Bulunamayan yerlerde geri çekilme sabit pencere:
birim 3 sayfanın altına düşerse öncekine eklenir, 8 sayfayı aşarsa eşit parçalara bölünür.
LANGE'de sonuç 322 birim, ortalama 4.3 sayfa.

Tablo ve görsel v1'de kapsam dışı. `uretim.yasakli: [table, image]`; modele şekle,
tabloya veya görsele atıf yapan soru yazmaması söylenir.

## 5. Modül kimliği ve kapsam sınırı

`id: lange-anestezi-7`. Gövde 22–1411 PDF sayfası; ön madde (1–21) ve indeks (1412–1465)
atlanır. 59 bölümün tamamı işlenir, bölüm atlanmaz. Sıra: önce 1. bölüm pilotu,
`verify` temiz çıkarsa gerisi.

## Üretim yolu

API anahtarı yerine oturum içi alt ajanlar kullanılır: `quizforge brief` birim istemini
dosyaya yazar, ajan (angarya olduğu için Sonnet) JSON'u `build/raw/` altına bırakır,
`quizforge ingest` alıntıyı doğrulayıp şemaya çevirir. Karar gerektiren iş Opus'ta kalır.
Anahtarla doğrudan koşan `run` komutu duruyor, ikinci yol olarak kullanılabilir.
