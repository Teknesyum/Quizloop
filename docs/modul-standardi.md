# Modül Standardı

**Sürüm: 1.0.0** — 2026-10-18

Bir QuizLoop modülünün uyması gereken kurallar. Modül üreten oturuma "modülü standarda göre
güncelle" demek yeter: o oturum bu dosyayı okur, kuralları uygular, `module.json` içindeki
`standart` alanına bu sürümü yazar ve paketi yeniden kurar.

Alanların biçimi tek yerde tanımlıdır: `src/shared/schema/*.ts` (zod). `schema/*.json` ondan
üretilir. Bu belge biçimi tekrarlamaz; neyin, nereden, nasıl doldurulacağını söyler.

## Sürümleme

- Standart üç parçalı sürüm taşır: `büyük.küçük.yama`.
- **Büyük:** eski modül bu sürümle açılmaz ya da uygulamanın yeni bir sürümü gerekir.
- **Küçük:** modüllerin benimsemesi gereken yeni kural; eski modül çalışmaya devam eder.
- **Yama:** yalnızca anlatım düzeltmesi; modüle dokunmak gerekmez.
- Her değişiklik en alttaki Sürüm Geçmişi'ne bir satırla girer. Kuralı değiştiren
  `docs/kararlar/` altına karar da yazar.
- Modül, uyduğu sürümü `module.json` içinde `standart` alanıyla söyler. Alanı olmayan modül
  "standart öncesi" sayılır.

## Güncelleme Yordamı

Modül oturumu "standarda göre güncelle" aldığında:

1. Modülün `standart` alanını okur; boşsa 0.0.0 sayar.
2. Sürüm Geçmişi'nde o sürümden sonraki her satırın kuralını uygular.
3. Paketi kurar, şemadan geçirir, uygulamada bir oturum açıp dener.
4. Raporda önceki ve sonraki paket boyutunu, eklenen anlatım sayısını, silinen dosya
   sayısını yazar.
5. `standart` alanını bu belgenin sürümüne çeker; modülün kendi `version` alanını da artırır.

## 1. Paket Yapısı

- `module.json`, `blocks/NNNN.json` (her biri `sha256` ile), `assets/`, kitaplı modülde
  `kaynak/bolum/NN.pdf`.
- `assets/img/` soru görselleri, `assets/tbl/` tablo görselleri, `assets/kaynak/` kaynak
  kesitleri, `assets/bolum/N.webp` bölüm kapakları, `assets/kapak.webp` modül kapağı.
- **Sahipsiz dosya yok.** `assets/` altındaki her dosyaya bir soru, bir bölüm kartı ya da
  modül kartı başvurur. Başvurulmayan dosya pakete girmez.
- `assets/kaynak/` altındaki kesit yalnızca bir sorunun `source.kesit.ref` alanı ona
  bakıyorsa pakete girer.

## 2. Kaynak ve İz

- Her soru `source` taşır: dosya, sayfa aralığı, birebir alıntı. İddia kaynağa geri
  izlenebilir olmalı.
- Gerçek kitabın adı, yazarı, yayınevi, dosya adı ya da özeti depoya, belgelere, testlere,
  istemlere ve commit mesajlarına girmez (0032). Örneklerde `Example Book`, `example.pdf`.
- Gerçek kitaptan üretilen modül açık kanala, siteye ya da kataloğa konmaz.

## 3. Anlatım (Anlat Düğmesi)

Soruda Anlat düğmesine basılınca `anlatim` alanı gösterilir. Bu, **kavramın** kısa konu
anlatımıdır; sorunun çözümü (`solution`) ayrı kalır ve onu tekrar etmez.

**Ne anlatılır**

- Kavram başına bir anlatım yazılır. Aynı `conceptId`'ye sahip her soru aynı bloklarla
  doldurulur.
- Öğrencinin bu kavramla ilgili herhangi bir soruyu çözebilmesi için gereken çekirdek
  bilgi: tanım, kural, ayırt edici nokta, sık karıştırılan şey.
- İlk blok `text` olur ve kavramın özünü tek paragrafta söyler. Ardından gerektiği kadar
  blok gelir; uzun ders metni yazılmaz.
- Sorunun doğru cevabını ele veren cümle yazılmaz; anlatım soru çözülmeden de açılabilir.

**Nereden alınır**

- Kitaplı modülde anlatım kavramın kitaptaki sayfalarından çıkarılır ve en az bir `sayfa`
  bloğu taşır: `pdfSayfa`, birebir `alinti`, gerekiyorsa `isaretler`. Böylece öğrenci
  kaynağa bir dokunuşla gider.
- Kitapsız modülde (dil modülleri gibi) anlatım üretim kurallarından yazılır; kural
  dosyasındaki kaynak neyse o geçerlidir.
- Dil modüllerindeki "ders anlatımı yok" kuralı ayrı bir ders ekranı olmadığını söyler;
  soru içindeki kavram anlatımını yasaklamaz. Bu modüller de anlatım taşır.

**Hangi blok, ne zaman**

| Blok    | Ne için                                           |
| ------- | ------------------------------------------------- |
| `text`  | Kavramın özü, kural, açıklama                     |
| `hint`  | Akılda tutma ipucu, sık yapılan hata              |
| `table` | Karşılaştırma, sınıflama, doz ya da ölçüt listesi |
| `image` | Kitaptaki şekil kavramı gerçekten açıklıyorsa     |
| `sayfa` | Kitaptaki yerine götüren sayfa, alıntı ve işaret  |

## 4. Görseller ve Boyut

- Soru görselleri WebP olur. Kalite değeri üretim tarafında ölçülerek seçilir ve rapora
  yazılır; çizim ve yazı okunaklı kalmalı.
- **Kitaptan alınan her görsel bölgesini kaydeder:** görseli taşıyan alana (`stem`, şık,
  `image` bloğu) `bolge: { pdfSayfa, bbox }` eklenir. `pdfSayfa` kitabın tamamındaki sayfa
  numarasıdır (`source.kesit` ile aynı); `bbox` o sayfada PDF noktası cinsinden
  `[x0, y0, x1, y1]`.
- Görselin kendisi şimdilik pakette kalır. Uygulama görseli PDF'ten çizmeye başlayınca
  standart 1.1.0 olur ve bölgesi kayıtlı görseller paketten çıkar (aşağıda).
- Kutular (`masks`, şık `box`) görsele göre 0–1 oranıyla yazılır; görsel bölgeden çizilince
  de aynı kalır.

## Sürüm Geçmişi

| Sürüm | Tarih      | Değişiklik                                                                                                                                                                                                             |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-10-18 | İlk numaralı sürüm. Paket yapısı ve iz kuralları yazıya geçti. Kavram başına `anlatim` zorunlu. Görseller WebP. Sahipsiz dosya pakete girmez. Kitaptan alınan görsel `bolge` kaydeder. Modül `standart` alanını taşır. |

**Sıradaki (yürürlükte değil): 1.1.0 — Görsel PDF'ten Çizilir.** Kitabı pakette gömülü olan
modülde `bolge` kaydı olan görseller paketten çıkar; uygulama o bölgeyi gömülü PDF'ten
çizer. Kitabı gömülü olmayan modülde görsel pakette kalır. Uygulama desteği yayımlanınca bu
satır tabloya girer ve gereken en düşük uygulama sürümü yazılır.
