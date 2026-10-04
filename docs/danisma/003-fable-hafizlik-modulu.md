# Danışma 003: Kur'an Hafızlık Modülü — Görüş Girdisi

claude-fable-5-1, 14.687 çıktı token, 265 sn. Girdi: [003-fable-hafizlik-modulu-girdi.md](003-fable-hafizlik-modulu-girdi.md). Cevap olduğu gibi:

---

# Danışma 003 — Cevap: Kur'an Hafızlık Modülü

Önce iki depo gözlemi, cevapları şekillendiriyor:

- `acik-uclu` zaten "göster → aç → kendini derecelendir" olarak çalışıyor (`machine.ts:177` reveal doğrudan `solved`'a geçiyor, `grade` 0-3 öz-değerlendirme alıyor, 3 = emekli). Hafızlığın asıl kartı bu; yeni `kind` gerekmiyor.
- `solution` içindeki `table` bloğu `header + rows` düz tablo; kelime-kelime meal için yeterli, yalnız yön (RTL) bilgisi yok.

## 1. Soru birimi: ayet

**Ayet olsun, "durak" değil.** Üç sebep:

- Türkçede "durak" iki şeye denir: ayet sonundaki yuvarlak işaret (ayet durağı) ve ayet içindeki secavendler (ط ج ز ص ق قف لا م). Sahibi büyük ihtimalle birincisini kastediyor; o zaten ayet.
- Secavendler mushaftan mushafa değişir. Medine mushafı Mısır sistemini (مـ لا ج صلى قلى ∴) kullanır, Diyanet/Hayrat mushafları secavend sistemini. Türk hafızın ezberlediği durak konumları için açık veri kümesi yok; Medine'nin işaretlerini sorarsak hafıza yabancı gelir.
- Ayet sınırı tek doğru kaynak (Kûfî sayım, 6236). Tanzil, Medine mushafı ve Türk mushafları aynı sayımı kullanır.

Uzun ayetleri (Bakara 282, Nisa 12 gibi) sonraki dalgada vakıf işaretinden bölmek düşünülebilir; ilk dalgada değil.

**Sayı:** cüz başına 2000 değil, 148–564 ayet. 1. cüz 148 (Fatiha 7 + Bakara 1-141), 30. cüz 564, ortalama ~208. Toplam 6236 → 50'lik bloklarla ~125 blok, her soru tipi için bir kat daha.

"Bu ayetten sonraki ayet" doğru ifade. Sure sonunda "sonraki" = bir sonraki surenin ilk ayeti; hafızlar sure geçişlerini de ezberler, bu soru atlanmasın, ayrı etiketlensin (`gecis:sure`).

## 2. Soru tipi: ikisi, ama ağırlık açık uçlu

Hafızlık **hatırlama** (okuyarak üretme) işidir, **tanıma** değil. Çoktan seçmeli, doğru ayeti dört şık arasında görünce "tanır"; bu hafızın gerçek sınavı değil. Ama tuzak (müteşabih) öğretir.

- **Ana kart: `acik-uclu`.** Gövde: ayet N (Arapça). Kullanıcı içinden okur, "göster" der, N+1'i görür, kendini derecelendirir. Mevcut akış birebir bu. `beklenenCevap` = N+1'in Arapça metni.
- **Yardımcı kart: `coktan-secmeli`,** yalnız müteşabih çeldirici hesaplanabilen ayetler için (bkz. 3). Benzeri olmayan ayetlere çoktan seçmeli sormak boş yere kolay soru üretir.

Modül ayarına "yalnız açık uçlu / ikisi" seçeneği koyun; `module.json` düzeyinde bir bayrak yeter.

Bir de gerçek pratik notu: hafızlar tekrarı **akışla** yapar (sayfa sayfa, sırayla); sınav (dinleme) ise **rastgele yerden** sorar. FSRS'in rastgele kuyruğu sınavı taklit eder; bu "sağlama"ya uygun. Ama "şu cüz / şu sayfa" süzgeci şart, yoksa 30 cüzden karışık soru gelen hafız uygulamayı bırakır.

## 3. Çeldiriciler: gerçek ayetlerden, deterministik

**Altın kural: hiçbir şık uydurma ya da değiştirilmiş Arapça metin içermesin.** Her şık Kur'an'da aynen geçen bir ayet olmalı. Değiştirilmiş ayet göstermek dinî açıdan kabul edilmez (tahrif algısı) ve hatalı ezber öğretir.

Hesap, hareke/işaretler soyulmuş ve normalize edilmiş metin üstünden (elif türevleri→ا, ة→ه, ى→ي, küçük harfler ve Kur'an işaretleri silinir), tamamen belirlenimci:

1. **Atlama çeldiricisi (asıl müteşabih):** Gövde ayet N'e en çok benzeyen ayetleri bul (kelime 3-gram Jaccard, eşik ≥ 0.5). Her benzer M için çeldirici = **M+1**. Hafızın gerçek hatası budur: N'i okurken M'ye atlar, M+1 ile devam eder.
2. **Baş benzeri:** Doğru cevap N+1 ile aynı ilk 2-3 kelimeyle başlayan başka ayetler.
3. **Son benzeri (fasıla):** N+1 ile aynı iki kelimeyle biten ayetler (غفور رحيم / عزيز حكيم / سميع عليم karışıklığı). Fasıla hatası hafızların en sık hatasıdır.
4. **Dolgu:** 1-3 yetmezse aynı sureden, benzer uzunlukta, N'e 3+ ayet uzaklıkta ayet. N+2 ve N-1 de doğal çeldirici.

Sıralama puanla, eşitlik ayet numarasıyla kırılsın; böylece aynı korpus aynı modülü üretir (`contentHash` kararlı kalır). 4 şık yeter (A-D). Çeldirici açıklaması (`distractors[key]`) otomatik yazılır: "Bu ayet Âl-i İmrân 3:22'nin devamıdır; gövdeyle benzerlik: «...»".

## 4. Olması gereken diğer soru tipleri

Türk hafızlığı **sayfa** odaklıdır. Medine mushafı ile Türk mushafları aynı 604 sayfa / 15 satır / ayet-berkenar düzenindedir, sayfa sınırları birebir aynıdır (satır kırılımları biraz farklı). Yani sayfa numarası güvenle kullanılır.

Öncelik sırasıyla:

- **Devam** (N → N+1): temel. Dalga 1.
- **Sayfa başı / sayfa sonu:** "X. sayfanın ilk ayeti?" (açık uçlu) ve "Bu ayet sayfa başı mı?" Hafızlar sayfa başlarını ayrıca ezberler. Dalga 2.
- **Konum:** "Bu ayet hangi sure / cüz / sayfa?" Çoktan seçmeli, çeldirici komşu sayfalar. Dalga 2.
- **Geri okuma** (N → N-1): zor, ileri hafızlar için. Dalga 3.
- **Fasıla tamamlama:** Gövde N+1'in son iki kelimesi gizlenmiş hali ("..." ile açıkça kesik gösterilir), şıklar Kur'an'da geçen gerçek fasılalar. Kural 3 korunur: gövde gerçek metnin parçası, şıklar gerçek ifadeler. Dalga 3.
- **Müteşabih sayımı:** "«...» ibaresi Kur'an'da kaç yerde geçer, nerelerde?" Dalga 3.
- **Sure başı:** "X suresinin ilk ayeti?" Dalga 2, ucuz.
- **Ses (kari kaydı):** gövdeyi dinlet, devamı sor. Ayrı veri, lisans ve boyut işi. Dalga 4+.
- Hizb/rub: Türk hafızlığında az kullanılır; etiket olarak koyun, soru yapmayın.

## 5. `conceptId` = ayet anahtarı

`conceptId: "2:255"` (sure:ayet). Sebepler:

- Aynı ayete birden çok tip (devam, konum, fasıla) olacak; "günde bir soru / conceptId" kuralı bunların aynı gün üst üste gelmesini engeller, tam istenen davranış.
- Sayfa yapılsa 604 kavram, günde en çok 20 soru/cüz çıkar; hafız için çok az.

Sayfa, cüz, hizb, sure `tags` ile gider: `sayfa:042`, `cuz:03`, `sure:002`, `tip:devam`. Süzgeç bu etiketlerden çalışır.

## 6. Kelime kelime meal: `table` yeter, yön eksik

`solution` sırası:

1. `text`: doğru ayetin tam Arapçası (büyük, Kur'an yazı tipi).
2. `text`: tam meal, mealin adı ile.
3. `table`: `header: ["Kelime", "Meal"]`, satır = bir kelime. Arapça sütun sağda olmalı; tabloya `dir` veya hücreye dil bilgisi gerekiyor.

En küçük şema değişikliği: `Table`'a isteğe bağlı `dir: 'rtl' | 'ltr'` ve `text` bloğuna isteğe bağlı `lang`. Alternatif, daha az dokunuş: `module.json` `language: "ar"` olunca renderer bütün Arapça blokları RTL yapsın; ama meal Türkçe olduğu için karışık yönlü içerik var, blok düzeyi `lang` daha doğru.

## 7. Veri kaynakları ve lisans

Önce yapısal gerçek: **modül git'e girmiyor, uygulamayla da dağıtılmıyor.** Dağıtılan iki şey var: üretici betik ve `_ornek`. Betik veriyi kullanıcının makinesine indirirse, meal lisansı son kullanıcı dağıtımı sorunu olmaktan çıkar (kendi indirmesi).

| Kaynak | İçerik | Durum |
|---|---|---|
| **Tanzil** (tanzil.net) Uthmani metin + `quran-data` (sure/cüz/hizb/sayfa/secde meta) | Arapça metin, sayfa başlangıçları | Verbatim dağıtım serbest, **değiştirmek yasak**, kaynak gösterilecek. `_ornek`'e girebilir. |
| **QUL** (qul.tarteel.ai, Quran.com Foundation) | Metin, mushaf satır düzeni (Medine 1405/1421), kelime-kelime mealler, yazı tipleri, ses zamanlamaları | Kaynak başına lisans; çoğu CC BY ya da CC BY-NC-ND. **Satır düzeni verisi** sayfa/satır soruları için tek açık kaynak. Her kaynağın lisansı tek tek doğrulanmalı. |
| **quran.com API v4** | Kelime-kelime Türkçe (var olduğunu hatırlıyorum, **doğrulanmalı**) | Betik indirir, `_ornek`'e girmez. |
| **Diyanet mealleri** | Tam meal | Diyanet telifi, açık değil. Yalnız kullanıcı indirmesi. |
| **Elmalılı Hamdi Yazır** (ö. 1942) özgün metin | Tam meal | Türkiye'de kamu malı (70 yıl doldu). **Sadeleştirilmiş sürümler telifli.** Özgün dili ağır; `_ornek` için mümkün, günlük kullanım için kullanıcı başka meal seçsin. |
| Tanzil çeviri listesi (Diyanet, Yıldırım, Ateş, Öztürk...) | Tam meal | Tanzil barındırır ama telif çevirmenlerde; dağıtmayın, betik indirsin. |
| **everyayah.com / QUL ses** | Ayet ayet kari kaydı | Çoğu "ticari olmayan"; dalga 4'te tek tek bakılır. |

Yazı tipi: **Amiri Quran** (SIL OFL) ya da **Scheherazade New** (OFL). Kur'an işaretleri (U+06D6–U+06ED, küçük yüksek harfler) için özel destek gerekir; Noto Naskh bunları eksik basar. KFGQPC Hafs yazı tipi güzel ama lisansı dağıtım için yeterince açık değil, uzak durun.

## 8. Metin bütünlüğü

Hatasızlık doğrulanabilir bir şey; "dikkatli olalım"la değil, kontrolle sağlanır:

- **İki kaynak çaprazı:** Tanzil Uthmani ile QUL/KFGQPC metni normalize edip ayet ayet karşılaştır; fark varsa üretim durur. Harekeli hamda da karşılaştır (işaret farkı için ikinci rapor).
- **Sayım kontrolü:** 114 sure, 6236 ayet, her surenin bilinen ayet sayısı tablosu (sabit liste) tutmalı.
- **Sağlama toplamı:** Her surenin ham metni için SHA-256, `module.json`'a `source.checksums` olarak yazılır; yükleyici açılışta doğrular. `contentHash` zaten var, bunu ayet metni için tekrar kullanın.
- **Hiç dönüştürme yok:** Gösterilen metin kaynaktan aynen geçer; normalizasyon yalnız benzerlik hesabında, ayrı değişkende.
- **Besmele:** Tanzil her surenin 1. ayetinin başına Besmele'yi ekler (Fatiha ve Tevbe hariç). Fatiha'da 1:1 Besmele'nin kendisidir; diğerlerinde gösterimden ayrılmalı, Neml 27:30'un içindekine dokunulmamalı. Bu, ilk üretimde en çok hata çıkaracak nokta.
- **Osmanî imla uyarısı:** Türk hafızlar Hafız Osman hattıyla ezberler; Medine Uthmani'de bazı kelimeler farklı yazılır (الصلوة gibi). Metin aynı, imla farklı. Giriş ekranında bir cümleyle söylenmeli, yoksa "yanlış yazmış" sanılır.

## 9. Şema ve arayüz: en az değişiklik

- `Table.dir?: 'rtl'|'ltr'` ve `SolutionBlock text/hint.lang?` (ya da tek `dir`).
- `Stem.lang?` / `Choice.lang?`: gövde ve şıklar Arapça. Alternatif: `module.json` `language: "ar"` → renderer'da gövde+şıklar RTL varsayılan, çözüm blokları `lang`a bakar.
- `app.css`: `[dir=rtl]` kuralları, Kur'an yazı tipi `@font-face`, Arapça için daha büyük satır yüksekliği. A-D şık harfleri RTL satırda sağa alınmalı; `teknesyum-ui` belirteçleri içinde kalınır.
- Yeni `kind` **gerekmez**. `acik-uclu` + `coktan-secmeli` yeter.
- `source`: `file` = "tanzil-uthmani-1.1.txt", `pages` = Medine sayfası (tek sayfa, `[42,42]`), `quote` = ayetin kendisi, `chapter` = sure adı. Kaynak kuralı bozulmadan karşılanıyor.
- Üretici: `quizforge` değil, model gerektirmeyen ayrı deterministik betik (`scripts/hafizlik/` ya da quizforge içinde `--generator hafizlik`). Girdi: Tanzil dosyaları + meta; çıktı: `module.json` + bloklar.

## 10. Tuzaklar ve dalga sırası

**Tuzaklar:**

- Uydurma/değiştirilmiş Arapça şık (en büyük). Fasıla sorusunda bile şıklar gerçek ifade olmalı.
- Yanlış yazı tipi → Kur'an işaretleri kutu çıkar; hafız güvenini kaybeder.
- Besmele'yi ayet sayıp 1. ayete yapıştırmak.
- Sure geçişlerini atlamak ya da son ayette "sonraki yok" demek.
- 30 cüzden karışık kuyruk, süzgeçsiz.
- Çoktan seçmeliyi ana kart yapmak (tanıma ≠ ezber).
- Meal lisansı yüzünden Arapça metni de dağıtmamak; ikisi ayrı.
- Hafız olmadan "doğru pratik" varsaymak: dalga 1'den sonra bir-iki hafıza 20 dakika kullandırmak bütün bu cevaplardan daha değerli.

**Dalga sırası:**

1. **Veri + çekirdek:** Tanzil indir, iki kaynak doğrula, sayım ve sağlama toplamı; `devam` soruları (açık uçlu, tüm 6236 + çoktan seçmeli yalnız müteşabih bulunanlara); `conceptId` ayet, etiketler; RTL + yazı tipi; cüz/sayfa süzgeci; `_ornek` = Fatiha + Bakara 1-20 + Nas-Felak. Hafız denemesi.
2. **Sayfa katmanı:** QUL satır düzeni; sayfa başı/sonu, konum, sure başı soruları; Osmanî imla uyarısı.
3. **Meal katmanı:** Betikle kelime-kelime ve tam meal indirme (kullanıcı seçer), `table` RTL, `lang`.
4. **İleri hafız:** Geri okuma, fasıla, müteşabih sayımı.
5. **Ses:** Kari kaydı ile gövde dinletme; lisans ve boyut kararı o zaman.

**Doğrulanacak iki iddiam:** quran.com'da Türkçe kelime-kelime mealin varlığı ve QUL kaynaklarının tek tek lisansları. İkisini de betiği yazmadan önce bir göz atmayla kapatın.
