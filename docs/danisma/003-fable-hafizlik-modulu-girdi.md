# Danışma 003 girdi: Kur'an Hafızlık Modülü — Görüş Girdisi

Ajana giden metin:

---

[[danisma:003]]

# Kur'an Hafızlık Modülü — Görüş Girdisi

## Sahibin Cümlesi (Aynen)

> yeni modül: kuranı kerim hafızlık sağlayıcısı cüz cüz bölüm şeklinde olcak arapça bir ayet koycak (ayet değilde duraklar dan birini seçicek)
> yani atıyorum ilk cüzde 2000 durak varsa 2000 soru olcak bu duraktan sonraki ayeti tahmin etme şeklinde soru olcak cevaplarda ayetin meali de olsun kelime kelime meal açıklansın doğru cevapta hafızlık sağlama uygulaması ilk önce plan yap sonra onayımla başla fable a da danış olması gerekenleri tam bilmiyorum ben hafız dğeilim önerilere açığım

## Olgular (Depodan)

- Quizloop: Electron + React + TypeScript, Android'de Capacitor. Aralıklı tekrar (FSRS) quiz motoru.
- Modül salt okunur JSON: `module.json` + `blocks/NNNN.json` (~50 soru/blok). İlerleme ayrı SQLite, soruya kalıcı `id` ile bağlanır.
- Soru kaydı (`src/shared/schema/question.ts`): `id`, `conceptId`, `stem {md, imageRef?, table?, masks?}`,
  `kind`: `coktan-secmeli | acik-uclu | isaretleme`, `choices[]` en çok 5 (A-E), `correct`,
  `distractors {key -> md}` (her yanlış şık için açıklama), `solution[]` bloklar: `text | table | image | formula | hint`,
  `source {file, pages, quote, chapter}` zorunlu, `difficulty` kolay/orta/zor, `tags[]`, `contentHash`.
- Kuyruk kuralı: aynı `conceptId`'den bir günde en çok bir soru.
- `module.json` içinde `language` alanı ve isteğe bağlı `source.bolumler` (kitap bölümleri) var.
- Arayüzde bugün sağdan-sola (RTL) ya da Arapça yazı tipi desteği yok: `app.css` içinde `direction`/`rtl` geçmiyor.
- Mevcut üretim hattı `quizforge` PDF'ten model ile soru üretir; bu modül için model gerekmez, metin sabit.
- Kural: gerçek modül git'e girmez (`modules/` git-ignore), yalnız `_ornek` gider. Lisans AGPL-3.0-or-later.
- Kural: her soru `kaynak` (dosya, sayfa, alıntı) taşır.

## Bilinmeyenler

- Sahibi hafız değil; hafızlık sağlamlaştırma ("sağlama") pratiğinin gerçekte nasıl yapıldığını bilmiyoruz.
- "Durak" ile kastedilen birim belirsiz: vakıf işaretleri (م ط ج ز ص قلى صلى ∴) mi, ayet sonu mu, ikisi mi.
- Açık lisanslı veri kaynakları: Arapça metin (Tanzil Uthmani?), kelime kelime Türkçe meal (quran.com / QUL?), Türkçe meal (Diyanet lisansı?).

## Sorular

1. Soru birimi ne olmalı? Vakıf işaretine göre bölüt mü, ayet mi? "Bu duraktan sonraki ayet" yerine "sonraki bölüt" daha mı doğru? Cüz başına gerçekçi soru sayısı kaç çıkar?
2. Çoktan seçmeli mi, açık uçlu (kendi kendine oku, sonra göster, kendini derecelendir) mi, ikisi mi? Hafızlar hangisinden yarar görür?
3. Çeldiriciler nasıl seçilmeli? Müteşâbih (benzer) ayetler hafızların asıl tuzağı — çeldirici bunlardan mı gelmeli, nasıl hesaplanır (deterministik)?
4. Hafızlık sağlamada olması gereken başka neler var: sayfa/satır konumu (Medine mushafı 604 sayfa, 15 satır), sure/ayet numarası, hizb/rub, ses (kari kaydı), önceki ayetle bağ, sayfa başı ve sayfa sonu soruları?
5. `conceptId` ne olmalı ki FSRS kuyruğu mantıklı çalışsın (ayet, sayfa, yoksa bölüt)?
6. Kelime kelime meal doğru cevapta nasıl gösterilmeli (mevcut `solution` `table` bloğu yeter mi)?
7. Hangi veri kaynakları AGPL bir uygulamayla dağıtılabilir; hangileri yalnız kullanıcının kendi indirmesiyle kullanılabilir?
8. Dinî metinde hata kabul edilemez: metin bütünlüğü nasıl doğrulanır (sağlama toplamı, ikinci kaynakla karşılaştırma, hareke/Osmanî imla)?
9. Şemada ve arayüzde en az hangi değişiklik gerekir (RTL, Arapça yazı tipi, `lang`/`dir` alanı)? Yeni `kind` gerekir mi?
10. Kaçınılması gereken tuzaklar ve dalga sırası önerin.
