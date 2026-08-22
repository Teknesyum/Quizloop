# Anki dışı üç masaüstü SRS taraması

Seçim: Mnemosyne (olgun paket/senkron formatı olan tek masaüstü SRS), obsidian-spaced-repetition (içerik ile ilerleme verisi ayrımını açıkça tartışan tek proje), Incrementum (bizim yığına en yakın yeni nesil: Tauri 2 + React 19, PDF'ten AI kart). Diğer adaylar ya web/mobil ya da tek kişilik oyuncak boyutundaydı.

## Depolar

- **Mnemosyne** · https://github.com/mnemosyne-proj/mnemosyne · AGPL-3.0 + "türev işte Mnemosyne adı görünür kalsın" ek şartı (GitHub NOASSERTION gösteriyor, LICENSE metninden okundu) · son commit 2026-04-18, son etiketli sürüm 2.11 / 2023-11-12 · ~91 MB, 598 yıldız, 24 açık issue · Python + Qt.
- **obsidian-spaced-repetition** · https://github.com/st3v3nmw/obsidian-spaced-repetition · MIT · son commit 2026-08-03, son sürüm 1.15.4 / 2026-06-14 · ~12,5 MB, 2.525 yıldız, 328 açık issue · TypeScript eklenti.
- **Incrementum** · https://github.com/melpomenex/Incrementum · Apache-2.0 · son push 2026-08-17, son sürüm v2.7.0 / 2026-08-16 · ~73 MB, 70 yıldız, 2 açık issue, ilk commit 2026-01-07 · Tauri 2 + React 19 + Rust.

Rakamlar `gh api repos/...` ve `.../releases/latest` çıktısından, 2026-08-22'de alındı.

## Alınacak fikirler

- **Modül paketi = zip içinde METADATA + tek veri dosyası + medya.** Mnemosyne `.cards` tam olarak budur: `METADATA` (serbest anahtar:değer), `cards.xml`, yanında medya. Quizloop'ta modül paketinin dış biçimi olur. Değerli: tek dosya paylaşılır, sürüm/kaynak alanları içerikten ayrı durur, medya paketle birlikte taşınır — git'e girmeyen içerik için doğal birim.
- **İçe aktarma = olay akışını uygulamak, dosya kopyalamak değil.** Mnemosyne dışa aktarırken kalıcı ID'li kayıt girdileri üretir, içe aktarırken bunları mevcut veritabanına tek tek uygular. Quizloop'ta "modülün 2. sürümü geldi" akışına oturur: aynı soru ID'si varsa metin güncellenir, ilerleme satırına dokunulmaz. AI modülü yeniden ürettiğinde kullanıcı sıfırdan başlamaz.
- **İlerleme içerik dosyasının dışında, kısa kalıcı ID ile bağlı.** OSR bugün zamanlamayı notun içine HTML yorumu olarak gömüyor (`<!--SR:...-->`, frontmatter'da `sr-due/sr-interval/sr-ease`); kendi `src/data/data-store/README.md` dosyasında bunun yanlış olduğunu kabul edip her karta `^sr-id-<uuid>` verip zamanlamayı ayrı dosyaya taşımayı planlıyor (issue #162, hâlâ açık). Bu dersi bedavaya alırız.
- **Kuyruk yükleyici ile oturum arayüzü ayrı katman.** OSR'de `review-queue-loader` ve `flashcard-review-sequencer` sunum bileşenlerinden ayrı. Quizloop'ta "sıradaki soru ne" mantığı; şıksız gösterim, şık eleme, açıklama akışı ve çözüm bloğu oynatımından bağımsız kalmalı — biri değişince öbürü bozulmasın.
- **Medya tek kök dizinde, veritabanında yalnız göreli ad.** Mnemosyne'de tek `media_dir` var, paket oraya açılıyor. Bizde `<modül>/media/` ve DB'de sadece dosya adı: modül klasörü taşınınca yol kırılmaz.

## Kaçınılacaklar

- **Zip'i doğrulamadan hedef dizine açmak.** Mnemosyne arşivi doğrudan medya dizinine açıyor, isim/yol denetimi görünmüyor — yol gezinme ve üzerine yazma riski. Modül açılmadan önce ad temizliği + izinli uzantı listesi şart.
- **İlerlemeyi içerik dosyasına gömmek.** OSR'nin inline çözümü, dosya AI ile yeniden üretildiğinde ilerlemeyi de siler. İçerik üretilebilir, ilerleme üretilemez; ikisi aynı dosyada duramaz.
- **Kart tipini eklentiye bağlamak.** Mnemosyne'de eksik kart tipi eklentisi içe aktarmayı komple hata ile düşürüyor. Bizde soru şeması sabit ve sürümlü olmalı; bilinmeyen alan uyarıyla yok sayılsın, paket reddedilmesin.
- **Kapsam şişmesi.** Incrementum 8 ayda OCR, yerel Whisper, TTS, NotebookLM, bilgi grafiği, tarayıcı eklentisi, 146 tema, Docker/nginx/Vercel dosyalarını tek depoya doldurmuş (~73 MB). Quizloop'un çekirdeği tek cümle: modülü aç, soruyu sor, tekrarı planla.
- **İmzasız dağıtımı belgeyle geçiştirmek.** Incrementum README'si macOS'ta "sağ tık → Aç" tarifi veriyor. Üç platform hedefleyen bir uygulamada bu, ilk çalıştırmada kaybedilen kullanıcı demek.
- **Doğrulanamayan iddiaya güvenmek.** Incrementum'un "build passing" rozeti bağlantısız statik görsel; FSRS-6/SM-18/SM-20 desteği bağımsız olarak **doğrulanamadı**. 70 yıldız + 2 açık issue kalite değil, kullanılmamışlık göstergesi olabilir.

**Lisans uyarısı:** Mnemosyne AGPL-3.0 üstüne marka şartı taşıyor — MIT Quizloop'a tek satır kod veya doğrudan şema kopyası giremez, yalnız desen okunur. OSR (MIT) ve Incrementum (Apache-2.0) uyumlu; Apache-2.0'dan bir şey alınırsa NOTICE yükümlülüğü doğar.

## Karar önerisi

Modül paketi: zip = `module.json` (meta + sürüm) + `questions.json` + `media/`, Mnemosyne `.cards` deseni.
İlerleme ayrı yerel veritabanında, soru bazında kalıcı ID ile bağlı; güncelleme ID eşleşmesiyle merge edilsin.
Paket açma adımına yol/uzantı denetimi koy — Mnemosyne'in atladığı yer burası.
Zamanlayıcı, kuyruk ve oturum arayüzü üç ayrı modül; sınav mekaniği yalnız arayüz katmanında yaşasın.
Hiçbir depodan kod alma; Mnemosyne AGPL, diğer ikisinin çözümü zaten desen düzeyinde yeterli.
