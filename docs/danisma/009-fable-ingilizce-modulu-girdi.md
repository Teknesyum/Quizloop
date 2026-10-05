# Danışma 009 girdi: İngilizce Modülü — Görüş Girdisi

Ajana giden metin:

---

[[danisma:009]]

# İngilizce Modülü — Görüş Girdisi

## Sahibin Cümlesi (Aynen)

"şimdi bir modül oluşturmanı istiyorum ingilizce öğrenmek amaçlı bir modül yapıcaz quizloopa çok kapsamlı bir çalışma istiyorum testimizi bitiren c2 seviyesine kadar çıkmış olacak seviye seviye modülün alt bölümlerini oluşturmak bir fikir senin önerilerini alalım şuan sadece plan yapıcaz fable a da danış kaynak neresi olmalı vb vb"

Şu an yalnız plan yapılıyor; kod ya da içerik üretilmeyecek.

## Quizloop'un Bugünkü Hali (Olgular)

- Aralıklı tekrar (FSRS) ile çalışan soru motoru. Electron masaüstü, Android (Capacitor), tarayıcı (PWA).
- Modül = salt okunur JSON: `module.json` + `blocks/NNNN.json` (blok başına ~50 soru) + `assets/`.
- Soru türleri yalnız üç tane: `coktan-secmeli` (en çok 5 şık A–E, her yanlış şık için ayrı açıklama zorunlu),
  `acik-uclu` (`beklenenCevap` metni; kullanıcı kendi kendini değerlendirir), `isaretleme` (görsel üstünde kutu).
- Şıklar "Şıkları göster"e basılana kadar gizli; önce akıldan cevaplanıp sonra şık seçilebiliyor.
- Soru kaydı: `id`, `conceptId`, `stem {md, imageRef?, table?}`, `choices`, `correct`, `distractors`,
  `solution[]` (text | table | image | formula | hint), `source {file, pages, quote, chapter}`, `difficulty`, `tags[]`.
- **Ses alanı yok.** Görsel yalnız webp/png/svg. Yazarak cevap girme ve otomatik karşılaştırma yok.
- Bölümler `source.chapter` ile oluşur; uygulamada Bölümler ekranı, günlük hedef, bölüm kartları var.
- Proje kuralı: her soru `kaynak` (dosya, sayfa, alıntı) taşımalı; iddia izlenebilir olmalı.
- `module.language` alanı var (varsayılan `tr`). Arayüz Türkçe ve İngilizce.
- İki üretim yolu var:
  1. `quizforge`: PDF → sayfa külliyatı → alt başlık birimi → alt ajan soru yazar → `verify` alıntıyı
     kaynak metinde deterministik arar. (LANGE Anestezi modülü, 59 bölüm.)
  2. Kurallı üretici: Kur'an hafızlık modülü; model çağırmadan, sabitlenmiş (commit + SHA-256) açık
     kaynaktan 10.508 soru, çeldiriciler algoritmayla seçildi. 211 blok, 10,5 MB.
- Depo AGPL-3.0; `modules/` depoya girmez, paket `dist/modules/` altından dağıtılır. Telifli kaynak
  metni pakete girmez. Modül başkalarına dağıtılacak, yani kaynak lisansı bağlayıcı.
- Kullanıcı kitlesi Türkçe konuşan yetişkinler.

## Ana Ajanın Taslağı (Eleştirilmek Üzere, Doğrulanmış Değil)

- Tek modül yerine seviye başına ayrı modül: A1, A2, B1, B2, C1, C2 (altı paket) ya da tek modülde
  altı ana bölüm. Hangisi daha doğru, emin değilim.
- Seviye içinde alt bölümler: Kelime, Dil Bilgisi, Kalıp Ve Eşdizim, Okuduğunu Anlama, Sık Yapılan
  Hatalar (Türkçe konuşanlara özgü), Seviye Sonu Sınavı.
- Kaynak adayları (lisansları ezberden, doğrulanmadı): CEFR-J kelime listesi (A1–B2), Octanove
  C1/C2 listesi, NGSL/NAWL, Oxford 3000/5000 (telifli), English Vocabulary Profile ve English Grammar
  Profile (Cambridge, çevrimiçi bakılabilir ama yeniden dağıtımı belirsiz), Tatoeba cümleleri
  (Türkçe çevirili), Wiktionary, Open English WordNet, VOA Learning English (ABD kamu malı,
  seviyeli metin), Avrupa Konseyi CEFR tanımlayıcıları, SUBTLEX sıklık listesi.
- Üretim: kelime ve eşdizim için kurallı üretici (hafızlık modülündeki gibi), dil bilgisi ve okuma
  için alt ajanlı yol.

## Sorular

1. Bir soru motoru (çoktan seçmeli + açık uçlu, sessiz, yazmasız) dürüstçe hangi becerileri C2'ye
   kadar taşıyabilir, hangilerini taşıyamaz? "Testi bitiren C2 olur" vaadi nasıl dürüst kurulur?
2. Tek modül mü, seviye başına modül mü? Seviye içi alt bölümler ne olmalı, sıra nasıl olmalı?
3. Kaynak neresi olmalı? Kelime, dil bilgisi, okuma metni ve örnek cümle için ayrı ayrı: hangi
   kaynak, lisansı ne, dağıtılan pakete girebilir mi, seviye etiketi güvenilir mi? Emin olmadığın
   lisansı "doğrulanmalı" diye işaretle.
4. Proje kuralı her soruya dosya/sayfa/alıntı ister. Sözlük ve liste tabanlı bir dil modülünde
   bu kural nasıl karşılanır?
5. Soru sayısı kabaca ne olmalı (seviye başına)? Aralıklı tekrar yükü altında gerçekçi mi?
6. Soru kalıpları: her beceri için en verimli 2-3 kalıp ve çeldiricinin nereden geleceği.
7. Motor eksikleri (ses, yazarak cevap, boşluk doldurma, eşleştirme) içinden hangisi bu modül için
   vazgeçilmez, hangisi ertelenebilir? Şema değişikliği önerirsen en küçük olanı söyle.
8. Açıklama dili: Türkçe mi, İngilizce mi, seviyeye göre mi değişmeli?
9. Taslaktaki en zayıf üç varsayım hangisi?

Yanıt Türkçe, en çok 900 kelime, önce öneri sonra gerekçe.
