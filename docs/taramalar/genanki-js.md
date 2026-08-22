# genanki-js

## Depo
krmanik/genanki-js · https://github.com/krmanik/genanki-js · **AGPL-3.0** (README'de açık; GitHub API `NOASSERTION` döndürüyor) · son sürüm `v1.0.5` 2021-09-17 · son push 2023-03-12 · 76 yıldız · 3 açık issue · ~2.4 MB, 10 kaynak dosya.

## Ne için bakıldı
Dışa aktarma hedefi olarak Anki `.apkg`. Üç soru: JS'ten gerçekten `.apkg` üretiliyor mu, medya taşınıyor mu, şık başına açıklama Anki kart şablonuna sığar mı.

## Alınacak fikirler
- **`.apkg` = SQLite dosyası + medya + `media` eşlem dosyası, hepsi zip.** Depo bunu `apkg_schema.js` (collection şeması) + `apkg_col.js` (varsayılan `col` satırı) + `package.js` (zipleme) olarak üçe ayırmış. Bu ayrım bizim `quizforge` dışa aktarıcısının doğal iskeleti: şema sabiti, koleksiyon varsayılanı, paketleyici. Değerli çünkü Anki'nin en kırılgan yeri `col` tablosundaki JSON sütunları — onu tek dosyada izole tutmak sürüm uyumunu tek yerden yönetilir kılıyor.
- **Medya taşıma sözleşmesi: `addMedia(blob, dosyaAdı)`, zip içinde dosyalar `0`,`1`,`2`… diye numaralanır, `media` adlı JSON eşlem gerçek adı tutar.** Yani medya adı kart HTML'ine gömülür, dosya adı gömülmez. Bizim modül `assets/img/` yapımıza doğrudan oturur: çıkarımda sıra numarası üretip eşlemi yazmak yeterli, dosya adlarını sterilize etmeye gerek yok.
- **Not kimliği `guid` + ilk alanın `csum`'u ile kurulur** (`anki_hash.js`, `sha256.js`). Bu zaten `anki-cekirdek.md`'de aldığımız desenin çalışan JS karşılığı — yeniden içe aktarmada güncelleme mi kopya mı kararını buradan okuyabiliyoruz.

Şık başına açıklama: Anki'nin şablon dili koşullu alan (`{{#Alan}}`) dışında mantık taşımaz ve temel kart, kullanıcının hangi şıkkı seçtiğini kaydetmez. Tek gerçekçi yol **her çeldirici için ayrı alan** (`SecenekA`, `AciklamaA`, …) açıp cevap yüzünde hepsini birden göstermek. `genanki-js` model tanımında `flds`/`tmpls` doğrudan geçtiği için buna engel yok — ama bu "açıklamayı taşıma" değil "açıklamayı düzleştirme"dir. Bilgi kaybı yok, etkileşim kaybı var.

## Kaçınılacaklar
- **AGPL-3.0. Bağımlılık olarak alınamaz** — `docs/PLAN.md` kuralı net (AGPL'den desen alınır, kod alınmaz). Üstelik kökeni de AGPL zinciri: mkanki → genanki. `.apkg` biçiminin kendisi telifli değil, kod telifli.
- Terk edilmiş sayılır: son etiketli sürüm 5 yıl önce, son commit 3 yıl önce. Anki'nin koleksiyon şeması bu sürede değişti; üretilen paketin güncel Anki'de sorunsuz açıldığı **doğrulanamadı**.
- Tarayıcı-önce tasarım: `sql.js` (WASM), `FileSaver.js`, `JSZip` global `<script>` olarak bekleniyor, npm paketi yok, CDN'den `dist/genanki.js` çekiliyor. Node tarafında çalışan bir CLI için bu üç bağımlılığın hepsi gereksiz yük.
- Şık başına açıklamayı düzleştirmek geri döndürülemez: dışa aktarılan kart Quizloop'a geri getirilemez. `.apkg` tek yönlü çıkış kabul edilmeli.

## Karar
**Desen.** Kod alınmaz (AGPL), `.apkg` üçlü ayrımı ve medya numaralandırma sözleşmesi alınır.
`.apkg` dalga 2'ye kalır; GIFT ilk hedef olarak doğru — şık açıklamasını kayıpsız taşıyan tek biçim o.
