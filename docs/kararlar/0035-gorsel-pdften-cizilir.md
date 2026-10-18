# 0035 — Görsel Gömülü PDF'ten Çizilir, Eski Modül Eski Usulle Gösterilir

Tarih: 2026-10-18. 0034'ü genişletir; standart 1.1.0.

## Sahibin Sözü

"Uygulamamız eski usul davranan modülleri de eski usulle gösterebilsin, iskeletin
esnekliğini kullanarak aşalım sorunu. Eğer modül yeniyse yeni metodla davranacak; modül
kullandığı standartları yazmak zorunda olacak."

## Karar

- Uygulama modülün verisine bakar, sürüm tablosuna değil: görsel dosyası olan alan
  dosyadan, dosyası olmayıp `bolge` taşıyan alan gömülü PDF'ten çizilir. Soru, şık ve
  çözüm/anlatım `image` bloğu aynı kuralla çalışır.
- `image` bloğunda `ref` artık isteğe bağlı; kurulum `ref` ya da `bolge`'den birini ister.
- Kurulum denetimi (`src/core/modules/loader.ts`):
  - Modülün `standart`'ı uygulamanın `STANDART`'ından (`src/shared/standart.ts`) yeniyse
    kurulum "uygulamayı güncelle" der.
  - PDF'ten çizilen görseli olan modül en az 1.1.0 yazmalı ve kitabı `source.bolumler` ile
    pakette taşımalı.
- Çizim (`src/renderer/src/components/region.ts`): bölge sayfası pdf.js ile yalnızca o
  dikdörtgen kadar bir tuvale çizilir, genişlik ~1400 piksele ölçeklenir (en çok 4 kat),
  WebP'ye çevrilip bellekte tutulur (son 48 görsel, en çok 2 açık kitap dosyası).
- Kitap henüz yüklenmemişse iskelet, kitap yoksa ya da açılmazsa "kitap bağlı değil"
  ipucu gösterilir.

## Doğrulama

Sentetik bir modülle (örnek modülden türetilmiş, gerçek içerik yok) web kabuğunda denendi:
soru, şık ve çözüm görseli PDF bölgesinden çizildi (1280×960, 840×440 piksel); örnek
modüller görsel dosyasıyla açılmaya devam etti. Kurulum kuralları
`src/core/modules/loader.test.ts` içinde sekiz testle bağlı.

## Sonuç

En düşük uygulama sürümü 0.7.69. Modül oturumu "standarda göre güncelle" aldığında
bölgesi kayıtlı görselleri paketten çıkarır; kitabı gömülü olmayan modülde görsel kalır.
