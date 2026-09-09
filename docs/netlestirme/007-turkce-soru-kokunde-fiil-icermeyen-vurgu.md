# Netleştirme: Turkce soru kokunde fiil icermeyen vurgu ifadelerini modele guvenmeden nasil gar

- tarih: 2026-09-09
- girdi: 007-turkce-soru-kokunde-fiil-icermeyen-vurgu-girdi.md
- maliyet: 45.564 token, 12 sn

## Dönen

1. Süzgeç yalnız Sonnet çıktısını eleyecek mi, yoksa elenen ifadenin yerine yeniden üretim isteyecek mi (tur sayısı sınırı ne)?
2. Sıfat-fiil ("cerrahı sorumlu tutan", "-en/-an" ile biten tamlama) kesin yasak mı, tartışmalı mı; kural buna göre kesilecek.
3. Yanlış eleme kabul edilebilir mi: "kalıtsal", "ölçüm", "bakım" gibi isimleşmiş sözcükler elense soru vurgusuz kalabilir mi, yoksa soru başına en az kaç ifade zorunlu?
4. Süzgeç aracı ne olabilir: sadece regex/ek listesi mi, yoksa Zemberek gibi bir Türkçe morfolojik analizci bağımlılığı eklemek kabul mü?
5. Ölçüt ne: pilot bloktaki 150 ifade elle etiketlenip süzgecin doğruluğu ölçülecek mi, yoksa kural tasarımı yeter mi?

## Verilen kararlar

1. Süzgeç ayıklar, yeniden üretim istemez. Tek tur; elenen ifade kaybolur, soru daha az
   vurguyla kalır. Yeniden tur, blok başına maliyeti ikiye katlar.
2. Kesin yasak. Kullanıcının cümlesi: "hiç bir fiil vurgulanmamalı". Sıfat-fiil de fiildir;
   "cerrahı sorumlu tutan" elenir.
3. Kabul edilebilir. Alt sınır soru başına 1 ifade; hiç kalmazsa soru vurgusuz görünür,
   bu bozuk bir durum değil. Yanlış eleme, yanlış vurgudan ucuzdur.
4. Yalnız regex ve ek listesi. Yeni bağımlılık yok — uygulama çevrimdışı çalışıyor ve
   Zemberek Java bağımlılığı getirir.
5. Ölçüldü: pilot bloğun 150 ifadesi süzgeçten geçirildi, 99 geçti, 51 elendi. Elenenler
   gözle denetlendi; "yapay ventilasyon uygulanıyor", "kabul görmeden önceki", "cerrahı
   sorumlu tutan" gibi fiilliler doğru elendi. "uzmanlık alanı" ve "kullandığı madde" ise
   yanlış elendi — ilki `-an`, ikincisi `-dığı` yüzünden. Bu yanlış eleme oranı 3. maddedeki
   karara göre kabul ediliyor.
