# 0008 — Görsel Ve Tablo Soru Türleri

Tarih: 2026-09-30. 0005'i genişletir, geçersiz kılmaz.

**Karar.** Soru yalnız metinden çıkmaz. Üç biçim eklenir:

- **Tablolu kök** — `stem.table`: kitaptaki tablo yapılandırılmış olarak kökte verilir,
  soru tabloyu okumayı ve yorumlamayı sınar. Hücreler kaynak sayfanın metninde bulunmak
  zorundadır (verify), uydurma tablo çöpe gider.
- **Maskeli görsel** — `stem.masks`: şekildeki bir etiket kutuyla kapatılır, "işaretli
  yapı hangisi" diye sorulur. Kutular OCR sözcük kutularından deterministik gelir.
- **İşaretleme** — `kind: isaretleme`: şıklar görsel üstündeki kutulardır; öğrenci
  tıklar ya da harfe basar. Oturum makinesi değişmez, şık anahtarlarıyla çalışır.

Her görselde `alt` metni zorunlu hedeftir (verify uyarır). Sızıntı kuralı: kapatılan
etiket ya da doğru şık metni kökte geçemez (verify hatası).

**Neden.** Anesteziyoloji sınavı monitör trazesi, devre şeması ve tablo okutur;
metinden türetilmiş soru bu beceriyi ölçmez.
