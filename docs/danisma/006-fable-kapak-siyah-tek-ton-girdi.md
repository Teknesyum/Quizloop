# Danışma 006 girdi: Kapak Kartı Yazısının Arkasındaki Siyahlık — Dördüncü Deneme

Ajana giden metin:

---

[[danisma:006]]

# Kapak Kartı Yazısının Arkasındaki Siyahlık — Dördüncü Deneme

## Bağlam

Quizloop (Electron + React, koyu tema, zemin tam siyah). Kütüphanede modül kartının
arkasında kapak resmi var (`.ql-cover`, kartı tümüyle kaplar). Üstünde başlık (`.tk-h3`),
yüzde (`.ql-percent`), etiketler (`.ql-tag`), küçük sayaç yazıları (`.tk-hint`) durur.
Resim açık renkliyse yazı okunmuyor; sahibi yazının arkasında siyahlık istiyor.

## Sahibinin Sözleri (Sırayla, Aynen)

1. "bide istediğim bu değil kaç kere söyleyeceğim fable a danışır mısın şu yazının
   arkasındaki siyahlıktan kasteddiğim ne diye !!!" (0.7.16'daki düz dikdörtgen plakaya)
2. "tam siyah olcak"
3. "harflerin arkasındaki siyahlık berbat olmuş bu alandaki istediğim şeyi düzelt
   düzeltemezsen fable a yaz nokta nokta bişey istemiyoruz çok smoooth bi görüntü laızm"
   (0.7.17: 24 adet sıfır bulanıklı text-shadow kopyası, 8px yarıçap)
4. "üst üste geçmiş gölge şeklinde şeyler var böyle değil tek bir siyah ton olacak tam
   deep siyah" (0.7.18: 22 katman bulanık text-shadow, 4/8/12px)
5. "fabla a da sor bu kadar zor olmamalı basit bir işi yapamıyorsun"

## Şu Anki Hal (0.7.19, Az Önce Etiketlendi)

Her yazı öğesine `filter: url(#ql-ink)`. Süzgeç: SourceAlpha → feGaussianBlur
stdDeviation 4 → feColorMatrix alfa = 40·a − 2 (eşikleme) → altına siyah, üstüne yazı.
Sonuç: harfleri yaklaşık 6px dışından izleyen, kenarı yuvarlak, tek ton tam siyah leke.
Her öğe (başlık, yüzde, her etiket, her sayaç) ayrı ayrı kendi lekesini alıyor; kart
üstünde 8–10 ayrı siyah ada oluşuyor, aralarında kapak görünüyor.

Denenip bozuk çıkan: `-webkit-text-stroke` + `paint-order` (Chromium'da sivri köşe,
komşu harfin dolgusunu yiyor).

## Kısıtlar

- Yalnızca `--tk-*` belirteçleri; renk/ölçü uydurulmaz. `--tk-bg-from` = siyah,
  `--tk-scrim` = yarı saydam koyu, `--tk-sp-1..5` = 4/8/12/16/24 px, `--tk-r` yarıçap.
- Chromium (Electron, Android WebView) ve Safari (PWA) çalışmalı.
- Liste görünümünde ve kapaksız kartta hiçbir şey değişmemeli.

## Sorular

1. Beş sözü birlikte okuyunca sahibi tam olarak ne görmek istiyor? Harf şeklini izleyen
   leke mi, yoksa başka bir şey mi (örneğin kartın alt/üst kısmını kaplayan tek parça
   düz siyah bölge, ya da yazı bloğunun tamamını saran tek yuvarlak siyah zemin)?
   "Bu kadar zor olmamalı, basit bir iş" sözü hangi yoruma işaret ediyor?
2. 0.7.19'daki süzgeçli çözüm bu isteği karşılıyor mu? Karşılamıyorsa en olası kusuru ne?
3. Tek öneri ver: hangi CSS, hangi öğeye. Kısa ve uygulanabilir olsun.
4. Sahibine sorulacak tek bir netleştirme sorusu gerekiyorsa onu yaz; gerekmiyorsa yazma.
