# Cloudflare R2 Koşulları İncelemesi

Tarih: 2026-10-10. Yöntem: Cloudflare sayfaları okundu; sayfa özetleri araçla alındı, bu yüzden tırnak içi cümleler tam metin sayılmamalı. Sayfa tarihleri: fiyat sayfası 2026-10-01, hizmet koşulları 2026-09-28.

## 1 Ücretsiz Katman

- Depolama 10 GB-ay (yalnız Standard sınıf; Infrequent Access için geçerli değil).
- Sınıf A işlem: ayda 1 milyon. Sınıf B işlem: ayda 10 milyon.
- Çıkış (egress) ücreti yok, hiçbir depolama sınıfında.
- Aşılırsa: kesinti ya da kısıtlama anlatılmıyor, aşan kısım ücretlendirilir (Standard 0,015 USD/GB-ay, Sınıf A 4,50 USD/milyon).
- Kart zorunluluğu: DOĞRULANAMADI. Resmî sayfalar yalnız "ödeme akışını tamamlayıp R2 aboneliği ekleyin" diyor, kart demiyor. Üçüncü taraf kaynaklar (Kasım 2025 blog, Mart 2026 Reddit) kart ya da PayPal istendiğini söylüyor; resmî değil, kesin sayılmaz.

Kaynak: https://developers.cloudflare.com/r2/pricing/
Kaynak: https://developers.cloudflare.com/r2/get-started/

## 2 Herkese Açık Erişim Yolları

- r2.dev: "hız sınırlı ve yalnız geliştirme amaçlı"; "üretim dışı trafik içindir"; "desteklenmeyen erişim yolu, güvenilirlik ve başarım garanti edilmez".
- r2.dev'de Cloudflare önbelleği, WAF, Access, Bot Management yok. Limitler sayfası: kabaca saniyede yüzlerce istek, aşılınca HTTP 429.
- Özel alan adı: alan adı aynı hesapta bir bölge (zone) olmalı; Cloudflare önbelleği, WAF, Access desteklenir; üretim için önerilen yol. Kovada en çok 100 özel alan adı.
- r2.dev açmak için kova ayarlarında `allow` yazılır.

Kaynak: https://developers.cloudflare.com/r2/buckets/public-buckets/
Kaynak: https://developers.cloudflare.com/r2/platform/limits/

## 3 CORS

- Panel: R2 > kova > Settings > CORS Policy > Add CORS policy > JSON sekmesi > Save. Panel biçimi: düz dizi, alanlar `AllowedOrigins`, `AllowedMethods`.
- Wrangler: `npx wrangler r2 bucket cors set <KOVA> --file cors.json`; biçim `{"rules":[{"allowed":{"origins":[...],"methods":["GET"]}}]}`. Kontrol: `cors list`.
- Kaynak (origin) `*` ya da şema+sunucu+isteğe bağlı port olmalı, yol olamaz.
- Yayılma nadiren 30 sn'ye kadar sürebilir. Özel alan adı CORS başlıklarını döndürür; politika değişirse o ana makinenin önbelleği temizlenmeli.
- r2.dev'de CORS çalışır mı: DOĞRULANAMADI. CORS sayfası r2.dev'den söz etmiyor. Üretim için zaten özel alan adı gerekiyor; r2.dev ile gerçek bir fetch denemesi yapılmalı.

Kaynak: https://developers.cloudflare.com/r2/buckets/cors/

## 4 Boyut Sınırları

- Nesne başına en çok 5 TiB (dipnot 4,995 TiB; aynı sayfada çok parçalı için "4,995 GiB" yazan tutarsız bir dipnot var).
- Tek parça yükleme 5 GiB; çok parçalı yüklemede en çok 10.000 parça. 700 MB tek parçaya sığar, yine de çok parçalı önerilir.
- Wrangler ile tek nesne yükleme 315 MB'a kadar; büyük dosya için rclone ya da S3 uyumlu araç öneriliyor.
- Panelden yükleme boyut sınırı: DOĞRULANAMADI (resmî sayfada yok). Üçüncü taraf kaynaklar tek istekte 300 MB ve bir seferde 100 dosya diyor; resmî değil.
- Aynı anahtara saniyede en çok 1 yazma (aşılırsa 429).

Kaynak: https://developers.cloudflare.com/r2/platform/limits/
Kaynak: https://developers.cloudflare.com/r2/objects/upload-objects/

## 5 İçerik Koşulları ve Telif

- Geliştirici Platformu koşullarında R2 için ayrı bölüm yok; R2 bu koşullar altında. Metin: Geliştirici Platformu "içerik barındırmak için kullanılabilir". Video ya da HTML dışı içerik kısıtı bu koşullarda yok.
- Eski "HTML dışı içerik" maddesinin karşılığı CDN bölümünde: ücretsiz/Pro/Business planlarda video ve diğer büyük dosyaları CDN üzerinden sunmak için belirli ücretli hizmetler (Developer Platform, Images, Stream örnek verilmiş) gerekir. Bu cümlede Developer Platform (R2 dahil) bir uyum yolu olarak sayılıyor, yani R2 ile sunmak bu maddeyi karşılar görünüyor. Kesin yorum için hukukî teyit: DOĞRULANAMADI.
- Cloudflare ağı yükü olursa depolama ve istek sayısını geçici sınırlayabilir (bölüm 1).
- Telif: barındırılan içerik için "kaldırır ya da erişimi kapatır"; DMCA bildirim-kaldırma süreci izlenir; site sahibine bildirim yapılır; geçerli karşı bildirim ve dava açılmazsa içerik geri açılır. Not: kaynak sayfa R2'yi adıyla anmıyor (Stream, Pages, Workers vb. sayıyor); R2 için aynı yaklaşımın geçerli olduğu çıkarımdır, doğrulanamadı.
- Abonelik bitince müşteri içeriğine en çok 30 gün erişim sağlanabilir, saklama yükümlülüğü yok.

Kaynak: https://www.cloudflare.com/service-specific-terms-developer-platform/
Kaynak: https://www.cloudflare.com/service-specific-terms-application-services/
Kaynak: https://www.cloudflare.com/trust-hub/abuse-approach/

## 6 Adres Kalıcılığı ve Önbellek

- Özel alan adı Cloudflare önbelleğini kullanır; Smart Tiered Cache önerilir. Varsayılan olarak yalnız belirli uzantılar (dosya uzantısına göre, MIME'a göre değil) önbelleğe alınır; HTML ve JSON varsayılan olarak alınmaz. `.qlmod` uzantısı listede olmayabilir: bir Cache Rule gerekebilir (liste doğrulanamadı).
- Varsayılan Edge TTL (başlık yoksa): 200/206/301 için 120 dk; 302/303 için 20 dk; 404/410 için 3 dk.
- Aynı adla üzerine yazılınca eski sürümün ne kadar sunulabileceği: DOĞRULANAMADI (resmî sayfa söylemiyor). Çıkarım: önbellekte kalan nesne TTL boyunca (varsayılan 2 saat) ya da temizleme (purge) yapılana dek eski kalabilir. r2.dev'de önbellek yok.
- Pratik öneri: sürümlü dosya adı (ör. `modul-1.2.3.qlmod`) ve katalog JSON'una kısa Cache-Control; adresin kalıcılığı için resmî bir söz bulunamadı.

Kaynak: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/
Kaynak: https://developers.cloudflare.com/r2/buckets/public-buckets/
