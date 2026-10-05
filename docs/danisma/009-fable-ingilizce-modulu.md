# Danışma 009: İngilizce Modülü — Görüş Girdisi

claude-fable-5-1, 6.717 çıktı token, 114 sn. Girdi: [009-fable-ingilizce-modulu-girdi.md](009-fable-ingilizce-modulu-girdi.md). Cevap olduğu gibi:

---

# Danışma 009 — Yanıt

## 1. Dürüst vaat
**Öneri.** Hedefi "C2 düzeyinde kelime ve dil bilgisi tanıma, C1 okuduğunu anlama" olarak yazın; "testi bitiren C2 olur" cümlesini kullanmayın. Modül adı: "İngilizce Altyapı A1–C2".
**Gerekçe.** Çoktan seçmeli + kendi kendine değerlendirme, alıcı becerileri (kelime, kural tanıma, okuma) iyi taşır; konuşma, dinleme ve yazma ölçmez. C2 tanımı üretim becerisidir; şıkları gizleyip akıldan cevaplatmak hatırlamayı güçlendirir ama üretim sayılmaz. Vaadi alıcı tarafla sınırlamak hem dürüst hem savunulabilir.

## 2. Yapı
**Öneri.** Seviye başına ayrı modül, altı paket. Her modülde bölüm sırası: Kelime → Dil Bilgisi → Kalıp Ve Eşdizim (B1'den itibaren) → Okuma (A2'den itibaren) → Seviye Sonu Sınavı. "Türkçe konuşanlara özgü hatalar" ayrı bölüm değil, dil bilgisi sorularında `tags: ["tr-girisim"]` etiketi.
**Gerekçe.** Bölümler `source.chapter` ile düz liste; tek modülde 30 bölüm kart ekranını boğar. Kullanıcı kendi seviyesinden başlayıp yalnız o paketi indirir; paketler ayrı sürümlenir; C1–C2 kelime hacmi tek başına birkaç MB. Hata bölümünü ayırmak soru tekrarı doğurur; etiket aynı işi görür ve ileride filtre olur.

## 3. Kaynaklar
Kelime omurgası:
- **CEFR-J Wordlist** (A1–B2, ~7.800 kelime, seviye etiketli). Lisans: eğitim amaçlı serbest diye hatırlıyorum, dağıtım izni **doğrulanmalı**.
- **Octanove Vocabulary Profile C1/C2** — CEFR-J'nin devamı, CC BY-SA 4.0 diye hatırlıyorum, **doğrulanmalı**.
- **NGSL/NAWL** CC BY-SA 4.0, sıklık doğrulaması için yardımcı.
- Oxford 3000/5000, EVP, EGP: **pakete girmez**. EVP/EGP'ye yalnız seviye kararında "bakılır", alıntılanmaz.

Anlam ve tanım: **Open English WordNet** (CC BY 4.0) İngilizce tanım ve eş anlamlı dışlama için; **Wiktionary** (CC BY-SA 3.0) Türkçe karşılık için, kapsamı dengesiz, **doğrulanmalı**.

Örnek cümle: **Tatoeba** (CC BY 2.0 FR; Türkçe çeviri sayısı yüksek ama kalite dengesiz, seviye etiketi yok). Seviye uyumsuz olduğunda model yazar, kaynak olarak kural dosyası gösterilir (bkz. 4).

Dil bilgisi kapsamı: **British Council/EAQUALS Core Inventory** seviye-konu haritası olarak; lisans **doğrulanmalı**. Kuralların kendisi telif konusu değildir; kendi `kaynak/dilbilgisi/` dosyalarımızı yazarız.

Okuma: **VOA Learning English** (ABD kamu malı; ajans haberi içeren parçalar hariç, parça parça **doğrulanmalı**), **Simple English Wikipedia** (CC BY-SA). Sıklık: SUBTLEX lisansı araştırma amaçlı, **doğrulanmalı**; alternatif FrequencyWords/OpenSubtitles (CC BY-SA).

Not: CC BY-SA veriden türeyen modül verisi de CC BY-SA olur; `module.json`'a lisans ve atıf alanı girer. Kod AGPL ayrı kalır.

## 4. Kaynak kuralı
**Öneri.** Hafızlık modülü deseni: `source.file` = veri kümesi adı + sabitlenmiş commit/SHA-256, `pages` = satır/kayıt kimliği, `quote` = girdinin aynısı. Model yazdığı cümle için `file` = depodaki kural dosyası (`kaynak/dilbilgisi/B1-present-perfect.md`), `quote` = kural cümlesi, `tags: ["uretilmis"]`.
**Gerekçe.** Kural "iddia izlenebilir olsun" der; liste modülünde iddia "bu kelime B1'dir, anlamı şudur"dur ve kaynağı liste satırıdır. Üretilmiş cümlenin iddiası kuraldır; kural dosyası depoda sürümlü olduğundan izlenebilir.

## 5. Hacim
**Öneri.** Kelime başına tek soru. Kabaca: A1 900, A2 1.200, B1 1.800, B2 2.300, C1 3.000, C2 2.500 — toplam ~11.700, hafızlık modülü ölçeğinde.
**Gerekçe.** Günde 20 yeni kartla A1 bir buçuk ay, tamamı yaklaşık iki yıl; ciddi öğrencinin Anki tempo­suyla uyumlu. Kelime başına iki yön kart hacmi ikiye katlar, kazancı azdır.

## 6. Kalıplar
- **Kelime:** Bağlam cümlesinde hedef kelime → Türkçe karşılık (A1–B1); İngilizce tanım → kelime (B2+). Çeldirici: aynı seviye, aynı sözcük türü, yakın sıklık; WordNet eş anlamlıları dışlanır.
- **Dil bilgisi:** Boşluklu cümle, 4 biçim şık; çeldirici kuralın bilinen karışma kümesinden (past/present perfect, a/the/—, make/do). "Hangi cümle doğru?" ikinci kalıp; dönüştürme açık uçlu üçüncü.
- **Okuma:** 80–200 kelimelik parça stem'de, parça başına 3–5 soru; çeldirici parçadaki yanlış çıkarım; `verify` alıntıyı parçada arar.

## 7. Motor
**Öneri.** Şema değişikliği yok; boşluk doldurma zaten stem'de `___` ile çoktan seçmeli olarak çıkıyor. İleride tek alan: `acik-uclu`'ya isteğe bağlı `acceptedAnswers: string[]` (normalize edilip karşılaştırılır), yazım için A1–B1'de işe yarar, ertelenebilir. Ses ve eşleştirme ertelenir; ses geldiğinde `audioRef` eklenir.
**Gerekçe.** Gizli şık mekanizması hatırlamayı zaten zorluyor; yeni tür eklemek üç platformda ekran demek.

## 8. Açıklama dili
A1–B1 Türkçe; B2 Türkçe + parantezde İngilizce tanım; C1–C2 İngilizce, yalnız anahtar terime tek satır Türkçe. Üst seviyede açıklama okumak maruziyetin kendisidir.

## 9. En zayıf üç varsayım
1. **"Bitiren C2 olur."** Alıcı araç üretim becerisi vermez; vaat daraltılmalı.
2. **Seviye etiketleri uyumlu.** CEFR-J (Japon müfredatından türemiş), NGSL ve Oxford farklı yöntemle etiketler; karıştırınca çelişir. Tek omurga (CEFR-J + Octanove), diğerleri yalnız yardımcı.
3. **Kurallı üretici kelimeye yeter.** Hafızlık modülü sabit metin üstünde çalıştı; kelime sorusu bağlam cümlesi ve belirsizlik taşımayan çeldirici ister. Algoritmik çeldirici iki doğru cevaplı soru üretir. Gerekli hat: kurallı seçim → model cümle yazar → geri çeviriyle doğrulama → belirsizlik denetimi (ikinci model şıkları kör çözer, tek doğru bulamazsa soru düşer).

Ek öneri: seviye belirleme sınavı şimdilik yok; kullanıcı modülü seçer. Planda ilk somut adım lisans doğrulama tablosu (`docs/taramalar/`), sonra A1 pilotu (300 soru) ile kalıp ve çeldirici hattını ölçmek.
