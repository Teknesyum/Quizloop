# Danışma 005: Kapak Kartında Yazının Arkasındaki Siyahlık

claude-fable-5-1, 3.579 çıktı token, 76 sn. Girdi: [005-fable-kapak-siyahlik-girdi.md](005-fable-kapak-siyahlik-girdi.md). Cevap olduğu gibi:

---

## Tek yorum

Sahibin dört cümlesi birlikte okununca kastı şu: **harflerin biçimini izleyen, kenarı keskin, geniş bir siyah gölge kalıbı.** Ne bulanık hale (0.7.13–15), ne dikdörtgen plaka (0.7.16). İkisi de yanlış yöne gitti; aradığı şey ikisinin arasında.

### 1. Siyahlığın biçimi

Harfin çevresini izler. 1. cümlede "anahat olmasın… düz siyah panel değil… harf bazında" diyor; 4. cümlede 0.7.16'nın plakasına "bu değil" diyor. Yani kutu kesin dışarıda. İnce anahat (1px stroke) da dışarıda. Geriye kalan: harfin her yöne şişirilmiş, dolgulu siluet kopyası. 2. cümledeki "biraz daha genişlet" bu siluetin yarıçapı; harfler arası boşluktan geniş olunca harfler tek bir siyah leke içinde birleşir, kelime bir bütün olur.

### 2. "Parlama tarzı olsun ancak parlama olmasın, bir anda siyah tona geçelim"

"Parlama tarzı" = biçim: harften dışarı yayılan, harfi takip eden şekil (halenin ayak izi). "Parlama olmasın" = geçiş: bulanık değil, saydamdan siyaha kademeli solma yok. "Bir anda siyah tona geçelim" = kenar keskin, yayılan bölge tek düze siyah. Yani 0.7.15'teki halenin bulanıklığını sıfırlayıp onun yerine genişliğini korumak. Bulanıklık yerine yarıçap.

### 3. "Her yerde aynı düzen"

Kartta yazı olan her öğe: başlık, yüzde, etiketler ("Sürüm 1.5.0", "Kuran", "Hafızlık"), sayaçlar. 3. cümlenin ilk yarısı tam olarak bunu şikâyet ediyor: sürüm etiketinde kutu, diğerlerinde hale — iki ayrı siyahlık. Hepsi aynı siluet gölgesini alır.

Düğmeler ("Karışık", "⋯") ayrı: "arkasında yarı saydam siyah olabilir" diyor, bu bir izin. Hayalet düğmeler `--tk-scrim` plakalı kalabilir; düğme zaten kutu olduğu için orada plaka yabancı durmaz. "Oturuma başla" dolu düğme, dokunulmaz.

### 4. Yalnızca tokenlarla CSS

`text-shadow` bulanıklık 0 ve sekiz yöne ofsetle harfin kopyaları atılır; kopyalar birleşince keskin kenarlı dilate siluet çıkar. Renk `--tk-bg-from` (düz siyah), yarıçap bir boşluk tokenı. Sahip "daha genişlet" dediği için `--tk-sp-2` ile başla, dar gelirse `--tk-sp-3`.

```css
.ql-cover-card .tk-h3,
.ql-cover-card .ql-percent,
.ql-cover-card .ql-tag,
.ql-cover-card .tk-hint {
  --ql-ink-r: var(--tk-sp-2);
  --ql-ink-d: calc(var(--ql-ink-r) * 0.7071);
  background: none;
  padding: 0;
  text-shadow:
    var(--ql-ink-r) 0 0 var(--tk-bg-from),
    calc(-1 * var(--ql-ink-r)) 0 0 var(--tk-bg-from),
    0 var(--ql-ink-r) 0 var(--tk-bg-from),
    0 calc(-1 * var(--ql-ink-r)) 0 var(--tk-bg-from),
    var(--ql-ink-d) var(--ql-ink-d) 0 var(--tk-bg-from),
    calc(-1 * var(--ql-ink-d)) var(--ql-ink-d) 0 var(--tk-bg-from),
    var(--ql-ink-d) calc(-1 * var(--ql-ink-d)) 0 var(--tk-bg-from),
    calc(-1 * var(--ql-ink-d)) calc(-1 * var(--ql-ink-d)) 0 var(--tk-bg-from);
}

.ql-cover-card .tk-btn-ghost {
  background: var(--tk-scrim);
  border-radius: var(--tk-r);
}
```

Sekiz yön yarıçap büyüdükçe köşeli görünür; o zaman aynı kalıpla `--ql-ink-r`'nin yarısında ikinci bir sekizli halka eklenir (on altı katman). Katmanlar üst üste bindiği için renk saydam olamaz — `--tk-scrim` kullanılırsa bindiği yerler düzensiz koyulaşır, "tek tonda siyah" bozulur. Bu yüzden `--tk-bg-from`.

Tokenlar `calc` içinde kullanıldığı için elle ölçü yazılmıyor; `--ql-ink-*` yalnızca türetilmiş ara değer.

## Emin olmadığım yer

Siluetin tonu. Sahip yazılar için "yarı saydam" demedi, bunu yalnızca düğmeler için söyledi; `text-shadow` katmanlaması da saydamlığı teknik olarak zorlaştırıyor. Ben düz siyah okuyorum ama bu bir çıkarım.

Sahibe tek soru:

```
Yazıların arkasındaki siyahlık harfleri izleyen keskin kenarlı bir gölge olacak; bu gölge düz siyah mı olsun, yoksa düğmelerdeki gibi yarı saydam mı (altındaki kapak resmi hafifçe görünsün mü)?
```
