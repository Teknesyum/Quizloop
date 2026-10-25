# Modül Standardı

**Sürüm: 1.3.0** — 2026-10-24 · En düşük uygulama: 0.8.1

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
- Modül, uyduğu sürümü `module.json` içinde `standart` alanıyla söyler. **Yeni üretilen ya da
  güncellenen her modül bu alanı yazmak zorundadır.** Alanı olmayan modül "standart öncesi"
  sayılır ve eski usulle (görsel dosyasıyla) gösterilir.
- **Uygulama modülü verisine göre davranır.** Görsel dosyası (`imageRef`, `ref`) olan alan
  dosyadan gösterilir; dosyası olmayıp `bolge` taşıyan alan gömülü PDF'ten çizilir. Böylece
  eski modüller değişmeden çalışır, yeni modüller yeni yolla.
- Kurulumda uygulama denetler: modülün `standart`'ı uygulamanın desteklediğinden yeniyse
  kurulum "uygulamayı güncelle" diyerek durur. PDF'ten çizilen görseli olan modül en az
  1.1.0 yazmalı ve kitabı pakette taşımalıdır (`source.bolumler`); yoksa kurulmaz.

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

**Alt dal**

- Bir modül birden çok dal taşıyabilir (ör. Teorik ve Klinik Vaka). Dal, bölüm adının
  önekidir ve `›` ile ayrılır: `source.chapter = "Teorik › 09 Sepsis"`.
- Uygulama iki ya da daha çok dal görünce Bölümler ekranında dal seçicisi gösterir; kartta
  önek görünmez, bölüm kapağı önekten sonraki numarayla bulunur.
- Tek dallı modül önek yazmaz. Aynı bölüm iki dalda varsa her dalda ayrı bölüm adıdır;
  ilerleme ve hedef ayrı tutulur.

## 2. Kaynak ve İz

- Her soru `source` taşır: dosya, sayfa aralığı, birebir alıntı. İddia kaynağa geri
  izlenebilir olmalı.
- Gerçek kitabın adı, yazarı, yayınevi, dosya adı ya da özeti depoya, belgelere, testlere,
  istemlere ve commit mesajlarına girmez (0032). Örneklerde `Example Book`, `example.pdf`.
- Gerçek kitaptan üretilen modül açık kanala, siteye ya da kataloğa konmaz.
- Kitap dışı kaynağa (kılavuz, makale) dayanan soruda `source.file` o kaynağın adıdır.
  Modülün `source.file` değerinden farklıysa uygulama kitap düğmesini ve sayfa satırını
  göstermez, yalnız alıntıyı ve dosya adını gösterir.

## 3. Anlatım (Anlat Düğmesi)

Soruda Anlat düğmesine basılınca `anlatim` alanı gösterilir. Bu, **kavramın** kısa konu
anlatımıdır: soruyu hiç bilmeyen öğrenci okuduktan sonra o kavramın bütün sorularını
çözebilmelidir. Sorunun çözümü (`solution`) ayrı kalır, anlatımı tekrar etmez.

**Temel kurallar**

- Kavram başına bir anlatım yazılır. Aynı `conceptId`'ye sahip her soru aynı bloklarla
  doldurulur.
- Anlatım soru çözülmeden de açılabilir: sorunun doğru cevabını ele veren cümle yazılmaz.
  Kuralı anlatır, bu sorunun şıkkını söylemez.
- Uzun paragraf yok. Her madde (`- `) tek bilgi taşır; kilit sözcük `**…**` ile vurgulanır.
- Kısaltma ilk geçtiği yerde açılır: `**ARDS** (akut solunum sıkıntısı sendromu)`.
- Bölüm kartı ve konu anlatımı da aynı kurala uyar: maddeli, vurgulu, öz.

**Anlatımın sırası**

Bir anlatım şu basamaklarla kurulur. Kavramda karşılığı olmayan basamak atlanır, sıra
bozulmaz.

| Sıra | Basamak      | Blok    | Ne yazılır                                                                |
| ---- | ------------ | ------- | ------------------------------------------------------------------------- |
| 1    | Öz           | `text`  | Kavram bir iki cümlede, sade sözcüklerle: ne olduğu ve neden önemli.      |
| 2    | Nasıl işler  | `text`  | Mekanizma ya da neden-sonuç, 2–4 madde. "Neden böyle?" sorusunu yanıtlar. |
| 3    | Ne yapılır   | `text`  | Kural, adım, karar: tanı ölçütü, tedavi sırası, dil kuralı. Maddeli.      |
| 4    | Sayılar      | `table` | Eşik, doz, ölçüt, sınıflama. Karşılaştırılan iki şey de tabloya girer.    |
| 5    | Karıştırılan | `hint`  | Sık yapılan hata ya da benzer kavramdan ayırt edici nokta, tek cümle.     |
| 6    | Kısa örnek   | `text`  | Klinik modülde iki üç satırlık vaka, dil modülünde örnek cümle.           |
| 7    | Görsel       | `image` | Yalnızca şekil kavramı gerçekten açıklıyorsa.                             |
| 8    | Kaynak       | `sayfa` | Kitaptaki yeri: `pdfSayfa`, birebir `alinti`, gerekiyorsa `isaretler`.    |

- 1. basamak her anlatımda vardır ve ilk bloktur.
- Kitaplı modülde 8. basamak zorunludur; öğrenci kaynağa bir dokunuşla gider.
- Anlatım toplamda bir ekranı geçmez. Geçiyorsa kavram ikiye bölünür, ders metni yazılmaz.
- Anlat ekranı adım adım ilerler: `sayfa` bloğu ve `#` ile başlayan `text` bloğu
  (`### Aşama 2: …`) yeni adım açar. Aşamalı ders yazan modül adımları başlıkla ayırır.

**Örnek (kısaltılmış)**

```text
text  : **Sepsis**, enfeksiyona düzensiz konak yanıtıyla gelişen, hayatı tehdit eden organ
        işlev bozukluğudur. Erken tanı ölümü azaltır.
text  : - Enfeksiyon yaygın **damar genişlemesi** ve kılcal sızıntı yapar.
        - Doku perfüzyonu düşer, **laktat** yükselir.
text  : - Şüphede ilk saatte kültür, **antibiyotik** ve sıvı başlanır.
table : Ölçüt | Eşik  (SOFA artışı ≥2, laktat >2 mmol/L …)
hint  : Sepsis ile **septik şok** karışır: şokta sıvıya rağmen vazopressör gerekir.
sayfa : pdfSayfa 212, alinti "…"
```

**Nereden alınır**

- Kitaplı modülde anlatım kavramın kitaptaki sayfalarından çıkarılır; kitaptan sonra
  değişen öneri güncel kılavuzdan yazılır ve "kitapta eski öneri" notu düşülür.
- Kitapsız modülde (dil modülleri gibi) anlatım üretim kurallarından yazılır; kural
  dosyasındaki kaynak neyse o geçerlidir.
- Dil modüllerindeki "ders anlatımı yok" kuralı ayrı bir ders ekranı olmadığını söyler;
  soru içindeki kavram anlatımını yasaklamaz. Bu modüller de anlatım taşır.

**Denetim**

Anlatım yazıldıktan sonra şu sorulara evet denmelidir:

- Kavramı bilmeyen biri yalnız bunu okuyarak bu kavramın her sorusunu çözebilir mi?
- İlk blok tek başına okununca kavram anlaşılıyor mu?
- Hiçbir cümle belirli bir sorunun şıkkını ele vermiyor mu?
- Her sayı tabloda ya da kaynağıyla mı?

## 4. Görseller ve Boyut

- Soru görselleri WebP olur. Kalite değeri üretim tarafında ölçülerek seçilir ve rapora
  yazılır; çizim ve yazı okunaklı kalmalı.
- **Kitaptan alınan her görsel bölgesini kaydeder:** görseli taşıyan alana (`stem`, şık,
  `image` bloğu) `bolge: { pdfSayfa, bbox }` eklenir. `pdfSayfa` kitabın tamamındaki sayfa
  numarasıdır (`source.kesit` ile aynı); `bbox` o sayfada PDF noktası cinsinden
  `[x0, y0, x1, y1]`.
- **Kitabı pakette gömülü modülde bölgesi kayıtlı görsel paketten çıkar:** alanda yalnızca
  `bolge` kalır, `imageRef` / `ref` silinir, dosya `assets/` altından atılır. Uygulama o
  bölgeyi gömülü PDF'ten çizer.
- Kitabı gömülü olmayan modülde görsel pakette kalır (`imageRef` / `ref`), `bolge` yine de
  yazılabilir.
- PDF'te karşılığı olmayan görsel (üretimde çizilen şema, başka kaynaktan şekil) pakette
  kalır.
- Görsel dosyadan çizilirken de, bölgeden çizilirken de `image` bloğu en az birini taşır:
  `ref` ya da `bolge`.
- Bölgenin doğru çizildiği uygulamada denetlenir: sınır kesilmiş, yanlış sayfa ya da boş
  alan çıkıyorsa `bbox` düzeltilir.
- Kutular (`masks`, şık `box`) görsele göre 0–1 oranıyla yazılır; görsel bölgeden çizilince
  de aynı kalır.

## 5. Soru Yazımı

**Kök ve vurgu**

- Kökte sorunun dayandığı kilit parça `vurgu` alanına birebir yazılır; uygulama kökte o
  parçayı tema vurgu rengiyle gösterir. Soru başına bir iki vurgu; her şey vurgulanırsa
  hiçbiri öne çıkmaz.
- Klinik vaka uzun cümleyle başlamaz, sabit başlıkla başlar:
  - 1. satır: yaş + cinsiyet harfi + tanı ya da yakınma, kalın: `**3K-İnguinal Herni**`,
       `**67E-Göğüs Ağrısı**`. Harf `K` kadın/kız, `E` erkek; `vurgu` alanına `3K` gibi yazılır.
       Uygulama kalın başlıktaki harfi boyar: `E` temanın birinci rengi (mavi), `K` ikinci
       rengi (pembe).
  - 2. satır: eşlik eden hastalıklar, kısaltmayla, virgülle: `DM, HT, KOAH`. Yoksa `Ek hastalık yok`.
  - 3. satır: laboratuvar, `ad değer birim` virgülle: `Hb 9,8 g/dL, Kr 1,4 mg/dL`. Yoksa satır yazılmaz.
  - Ardından soru cümlesi, kısa.

**Şıklar ve açıklamaları**

- Şık açıklaması o şıkkın neden doğru ya da yanlış olduğunu söyler; başka şıkkın doğru
  olduğunu ele vermez, doğru cevabı tekrar etmez. Şıklar açılmadan görünen hiçbir metin
  cevabı söylemez.

**Çözüm**

- Çözüm (`solution`) bu sorunun neden böyle çözüldüğünü kısa söyler; kavram bilgisini §3
  anlatımına bırakır. Uzun paragraf yok, ilk `text` bir iki cümlelik öz.

**Çeşitlilik ve zincir**

- Modül tek tip sorudan oluşmaz: çoktan seçmeli, açık uçlu, işaretleme ve zincirli sorular
  karışık kullanılır.
- **Zincirli soru:** bir hikâyeyi adım adım ilerletir. İlk soru bir adımı sorar
  ("Bu aşamada hava yolu için ne kullanılır?"), cevaptan sonra gelen soru onu sürdürür
  ("Evet, LMA. LMA'nın en çok korkulan riski nedir?"). Sonraki soru öncekinin `devam`
  alanında kimliğiyle yazılır; uygulama doğru cevaptan hemen sonra onu getirir. Zincirin
  sonraki halkası ilk halkanın cevabını kökünde söyleyebilir; ilk halkanın kökü
  sonrakini ele vermez.
- Zincirin ara halkası ilk kez yalnız önceki halkanın ardından sorulur. Önceki halka
  görülmüş ya da emekliyse ara halka sıradan kart gibi gelebilir.

**Kod sorusu**

- `kod` etiketli soruda Kaynak bloğu yerine katlanır "Kodu Göster" düğmesi çıkar.
- Kod parça parça gösterilecekse `kod` alanı yazılır: `[{ kod, md }]`, en az bir parça;
  her parçanın altında `md` o parçanın ne yaptığını söyler. Alan yoksa `source.quote`
  tek blok kod olarak gösterilir.

**Oturum boyu**

- Modül `sessionSize` ile oturum başına soru sayısını önerebilir (5–200). Yazılmazsa
  kullanıcının ayarı geçer (varsayılan 40). Kısa kartlı dil modülleri daha büyük, uzun
  vakalı modüller daha küçük değer seçer.

## Sürüm Geçmişi

| Sürüm | Tarih      | Değişiklik                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.3.0 | 2026-10-24 | Anlatım yeniden yazıldı: sekiz basamaklı sıra (öz, nasıl işler, ne yapılır, sayılar, karıştırılan, örnek, görsel, kaynak), kısaltma ilk geçişte açılır, bir ekranı geçmez, denetim soruları; §5 Anlat kuralları §3'e taşındı. Alt dal: bölüm adı `Dal › Bölüm` (0040). Kılavuz kaynaklı soruda kitap düğmesi yok, `#` başlığı Anlat adımı açar, zincirin ara halkası önce gelmez, kod sorusunda `kod` parçaları. En düşük uygulama 0.8.1. |
| 1.2.0 | 2026-10-21 | Soru Yazımı bölümü: kökte `vurgu`, klinik vakada `3K-Tanı` başlığı ve ek hastalık, laboratuvar satırları, şık açıklaması cevabı ele vermez, Anlat ve konu anlatımı maddeli ve öz, zincirli soru (`devam`), `sessionSize`. En düşük uygulama 0.8.0.                                                                                                                                                                                        |
| 1.1.0 | 2026-10-18 | `standart` alanı zorunlu. Kitabı gömülü modülde bölgesi kayıtlı görseller paketten çıkar, uygulama gömülü PDF'ten çizer. `image` bloğunda `ref` ya da `bolge`. En düşük uygulama 0.7.69.                                                                                                                                                                                                                                                  |
| 1.0.0 | 2026-10-18 | İlk numaralı sürüm. Paket yapısı ve iz kuralları yazıya geçti. Kavram başına `anlatim` zorunlu. Görseller WebP. Sahipsiz dosya pakete girmez. Kitaptan alınan görsel `bolge` kaydeder. Modül `standart` alanını taşır.                                                                                                                                                                                                                    |
