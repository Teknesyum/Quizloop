# Danışma 008: Kart Ve Liste Görünümü, İkinci Tur

claude-fable-5-1, 4.255 çıktı token, 96 sn. Girdi: [008-fable-kart-liste-hedef-girdi.md](008-fable-kart-liste-hedef-girdi.md). Cevap olduğu gibi:

---

## Danışma 008 — Cevap

### 1. Kart taslağı

Kare kapak doğru. Kaynak 760×731, yani zaten kare; 96×96 çerçeve yalnızca %4 kırpar, 96×144 ise genişliğin %36'sını atıyordu. "Mini resimler güzel çıkmamış"ın nedeni budur, bulanıklık değil. Bölüm resimlerindeki yazı 96 px'e inince her durumda okunmaz; bu kabul edilir, resim tanıma işareti olarak kalır.

Boyut: masaüstünde 96, telefonda (360 px) da 96 kalsın; 320 px sütunda 96 + 12 boşluk sonrası 212 px yazıya kalıyor, yeterli. `object-position: top` ekle, bölüm resimlerinde başlık üstteyse kesilmez.

Taslakta değiştireceğim tek şey: "3800 soru … %1 emekli" satırını fs-1, text-label gri yap ve çubuğun hemen üstüne 4 px ile yapıştır. Böylece "sayı bloğu" (3 satır) ile "ilerleme bloğu" (satır + çubuk) gözle ayrılır. Hedef satırı yalnızca hedef varsa gelsin, taslaktaki gibi.

### 2. Üç satırın yazımı

Sahibin yanılgısı ("bugün yaptıklarımız mı?") sözcüğün edilgen olmamasından: "sırada" ne olduğunu söylemiyor. Fiil açık olsun.

| Yer | Türkçe | English |
|---|---|---|
| 1. satır (fs-3, vurgulu) | **Bugün sorulacak: 12** | **Due today: 12** |
| 2. satır (fs-1, gri) | Hiç görülmemiş 3761 · Tekrarda 27 | Unseen 3761 · In review 27 |
| 3. satır (fs-1, gri) | Hedef: bugün 40/150 | Goal: today 40/150 |
| İlerleme | 3800 soru · %1 emekli | 3800 questions · 1% retired |

"Öğreniliyor" yerine "Tekrarda": soru görüldü, ileri bir güne planlı; "tekrarda" bunu söyler, "öğreniliyor" ise kullanıcıya bir hüküm gibi geliyor. "Yeni" yerine "Hiç görülmemiş": "yeni" sürümle karışıyor (hemen üstünde "Sürüm 1.2" var).

"Emekli" kalır; açıklaması iki yerde: yüzdenin `title`'ı "Emekli: 'anladım' dediğin, bir daha sorulmayacak sorular" ve Nasıl Kullanılır'da aynı cümle. 32 px rakamı kaldır; fs-3 yeterli, kartın yarısını tek rakam almasın.

### 3. Liste satırı

Masaüstü, tek satır:

```
[40x40] Başlık…                      12 sorulacak · 40/150    %1   [Oturuma başla]
        ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (4 px, başlık sütununun eni)
```

Sıra: kapak → başlık → bugün ne yapılacak → hedef → ilerleme → eylem. Göz soldan sağa "ne, ne kadar, başla" okur. "Karışık" ve "…" listede yok; liste hızlı başlatma görünümüdür, ayar kartta yapılır. Çubuk için yeni ölçü uydurma, 4 px kalsın.

Telefon 360 px, iki satır:

```
[40x40] Başlık…                              [Oturuma başla]
        12 sorulacak · 40/150 · %1 emekli
        ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
```

Satır arası 4 px, satırlar arası 8 px, kenar 16 px. Hedef yoksa "40/150" parçası düşer, nokta da düşer.

### 4. Hedef

Formül doğru; "+ bugün emekli olan" eklemen şart, yoksa her emeklide payda sabit kalırken pay küçülür ve hedef gün içinde düşer. Daha sağlam tanım: süre değil **bitiş tarihi** sakla. Seçim anında `bitis = bugün + süre`; her gün başında bir kez hesapla ve o günü dondur:

```
günlük hedef = tavan((toplam − emekli_gün_başı) / (bitis − bugün))
```

Böylece bir gün kaçırılırsa hedef kendiliğinden yükselir; bu doğru davranış. `bitis` geçince ya kalan 0 olunca hedef satırı gizlenir, düğme "Hedef"e döner.

Seçim: pencere değil, düğmeye bağlı küçük açılır menü. Satır başına süre ve ne anlama geldiği: "3 ay → günde ~150" (hesap: kalan / gün). Sahip 1 haftayı seçmeye kalkınca "günde ~538" görür ve kendi vazgeçer. Altta "Hedefi kaldır". Seçenekler: 1 hafta, 3 hafta, 1 ay, 3 ay, 1 yıl, 3 yıl.

Düğme etiketi: hedef yokken "Hedef", varken "Hedef · 3 ay". Kısa, kartta neyin seçili olduğunu tek bakışta söyler; 40/150 ise bilgi satırında kalır, düğmede tekrar etmez.

### 5. Tıklayınca açılan detay animasyonu

Yapma. Üç neden:

- Kartta artık gizli bilgi yok; açılacak panel boş olur ya da aynı sayıları tekrar eder.
- Izgarada bir kart uzadığında komşular kayar; "smooth" niyetle başlayan iş yerleşim sıçramasıyla biter.
- Kart ve liste zaten "ayrıntılı / sıkışık" ikilisi; üçüncü bir durum iki görünüm arasındaki ayrımı bulandırır.

İleride "daha çok sayı" istenirse en ucuz yol: çubuğa gelince (hover / basılı tutma) dört durumu da gösteren `title` ipucu. Tek satır kod, hareket yok.
