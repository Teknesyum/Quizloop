# Danışma 002 girdi: Soru: Android paket adı büyük harfli mi olsun?

Ajana giden metin:

---

[[danisma:002]]

# Soru: Android paket adı büyük harfli mi olsun?

Sahip, Play Console'da yeni uygulama oluştururken paket adını `com.teknesyum.QuizLoop` (büyük harfli) yapmak istiyor. Gerekçesi: marka imzası, "biri teknik dosyalara bakarsa bu bizim desin", geleneği bozup kendi geleneğimiz olsun.

Olgular:
- Şu anki applicationId / Capacitor appId: `com.teknesyum.quizloop` (küçük harf). Java paket klasörü `android/app/src/main/java/com/teknesyum/quizloop/` (MainActivity.java, PaketPlugin.java).
- v0.7.0 GitHub'da yayımlandı; imzalı APK (upload anahtarıyla) Obtainium kullanıcılarına açık. Kaç kişinin kurduğu bilinmiyor, büyük ihtimalle yalnızca sahip ve birkaç kişi.
- Play'de henüz uygulama oluşturulmadı ya da büyük ihtimalle oluşmadı; AAB hiç yüklenmedi. Play'de paket adı oluşturulduktan sonra değiştirilemez.
- Görünen ad zaten "QuizLoop" (Play listesi, ikon altı). Paket adı kullanıcıya görünmez, yalnızca Play URL'sinde (play.google.com/store/apps/details?id=...) ve geliştirici araçlarında görünür.
- Android applicationId büyük harfi teknik olarak kabul ediyor (harf, rakam, alt çizgi; segment harfle başlamalı). Java paket adı geleneği küçük harf; Android lint/Studio uyarı verebilir.
- Windows (büyük-küçük harf duyarsız) geliştirme makinesi; CI Linux (duyarlı).
- Diğer Teknesyum programları da benzer iki parçalı adlar kullanıyor (DustyBytes vb.); onların paket adı kuralı bu kararla belirlenecek.
- Değiştirmek gerekirse: build.gradle applicationId + namespace, capacitor.config appId, Java klasör/paket bildirimi, workflow packageName, belge/gizlilik metinleri; yeni sürüm (0.7.1) etiketlenip CI'da yeniden derlenmeli. GitHub APK kullanıcıları için yeni paket adı = ayrı uygulama (eski kaldırılmalı, ilerleme aktarım paketiyle taşınmalı).

Soru: Büyük harfli paket adının (a) yalnızca applicationId'de, Java paketi küçük kalarak, (b) her yerde büyük harf, (c) küçük harfte kalmak seçenekleri arasında hangisini önerirsin? Gerçek teknik riskleri (Play, araçlar, büyük-küçük harf duyarsız dosya sistemleri, deep link/intent, gelecekteki uygulamalar) ve markaya katkısını tart. Kısa, net tavsiye ver; sahip kararı alacak.
