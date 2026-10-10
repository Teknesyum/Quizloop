# 0030 — Engel Listesi, İletişim Düğmesi Ve İz Denetimi

Tarih: 2026-10-10. Karar 0029'u (katalog ve kanal) tamamlar.

## Neden

Katalog düzeninde içerik bizim sunucumuzda durmaz, ama uygulama bizimdir. Üç eksik vardı:
şikâyet edenin bize ulaşacağı açık bir yol, şikâyet haklı çıkınca elimizde bir araç, ve
ürettiğimiz paketlerin içinde bize işaret eden bir kalıntı kalmadığının güvencesi.

## Karar

1. **İletişim.** Ayarlar, Hakkında bölümüne ve Kataloglar ekranının altına "Bize Ulaş"
   düğmesi kondu. `CONTACT_URL` adresini (`github.com/Teknesyum/Quizloop/issues/new`)
   tarayıcıda açar. README'ye "Contact" başlığı eklendi. Uygulama içi form yok: GitHub
   hesabı olmayan biri yazamaz, bu bilinen bir sınırdır.
2. **Engel listesi.** `src/shared/blocked.ts` içindeki `BLOCKED` dizisi uygulamaya gömülür
   ve boş çıkar. Kullanıcının gördüğü bir ekran ya da ayar yoktur. Üç tür satır alır:
   alan adı (alt alan adlarıyla birlikte), `https://` ile başlayan adres ön eki, paketin
   SHA-256 özeti. Engelli katalog `blocked` hatasıyla açılmaz; engelli paket ya da özet
   taşıyan kanal listede hiç görünmez ve güncellenmez. Kurulu modüle dokunulmaz.
   Listeye satır eklemek yeni sürüm demektir; uzaktan çekilen liste bilerek yok, çünkü
   o zaman her açılışta bizim sunucumuza istek giderdi.
3. **İz denetimi.** `tools/quizforge/src/iz.ts` içindeki `izsizZip` bütün paket
   yazıcılarının (`paket`, `hafizlik`, `antimikrobiyal`, `ingilizce`, `arapca`) tek çıkış
   kapısıdır. Paketin her dosyasında ve dosya adında şunları arar: `teknesyum`,
   `quizforge`, git kullanıcı adı ve e-postası, makine adı, ev klasörü yolu,
   `QUIZFORGE_IZ` ortam değişkeni ve `tools/quizforge/iz.yerel.txt` satırları. Bulursa
   paketi yazmaz. Zip içindeki dosya saatleri sabit bir tarihe çekilir. Hazır paket
   `npx tsx src/iz.ts <paket | klasör>` ile sonradan da taranır.
   Tek muafiyet: tıp metinlerinde geçen "Teknesyum-99" (element adı).

## Sınırlar

- Denetim sıkıştırılmış PDF akışlarının içini okumaz; PDF'in üstverisi düz yazıysa yakalar.
- Paket biçimi (`.qlmod`), dosya adındaki `quizloop-` ön eki ve açık depodaki
  `sources/lange-anestezi-7/rules.yaml` bizi yine gösterir. Denetim paketin içine bakar,
  paketin nereden çıktığını gizlemez.

## Açık Kalanlar

Karar 0029'dan devreden, henüz yapılmayan iki iş:

1. `quizforge`'a katalog yayınlama komutu (boyut ve özet hesaplayıp katalog dosyasını yazar).
2. Android: Play'in "Kullanıcı Tarafından Oluşturulan İçerik" politikası okunup uygunsa
   `capabilities.catalogs` açılır.
