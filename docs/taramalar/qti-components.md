# qti-components

## Depo
Citolab/qti-components · https://github.com/citolab/qti-components · **GPL-3.0-only** · son etiket `qti-components-v7.27.2` 2026-03-24, npm `7.28.1` 2026-06-08 · son push 2026-08-19 · 18 yıldız · 20 açık issue · ~63 MB, pnpm monorepo, 12 paket.

## Ne için bakıldı
QTI 3.0 ciddi bir dışa aktarma hedefi mi, soru bankamızı QTI'ye çevirmek ne kadar iş, çeldirici açıklaması QTI'de nasıl temsil ediliyor.

## Alınacak fikirler
- **QTI 3.0 canlı ve gerçek uygulanıyor — bu bir demo değil.** `qti-elements` altında `qti-response-declaration`, `qti-response-processing`, `qti-outcome-declaration`, `qti-template-processing`, `qti-custom-operator` bileşenleri var; npm'de 408 yayınlanmış sürüm. Yani QTI hedefi teknik olarak ulaşılabilir. Ama Cito (Hollanda sınav kurumu) bunu kendi sınav altyapısı için yazıyor, README'de `repostatus: WIP` rozeti duruyor.
- **Çeldirici açıklaması QTI'de birinci sınıf alan değil, üç parçalı bir mekanizma:** `qti-response-processing` bir sonuç değişkeni (`FEEDBACK`) atar, `qti-feedback-inline` / `qti-feedback-block` / `qti-modal-feedback` o değişkenin değerine göre kendini gösterir. Depoda üçü de mevcut. Yani "şık A yanlışsa şu metni göster" ifade edilebilir — ama her çeldirici için ayrı bir kural + ayrı bir feedback bloğu yazmak gerekir. Bizim `distractors { key -> md }` alanı, N çeldirici için N kural + N blok üreten mekanik bir dönüştürücüye açılır. Bu üretilebilir ama basit değil: bir soru = ~40 satır XML.
- **Paket sınırı çizimi öğretici.** `qti-transformers` (XML→model), `qti-processing` (kural motoru), `qti-elements` (görsel), `qti-loader` (paket okuma) ayrı paketler. `quizforge` dışa aktarıcılarını aynı sınırla kurmalıyız: **dönüştürücü ile oluşturucu ayrı** — GIFT, `.apkg` ve QTI aynı ara modelden beslensin, her biri kendi biçim bilgisini kendi içinde tutsun. Üç hedef planlıyorsak bu ayrımı ilk hedefte kurmak bedava, üçüncüde pahalı.

## Kaçınılacaklar
- **GPL-3.0. Bağımlılık olarak kesinlikle alınamaz** — Electron uygulamasına linklenmesi MIT dağıtımımızı bozar. README "başka türlü kullanmak isterseniz sorun" diyor, yani ticari çift lisans kapısı açık; bu bir çözüm değil, bir pazarlık.
- Ölçek uyuşmazlığı: 63 MB depo, 12 paket, Storybook + Chromatic + görsel regresyon altyapısı. Tek başına bir masaüstü uygulaması için bunun yanına yaklaşmak yok.
- QTI'ye çevirmek "biçim dönüştürme" değil **model dönüştürme**. Bizim modülümüzde açıklama düz metin bir alan; QTI'de yürütülebilir bir kural. Aradaki fark, yazılacak dönüştürücünün maliyetinin tamamı.
- 18 yıldız, dar kullanıcı tabanı. QTI dışa aktarmanın Quizloop kullanıcısına değer üreteceği **doğrulanamadı** — hedef kitle kurumsal sınav sistemleri, bireysel çalışan değil.

## Karar
**Elendi (bağımlılık olarak), desen (paket sınırı olarak).** GPL kapıyı kapatıyor.
Alınan tek şey: dönüştürücü/oluşturucu ayrımı ve QTI'nin feedback modelinin nasıl kurulduğu bilgisi.
QTI dışa aktarma dalga 3'ten önce gündeme gelmesin — maliyeti GIFT'in birkaç katı, karşılığı belirsiz.
