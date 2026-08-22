# Açık kaynak çoktan seçmeli sınav motorları taraması

## Depolar

- **moodle/moodle** · https://github.com/moodle/moodle · GPL-3.0 · son push 2026-08-18, son etiket v5.2.2 (2026-08-08) · ~966k KB PHP, 7.3k yıldız; GitHub açık issue 1 — hatalar tracker.moodle.org'da tutulduğu için bu sayı anlamsız.
- **Khan/perseus** · https://github.com/Khan/perseus · MIT · son commit 2026-08-21, son sürüm `@khanacademy/perseus@84.3.0` (2026-08-20) · ~429k KB TypeScript monorepo, 1.585 yıldız, 72 açık issue.
- **h5p/h5p-multi-choice** (+ `h5p/h5p-question-set`) · https://github.com/h5p/h5p-multi-choice · içerik tipi MIT (`library.json`), fakat çalıştıran çekirdek `h5p/h5p-php-library` GPL-3.0 · son push 2026-08-20 · ~1 MB, 15 yıldız, 21 açık issue; etiketli sürüm yok, sürüm `library.json` içinde 1.16.27.

Neden bu üçü: Moodle üretimdeki en olgun soru bankası + deneme/puanlama şeması. Perseus bizim yığınımıza en yakın olan (TS, React) ve şık başına gerekçeyi tip düzeyinde tutan tek örnek. H5P ise tek soruyu taşınabilir JSON olarak tanımlayan en küçük model; "seçilirse / seçilmezse" geri bildirim ayrımı orada. USMLE tarzı açık soru bankası aradım, GitHub'da yıldızı ve bakımı ciddi bir örnek çıkmadı (arama 2026-08-22, en yüksek isabet 32 yıldız) — o alan boş.

## Alınacak fikirler

- **Şık başına açıklama birinci sınıf alan.** Üçünde de var: Moodle `question_answers(fraction, feedback)`, Perseus `PerseusRadioChoice.rationale` (çevrilebilir Markdown), H5P `tipsAndFeedback{tip, chosenFeedback, notChosenFeedback}`. Quizloop'ta `Option.rationale` zorunlu alan olmalı, "seçilmediyse" metni opsiyonel. Daktilo efektiyle akan metnin kaynağı doğrudan budur; sonradan eklenen alan tüm soru dosyalarını göç ettirmeyi gerektirir.
- **Kısmi puan + deneme başına ceza ayrı parametre.** Moodle'da `question.penalty` ve `question_answers.fraction` soru üstünde durur; "her yanlış denemede puan düşer" davranışı motora değil `interactive` / `interactivecountback` davranış eklentisine aittir. Quizloop'un "yanlış şık puan düşürür ve elenir" kuralı da soru/oturum yapılandırması olmalı, puanlama fonksiyonuna gömülü sabit değil.
- **Append-only deneme günlüğü.** Moodle oturum durumunu güncellemez: `question_attempts` → `question_attempt_steps(sequencenumber, state, fraction)` → `question_attempt_step_data`. Her tıklama yeni adım. Quizloop'un yerel oturum deposunda aynısı: skor türetilir, saklanmaz. Aralıklı tekrar zaten ham olay ister (kaç denemede bulundu, hangi çeldiriciye takıldı); ayrıca kapanan uygulamada oturumu son adımdan kurtarır.
- **Puanlamayı render'dan ayrı pakete koy.** Perseus monorepo'su `perseus-core` (şema), `perseus-score` (saf puanlama), `perseus` (renderer), `perseus-editor` diye bölünmüş. Quizloop'ta `core-schema` / `core-score` / `ui` aynı sınırı verir; Electron'da main-renderer ayrımı zaten var, saf puanlama fonksiyonu test edilebilir ve ileride CLI veya içerik doğrulayıcı aynı kodu kullanır.
- **İçeriği blok/yuva olarak modelle, HTML olarak değil.** Perseus item'i: içerik metni + widget haritası (image, table, expression) + `hints[]` dizisi; soru ve ipuçları ayrı renderer'lar. Quizloop'un çözüm blokları (metin/tablo/görsel/formül) için ayrımlı birlik (discriminated union) dizisi, sırayla oynatılır. Yeni blok türü eklemek eski soruları kırmaz.
- **Bankada sürümleme ve etiket ayrı tablo.** Moodle 4.0'dan beri `question_bank_entries` + `question_versions`: soru düzenlenince yeni sürüm doğar, eski denemeler eski sürüme bağlı kalır. Filtreleme/etiketleme çekirdeğe gömülü değil, `qbank_tagquestion`, `qbank_customfields`, `qbank_history` eklentilerinden gelen kolon/filtrelerle yapılır. Binlerce soruda düzeltme kaçınılmaz; sürüm yoksa geçmiş istatistik ve tekrar aralıkları bozulur.
- **Oturum yapılandırması havuz üstünden.** H5P Question Set: `randomQuestions`, `poolSize`, `passPercentage`, `disableBackwardsNavigation`, skor aralığına göre metin (`overallFeedback.from/to`). Quizloop'un "sınav oturumu" tanımı için hazır ve küçük bir sözlük; kendi terimlerimizi uydurmadan önce bunu ölçüt alalım.

## Kaçınılacaklar

- **HTML string saklamak.** Moodle `questiontext` + `questiontextformat` ikilisiyle HTML tutar; her alan için bir de format alanı taşır. Electron'da güvenilmeyen HTML render etmek XSS yüzeyidir ve blok tabanlı çözüm oynatmayı imkânsızlaştırır. Bizde içerik JSON blok kalmalı.
- **Eklenti/davranış katmanı kurmak.** Moodle 14 soru davranışı ve 18 qbank eklentisini çalışma zamanında yükler; tek kullanıcılı masaüstü için gereksiz dolaylılık. Bize iki davranış yeter: "şıksız göster" ve "şık elemeli deneme".
- **H5P çalışma zamanını almak.** İçerik tipi MIT olsa da çalıştıran çekirdek (`h5p-php-library`) GPL-3.0 ve içerik iframe + jQuery ile render ediliyor. MIT kalacaksak yalnızca veri modeli fikri alınır, kod veya çekirdek alınmaz. "H5P uyumlu" ifadesini marka koşullarını okumadan kullanmayalım (koşullar doğrulanamadı).
- **Moodle'dan şema dosyası kopyalamak.** GPL-3.0 MIT'e bulaşır; ayrıca depoda ayrı bir `TRADEMARK.txt` var, Moodle adı lisanstan bağımsız korunuyor. Okunur, kendi tablolarımızı kendimiz yazarız.
- **Perseus'a bağımlılık kurmak.** Ana paket 84.x majör sürümde ve Khan Academy'nin iç ihtiyacına göre kırıcı değişiyor; item şeması bizim dört blok türümüze göre çok geniş (math-input, kas, grafik widget'ları). Şemayı örnek al, paketi kurma.
- **Şık açıklamasını genel geri bildirimle karıştırmak.** Moodle soru düzeyinde üç sabit metin tutar (`correctfeedback`, `partiallycorrectfeedback`, `incorrectfeedback`) ve bir `generalfeedback`. Bu bizim ürün fikrimiz için yetersiz: açıklama şık düzeyinde zorunlu, genel çözüm anlatımı ondan ayrı bir alan.

## Karar önerisi

1. Şema ayrımı Perseus'un bölünmesini izlesin: `core-schema` (tipler), `core-score` (saf fonksiyon), `ui` (renderer). `Option.rationale` şemada zorunlu.
2. Oturum kaydı Moodle `question_attempt_steps` desenine göre append-only olsun; skor ve istatistik adımlardan türetilsin.
3. Puan ve ceza değerleri soru/oturum yapılandırmasında dursun, puanlama koduna gömülmesin.
4. Soru bankasına ilk günden sürüm alanı koy; etiket/filtre şemayı değiştirmeden genişleyebilsin.
5. Üçünün hiçbirinde aralıklı tekrar yok — SRS için ayrı tarama gerekli (aday: `open-spaced-repetition/ts-fsrs`, MIT, TS; `ankitects/anki`, AGPL-3.0).

## Kaynaklar

- `gh api repos/moodle/moodle`, `.../tags`, `contents/public/lib/db/install.xml`, `contents/public/question/type/multichoice/db/install.xml`, `contents/public/question/behaviour`, `contents/public/question/bank` — 2026-08-22.
- `gh api repos/Khan/perseus`, `.../releases/latest`, `packages/` listesi, `packages/perseus-core/src/data-schema.ts` (rationale alanı), `packages/perseus-score/` — 2026-08-22.
- `gh api repos/h5p/h5p-multi-choice`, `h5p/h5p-question-set`, `h5p/h5p-php-library`; `library.json` ve `semantics.json` ham dosyaları — 2026-08-22.
