[[netlestirme:003]]

# Netleştirme: Kullanıcı Quizloop'u tam ekranda 'cazibesini kaybediyor', orta boyutta 'iyi' bul

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

Kullanıcı Quizloop'u tam ekranda 'cazibesini kaybediyor', orta boyutta 'iyi' buluyor ve 'yine de geliştirilmeli' diyor. Ben işe başlamadan önce bu cümlenin hangi kısmının belirsiz olduğunu ve kullanıcıya sormam gereken TEK ayırt edici soruyu bilmek istiyorum. Görüş verme, seçenek sıralama, çözüm önerme: yalnız netleştir. Somut olarak: (a) 'cazibesini kaybediyor' şikayeti ölçülen yerleşimde hangi somut olguya karşılık geliyor, birden fazla adaya işaret ediyorsa hangileri; (b) bu adaylar arasındaki fark kullanıcıya sorulmadan olgulardan çözülebilir mi, yoksa çözülemez mi; (c) çözülemiyorsa kullanıcıya sorulacak tek soru ne olmalı ve hangi iki cevap birbirinden farklı iş çıkarır.

## Elde olan olgular

# Olgular — Quizloop arayüzü, geniş ekran davranışı

Uygulama: Electron 42 + React 19 masaüstü quiz uygulaması. Dört ekran:
Kütüphane (modül kartları), Oturum (soru + şıklar + çözüm), Özet, Ayarlar,
artı İstatistik. Tema teknesyum-ui token'ları (`--tk-*`), renk/ölçü uydurulamaz.

## Kullanıcının cümlesi (birebir)

"tam ekrana alınca cazibesini kaybediyor biraz ortalama büyüklükteyken iyi
durumda görünüş tabi yine geliştirilmeli"

## Yerleşimin ölçülen hali (src/renderer/src/styles/app.css, 12 KB, tamamı okundu)

- `.ql-shell`: grid, satırlar `40px` (başlık çubuğu) + `1fr`. `height:100%`,
  `overflow:hidden`.
- `.ql-body`: grid, sütunlar `--tk-sidebar-w` (240px sabit) + `minmax(0,1fr)`.
  Oturum sırasında `.ql-body-focus` kenar çubuğunu tamamen kaldırıyor, tek sütun.
- `.ql-main`: `overflow-y:auto`, `padding: 24px` sabit.
- `.ql-screen` (her ekranın sarmalayıcısı): `max-width: calc(var(--tk-measure) * 2)`
  = `130ch`, `margin: 0 auto`.
- `.ql-session`: `max-width: calc(var(--tk-measure) * 1.4)` = `91ch`.
- `--tk-measure: 65ch`. Gövde fontu ~16px varsayımıyla 65ch ≈ 520px,
  yani `.ql-screen` ≈ 1040px, `.ql-session` ≈ 730px.
- `.ql-grid` (kütüphane kartları): `repeat(auto-fill, minmax(320px, 1fr))`.
- `.ql-tiles` (istatistik): `repeat(auto-fill, minmax(180px, 1fr))`.
- `.ql-summary-grid`: `repeat(auto-fit, minmax(160px, 1fr))`.
- `.ql-grade-row`: `repeat(auto-fit, minmax(200px, 1fr))`.
- **Dosyada tek bir `@media` kuralı yok.** Hiçbir kırılma noktası tanımlı değil.
- Yazı boyutları sabit px (`--tk-fs-1..5`), viewport'a bağlı hiçbir birim yok
  (`vw`, `clamp()`, `cqi` geçmiyor).

## Bunun geniş ekranda sonucu (aritmetik)

2560px genişlikte, kenar çubuğu 240px: ana alan ~2320px. İçerik 1040px'te
kapanıp ortalanıyor, iki yanda ~640px'er boş alan kalıyor. Kütüphane kart
grid'i 1040px içinde en çok 3 sütun oluyor; 2320px kullanılsa 7 sütun olurdu.
Oturum ekranında içerik 730px, iki yanda ~795px'er boşluk.

1280px genişlikte: ana alan ~1040px, içerik tam oturuyor, boşluk yok.
Kullanıcının "ortalama büyüklükte iyi" dediği bant bu.

## Kısıtlar

- Satır uzunluğu okunabilirlik için sınırlı tutulmuş; soru metnini 2300px'e
  yaymak okunabilirliği bozar. Yani "boşluğu içerikle doldur" ile "satırı
  uzatma" çatışıyor.
- teknesyum-ui token'ları dışına çıkılamaz; yeni renk/ölçü uydurulamaz.
  Mevcut token'lar: `--tk-measure`, `--tk-sidebar-w`, `--tk-sp-1..5`,
  `--tk-fs-1..5`, `--tk-panel-padding`, `--tk-section-gap`.
- Kullanıcı LANGE içerik işini şimdilik durdurdu; sıra arayüzde.
- Uygulama içinde henüz gerçek modül kurulu değil, ekranlar boş/az veriyle
  görülüyor olabilir.
