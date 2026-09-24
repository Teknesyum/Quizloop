# 0007 — Zorluk Tek Ölçütle Verilir, Kota Yok

- tarih: 2026-09-24
- durum: kabul
- 0004'ün `uretim.zorlukDagilimi` maddesini kaldırır

## 1. Sorun

Kullanıcı: "zorluklar çok tutarsız". Neden: üretim istemi her birime "kolay %30, orta %50,
zor %20" kotası dayatıyordu. Model soruyu değil oranı etiketledi. Eski ve yeni etiketlerin
karşılaştırması bunu gösteriyor: eski 601 "zor" sorudan 346'sı tek bir ezber bilgi soruyor.

## 2. Karar

Zorluk, kaynağı görmeyen adayın yapması gereken işle ölçülür. Ölçüt `tools/quizforge/src/zorluk.ts`
içinde `ZORLUK_OLCUTU` olarak tek yerde durur; hem üretim istemi hem sonradan etiketleme
onu kullanır. Altı alt ölçüt: K1 (tek olgu hatırlama), O1 (tek adım çıkarım), O2 (tek kuralı
vakaya uygulama), Z1 (çok adımlı klinik akıl yürütme), Z2 (iki bilgiyi birleştirme),
Z3 (yakın çeldirici ya da istisna). Kota yok; dağılım içerikten çıkar.

`rules.yaml` içindeki `zorlukDagilimi` alanı artık okunmaz. Dosya değiştirilmedi, çünkü
değişirse `rulesHash` ve plan geçersiz olur.

## 3. Sonuç

Mevcut 3030 soru bu ölçütle yeniden etiketlendi. Ölçüm: `docs/olcumler/0003-zorluk-etiketleri.md`.
Dağılım kolaya kaydı (%64,5 kolay, %2,4 zor); bu bankanın gerçek hali. Zor soru istenirse
çözüm etiketi değiştirmek değil, Z ölçütlerine göre soru üretmektir.
