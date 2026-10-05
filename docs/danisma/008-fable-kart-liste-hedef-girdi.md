# Danışma 008 girdi: Kart Ve Liste Görünümü, İkinci Tur

Ajana giden metin:

---

[[danisma:008]]

# Kart Ve Liste Görünümü, İkinci Tur

QuizLoop: aralıklı tekrar soru uygulaması (Electron + React, telefon ve tarayıcı sürümü de var).
Koyu tema, düz siyah zemin, yalnızca `--tk-*` tasarım değişkenleri (boşluk adımları 4/8/12/16/24 px,
yazı boyutu fs-1..fs-5, renk-1 pembe vurgu, renk-3 mor, text-label gri). Yeni renk ya da ölçü uydurulamaz.

## Bugünkü Kart (0.7.30, 007 Danışmasının Sonucu)

```
Başlık (tek satır, sığmazsa …)
[kapak 96x144]  Sürüm 1.2 · Anestezi · Tıp
                0                      <- 32 px rakam
                Bugün Sırada
                3761 Yeni · 0 Öğreniliyor
                3800 Soru      %1 Emekli
                ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (4 px çubuk, yalnızca sağ sütunda)
[…]                     [Karışık] [Oturuma başla]
```

Liste görünümü bugün: tek satır; başlık solda, yüzde, sağda "Oturuma başla". Kapak, sayılar ve çubuk gizli.

## Sahibinin Bu Turdaki Sözleri (Aynen)

- "insanlar emekli ne demek diyor bunu da açıkla insanlara"
- "mini resimler güzel çıkmamış nedeni çöz"
- "liste butonuna basınca olan kısmı da düzgünce tasarla baştan fable a da danış"
- "0 bugün sırada kısmı çok fazla yer kaplamış ne demek olduğunu da anlamıyorum bugünkü yaptıklarımız mı onu da tek satır yapmaya çalış"
- "progress bar ı da resmin solundan başlat"
- "... ile karışık arasına Hedef diye bir buton koyalım günlük hedefi belirlesin kullanıcı 1yıl 1 hafta 1 ay 3 ay 3 hafta 3 yıl gibi seçenekler seçsin buna göre her gün ne kadar çalışması gerektiği hedef olarak konsun 40/150 gibi hedefi de gösterelim varsa"
- "aslında kartlara tıklayınca detaylarını gösteren smooth bir animasyon düşünmüştüm ama böylesi daha iyi sanırım sen de fikir belirtebilirsin"
- "3761 Yeni biraz kötü bi çeviri olmuş gibi 0 Öğreniliyor da öyle bunları da düzelt komple"

## Ölçtüğüm Olgular

- Kapak dosyaları 760x731 px (neredeyse kare): kitap sayfasının üst %62'si. Eski tasarımda kartın arka planıydı.
  Şimdi 2:3 dik çerçevede `object-fit: cover` ile ortadan dar bir şerit kalıyor; bölüm resimlerinde yazı kesiliyor.
- Soru durumları: hiç görülmemiş (state New), öğrenme aşamasında (görüldü, tekrarı ileri bir güne planlı),
  bugün tekrarı gelmiş (due <= şimdi), emekli (kullanıcı "anladım" dedi, bir daha sorulmaz).
  İlerleme yüzdesi = emekli / toplam.
- Bir modülde 3800 soru olabiliyor; bölüm kartlarında etiket yok, yalnızca başlat düğmesi var.
- Telefon genişliği 360 px; kart ızgarası en az 320 px sütun.

## Benim Taslağım

Kart:
```
Başlık (tek satır)
[kapak 96x96 kare]  Sürüm 1.2 · Anestezi · Tıp
                    Bugün tekrar edilecek: 12
                    Hiç sorulmamış: 3761 · Öğrenme aşamasında: 27
                    Hedef: bugün 40/150            (yalnızca hedef varsa)
3800 soru                                  %1 emekli
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (kartın tam eni)
[…] [Hedef]                     [Karışık] [Oturuma başla]
```

Hedef: süre seçilir (1 hafta, 3 hafta, 1 ay, 3 ay, 1 yıl, 3 yıl). Günlük hedef =
tavan((kalan emekli olmamış soru + bugün emekli olan) / kalan gün). Gösterim "bugün emekli olan / günlük hedef".
"Emekli" açıklaması: yüzdenin üstünde ipucu (title) ve "Nasıl kullanılır?" metninde bir cümle.

Liste satırı:
```
[kapak 40x40] Başlık (tek satır)                 12 tekrar · 40/150   %1  [Oturuma başla]
              ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (ince çubuk başlığın altında)
```

Karta tıklayınca açılan detay: yapmamayı düşünüyorum, çünkü kartta gizli bilgi kalmıyor.

## Sorularım

1. Kart taslağında neyi değiştirirdin? Kare kapak doğru mu, boyutu ne olmalı?
2. Üç bilgi satırının Türkçe ve İngilizce en anlaşılır, en kısa yazımı ne olmalı? ("Bugün Sırada", "Yeni",
   "Öğreniliyor", "Emekli" anlaşılmadı.) "Emekli" sözcüğü uygulamanın başka yerlerinde de geçiyor, kalacak.
3. Liste satırını baştan tasarla: hangi bilgiler, hangi sırada, telefonda (360 px) nasıl kırılır?
4. Hedef: formülüm doğru mu, daha anlaşılır bir tanım var mı? Süre seçimi küçük bir açılır menü mü, pencere mi?
   Hedef düğmesinin üstünde seçili süre yazsın mı?
5. Karta tıklayınca açılan detay animasyonu: yapalım mı, yapmayalım mı, neden?

Kısa ve somut yaz; ölçü verirken yalnızca yukarıdaki boşluk adımlarını ve fs-1..fs-5'i kullan.
