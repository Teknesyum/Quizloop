# Netleştirme: LANGE 7. baskı PDF'ini Quizloop modülü için uygun hale getirmek somut olarak ne 

- tarih: 2026-09-08
- girdi: 001-lange-7-baski-pdf-ini-quizloop-modulu-ic-girdi.md
- maliyet: 51015 token, 24 sn, claude-opus-5

## Dönen

## Belirsizlikler ve netleştirme soruları

**1. Kapsam.** "Uygun hale getirme" bittiğinde elimde ne olmalı — yalnız kaynak hazırlığı (sayfa metni külliyatı + bölüm/alt başlık haritası + `rules.yaml`) mı, yoksa `tools/quizforge/` CLI'ının yazılıp soruların da üretilmiş olması mı?

**2. Külliyatın yeri ve biçimi.** Çıkarılan metin nereye, hangi biçimde yazılsın — `sources/lange7/` altında sayfa başına bir `.txt` mi, tek `.jsonl` mi; yumuşak tire/satır sonu birleştirme gibi normalizasyon külliyata mı işlensin yoksa yalnız `verify` anında mı uygulansın?

**3. Sayfa numarası.** `source.pages` ve `ModuleMeta.source.pages` PDF sayfasını mı kitap sayfasını mı taşıyacak (aralarında +21 fark var), ve `source.file` telifli PDF'in adı mı olacak yoksa külliyat dosyası mı?

**4. Parça birimi ve tablo/görsel.** `/Outlines` bozuk olduğu için alt başlıklar metinden çıkarılacak — hangi kural (büyük harf/numaralı başlık deseni?) ve çıkaramadığı bölümlerde geri çekilme ne olsun (sabit 3-8 sayfalık pencere mi, bölüm bütünü mü); OCR'da düzeni bozulmuş tablolar ve görseller v1'de kapsam dışı mı?

**5. Modül kimliği ve kapsam sınırı.** Modül `id`'si ne olsun (`^[a-z0-9][a-z0-9-]{1,63}$`), ve 59 bölümün tamamı mı işlenecek — ön madde, indeks, ekler ve varsa vaka/klinik bölümleri atlanacak mı, yoksa önce tek bölümlük bir pilot mu istiyorsun?

## Cevaplar

2026-09-09: beş soru docs/kararlar/0004-modul-uretim-kurallari.md ile kapatıldı.
Özet: kapsam = kaynak + hat + paketlenmiş sorular; külliyat sources/<id>/pages.jsonl;
source.pages kitap sayfası ve source.file telifli PDF adı; birim = BÜYÜK HARF alt başlık,
3-8 sayfa penceresine sığdırılır, tablo/görsel v1 dışı; id lange-anestezi-7, gövde 22-1411,
59 bölümün tamamı, önce 1. bölüm pilotu.
