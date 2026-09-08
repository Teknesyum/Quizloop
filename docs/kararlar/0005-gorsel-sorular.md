# 0005 — Görsel ve şekil soruları

- tarih: 2026-09-09
- durum: kabul
- kaynak: docs/netlestirme/002-lange-modulunde-gorsel-sekil-sorulari-sa.md
- 0004'ün `uretim.yasakli: [table, image]` maddesini kısmen kaldırır

Görsel şart. Kullanıcının netleştirme cevapları:

## 1. Kapsam ölçüsü

Sabit oran veya birim başına kota yok. Ölçüt şu: **şekle dayanan konu kapsam
dışı kalmasın**. Bir konu ancak şekille anlaşılıyorsa o şekil bir soruya bağlanır;
metinle anlaşılan konu için görsel zorlanmaz.

## 2. Görselin yeri

İkisi de serbest, ağırlık açıklamada. Şema hazır: `stem.imageRef`,
`choice.imageRef`, `solution` içinde `image{ref, caption}`.

**Cevap sızıntısı kuralı:** soru gövdesinde gösterilen görsel cevabı ele
veriyorsa (etiket, ok, altyazı) ya o bölge sansürlenir ya görsel gövdeye
konmaz, yalnız çözümde gösterilir. Bu kural denetlenebilir değil; üretimde
ajana söylenir ve örneklem elle gözden geçirilir.

## 3. Sıra

Görselli sorular mevcut birimlere **ek**tir; hiçbir metin sorusunun yerine
geçmez. Dolayısıyla metin geçişi 322 birimde bitirilir, görsel ikinci geçiştir.
Paketlenmiş bloklar bozulmaz, yeni sorular sona eklenir.

## 4. Bütçe

Birim başına ~2 kat token onaylandı. Üst sınır konmadı.

## 5. Şekil çıkarımı

Kabul kriteri baştan sabitlenmedi; akıl yürütmeye açık. Ölçüm: gövdede
(PDF 22-1411) 2 550 gömülü görsel var, 1 390 sayfanın hepsinde en az bir tane;
1 998'i 200×200'den büyük, 552'si küçük (logo, çizgi, madde imi). Tek şekil
birden çok gömülü nesneye bölünmüş olabilir, o yüzden şekil sayısı bundan azdır.
Karmaşık eşleşmelerde karar Opus'a bırakılır.
