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

## Düzeltme: Kelime Kutusu (2026-10-05, Modül 1.7.3)

Sahibinin sözü: "kuranda gör dediğimde işaretleyen alan çok alakasız olabiliyor".

Sebep: 4. maddedeki orantı. Kutu, ayetin satır genişliği kelime sayısına bölünerek
daraltılıyordu; kelimeler eşit genişlikte olmadığı için işaret satır içinde birkaç kelime
kayıyordu (örnek: 63:4, cevap dört kelime, işaret yedi kelimeyi kaplıyordu).

Yeni yol: PDF'in yazı katmanındaki harfler sırası ve yeriyle okunur, ayet metninin harfleriyle
hizalanır (difflib), her kelimenin kutusu kendi harflerinden çıkar. Cevabın işareti, kendi
kelimelerinin kutularının satır satır birleşimidir; ayetin son kelimesi ayet sonu işaretini de
alır. Kutuya iki yandan 3 punto pay verilir.

Ölçüm: 329.665 harfin 312.532'si eşleşti; 77.647 kelimenin 126'sının yeri bulunamadı, 17'si
sıra dışı çıktığı için atıldı (komşu kelimeler boşluğu kapatır). 10.508 sorunun 10.507'si
işaretli. On iki rastgele soruda işaret cevabın ilk ve son kelimesine oturdu:
`tmp/isaret-once-1.png`, `tmp/isaret-sonra-1.png`, `tmp/isaret-sonra-2.png`.

## Düzeltme: Kutu Kenarları (2026-10-05, Modül 1.7.4)

1.7.3 kutusunun sağ kenarı kelimenin ilk harflerini kesiyordu (2:69'da "قال"ın "قا"sı dışarıda kalıyordu). Sebep: PDF'teki harf konumu çizilen şeklin sol kenarıdır, kelimenin sağ ucu ilk harfin konumundan bir şekil genişliği kadar sağdadır.

Yeni kural: kelimenin sağ kenarı, aynı satır parçasında kendinden önce gelen kelimenin sol kenarından 2 punto içeridedir. Satırın ilk kelimesi sayfanın yazı çerçevesinin sağına, satırın son kelimesi çerçevenin soluna kadar uzar (çerçeveden 20 puntodan uzak, ortalanmış satırlarda satırın kendi ucu alınır). Kanıt: `tmp/isaret-kenar.png`, `tmp/isaret-ornek-174.png`.
