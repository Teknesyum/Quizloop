# Belgeden çoktan seçmeli soru üreten üç proje

## Depolar

- **obsidian-quiz-generator** · https://github.com/ECuiDev/obsidian-quiz-generator · MIT · son commit 2024-11-13, son etiketli sürüm 2.1.2 (2024-10-25) · 175 yıldız, 29 açık issue, TypeScript, ~14 MB
- **PageLM** · https://github.com/CaviraOSS/PageLM · "PageLM Community License" (OSI onaylı değil, ticari kullanım yasak) · son push 2026-08-19, etiketli sürüm yok · 1878 yıldız, 3 açık issue, TypeScript, ~30 MB
- **Questgen.ai** · https://github.com/ramsrigouthamg/Questgen.ai · MIT · son push 2023-12-08, etiketli sürüm yok · 950 yıldız, 36 açık issue, Python, ~11 MB

Seçim gerekçesi: üçü üç ayrı katmanı temsil ediyor. obsidian-quiz-generator LLM'e yapılandırılmış çıktı zorlatmanın ve üretileni insan-okunur biçimde saklamanın olgun örneği. PageLM belge yükleme + RAG + sınav planı olan tek aktif proje. Questgen.ai LLM öncesi dönemden, çeldiriciyi tesadüfe bırakmayan tek proje — Quizloop'un en zor parçası orada algoritmik çözülmüş. Elenen adaylar (fbellame/pdf-to-quizz, Leaf-Question-Generation) ya lisanssız ya da bunların altkümesi.

## Alınacak fikirler

- **İstem, açık soru tiplerine göre çalışma anında kurulur.** Her tip için bir şema satırı ve bir örnek JSON tutulur; yalnız etkin tiplerin şeması ve örneği istemde birleştirilir (obsidian, `src/generators/generator.ts`). Quizloop'ta kural dosyası hangi soru tiplerini açtıysa istem o kadar büyür. Değerli: sabit dev istem hem token yakar hem modeli istenmeyen tiplere iter.
- **Üç kademeli çıktı disiplini: sözleşme → katı yeniden deneme → onarım.** PageLM'de sistem istemi "OUTPUT CONTRACT / SCHEMA / VALIDATION / FAIL-SAFE" başlıklarıyla yazılmış, ayrıca yalnız biçim kurallarını içeren kısa bir `SYS_STRICT` yeniden deneme istemi var, sonra kod tarafında kod çiti temizleme + dizi çıkarma + tip zorlama. Quizloop'ta üretim hattının çıkış kapısına oturur. Değerli: tek denemede JSON alma varsayımı üretimde çöker.
- **Sınav planı koddan ayrı, YAML verisi.** PageLM `modules/sat.yml` gibi dosyalarda bölüm, süre, soru sayısı, zorluk, stil ve o bölüme özel istem metni tutuluyor; kod yalnız planı yürütüyor. Quizloop'un kural dosyası tam olarak bu — plan verisi ile motoru ayırma deseni doğrudan alınabilir.
- **Çeldirici, cevabın anlam-duyusundan (sense) türetilir ve mesafe eşiğiyle elenir.** Questgen sense2vec ile cevabın en yakın 15 komşusunu alıyor, cevabın kendisini içeren veya cevaptan bir düzenleme uzaklıktaki adayları atıyor, kalanları normalize Levenshtein eşiği 0.7 ile birbirine fazla benzeyenlerden arındırıyor. Quizloop'ta çeldirici üretiminden sonraki denetim adımı olur: LLM üretsin, bu kural elesin. Değerli: yazım varyantı ve eşanlamlı çeldirici sorunun tek doğru cevabını bozar.
- **Önce cevap, sonra soru.** Questgen metinden anahtar ifadeleri çıkarıp (MultipartiteRank, eşik 0.75) her anahtarı içeren cümleyi bulup soruyu ondan üretiyor. Quizloop'ta bu, kaynak alıntısını üretimden *önce* sabitlemenin yolu: alıntı seçilir, soru alıntıdan doğar, halüsinasyon denetimi ücretsiz gelir.
- **Kaydedilen soru insan-okunur, parser geri okuyabiliyor.** obsidian-quiz-generator soruları Markdown callout ve flashcard biçiminde yazıyor, kendi ayrıştırıcısı büyük/küçük harf ve boşluk farklarını yok sayarak aynı dosyayı sınav arayüzünde geri açıyor. Quizloop'un soru modülleri için aynı çift yön gerekli: elle düzeltilebilsin, motor geri okuyabilsin.

## Kaçınılacaklar

- **PageLM'in quiz'i belgeye bağlı değil.** `POST /quiz` yalnız `topic` string'i alıyor, `services/quiz/index.ts` istemi o konudan kuruyor; yüklenen belge chunk'ları ayrı bir RAG yolunda. Üstelik `lib/ai/embed.ts` metni 512/30 ile bölerken chunk'a hiçbir metadata (dosya, sayfa) iliştirmiyor — bu mimaride sayfa/alıntı üretmek imkânsız. Quizloop'ta kaynak alanı sonradan eklenemez, chunk'ın doğduğu anda taşınmalı.
- **Sessiz uydurma onarım.** PageLM'in `cleanOptions` fonksiyonu eksik şıkları `Option 1`, `Option 2` diye dolduruyor, geçersiz `correct` değerini 1'e sabitliyor. Sonuç: geçerli görünen, içi boş soru. Onarım katmanı biçim düzeltir, içerik uydurmaz — eksik içerik hata olarak reddedilmeli.
- **`json_object` şema zorlaması değildir.** obsidian-quiz-generator OpenAI'ye `response_format: { type: "json_object" }` gönderiyor; alanların varlığı sonradan tip koruyucularla kontrol ediliyor. Sağlayıcı destekliyorsa katı JSON şeması kullanılmalı, yoksa doğrulama+yeniden deneme döngüsü şart.
- **Üç projede de tekrar önleme yok.** Aynı not/bölüm ikinci kez verilirse aynı sorular yeniden üretiliyor; üretilmiş soruların kaydı istemin girdisi değil. Quizloop aralıklı-tekrar motoru olduğu için bu boşluk doğrudan bizim sorunumuz — çözümü kopyalayacak örnek yok, kendimiz kuracağız.
- **Hiçbirinde çeldirici başına ayrı gerekçe yok.** En fazla soru başına tek `explanation` var. Quizloop'un distractor rationale alanı için taranan projelerde şablon yok.
- **Questgen'in gizli kurulum maliyeti yüksek.** T5-large + spaCy + `pke`'nin git'ten kurulumu + sense2vec `s2v_reddit_2015_md` vektör paketinin indirilip açılması gerekiyor; ayrıca boru hattı İngilizce'ye bağlı (Brown korpusu, NLTK sözlükleri) ve vektörler 2015 Reddit verisi. 2023'ten beri commit yok. Bağımlılık olarak alınmaz, algoritma olarak alınır.
- **PageLM lisansı kod almayı engelliyor.** Ticari kullanım, SaaS ve gelir getiren her kullanım açıkça yasak; lisans "revocable" diyor. Marka/telif ayrı korunmuyor, tek metin. Quizloop ileride ücretli olursa PageLM'den satır alınmış olması sorun yaratır — yalnız desen okunur.

## Karar önerisi

Çeldirici denetimini Questgen'in mantığıyla kur: LLM üretsin, kod elesin (cevabı içeren/yazım varyantı olan/birbirine çok benzeyen adaylar atılır).

Kaynak sadakatini üretim sonrası doğrulamaya bırakma; Questgen'in "önce alıntı, sonra soru" sırasını benimse ve chunk'a dosya+sayfa metadatasını doğduğu anda iliştir.

İstem yapısını obsidian-quiz-generator'dan al (tip başına şema+örnek, çalışma anında birleştirme), çıktı disiplinini PageLM'den al (sözleşme + katı yeniden deneme), ama onarım katmanının dolgu üretmesine izin verme — eksik alan hatadır.

Kural dosyasını PageLM'in `modules/*.yml` deseninde tasarla: bölüm, sayı, zorluk, stil ve bölüme özel istem verisi; motor yalnız yürütücü.

PageLM'den kod alınmayacak (lisans ticari kullanımı yasaklıyor); diğer ikisi MIT, gerekirse alıntı yapılabilir ama ikisi de bakımsız — bağımlılık değil referans.

## Kaynaklar

- `gh api repos/ECuiDev/obsidian-quiz-generator`, `.../releases/latest` (2026-08-22 sorgusu)
- `gh api repos/CaviraOSS/PageLM`, `LICENSE.md`, `backend/src/services/quiz/index.ts`, `backend/src/core/routes/quiz.ts`, `backend/src/lib/ai/embed.ts`, `modules/sat.yml`
- `gh api repos/ramsrigouthamg/Questgen.ai`, `Questgen/mcq/mcq.py`, `README.md`
- obsidian-quiz-generator `src/generators/generator.ts`, `src/generators/openai/openAIGenerator.ts`, `README.md`
- Not: hiçbir projede doğrulanabilir başarı/doğruluk ölçümü yayımlanmamış; yıldız ve indirme sayıları dışında performans iddiası **doğrulanamadı**.
