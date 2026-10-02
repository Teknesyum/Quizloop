# İçerik Derecelendirme, Hedef Kitle ve Beyanlar — Önerilen Yanıtlar

Play Console, Uygulama içeriği bölümünde elle doldurulur. Uygulama kendi içerik taşımaz;
yalnızca kısa bir örnek modül (aralıklı tekrar üzerine sorular) ve kullanıcının kendi
içeri aldığı modüller vardır.

## IARC derecelendirme anketi

Kategori: **Diğer tüm uygulama türleri** (oyun, sosyal, haber değil). E-posta: geliştirici e-postası.

| Soru | Yanıt | Gerekçe |
|---|---|---|
| Şiddet (gerçekçi/çizgi, kan, silah) | Hayır | Örnek modül ve arayüz şiddet içermez |
| Cinsel içerik, çıplaklık | Hayır | - |
| Küfür, kaba dil | Hayır | - |
| Uyuşturucu, alkol, tütün (gösterim ya da özendirme) | Hayır | - |
| Kumar (gerçek ya da simüle) | Hayır | Puan sistemi yalnız çalışma puanıdır, ödül/para yok |
| Korku | Hayır | - |
| Ayrımcılık, nefret söylemi | Hayır | - |
| Kullanıcılar etkileşebiliyor mu / kullanıcı içeriği paylaşabiliyor mu? | Hayır | Hesap yok, paylaşma yok. Kullanıcının içeri aldığı modül yalnız onun cihazında kalır |
| Kullanıcı konumu başkalarıyla paylaşılıyor mu? | Hayır | Konum izni yok |
| Kişisel bilgi başkalarına açılıyor mu? | Hayır | - |
| Dijital satın alma sunuyor mu? | Hayır | Ücretsiz, satın alma yok |
| Sınırsız internet erişimi/tarayıcı var mı? | Hayır | Yalnız sabit GitHub bağlantıları sistem tarayıcısında açılır; uygulama içinde web tarayıcısı yok |
| Reklam | Hayır | - |

Beklenen sonuç: PEGI 3 / ESRB Everyone / IARC 3+ (ülkeye göre karşılığı).
Sınıf tanımı otomatik çıkar; elle değiştirilmez.

Not: Kullanıcının kendi getirdiği modül içeriği (örneğin tıp ya da hukuk soruları) kullanıcı içeriği
paylaşımı değil, kişisel çalışma verisidir. Anketin "kullanıcı oluşturulmuş içerik" sorusu
paylaşım/yayın arar; burada yoktur.

## Hedef kitle ve içerik

**Öneri: 13 yaş ve üstü** (13-15, 16-17, 18+ yaş grupları seçilir; 5-12 seçilmez).

Gerekçe:
- Uygulama sınav ve ders çalışan öğrenciler ile yetişkinler içindir; yaş aralığı geniş.
- 18+ yalnız yazılsa kapsam gereksiz daralır ve ortaokul-lise öğrencisini dışlar; içerik
  yetişkinlere özgü değildir.
- 13 altı seçilmediği için **Aileler (Designed for Families)** politikası ve çocuklara özel
  yükümlülükler devreye girmez. Uygulama zaten veri toplamıyor, reklam göstermiyor.
- Gizlilik politikasında "13 yaşından küçük çocuklara yönelik değildir" yazılı (`PRIVACY.md`, Children).

Diğer sorular:
- "Çocukların ilgisini çekebilir mi?": Hayır; arayüz sade, koyu, karakter/çizgi film yok.
- "Çocuklara yönelik mi?" (Families sorusu): **Hayır**.

## Diğer beyanlar (Uygulama içeriği)

| Beyan | Yanıt |
|---|---|
| Reklam | Reklam içermiyor |
| Hesap silme | Uygulama hesap oluşturmaya izin vermiyor (hesap yok) |
| Veri güvenliği | `veri-guvenligi.md` |
| Devlet uygulaması | Hayır |
| Finansal özellikler | Hayır (kredi, kripto, ödeme yok) |
| Haber uygulaması | Hayır |
| COVID-19 | Hayır |
| Gizlilik politikası | `PRIVACY.md` bağlantısı |

## Sağlık uygulaması beyanı

**Öneri: "Uygulamamın sağlıkla ilgili özelliği yok" (Health apps = Hiçbiri).**

Gerekçe:
- QuizLoop tıbbi cihaz değildir; teşhis, tedavi, izleme, ölçüm ya da sağlık verisi işlemez.
  Sensör, Health Connect, ilaç, belirti, kalp/uyku verisi yok.
- Bir sınav hazırlık aracıdır. Kullanıcı kendi modülünü tıp dahil herhangi bir konudan
  getirebilir, ancak uygulama o içeriği sağlık tavsiyesi olarak sunmaz, yalnız soru-cevap
  çalıştırır.
- Mağaza metninde sağlık, tedavi, teşhis iddiası yoktur (`liste.md`).
- Play "Tıbbi uygulamalar" açıklaması gerektiren bir özellik yok; "Tıbbi cihaz değildir"
  uyarısı mağaza metnine eklenmesine gerek kalmaz. İstenirse tam açıklamanın sonuna
  "QuizLoop is a study tool, not medical, legal or professional advice." cümlesi
  eklenebilir.

## Hedef sürüm notu

`targetSdk 36` (`android/variables.gradle:4`). Yeni uygulama gereği API 35+ şartı karşılanıyor.
