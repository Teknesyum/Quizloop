# TanStack/virtual

## Depo
`@tanstack/react-virtual` · https://github.com/TanStack/virtual · MIT · npm 3.14.10; depo son push 2026-08-18, monorepo son etiketi `@tanstack/angular-virtual@6.0.3` (2026-08-18) — React paketi ayrı sürümleniyor · 7.079 yıldız · 110 açık issue · npm paketi 56 KB açılmış (`npm view`).

## Ne için bakıldı
Bir modülde binlerce soru olabiliyor. Sınav ekranı tek soru gösterdiği için orada gerek yok; soru bankası listesi, modül içeriği tarayıcısı ve istatistik tabloları binlerce satır basacak. Soru: sanallaştırma gerçekten gerekli mi, satır yükseklikleri değişkenken davranışı nasıl, klavye gezinmesiyle çakışır mı.

## Alınacak fikirler
- **Headless ayrım: ölçüm ayrı, render ayrı.** Kütüphane hiçbir DOM üretmiyor; `getVirtualItems()` ile indeks/ofset listesi veriyor, işaretlemeyi biz yazıyoruz. Quizloop'ta liste bileşenlerinin görünümü `teknesyum-ui` içinde kalır, kütüphane yalnız kaydırma matematiğini alır.
- **Değişken yükseklik `measureElement` + ResizeObserver ile.** Belge açıkça uyarıyor: dinamik ölçümde `estimateSize` **olabilecek en büyük** boyutu tahmin etmeli, yoksa ilk konumlar yanlış çıkar. Soru satırları (uzun kök metni, formül) için doğrudan uygulanabilir; başlangıç tahmini tek yerden ayarlanır.
- **Seçim indeksi tek kaynak, kaydırma ondan türer.** Klavye gezinmesi DOM odak sırasına değil, tutulan `selectedIndex`'e bağlanır; `scrollToIndex` seçili satırı görünüre getirir. Anki tarama dosyasındaki "kısayol tek kaynaktan" deseniyle aynı hatta oturur.

## Kaçınılacaklar
- **Çözüm/typer alanını sanallaştırmak.** Daktilo ve KaTeX yükü sürekli yükseklik değiştirir; ResizeObserver her karakterde yeniden ölçüm tetikler. Akan içerik sanallaştırılmaz.
- **Tab ile gezinmeye güvenmek.** Görünmeyen satırlar DOM'da yok — sekme sırası, tarayıcı içi arama (Ctrl+F) ve ekran okuyucu sayımı bozulur. `aria-setsize`/`aria-posinset` elle verilmezse liste "3 öğe" gibi okunur.
- **Eşiksiz kullanmak.** 100-200 satırlık listede kazanç yok, mutlak konumlandırma ve CSS yeniden yazımı maliyeti var. Gizli kurulum maliyeti: kaydırma kabı, `position: absolute` ve `transform` düzeni.
- Dinamik ölçüm ile uzak bir indekse `scrollToIndex` çağrısında ofset kayması bildirimleri topluluk kanalında sık geçiyor — **doğrulanamadı**, ölçmeden söz verilmez.

## Karar
`bağımlılık` — yalnız soru bankası ve istatistik listelerinde, satır sayısı eşiği üstünde.
MIT, tek paket, çalışma zamanı bağımlılığı yok; sınav ve çözüm ekranına sokulmaz.
Klavye gezinmesi indeks tabanlı yazılırsa çakışma yok, DOM odağına dayanırsa var.
