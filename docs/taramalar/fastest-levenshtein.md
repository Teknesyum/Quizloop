# fastest-levenshtein

## Depo
ka-weihe/fastest-levenshtein · https://github.com/ka-weihe/fastest-levenshtein · MIT ·
GitHub'daki son etiket 1.0.15 (2022-08-02), npm `latest` 1.0.16 · 772 yıldız · ~4,6 MB
depo (yayınlanan paket birkaç KB), TS · son commit 2024-01-28 (README), 2 açık issue.

## Ne için bakıldı
İki yer: `source.quote` alıntısının kaynak metinde geçtiğinin sınanması ve kökler arası
tekrar tespiti. Soru, düzenleme uzaklığının bu ikisinden birine oturup oturmadığı.

## Alınacak fikirler
- **Alıntı doğrulaması düzenleme uzaklığı işi değil.** Karar ikili: normalize alıntı
  normalize kaynakta geçiyor mu. Alt dize araması eşiksiz ve açıklanabilir; uzaklık
  eşiği (0,9 gibi) keyfi olur, halüsinasyona kapı aralar. Plan'daki karar doğru.
- **Asıl eksik parça yaklaşık *alt dize* eşleme, tam uzaklık değil.** Kütüphane yalnız
  `distance(a, b)` ve `closest(str, arr)` veriyor. 200 karakterlik alıntıyı 10.000
  karakterlik birim metniyle karşılaştırmak anlamsız: uzunluk farkı tek başına uzaklığı
  belirler. Gereken Sellers/bitap türü yaklaşık alt dize araması burada yok.
- **Tek meşru kullanım hata mesajını okunur yapmak.** Alt dize tutmadığında kaynağı
  cümlelere bölüp `closest()` ile en yakın cümleyi bulmak, rapora "model şunu yazdı,
  kaynakta en yakın cümle şu" satırını ekler. Doğrulama kararına karışmaz.

## Kaçınılacaklar
- **Tekrar tespitinde Jaccard yerine kullanmak.** Üçlü-gram Jaccard kelime sırasından
  bağımsız ve uzunluk farkına dayanıklı, düzenleme uzaklığı sıraya duyarlı: sözcükleri
  yer değişmiş iki eş soru Jaccard'da yakalanır, uzaklıkta kaçar. Küme işlemi ucuz da.
- **Kıyaslama iddialarına dayanmak.** README "JS'deki en hızlı uygulama" diyor; ölçüm
  kendi deposunun benchmark'ı, bağımsız olarak **doğrulanamadı**.
- **Sürüm sapması.** npm'de 1.0.16 var, depoda karşılığı etiket yok — alınırsa sabitle.

## Karar
`elendi` — alıntı doğrulaması alt dize araması, tekrar tespiti Jaccard ile çözülüyor;
ikisinde de düzenleme uzaklığına yer yok. MIT, lisans engeli yok; ihtiyaç yok. Hata
mesajında "en yakın cümle" istenirse yeniden bakılır.
