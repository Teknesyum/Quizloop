# Taşınabilir soru bankası formatları

## Depolar

- QTI 3.0 spesifikasyonu · https://www.imsglobal.org/spec/qti/v3p0/info · 1EdTech telif, açık erişim, OSI lisansı değil · sürüm 3.0 (2022), 3.1 çalışması sürüyor (doğrulanamadı) · XML + IMS Content Packaging zip.
- 1EdTech/qti-examples · https://github.com/1EdTech/qti-examples · lisans dosyası yok (GitHub `license: null`), yalnız NOTICE · son push 2026-08-18 · ~40 MB, 34 yıldız, 3 açık issue. Resmî örnek item havuzu; referans olarak okunur, kopyalanmaz.
- amp-up-io/qti3-item-player · https://github.com/amp-up-io/qti3-item-player · MIT · son push 2025-06-21 · 30 yıldız, 4 açık issue, etiketli sürüm yok. En olgun tek dosyalık QTI 3 item oynatıcı referansı.
- Citolab/qti-components · https://github.com/Citolab/qti-components · GPL-3.0 · son push 2026-08-19, son sürüm qti-components-v7.27.2 (2026-03-24) · 18 yıldız, 20 açık issue. Canlı ama GPL — MIT projeye bağımlılık olarak giremez.
- ankitects/anki · https://github.com/ankitects/anki · AGPL-3.0-or-later (+ bazı BSD parçalar; GitHub "NOASSERTION" gösteriyor) · son sürüm 26.08.1 (2026-08-05) · ~29.9k yıldız, 447 açık issue. `.apkg`/`.colpkg` formatının tek otoritesi kod tabanının kendisi.
- kerrickstaley/genanki · https://github.com/kerrickstaley/genanki · MIT · son push 2024-12-30 · 2.674 yıldız, 36 açık issue. Anki kodu olmadan `.apkg` yazan bağımsız uygulama; AGPL bulaşmasını keser.
- GIFT (Moodle) · https://docs.moodle.org/en/GIFT_format · Moodle GPL-3.0 · canlı · düz metin. Ayrıştırıcı referansı: fuhrmanator/GIFT-grammar-PEG.js, MIT, son sürüm v1.0.2 (2024-09-15), 38 yıldız, 10 açık issue.
- bonartm/quizdown-js · https://github.com/bonartm/quizdown-js · MIT · **arşivlenmiş**, son push 2025-11-19, son sürüm v0.6.0 (2022-09-07) · 123 yıldız. Markdown-tabanlı sınav sözdiziminin en temiz küçük örneği; tasarımı öğretici, bağımlılık değil.

## Alınacak fikirler

- **Şık başına açıklamayı formatın kendisinde tut.** GIFT bunu `#` ile şıkkın yanında, Moodle XML `<answer><feedback>` ile taşır; ikisi de bizim "her yanlış şık için ayrı açıklama" alanımızın birebir karşılığı. Quizloop'ta `schema/`deki soru kaydına oturur. Değeri: dışa aktarımda veri kaybı olmadan eşleşecek tek alan bu — kendi alan adımızı seçerken bu iki formatın kırılma noktalarına bakmalıyız.
- **Paket = zip + manifest + numaralandırılmış medya.** QTI, içeriği `imsmanifest.xml` ile tanımlanan bir zip olarak taşır; Anki `.apkg` de zip içinde `collection.anki21b` (zstd'li SQLite, şema 18) artı bir medya adı→dosya eşlemesi tutar, medya dosyaları sırayla numaralanır. Quizloop modülünün PDF'ten sökülmüş görsel ve tabloları için aynı desen: dosya adı gövdede değil, eşleme tablosunda. Değeri: yeniden adlandırma ve çakışma sorununu tek yerde çözer.
- **Format sürümünü paketin ilk bayrağı yap.** Anki, zip'in içine önce bir `meta` koyup sürüme göre koleksiyon dosya adını ve şema sürümünü seçiyor; eski sürümler `Legacy1/Legacy2` olarak yaşamaya devam ediyor. Quizloop modül meta dosyasına aynı ayrım girmeli. Değeri: modüller git'e gitmediği için geriye dönük okuma tek güvencemiz.
- **Kaynak izlenebilirliği hiçbir formatta yok — uzantı noktası olarak planla.** QTI'da en yakın şey manifest'teki LOM/QTI metadata; GIFT ve Aiken'de karşılığı sıfır. Quizloop'un `kaynak` (dosya, sayfa, alıntı) alanı kendi alanımız olarak kalır, dışa aktarımda genel geri bildirim metnine düz metin olarak eklenir. Değeri: halüsinasyon denetimi bizim ayırt edici yanımız, onu standarda feda etmeyiz.

## Kaçınılacaklar

- **QTI 3.0'ı iç format yapmak.** Şık başına geri bildirim QTI'da doğrudan şıkkın içinde durmaz; `FEEDBACK` çıktı değişkenini set eden response processing artı her şık için ayrı `qti-feedback-block`/`qti-feedback-inline` gerekir. Bir çoktan seçmeli soru, elle bakılamayacak kadar uzun XML'e dönüşür; yapay zekânın üretim sırasında blok blok yazdığı bir akış için yanlış zemin.
- **Anki `.apkg`'yi iç format yapmak.** İçerik SQLite'ta; git'e gitmese bile diff'lenemez, elle düzeltilemez, üretim defteriyle birlikte yürümez. Ayrıca not tipi alanları serbest HTML'dir: "doğru şık", "yanlış şık açıklaması" gibi anlamlar formatta değil, kullandığın not tipi şablonundadır — semantik kaybı içe aktarmada geri gelmez.
- **Anki kodunu bağımlılık olarak almak.** AGPL-3.0-or-later; MIT bir Electron uygulamasına linklenmesi lisans sorunu doğurur. Yazma tarafı gerekirse MIT olan genanki tarzı bağımsız uygulama örnek alınır. "Anki" adının marka olarak ayrıca korunduğu bilgisi bu taramada doğrulanamadı — dışa aktarma menüsünde ad kullanmadan önce kontrol edilmeli.
- **Aiken.** Yalnız çoktan seçmeli, geri bildirim yok, medya yok. Bizim kaydımızın yarısı düşer.
- **Arşivlenmiş quizdown-js'i bağımlılık yapmak.** Depo arşivli, son etiketli sürüm 2022; sözdizimi fikri alınır, paket alınmaz.

## Karar önerisi

1. İç format kendimizin olsun: JSON kayıtlar + `schema/` doğrulayıcı sözleşme. QTI da Anki de bizim şık-başına-açıklama ve kaynak alanlarımızı kayıpsız taşımıyor.
2. Alan adlandırmasını Moodle XML'in soru modeliyle hizala (per-answer feedback, general feedback, tags) — çeviri katmanı böylece bire bir kalır.
3. Birinci dışa aktarma hedefi GIFT: tek dosya, şık başına açıklama doğal, çıktı gözle okunabilir; medya için `giftmedia` zip düzeni izlenir.
4. İkinci hedef Moodle XML (medya base64 gömülü, tag desteği). Anki `.apkg` üçüncü sırada ve yalnız genanki tarzı bağımsız yazıcıyla.
5. QTI 3.0 şimdilik yalnız okunacak referans: paketleme ve sürümleme desenini alırız, XML'ini almayız.
