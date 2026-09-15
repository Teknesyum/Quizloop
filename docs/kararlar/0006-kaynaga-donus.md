# 0006 — Kaynağa dönüş: şıksız soru, kaynak kesiti, kitap görünümü

- tarih: 2026-09-15
- durum: kabul
- 0004'ün `uretim.sikSayisi: 5` maddesini zorunluluktan çıkarır
- 0005'in görsel geçişini planın J4 maddesine bağlar

## 1. Şık zorunlu değil

Kullanıcı: "her sorunun cevabı şıklı olmak zorunda değil, illa kullanıcıya şık
sunacağım diye zorlama". Şema iki tip tanır; açık uçlu soruda kullanıcı cevabı
kendi düşünür, açar, kendini puanlar. Puanlama yolu değişmez.

## 2. Kaynak metin değil, kaynağın kendisi

Çözümdeki alıntı bundan sonra PDF'den kesilmiş görüntüsüyle birlikte gelir.
Kesme işi deterministiktir: alıntı PDF sayfasında aranır, bulunan satırların
dikdörtgeni kesilir. Model bu işe karışmaz; bulunamayan alıntı sessizce
atlanmaz, rapora düşer.

## 3. Sayfa numarası bir bağlantıdır

Kullanıcı sayfayı tıklayınca kitabın o açılımı gelir — çift sayfa, çevirme
efekti, ilgili yerin etrafında yanıp sönen anahat. PDF modül paketine girmez;
kullanıcının diskindeki dosya kullanılır, yoksa kesit görseli gösterilir.

## 4. Kesit ile görüntüleyici aynı çözücüyü paylaşır

Alıntının PDF üzerindeki yerini bulan tek bir kod yolu vardır. Kesit onu
üretim zamanında, görüntüleyici çalışma zamanında kullanır; iki yerde iki
farklı arama yapılmaz.
