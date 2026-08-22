# pdf-lib

## Depo
Hopding/pdf-lib · https://github.com/Hopding/pdf-lib · MIT · son etiketli sürüm **v1.17.1, 2021-11-06** (npm son yayın 2022-05-12) · 8.6k yıldız · depo ~135 MB, saf TypeScript, sıfır çalışma-zamanı bağımlılığı.

## Ne için bakıldı
Modül üretiminde kaynak PDF `/Outlines` ağacına göre bölümlere ayrılıyor. Eğer bu iş saf JS'te yapılabilirse Python yan-süreci en azından bölme adımından çıkar. Soru: outline okunabiliyor mu, sayfa aralığı bölünebiliyor mu, 401 MB'da ne oluyor.

## Alınacak fikirler
- **Sayfa aralığına göre bölme gerçekten var ve saf JS.** `PDFDocument.load` → `copyPages(kaynak, [indeksler])` → `addPage` → `save()`. Kaynak sayfanın kaynakları (font, görsel) kopyalanan belgeye taşınıyor. Quizloop bölüm başına ayrı PDF çıkarmak isterse bu adım için Python'a gerek yok.
- **Düşük seviye nesne modeli açık.** `PDFDocument.context` üzerinden katalog sözlüğüne inilip `/Outlines` dizisi elle gezilebilir; kütüphane bunu API olarak sunmasa da veri erişilebilir. Desen olarak değerli: outline okuma "PDF sözlük gezme" işidir, ayrı bir motor gerektirmez.
- **Sıfır bağımlılık + her JS ortamında çalışma hedefi** (Node, tarayıcı, Deno, React Native). Electron ana sürecine tek paketle giriyor, native derleme yok — Quizloop'un en büyük dağıtım derdi olan ABI/derleme sorununa hiç dokunmuyor.

## Kaçınılacaklar
- **Metin çıkaramaz.** README açıkça yazıyor: form alanı dışındaki sayfa metnini çıkarmak desteklenmiyor, "ileride eklenebilir". Yani soru gövdesi metnini bundan alamayız; `pdfplumber`/`docling` yerini tutmaz.
- **Görsel çıkarma yok.** Görsel gömme var, sökme yok. Zincirin `pypdfium2` ayağı yerinde kalır.
- **`/Outlines` için hazır API yok.** Depoda "Outlines" geçtiği yerler `ViewerPreferences` (PageMode) ve README; outline okuma özelliği değil. Elle sözlük gezmek, hedef (`/Dest`, `/A` → `/GoTo`) çözmek ve isimli hedef tablosunu (`/Names`) ele almak bize kalır — sanılandan çok iş.
- **Bakım durmuş.** `master` üzerindeki son commit **2021-11-12**; depoya son push 2024-07-17 (yan dal), 316 açık issue. Terk edilmiş sayılmalı — okunur, bağımlılık yapılırken düşünülür.
- **Bellek: tüm dosya belleğe alınır ve nesne grafiği çözülür.** 401 MB'lık PDF'te ham bayt + ayrıştırılmış nesneler Electron ana sürecinin V8 yığınına biner; akış (streaming) veya artımlı ayrıştırma yok. Bu boyutta risk yüksek, ölçmeden kullanılmamalı — **kendi ölçümümüz yok, doğrulanamadı.**

## Karar
`elendi` (bağımlılık olarak). Metin ve görsel çıkaramadığı için Python zincirini eleyemez, tek başına outline okumak için de hazır API vermiyor.
İleride "bölümü ayrı PDF olarak kaydet" özelliği istenirse `copyPages` deseni yeniden değerlendirilir; o gün bakımsızlık ve 401 MB bellek davranışı ölçülerek karara bağlanır.
