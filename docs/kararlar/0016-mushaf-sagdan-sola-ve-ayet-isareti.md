# 0016 — Mushaf Sağdan Sola Çevrilir, Ayetin Satırı İşaretlenir

Tarih: 2026-10-04

## Sorun

Sahibinin sözü: "kuran modülünde yine sayfa çevirme eski saçma usule dönmüş ayrıca ilgili
ayetin hangi satırda olduğu neden vurgulanmıyor..."

Ölçüm (tarayıcı kabuğu, "Kuran'da gör"): kitap 26–27. sayfayı Latin kitabı gibi açıyor (26
solda), ileri çevirme sağdan sola kıvrılıyor; sayfada işaret sayısı 0.

İşaretin çıkmama sebebi: mushaf PDF'inin yazı katmanı bozuk eşlenmiş, okunan metin ayetle
tutmuyor; alıntı araması hiçbir zaman isabet etmiyor.

## Karar

1. **Yön modülün beyanıdır.** `module.json` → `source.sagdanSola` (isteğe bağlı). Uygulama
   metne bakıp tahmin etmez. `SourceBook.sagdanSola` olarak arayüze gider.
2. **Çevirme aynalanır.** Kitap sahnesi yatayda ters çevrilir, her yaprak kendi içinde geri
   çevrilir; fare ve dokunma konumu da aynalanır. Çift sayfa sağda, ileri çevirme soldan
   sağa kıvrılır. Ok tuşları yer değiştirir: sol ok ileri, sağ ok geri. Kıvrılma hareketi
   aynı kalır (karar 09-24, StPageFlip).
3. **İşaret üretimde hesaplanır.** `Source.isaretler`: `{ pdfSayfa, bbox }` listesi (isteğe
   bağlı). Kitap görünümü öncelik sırasıyla `kesit`, `isaretler`, alıntı aramasını kullanır.
4. **Mushaf için kaynak:** `py/hafizlik_satir.py` PDF'teki ayet sonu işaretlerini (﴾n﴿)
   sırayla okur; 114 sure ve 6236 ayet tutmazsa durur. Her ayetin satır parçaları çıkar.
   Sorunun cevabı ayetin bir parçasıysa kutu, kelime sırasına göre orantıyla daraltılır;
   bu yaklaşıktır, bir iki kelime kayabilir. `source.pages` işaretin düştüğü sayfaya çekilir.

## Sonuç

Eski uygulama yeni modülü açar (fazla alanlar şemada atılır), yalnızca yeni davranışı
göstermez. Hafızlık modülü 1.6.0 olur; soru kimlikleri değişmez, ilerleme korunur.
