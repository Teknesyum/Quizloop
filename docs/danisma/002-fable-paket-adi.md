# Danışma 002: Soru: Android paket adı büyük harfli mi olsun?

claude-fable-5-1, 3.772 çıktı token, 68 sn. Girdi: [002-fable-paket-adi-girdi.md](002-fable-paket-adi-girdi.md). Cevap olduğu gibi:

---

## Tavsiye: (a) — applicationId `com.teknesyum.QuizLoop`, Java paketi `com.teknesyum.quizloop` kalsın

Bu, "marka imzası" isteğini sıfır çalışma riskiyle karşılayan tek seçenek. Emsali de güçlü: Slack'in Play paket adı `com.Slack`'tir, kaynak paketleri ise küçük harf `com.slack.*`. Aynı desen UC Browser'da da (`com.UCMobile.intl`) var; Play ve araç zinciri yıllardır bunu sorunsuz taşıyor.

### Gerçek teknik riskler

- **Play:** Paket adı büyük-küçük harfe duyarlı ve sonradan değişmez; `QuizLoop` kabul edilir, Play URL'si de `id=com.teknesyum.QuizLoop` olur. Tek şart: her yerde aynı yazım. CI'daki Play yükleme adımının `packageName` alanı birebir eşleşmeli, yoksa yükleme reddedilir.
- **Android Studio / lint:** "Package name should be lowercase" uyarısı yalnızca Java `package` bildirimine bakar; applicationId'ye bakmaz. (a)'da uyarı çıkmaz, (b)'de çıkar.
- **Büyük-küçük harf duyarsız dosya sistemi:** Asıl tuzak burada ve yalnızca (b)'de. Windows'ta `quizloop/` klasörünü `QuizLoop/` yapınca git değişikliği görmez, Linux CI sınıfı bulamaz ve derleme çöker; ancak `git mv` ile iki aşamalı (önce geçici ada) yeniden adlandırma kurtarır. (a) klasöre dokunmadığı için bu risk yok.
- **Deep link / intent / FileProvider:** `${applicationId}.fileprovider` gibi authority'ler ve explicit intent'ler applicationId'den türer, tutarlı kaldığı sürece sorun yok. Deep link'ler host/scheme'e bağlı, paket adıyla ilgisi yok.
- **Capacitor:** `appId` yalnızca `cap add` sırasında Java paketini üretir; sonrasında `build.gradle` içindeki `applicationId` ve `namespace` belirleyici. `applicationId = "com.teknesyum.QuizLoop"`, `namespace = "com.teknesyum.quizloop"` ayrı tutulabilir; `cap sync` bunları ezmez. `capacitor.config` appId'yi de büyük harfe çekin ki belgeyle gradle çelişmesin.
- **Gelecekteki uygulamalar:** Kural şöyle yazılabilir: "applicationId `com.teknesyum.<ÜrünAdı>` (CamelCase), kaynak paketleri küçük harf." DustyBytes vb. için aynı deseni uygulamak sorunsuz.

### Markaya katkısı

Küçük ama gerçek: Play bağlantısı paylaşıldığında, Obtainium'da, APK analiz araçlarında ve hata raporlarında `com.teknesyum.QuizLoop` görünür. Kullanıcıya görünen ad zaten "QuizLoop" olduğu için ek bir kazanım değil, tutarlılık kazanımı.

### Zamanlama

Karar şimdi verilmeli; Play'de uygulama oluşturulduktan sonra kapı kapanır. 0.7.0 APK kullanıcısı birkaç kişiyken paket adı değişimi (eski uygulamayı kaldır, aktarım paketiyle taşı) ucuz; Play'e çıktıktan sonra imkânsız. Dolayısıyla istiyorsanız 0.7.1 ile hemen.

### Seçeneklerin özeti

- **(a)** Önerilen. Marka imzası + Java geleneği korunur + klasör yeniden adlandırma tuzağı yok. Maliyet: gradle applicationId, capacitor.config appId, workflow packageName, belge/gizlilik metinleri, 0.7.1 etiketi.
- **(b)** Önermem. (a)'nın tüm faydası, artı lint uyarısı, Windows/Linux klasör tuzağı ve Java paketi değişimi. Kazanç yok.
- **(c)** Marka imzasını istemiyorsanız sıfır maliyetli varsayılan. Teknik olarak hiçbir eksisi yok; yalnızca "bizim imzamız" gerekçesi düşer.

Net cümle: Marka imzasını istiyorsanız (a), istemiyorsanız (c); (b) hiçbir durumda.
