# Raf — Sonraya Bırakılanlar

Sahibin "rafta dursun" dediği işler. Burada duran iş yapılmaz, unutulmaz. Raf boş değilken
her yanıtın sonunda bu dosyanın bağlantısı basılır. İş başlayınca satırı buradan silinir.

## 1. Kanal (Abonelik) Sistemi

Rafa konuş: 2026-10-08. Sahibin sözü: "dosyayı içeri aktar değil de falana abone ol, o her
güncellendiğinde güncellensin" ve "kanalları biz sunmayacağız, kanal içeriğinden mesul
olmamalıyız".

**Düzen: Uygulama Yalnız Okuyucu.** CloudStream'in depo düzeni gibi: uygulama boş gelir,
kullanıcı bir adres yapıştırır, içerik yayıncısınındır.

- Kanal, kullanıcının yapıştırdığı `https` adresidir. Orada yayıncının `kanal.json` dosyası
  (modül kimliği, ad, sürüm, paket adresi, boyut, sha256) ve `.qlmod` paketi durur.
- Uygulama açılışta ve günde bir kez kanalı yoklar; sürüm yeniyse indirir, özeti doğrular,
  sormadan kurar (0017). Özet tutmazsa eski sürüm yerinde kalır. Eski sürüme dönüş sorulur.
- Biz hiçbir şey barındırmayız: sunucu, katalog, arama, öneri yok. Kimin neye abone olduğunu
  bilmeyiz.

**Sorumluluğu Azaltan Kurallar**

1. Hiçbir üçüncü taraf kanalı uygulamaya gömülmez, sitede ve README'de önerilmez.
2. Abone olurken uyarı: içerik QuizLoop'a ait değildir. Kanal adresi kartta hep görünür.
3. Kanal yalnız veri taşır, kod taşımaz (Play'in mağaza dışı kod yasağı).
4. Sitede şikâyet için iletişim satırı.
5. Kanal üretme komutu `quizforge`'da durur, uygulamanın içinde değil.

**Açık Riskler**

- Bu düzen riski azaltır, sıfırlamaz. CloudStream telif şikâyetleriyle kaldırıldı.
- Kendi adımızla yayınlanan kanaldan biz sorumluyuz; Lange ve hafızlık açık kanala konmaz.
- Play'e göndermeden önce "Kullanıcı Tarafından Oluşturulan İçerik" politikası okunur.

**Aşamalar**

1. Kanal dosyası şeması, "yalnız veri" kuralı, karar kaydı.
2. Çekirdek: abonelik listesi, yoklama, indirme, doğrulama.
3. Arayüz: adres yapıştırma, uyarı penceresi, kart etiketi, aboneliği bırakma.
4. `quizforge`'a kanal yayınlama komutu.
5. Play politika kontrolü ve mağaza açıklaması.
