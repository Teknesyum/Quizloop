# bottleneck

## Depo
SGrondin/bottleneck · https://github.com/SGrondin/bottleneck · MIT · son etiketli sürüm
v2.19.5 (2019-08-03) · 2.003 yıldız · ~1,6 MB, saf JS, çalışma zamanı bağımlılığı yok
(`dependencies: {}`) · push 2024-01-23, ana dalda son commit 2020-07-21, 88 açık issue.

## Ne için bakıldı
`quizforge run` saatlerce LLM çağrısı yapıyor: sağlayıcı 429 verdiğinde iş çökmeden
yavaşlasın, kota başlıklardan okunuyorsa ona uyum sağlasın. Kontrol noktası birimleri
sırayla işlediği için eşzamanlılık pratikte zaten 1.

## Alınacak fikirler
- **Kota sayacı (`reservoir`) gecikmeden ayrı bir kavram olsun.** `minTime` iki iş arası
  bekleme, `reservoir` kalan hak; sıfırlanınca kuyruk durur, iş düşmez. quizforge'da
  "dakikada N istek" ve "token bütçesi" aynı desenle iki ayrı sayaç olur.
- **Sayaç dışarıdan yazılabilsin.** `updateSettings()` / `incrementReservoir()` çalışırken
  değeri değiştiriyor; her yanıtta `x-ratelimit-remaining` okunup sayaca yazılır — tahmin
  yerine ölçüm. Uyarlanabilirlik bu kadar: `Retry-After` için hazır destek yok.
- **Yeniden deneme kararı tek olay işleyicisinde, ms döndürerek verilir.** `failed`
  olayından sayı dönerse iş o kadar sonra tekrar denenir, yoksa kalıcı hata. "Birim
  başarısız → kaç deneme → checkpoint'e `attempts`" akışı tek fonksiyona toplanır.

## Kaçınılacaklar
- **Bağımlılık olarak almak.** Son sürüm 2019, ana dalda son commit 2020, 88 açık issue;
  terk edilmiş sayılır. Tek kişilik masaüstü işi `maxConcurrent: 1` + bekleme, yani
  ~30 satırlık bir sıralayıcı. Clustering ise Redis istiyor; ikinci süreç bile yok.
- **Retry durum tuzağı.** README'nin kendi uyarısı: yeniden denenen iş kuyruğa dönmez,
  `EXECUTING` kalıp eşzamanlılık kotasını işgal eder. Kendi sıralayıcımızda beklerken
  slot bırakılmalı.

## Karar
`desen` — kod alınmaz. Reservoir/minTime ayrımı, sayacın yanıt başlığından güncellenmesi
ve `failed → ms` sözleşmesi quizforge'un LLM istemcisine taşınır; bakımsızlık ve Redis
yüzeyi bağımlılık olmasını engelliyor. MIT, lisans engeli yok.
