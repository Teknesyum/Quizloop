# cure53/DOMPurify

## Depo
`dompurify` · https://github.com/cure53/DOMPurify · **MPL-2.0 OR Apache-2.0 ikili lisans** (GitHub API yalnız Apache-2.0 der, npm `(MPL-2.0 OR Apache-2.0)`) · son sürüm 3.4.14 (2026-08-19), son push 2026-08-21 · 17.322 yıldız · 2 açık issue · npm paketi 1,8 MB açılmış (çoklu build içerir).

## Ne için bakıldı
Çözüm anlatımı yapay zekâ üretimi. Soru: `react-markdown` ham HTML'i zaten atıyorken ikinci bir temizleyici katman gerekli mi, modül dosyaları güvenilmeyen kaynak sayıldığında hangi durumda şart olur.

Lisans notu: MIT değil ama ikisi de izin verici, AGPL/GPL değil — MIT dağıtımla uyumlu. Apache-2.0 seçilirse bildirim yükümlülüğü doğar.

## Alınacak fikirler
- **Temizleme tek sınırda yapılır, veri yolu boyunca değil.** DOMPurify DOM'a yazılmadan hemen önceki tek noktada çalışır. Quizloop'ta aynı kural: güvenlik kapısı Markdown renderer'dır; IPC, depolama ve şema katmanı içeriği temizlemeye çalışmaz, yalnız doğrular. İki yerde temizlik, ikisinin de gevşemesi demektir.
- **Politika kancaları: izin kararı içerikten değil bağlamdan verilir.** `uponSanitizeAttribute` benzeri kancalarla bağlantı şeması beyaz listesi, `rel`/`target` zorlaması gibi kurallar tek yerde toplanıyor. Bu desen bize bağımlılık olarak değil, `react-markdown`'ın `urlTransform`'una yazılacak tek politika fonksiyonu olarak girer.
- **Sanitizer ile doküman geneli zorlayıcı ayrı katmanlardır.** README, Trusted Types `default` politikasıyla tüm sinkleri kapatmayı ayrı bir projeye (DOMFortify) bırakıyor ve DOMPurify'ı odaklı tutuyor. Ayrıca uyarı veriyor: CSP'de `trusted-types` dar tanımlanırsa DOMPurify'ın kendi `dompurify` politikasını kurması engelleniyor. Electron CSP'sini yazarken bilinmesi gereken sınır.

## Kaçınılacaklar
- **Gereksiz ikinci kalkan.** `rehype-raw` yokken Markdown boru hattından DOM'a ham HTML zaten geçmiyor; ek katman güvenlik değil, yalnız paket boyutu ve yanlış güven duygusu ekler.
- **Ham HTML açılırsa yanlış katmanı seçmek.** O durumda doğru yer `rehype-sanitize`: hast ağacı üzerinde, DOM'a hiç girmeden, şemayla çalışır. DOMPurify'a düşmek ancak Markdown dışı bir `innerHTML` sinki doğarsa gerekir — PDF çıkarıcıdan gelen HTML, modül paketinden gelen gömülü SVG gibi.
- **Node/ana süreçte kullanmak.** README sunucu tarafında `jsdom` şart diyor ve eski `jsdom` sürümlerinde DOMPurify doğru çalışsa bile XSS'e yol açan bilinen vektörler olduğunu yazıyor. Bu, Electron ana sürecine büyük bir bağımlılık yüzeyi taşımak demek.
- Yapılandırma bayrakları (`ADD_ATTR`, `ALLOW_UNKNOWN_PROTOCOLS`, `SAFE_FOR_XML: false`) kapıyı sessizce açar; varsayılan dışına çıkan her satır gerekçesiyle yazılmalı.

## Karar
`elendi` — bugünkü boru hattında karşılığı yok; kancalar ve tek-sınır fikri desen olarak alınır.
Koşullu geri gelir: ham HTML veya Markdown dışı bir `innerHTML` sinki doğarsa `bağımlılık` olur.
Modül dosyası güvenilmeyen kaynak sayılıyor; asıl savunma CSP + `urlTransform` + şema doğrulaması, temizleyici değil.
