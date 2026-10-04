# Danışma 007 girdi: Kütüphane Kartını Baştan Tasarlama — Olgular

Ajana giden metin:

---

[[danisma:007]]

# Kütüphane Kartını Baştan Tasarlama — Olgular

## Sahibinin Sözü (2026-10-05, aynen)

"sil siyah hala fazla ayrıca tek satır yazdırmaya çalışıyoruz o yüzdeyi de aşağı mı alsak kartları komple yeniden tasarlar mısın dediğim herşeyi unut çok güzel dizayn istiyorum fable a da danış"

## Kart Ne Taşıyor

Kütüphane kartı (modül): kapak görseli (kitap kapağı, `assets/kapak.webp`, dikey; her modülde yok), ad (uzun olabilir: "QuizLoop Rehberi: Uygulama Nasıl Kullanılır"), emekli yüzdesi, etiketler (Sürüm 1.0.1, Genel Kültür, Örnek…), dört sayaç (Bugün Sırada, Yeni, Öğreniliyor, Emekli), ilerleme çubuğu (emekli/toplam), "45 Soru", üç düğme: "…" menü, "Karışık" (hayalet), "Oturuma başla" (birincil, mavi dolgu).

Bölüm kartı: aynı iskelet; etiket ve menü yok, üç sayaç, tek düğme.

Izgara: `repeat(auto-fill, minmax(320px, 1fr))`, kart yüksekliği içerikten. Ayrıca "Liste" görünümü var (kapak, etiket, sayaç gizli) — ona dokunulmayacak. Telefonda tek sütun.

## Şimdiki Durum Ve Geçmiş

Kapak, kartın tamamının arkasında (`position:absolute; inset:0; object-fit:cover`), üstünde %60 siyah perde. Yazılar görselin üstünde okunmadığı için dokuz sürümde (0.7.18–0.7.29) yazı arkasına siyah zemin denendi: bulanık gölge, harfe sarılan SVG şekil, mavi anahat, kutular. Sahibi hepsini reddetti: "nokta nokta", "üst üste gölge", "yazıya çok yakın", "kocaman bir siyahlık", "siyah hala fazla".

Senin önceki görüşün (006): kapağı üst şerit yap, yazıyı düz siyaha koy. O zaman uygulanmadı.

## Kısıtlar (Değişmez)

- Yalnız koyu tema, zemin tam siyah (`--tk-surface #000`). Renkler: mavi `--tk-renk-1 #4da6ff` (etiket/başlık yazısı, birincil dolgu), mor `--tk-renk-3` (etiket yazısı, ilerleme), beyaz gövde yazısı.
- Yalnız tokenlar: boşluk 4/8/12/16/24 px, köşe 4 px, kenarlık 1 px, yazı 14/16/20/24/32 px, satır yüksekliği 1.25/1.5/1.6. Yeni renk, ölçü, gölge, degrade uydurulamaz (`--tk-scrim` rgba(0,0,0,.6) var).
- Dolgulu düğmede yazı siyah. Spinner yok. Hareket yalnız mevcut hover ölçeği.
- Başlık tek satır olmalı (sahibi istiyor), taşarsa üç nokta + `title`.
- Kapaksız kart da iyi görünmeli (örnek modüllerde kapak yok).
- Erişilebilirlik: yazı kontrastı 7:1.

## Sorular

1. Kart yerleşimi: kapak nerede, ne boyda/oranda; başlık, yüzde, etiket, sayaç, ilerleme, düğmeler hangi sırada ve hizada? Kutu kutu, yukarıdan aşağı tarif et.
2. Yüzde nereye? (Sahibi "aşağı mı alsak" diyor.) İlerleme çubuğuyla nasıl birleşir?
3. Dört sayaç nasıl sunulmalı ki kalabalık durmasın?
4. Kapaksız kartta kapak alanına ne gelir?
5. Bölüm kartı aynı tasarımdan nasıl türetilir?
6. "Çok güzel" için bu kısıtlar içinde en çok fark yaratacak üç karar nedir?
