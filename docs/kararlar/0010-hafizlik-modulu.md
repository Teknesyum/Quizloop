# 0010 — Kur'an Hafızlık Modülü Secavend Duraklarından Bölünür

Tarih: 2026-10-04. `PLAN.md` bölüm 12'deki "soru birimi" açık kararını kapatır.
Görüş: `docs/danisma/003-fable-hafizlik-modulu.md`.

**Karar.** Soru birimi ayet değil, Diyanet mushafının secavend durağıyla ayrılan parçadır.
Bir parça gösterilir, sonraki parça sorulur. Uzun ayet tek soru olmaz.

- Bölen işaretler: ط ج ز ص ق قف م. Bölmeyenler: لا, rukû (ع), muanaka.
- Üç kelimeden kısa parça öncekine, baştaysa sonrakine katılır (`--en-az`).
- Bölüm = cüz (`source.chapter` = "N. Cüz"); uygulamanın Bölümler ekranı aynen kullanılır.
- Parça başına tek kart, `coktan-secmeli` (sahibin kararı, 2026-10-04): uygulama şıkları
  "Şıkları göster"e basılana dek gizlediği için ezberden okuma şıklardan önce yapılır. Her şık
  Kur'an'da aynen geçen bir parçadır, uydurma ya da değiştirilmiş Arapça yoktur.
- Çeldirici sırası: benzer parçanın devamı (müteşâbih) → doğru cevapla aynı başlayan → aynı
  surede, aynı harfle biten en yakın parçalar. `--siksiz` kartları `acik-uclu` üretir.
- Aynı gövde iki yerde farklı devam ediyorsa önüne en çok üç önceki parça eklenir; yine
  ayrışmazsa sure adı ve ayet numarası yazılır.

**Kaynak.** Metin: `alperenugus/Kuran` deposundaki Diyanet metni, işlem (commit) ve SHA-256
ile sabitlenir (`tools/quizforge/src/hafizlik/kaynak.ts`). Meal ve kelime kelime meal:
quran.com API v4 (varsayılan meal 77, Diyanet İşleri). Hepsi kullanıcının makinesine iner;
`sources/`, `modules/` ve `dist/modules/` depoya girmez.

**Bütünlük.** Sağlama toplamı, 114 sure / 6236 ayet sayım tablosu, quran.com Uthmani metniyle
harf iskeleti çaprazı (6233/6236 aynı; 21:88, 63:10, 72:16 bilinen imla farkı, izin listesinde).
Gösterilen metne dönüştürme uygulanmaz.

**Arayüz.** Şema değişmedi. `p`, `li`, `td` öğelerine `dir="auto"`; Arapça için
Scheherazade New 400 (OFL, `@fontsource`), paragraflar ortalı, boyutlar teknesyum-ui
belirteçlerinden. Metindeki 66 işaretin hepsini taşıyan iki aday vardı (Noto Naskh, Scheherazade
New); sahibi ikisini görüp Scheherazade New 400'ü seçti. Amiri ve Amiri Quran secavend işaretlerini taşımıyor.

**Kapak.** `assets/kapak.webp` ve `assets/bolum/N.webp` (simgesiz düz renk geçişi, tema
renkleri; simge kart yazılarıyla çakıştığı için kaldırıldı). Görseller depoda: `tools/quizforge/src/hafizlik/kapak/`, üreten `py/hafizlik_kapak.py`.

**Ölçüm (2026-10-04, sürüm 1.2.1).** 10.509 parça, 10.508 soru, hepsi çoktan seçmeli; 8.653'ünde
en az bir benzer ayet çeldiricisi var. 211 blok, paket 4,4 MB. Bağlam eklenen gövde 1.242, sure adıyla ayrılan 9.

**Açık.** Bir hafızın denemesi yapılmadı. Benzeri olmayan 1.855 parçada çeldiriciler yalnız
yakın parçalardır, kolay elenebilir. Kelime tablosu Uthmani imlasıyla, geri kalan Diyanet imlasıyla.
