# Netleştirme: Koyu neon bir arayüzde kaynak alıntısı bloğu nasıl kağıt gibi ve nostaljik yapıl

- tarih: 2026-09-09
- girdi: 006-koyu-neon-bir-arayuzde-kaynak-alintisi-b-girdi.md
- maliyet: 45.262 token, 11 sn

## Dönen

1. Kağıt yüzeyi açık renkli (bej/krem) olabilir mi, yoksa koyu tema dışına çıkmak yasak mı — token dışı renk kuralı bu blok için de mutlak mı?
2. `teknesyum-ui` token setine yeni bir "kağıt" token'ı eklemek seçenek mi, yoksa yalnız mevcut token'larla mı çözülmeli?
3. "Nostaljik" hedefi hangi imge: daktilo/karbon kağıdı mı, eski kitap sayfası mı, sararmış defter kağıdı mı?
4. Blokta yalnız CSS mi, yoksa serif/monospace bir fontu yüklemek (paket boyutu, çevrimdışı) kabul edilebilir mi?
5. Erişilebilirlik sınırı var mı — alıntı metni için minimum kontrast oranı ve `filter`/doku efektlerinin `prefers-reduced-motion` gibi tercihlere uyması bekleniyor mu?

## Verilen kararlar

1. Koyu kalınacak. Token dışı renk yok; kağıt hissi dokuyla ve tipografiyle verilecek.
2. Yeni token eklenmeyecek; vendor sayfaları hiç ellenmiyor. Gereken tonlar mevcut
   token'lardan `color-mix` ile türetilecek.
3. İmge: eski kitap sayfası — ince yatay çizgi dokusu, kenarda dikiş payı, altta künye.
4. Yeni font yüklenmeyecek; blokta zaten paketli mono aile kullanılacak.
5. Kontrast düşürülmeyecek, metin `--tk-text` kalacak; doku statik, hareket yok.
