# Netleştirme: Quizloop'un oturum (soru sorma) ekranının tasarımını toparlamam gerekiyor. Kulla

- tarih: 2026-09-09
- girdi: 004-quizloop-un-oturum-soru-sorma-ekraninin--girdi.md
- maliyet: 47.925 token, 17 sn

## Dönen

Belirsiz kalanlar ve netleştirme soruları:

1. **Anahtar terim vurgusu kaynağı** — Terimler nereden gelecek: `tags` alanı mı, stem markdown'ında yazarın işaretlediği `**kalın**`/`*italik*` mi, yoksa yeni bir alan (üretim tarafında quizforge değişikliği) mı? Renk kategorisi (olgu/durum vs. madde/ilaç) nasıl belirlenecek?

2. **Soru cümlesi ayrımı** — Stem'i "gövde + soru cümlesi" diye ayırmak veri tarafında mı yapılacak (2532 sorunun `stem.md`'si yeniden yazılacak/işlenecek) yoksa yalnız görüntüleme tarafında (son cümle/`?` ile biten paragraf sezgisel olarak ayrılacak) mı?

3. **Font büyüt/küçült kapsamı** — Seçenek yalnız oturum ekranını mı etkileyecek yoksa tüm uygulamayı mı; kalıcı (ayar dosyası) mı, oturumluk mu; kısayolla mı (Ctrl +/−) yoksa düğmeyle mi?

4. **"Anlamadım" hiyerarşisi** — Kullanıcı üç düğmeden hangisinin öne çıkmasını bekliyor: en sık basılan (varsayılan eylem) mı, yoksa görsel ağırlık üçünde eşit mi olmalı? Bu, primary/ghost dağılımını belirler.

5. **Kısayol satırı kapsamı** — Kısayol açıklamaları tek satırda mı kalmalı (bugünkü gibi sabit alt satır) yoksa evreye göre değişen (stem'de farklı, solved'da farklı) bağlamsal metin kabul mü?
