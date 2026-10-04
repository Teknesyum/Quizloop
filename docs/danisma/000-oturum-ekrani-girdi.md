# Olgular — Quizloop oturum ekranı: okunabilirlik ve ölçü

## Ürün
Electron + React masaüstü uygulaması. Tıp sınavı sorularını aralıklı tekrarla
soruyor. Tek kullanıcı: sahibi, bir hekim. Uzun süre, arka arkaya, klavyeyle
çalışıyor. Koyu zemin, neon (cyan/magenta/mor) kimlik.

## Bir önceki tur ne yapıldı
Şıklar 16px'ten 20px'e çıktı, iç boşluk büyüdü, harfler çerçeveli rozet oldu.
Soru gövdesi ile soru cümlesi ayrıldı; soru cümlesi 24px ve üstünde ince çizgi.
Sorunun `tags` alanındaki terimler metinde yakalanıp dönüşümlü olarak mavi ve
pembe boyanıyor. Puan düğmelerinden dolgu pembe kaldırıldı, üçü de hayalet
oldu. Alta evreye göre değişen bir kısayol satırı kondu.

## Kullanıcı yeni tur için ne diyor (aynen)
> aşağı satır gözükmedi
> bir üst menüye dönme seçeneği eklenmemiş
> soruda "Günübirlik cerrahi geçirecek bir hastada ameliyat sonrası hızlı
> derlenip erken taburculuk hedefleniyor. / Metne göre propofolün piyasaya
> sürülmesi bu tür anestezide neden büyük bir ilerleme sayılmıştır?" diyor
> günübirlik ve propofol gibi kelimelere vurgu yapılabilirdi
> daha okunaklı bir tasarım istiyorum bilmiyorum font veya tasarımsal bişey
> belki siyah üstüne beyaz iyi bir fikir değildi
> arayüz büyüklük sıkıntıları var bunlar çözülsün
> soru emekli oldu yeni soruya otomatik geçiş yapılması lazım
> genişliği daha verimli kullanabiliriz soru alanı daha geniş olmalı ve
> vurgular eklensin artık

## Ölçüm (paketlenmiş uygulama, gerçek)
Pencere 1600×1100. `.ql-screen` genişliği 943px, solda 323px sağda 333px boş.
2560 genişlikte `.ql-screen` 1516px. Şık düğmesi yüksekliği 64px, yazı 20px.
Alt kısayol satırı ekranın en altında, uzun bir soruda görünür alanın dışında
kalıyor (kullanıcının ilk şikâyeti).

## Tasarım dizgesi (teknesyum-ui, vendor, DEĞİŞTİRİLEMEZ)
`teknesyum-ui/css/theme.css`. Yeni renk ya da px uydurmak yasak, `npm run
ui:scan` denetliyor.

Yazı ölçeği `--tk-fs-1..5 = 14 / 16 / 20 / 24 / 30px`. Dosyanın kendi notu:
"ara boyut eklemeyin; tartışmaya açık olan ölçeğin kendisidir."
Boşluk `--tk-sp-1..5 = 4 / 8 / 12 / 16 / 24px`. `--tk-measure: 65ch`.
Satır yüksekliği `--tk-lh-body: 1.5`, `--tk-lh-heading: 1.2`.

Renkler:
- zemin `--tk-bg` (koyu), `--tk-text: #ffffff`
- `--tk-blue: #00f3ff`, `--tk-pink: #ff00ea`, `--tk-purple: #b026ff`
- metin tonları `--tk-text-label: #00f3ff`, `--tk-pink-text: #ff54eb`,
  `--tk-purple-text: #c67eff`
- `--tk-success: #34d399`, `--tk-danger: var(--tk-pink)`,
  `--tk-warning: #fbbf24` (yalnız yüzey: metin/kenarlık/ikon, asla dolgu)
- `--tk-disabled: #71717a`
- kenarlık `--tk-border`, `--tk-border-strong`
- panel yüzeyi `.tk-panel`

Kural: dolgulu düğmelerin metni siyah. Koyu tema zorunlu, açık tema yok.
Uygulama ayrıca kullanıcı ölçeği taşıyor: %90–%160 arası altı kademe,
Ctrl + / Ctrl − ile, Electron zoom'u olarak uygulanıyor (tokenlara dokunmuyor).

## Bugünkü oturum ekranı düzeni
Tek sütun, ortalanmış. Yukarıdan aşağı:
1. Üst çubuk: `1 / 40`, zorluk etiketi, sağda puan + "Soruyu işaretle" +
   "Oturumu bitir".
2. `.tk-panel` içinde: soru gövdesi (20px) → çizgi → soru cümlesi (24px) →
   şıklar (20px, dikey liste) → çözüm → kaynak alıntısı → üç puan düğmesi.
3. Panelin dışında, en altta kısayol satırı (14px).

Evreler: `stem` (yalnız soru + iki düğme) → `choices` (şıklar açık) →
`solved` (çözüm + puanlama) → `graded` (puan farkı + sonraki).

## Veri
Soru: `stem.md` (≤60 kelime, düz markdown, kalın/italik yok), 5 şık
(≤20 kelime), her yanlış şık için açıklama, çözüm blokları, kaynak alıntısı,
zorluk, `tags: string[]`.
Yukarıdaki propofol sorusunun etiketleri:
`["propofol", "indüksiyon ajanları", "günübirlik anestezi", "farmakoloji tarihi"]`
Metinde kelimeler ekli geçiyor: "propofolün", "Günübirlik". Etiketler ayrıca
çok kelimeli ("günübirlik anestezi") ve metinde o hâliyle geçmiyor.

## Kısıtlar
- `teknesyum-ui/css/` dosyaları değiştirilemez; iş `src/renderer/src/styles/
  app.css` ve React bileşenlerinde.
- Yeni renk kodu ya da px uydurulamaz; token bileşimi serbest.
- Kodda yorum yok.
