[[netlestirme:004]]

# Netleştirme: Quizloop'un oturum (soru sorma) ekranının tasarımını toparlamam gerekiyor. Kulla

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

Quizloop'un oturum (soru sorma) ekranının tasarımını toparlamam gerekiyor. Kullanıcı 'şıklar çok küçük, hiç güzel bir tasarımı yok, base iskeletini araştır' diyor. Olgu dosyasındaki tokenlar ve bugünkü CSS/bileşen yapısı verili. Bana somut, uygulanabilir bir tasarım kararı ver: (1) soru gövdesi ile soru cümlesinin görsel ayrımı ve stem içindeki anahtar terimlerin renkle vurgulanması — hangi tokenlar, hangi kural, hangi terim hangi renk; (2) şıkların ölçüsü, iç boşluğu, harf rozetinin biçimi, hover/seçili/doğru/yanlış durumları — mevcut fs-2/sp-3 yerine ne; (3) 14-30px ölçeğine ara boyut eklemeden kullanıcıya font büyüt/küçült seçeneği nasıl verilir; (4) üç puan düğmesi: 'Anlamadım' bugün dolgu pembe (tk-btn-danger, siyah metin) ve kullanıcı 'fazla parlak, okuması zor' diyor — üç düğmenin doğru hiyerarşisi ne olmalı; (5) alttaki kısayol satırı: pembe+mavi tutarlı bir düzen ve 'neyi puanla', 'işaret atınca ne oluyor' sorularını yanıtlayan metin. Tokenların dışına çıkma, yeni renk/px uydurma.

## Elde olan olgular

# Olgular — Quizloop oturum ekranı tasarımı

## Ürün
Electron 42 + React 19 + TypeScript. Aralıklı tekrar (FSRS-6) ile tıp sınavı
soruları soran masaüstü uygulaması. Tek kullanıcı: sahibi. Klavye öncelikli.
Sorular LANGE Anestezi 7. baskı kitabından üretiliyor; 59 bölüm, şu an paketli
2532 soru, 51 blok.

## Tasarım dizgesi (teknesyum-ui, vendor, DEĞİŞTİRİLEMEZ)
Token dosyası `teknesyum-ui/css/theme.css`. Sadece bu tokenlar kullanılabilir,
yeni renk/ölçü uydurmak yasak. Bir tarayıcı (`npm run ui:scan`) bunu denetliyor.

Yazı ölçeği: `--tk-fs-1..5 = 14 / 16 / 20 / 24 / 30px`. Dosyada yazan not:
"ara boyut eklemeyin; tartışmaya açık olan ölçeğin kendisidir, tek bir kullanım
değil."
Boşluk: `--tk-sp-1..5 = 4 / 8 / 12 / 16 / 24px`. `--tk-measure: 65ch`.
Satır: `--tk-lh-body: 1.5`, `--tk-lh-heading: 1.2`.

Renkler:
- `--tk-bg` koyu zemin, `--tk-text: #ffffff` (saf beyaz, zaten)
- `--tk-text-label: #00f3ff`
- `--tk-blue: #00f3ff`, `--tk-pink: #ff00ea`, `--tk-purple: #b026ff`
- metin tonları: `--tk-pink-text: #ff54eb`, `--tk-purple-text: #c67eff`
- `--tk-success: #34d399`, `--tk-danger: var(--tk-pink)`,
  `--tk-danger-text: var(--tk-pink-text)`
- `--tk-warning: #fbbf24` — kural: yalnız yüzey (metin/kenarlık/ikon), asla dolgu
  ya da düğme
- `--tk-disabled: #71717a`

Düğme sınıfları (theme.css):
```
.tk-btn-primary { background: var(--tk-blue);   color: #000; box-shadow: var(--tk-glow-blue); }
.tk-btn-danger  { background: var(--tk-danger); color: #000; box-shadow: var(--tk-glow-pink); }
.tk-btn-ghost   { saydam zemin, mor kenarlık, hover'da rgba(176,38,255,.2) }
```
Yani dolgulu düğmelerin metni siyah; bu tokenların kuralı.

`.tk-prose { max-width: var(--tk-measure); line-height: var(--tk-lh-body); }`
— açık `color` yok, `--tk-text`ten miras alıyor.
`.tk-hint` → `--tk-fs-1` boyutunda, rengi `--tk-text`.

## Oturum ekranının bugünkü hâli
`src/renderer/src/screens/Session.tsx`, evre güdümlü:
`stem` → `choices` → `solved` → `graded`.

- `stem`: soru metni daktilo etkisiyle yazılıyor (`useTyper`), markdown
  (`react-markdown`) `tk-prose ql-stem-text` içinde. Altında iki düğme:
  "Biliyorum" (B tuşu) ve "Şıkları göster" (Boşluk).
- `choices`: `<ol class="ql-choices">`, her şık bir `<button>`.
- `solved`: çözüm blokları (text/hint/formula/image/table) + kaynak alıntısı
  blockquote + üç puan düğmesi:
  `g===3 → tk-btn-primary`, `g===1 → tk-btn-danger`, `g===2 → tk-btn-ghost`.
- `graded`: puan farkı + sonraki.
- En altta sabit tek satır: `<p class="tk-hint ql-keys">`.

Proje CSS'i (`src/renderer/src/styles/app.css`, düzenlenebilir):
```css
.ql-screen { display:flex; flex-direction:column; gap:var(--tk-section-gap);
             width:100%; max-width:calc(var(--tk-measure)*2); margin:0 auto; }
.ql-session { max-width: calc(var(--tk-measure) * 1.4); }
.ql-stem-text { font-size: var(--tk-fs-3); }        /* 20px */
.ql-choice > button {
  width:100%; display:flex; align-items:flex-start; gap:var(--tk-sp-3);
  padding: var(--tk-sp-3) var(--tk-sp-4);
  font-size: var(--tk-fs-2);                         /* 16px */
  line-height: var(--tk-lh-body);
  border: var(--tk-border-w) solid var(--tk-border);
  border-radius: var(--tk-r);
}
.ql-choice-key { ... }  .ql-choice-text { ... }
.ql-choice-wrong > button { ... } .ql-choice-right > button { ... }
.ql-grade-row { grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); }
.ql-keys { text-align:center; color: var(--tk-purple-text); }
```
Büyük ekranlar için `@media (min-width:1700px)` ve `(min-width:2200px)`
blokları var; 2200px'te ölçek 16/20/24/30/38px'e çıkarılıyor.

Tuşlar (`src/renderer/src/keys.ts`):
Boşluk=şıkları aç, B=biliyorum, A–E=şık seç, 1/2/3=puanla, Enter=sonraki,
F=işaretle, Esc=bitir.

Metinler (`locale/tr.json`):
- `session.grade.1 = "Anlamadım"`, ipucu "Bu oturumda tekrar gelir"
- `session.grade.2` orta, `session.grade.3 = "Anladım"`, ipucu
  "Emekli olur, bir daha sorulmaz"
- `session.keys = "Boşluk şıklar · B biliyorum · A–E seç · 1 2 3 puanla · F işaret · Esc bitir"`

## Soru verisi
Her soru: `stem.md` (markdown, ≤60 kelime), 5 şık (≤20 kelime), `correct`,
her yanlış şık için `distractors[key]` açıklaması, `solution` blokları,
`source {file, pages, quote, chapter}`, `difficulty` (kolay/orta/zor),
`tags: string[]` (ör. `["tarih","lokal anestezi"]`).
`source.chapter` her soruda dolu ve kitabın 59 bölümüyle birebir örtüşüyor
(ör. "5 Kardiyovasküler Monitorizasyon" → 55 soru).

Örnek bir stem'in yapısı, kullanıcının şikâyet ettiği hâliyle: uzun bir olgu
paragrafı ("Masif transfüzyon protokolü... travma...") ve sonunda soru cümlesi
("Bu yaklaşımın kökeni ve amacı metne göre nedir?") aynı paragrafın içinde,
ayrımsız akıyor.

## Kullanıcının kendi cümleleri (aynen)
> genel fontu biraz büyült birde fontu büyültüp küçültme seçeneği eklenmeli
> metin tam beyaz olmalı hafif gri gibi geldi gözüme
> Masif transfüzyon protokolü, travma yazıları bi renkli / eritrosit, taze
> donmuş plazma, trombosit yazıları bi renkli olsa çok daha okunabilir önemli
> yerlerin vurgulandığı bir metin olur
> "Bu yaklaşımın kökeni ve amacı metne göre nedir?" derkende iki tane enter
> basıp yazsak sorunun olduğu yeri ayırmış oluruz
> altta kısayolların açıklamalarını yazdığın açıklama hep pembe mavi ve pembe
> kombine gitmeli 1 2 3 puanla ama neyi puanla f işaret ama işaret atınca ne
> oluyor
> şıklar çok küçük hiç güzel bir tasarımı yok base iskeletin araştır
> anlamadım kutucuğu fazla parlak ve okuması zor

## Kısıtlar
- `teknesyum-ui/css/` altındaki hiçbir dosya değiştirilemez; tüm iş
  `src/renderer/src/styles/app.css` ve bileşenlerde yapılacak.
- Yeni renk kodu ya da px değeri uydurulamaz; token bileşimi serbest.
- Kodda yorum satırı yok.
- Uygulama koyu temalı, neon (cyan/magenta/mor) bir kimliği var.
