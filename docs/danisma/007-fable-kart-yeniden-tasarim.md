# Danışma 007: Kütüphane Kartını Baştan Tasarlama — Olgular

claude-fable-5-1, 6.524 çıktı token, 131 sn. Girdi: [007-fable-kart-yeniden-tasarim-girdi.md](007-fable-kart-yeniden-tasarim-girdi.md). Cevap olduğu gibi:

---

## Danışma 007 — Kütüphane Kartı Yeniden Tasarım Görüşü

Temel karar tek cümle: **yazı görselin üstünden iner, görsel kendi sütununa çekilir.** Dokuz sürümlük "siyah zemin" savaşının tek kalıcı çözümü bu; perde, gölge, kutu hepsi gereksizleşir ve 7:1 kontrast kendiliğinden gelir (beyaz/siyah 21:1, `#4da6ff`/siyah ≈ 8,4:1).

### 1. Yerleşim (yukarıdan aşağı, kutu kutu)

Kart: siyah zemin, 1 px kenarlık, 4 px köşe, 16 px iç boşluk. İçi iki satırlı bir ızgara:

```
┌──────────────────────────────────────────────┐
│ ┌──────┐  QuizLoop Rehberi: Uygulama Nas…    │  ← 20 px, tek satır, beyaz
│ │      │  Sürüm 1.0.1 · Genel Kültür · Örnek │  ← 14 px, düz metin, çip yok
│ │kapak │                                      │
│ │96×144│  12                                  │  ← 32 px, beyaz
│ │      │  Bugün sırada                        │  ← 14 px
│ │      │  8 yeni · 5 öğreniliyor · 25 emekli │  ← 14 px, tek satır
│ │      │                                      │
│ │      │  45 soru                    %56 emekli│ ← 14 px, iki uç
│ └──────┘  ▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░░░░░             │  ← 4 px çubuk, mor dolgu
│                                                │
│ [ … ]                   [ Karışık ] [Oturuma başla] │  ← alt şerit, kart boyu
└──────────────────────────────────────────────┘
```

**Üst satır — sol sütun:** kapak, 96 px geniş × 144 px yüksek (2:3, kitap oranı; 24'lük ızgaranın 4 ve 6 katı), `object-fit: cover`, 4 px köşe. Sütun genişliği sabittir; ızgaradaki tüm kartlar hizalanır.

**Üst satır — sağ sütun** (sütunlar arası 16 px), içerik dikeyde `space-between` ile kapak boyuna yayılır:
- Başlık: 20 px, satır yüksekliği 1.25, beyaz, `white-space: nowrap; text-overflow: ellipsis`, `title` özniteliği.
- Etiketler: 14 px, " · " ile ayrılmış düz metin, tek satır üç nokta. Çip/kenarlık yok — kartta çizgi sayısını azaltmak tasarımın yarısı.
- Sayaç bloğu (madde 3).
- İlerleme bloğu (madde 2).

**Alt satır — kart boyu şerit** (üstten 16 px): solda "…" hayalet, sağda "Karışık" hayalet + "Oturuma başla" birincil (mavi dolgu, siyah yazı). Düğmelerin kapağın altına da uzanması 320 px'lik kartta üç düğmenin sığmasını sağlar; "…" solda kalınca başlıktaki üç nokta ile de karışmaz.

Yaklaşık yükseklik: 16 + 144 + 16 + 36 + 16 ≈ 230 px; tüm kartlar aynı boyda çıkar.

Yedek: başlık 320 px'lik kartta ~16 karakterde kesilir. Sahibi bunu fazla sert bulursa başlık satırı kapak satırının *üstüne*, kart boyu alınır; geri kalan değişmez.

### 2. Yüzde nereye?

Aşağıya, ilerleme çubuğunun hemen üstündeki 14 px satıra, sağ uca: `%56 emekli`. Aynı satırın sol ucunda `45 soru`. Çubuk 4 px yüksek, tam sütun genişliği, ray kenarlık rengi, dolgu mor (`--tk-renk-3`). Yüzde böylece gösterdiği şeyin (çubuğun) etiketi olur; başlık satırı yalnız başlığa kalır. Ayrı bir "Emekli" sayacı artık gerekmez — aşağıda zaten.

### 3. Dört sayaç

Dört eşit kutu kalabalığın kaynağı. Tek odak: **Bugün Sırada** sayısı 32 px beyaz, altında 14 px "Bugün sırada". Kalan üçü tek 14 px satır: `8 yeni · 5 öğreniliyor · 25 emekli`. Kullanıcı karta bakınca tek bir sayı görür — bugün ne kadar işi var — gerisi okunabilir ama bağırmaz. Hiyerarşi güzelliğin kendisidir.

### 4. Kapaksız kart

Sütun kaldırılmaz (hizalama bozulur). Aynı 96×144 alana 1 px kenarlıklı, 4 px köşeli siyah kutu; ortasında modül adının ilk iki kelimesinin baş harfleri, 32 px mavi (`QR`). Kitap sırtı/monogram etkisi; örnek modüller kapaklı olanlarla aynı ritimde durur.

### 5. Bölüm kartı

Aynı karttan üç silme: kapak sütunu gider (bölümün görseli yok), etiket satırı gider, "…" ve "Karışık" gider. Başlığın önüne bölüm sırası mavi 20 px ile gelir: `03  Dolaşım Sistemi`. Üç sayaç aynı kalıp: büyük "Bugün sırada" + iki parçalı satır. Alt şeritte yalnız sağda "Oturuma başla". Aynı iç boşluk, aynı çubuk, aynı yazı boyları; yan yana durduklarında aynı aileden oldukları bellidir.

### 6. En çok fark yaratan üç karar

1. **Yazı asla görsel üstüne binmez.** Kapak sol sütunda, yazı saf siyahta. Perde (`--tk-scrim`), kutu, gölge tartışması biter.
2. **Tek büyük sayı, gerisi 14 px.** Bugün Sırada 32 px; başlık dışında başka hiçbir şey 14'ü aşmaz. Kart bir şey söyler.
3. **Çizgi diyeti.** Karttaki tek çizgiler: kart kenarlığı, kapak kenarı, 4 px çubuk. Etiket çipleri düz metin, sayaç kutuları yok, alt şeritte ayırıcı yok. Düğmeler sağa yaslı, şeridi iki uçtan tutan "…" ile denge.

Not: `--tk-renk-3` morunun siyah üstünde 7:1 verdiği doğrulanmalı; vermiyorsa etiket metni mavi veya beyaz olur, mor yalnız çubuk dolgusunda kalır (dolgu için yazı kontrastı aranmaz).
