# commander.js

## Depo
tj/commander.js · https://github.com/tj/commander.js · MIT · v15.0.0 (2026-05-29) ·
28.4k yıldız · ~4 MB depo, 6 açık issue (çok düşük — bakım disiplini işareti).

## Ne için bakıldı
quizforge'un `init / plan / run / verify / pack` alt komutları. Soru: bu beş komut için
yeterli mi, uzun süren üretimde ilerleme ve çıkış kodları nasıl yönetilir.

## Alınacak fikirler
- **Alt komut ağacı + komut başına ayrı dosya.** `program.command('run')` zinciri ile her
  alt komut kendi seçenek ve doğrulamasını taşır; commander eylem işleyicisinden başka bir
  şey bilmez. quizforge'da `src/cli/<komut>.ts` sınırı doğal olarak buradan çıkar —
  ayrıştırma katmanı üretim mantığını hiç görmez.
- **Çıkış kodu sözleşmesi CLI'ın kendisinde.** Kullanım hatası (eksik argüman, tanınmayan
  seçenek) commander tarafından ayrı kodla sonlandırılır; iş hatası (kural dosyası bozuk,
  PDF okunamadı) eylem işleyicisinde `process.exitCode` ile ayrılır. quizforge'un kontrol
  noktalı üretimi için "yarıda kesildi" ile "girdi hatalı" ayrı kodlar olmalı.
- **İlerleme çıktısı commander'ın işi değil — ve bu iyi.** Kütüphane spinner/progress
  sunmuyor; ilerleme `stderr`'e, makine okunur sonuç `stdout`'a yazılır. Bu ayrım
  quizforge'un çıktısını hem terminalde okunur hem de boruya bağlanabilir yapar.

## Kaçınılacaklar
- **v15 ESM-only ve Node.js >= 22.12.0 istiyor** (sürüm notları, 2026-05-29). CommonJS
  tüketiciler bundler/test koşucusu tarafında takılabilir. Quizloop Vite + TS olduğu için
  muhtemelen sorunsuz, ama quizforge'un hedef Node sürümü bu tarama sırasında doğrulanmadı.
  Takılırsan v14 Mayıs 2027'ye kadar güvenlik güncellemesi alıyor.
- **v15'te kırıcı davranış değişikliği:** yalnız tek başına `--no-*` seçeneği varsayılanı
  `true` yapıyor; pozitif ve negatif seçenek birlikte tanımlanırsa varsayılan örtük
  atanmıyor. Eski örneklerden kopyalanan seçenek tanımları sessizce farklı davranır.
- **Alternatifler neden değil:** `yargs` bağımlılık yüzeyi çok geniş; `clipanion` sınıf
  tabanlı ve dekoratör ağırlıklı, beş komut için fazla; `citty` daha küçük ama ekosistem
  ve sürüm geçmişi commander kadar oturmuş değil. Üçü de bu tarama kapsamında ölçülmedi.

## Karar
`bağımlılık` — MIT, sıfıra yakın açık issue, beş alt komut için fazlasıyla yeterli.
İlerleme ve çıkış kodu politikası bize ait; commander yalnız ayrıştırma sınırında kalır.
