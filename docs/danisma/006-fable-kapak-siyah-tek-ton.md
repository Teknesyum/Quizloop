# Danışma 006: Kapak Kartı Yazısının Arkasındaki Siyahlık — Dördüncü Deneme

claude-fable-5-1, 2.354 çıktı token, 67 sn. Girdi: [006-fable-kapak-siyah-tek-ton-girdi.md](006-fable-kapak-siyah-tek-ton-girdi.md). Cevap olduğu gibi:

---

Dosyayı ve ilgili CSS/TSX'i okudum. Cevabım:

## Danışma 006 — Cevap

### 1. Sahibi ne istiyor?

Beş sözü art arda okuyunca ortak nokta şu: her denemede "harf harf" bir şey yapıldı (plaka, 24 text-shadow, 22 bulanık katman, SVG leke) ve her seferinde sahibi "parça parça / üst üste geçmiş / nokta nokta" diye şikâyet etti. Yani kusur harflerin kenarında değil, **siyahlığın parçalı olmasında**. 0.7.19 bile 8–10 ayrı ada üretiyor; ada = parça.

"Tek bir siyah ton, tam deep siyah, çok smooth, basit bir iş" dört kelimeyi birleştirince tek yorum kalıyor: **yazının bulunduğu bölgeyi kaplayan, tek parça, düz, tam siyah bir zemin** — kapak resmini kartın yazısız kısmında bırakan, yazılı kısmında ise tamamen siyaha gömen bir alan. Harf şeklini izleyen hiçbir şey istemiyor; "harflerin arkasındaki siyahlık berbat" sözü tam da harfe yapışık çözümlere.

"Bu kadar zor olmamalı" sözü de bunu doğruluyor: sahibi için iş, bir div'in arkasına siyah koymak kadar basit. Dört sürümdür fancy harf efektiyle uğraşılması onu çileden çıkarıyor.

### 2. 0.7.19 isteği karşılıyor mu?

Hayır. Ton doğru (tam siyah, tek ton) ama **biçim yanlış**: her öğe ayrı leke, aralardan kapak sızıyor. Bu, sahibinin 4. sözündeki "üst üste geçmiş şeyler"in tam karşılığı; sadece daha temiz çizilmiş hali. Ayrıca `filter: url()` Safari'de yazıyı yer yer yumuşatıyor ve her kartta rasterizasyon maliyeti çıkarıyor; "smooth" beklentisinin tersine kenarlarda hafif kıpırtı yapar.

### 3. Tek öneri

Yazıya dokunmayı bırak; `filter: url(#ql-ink)` kuralını (`app.css` 312–317) ve `App.tsx` 144–150'deki SVG tanımını kaldır. Yerine kartın **içerik bloğu** siyah alsın, kapak yalnızca üst şeritte kalsın.

Kartın `.ql-cover` img'i `inset: 0` ile her yeri kaplıyor. Onu üst bantla sınırla, altındaki her şey düz `--tk-bg-from` üstünde dursun:

```css
.ql-cover-card:has(.ql-cover):not(.ql-grid-list *) {
  background: var(--tk-bg-from);
  padding-top: calc(var(--tk-sp-5) * 4);
}

.ql-cover-card:has(.ql-cover):not(.ql-grid-list *) .ql-cover {
  inset: 0 0 auto 0;
  height: calc(var(--tk-sp-5) * 4);
}

.ql-cover-card:has(.ql-cover):not(.ql-grid-list *)::after {
  inset: 0 0 auto 0;
  height: calc(var(--tk-sp-5) * 4);
  background: linear-gradient(to bottom, transparent, var(--tk-bg-from));
}
```

Sonuç: üstte 96px kapak şeridi, şeridin alt kenarı siyaha eriyor (gradient yalnız resim üzerinde; yazıya değmiyor, bu yüzden "nokta nokta" yok), başlık–yüzde–etiket–sayaç–buton hepsi **tek parça, tam siyah** zeminde. Harflere dokunan hiçbir efekt kalmıyor; Chromium ve Safari'de aynı görünür. Liste görünümü `:not(.ql-grid-list *)` dışında olduğu için ve kapaksız kart `:has(.ql-cover)` tutmadığı için değişmez. `.ql-tag` için `border-color: transparent` ve `.tk-btn-ghost` için `--tk-scrim` kuralları artık gereksiz; kaldırılabilir.

`Chapters.tsx`'teki `.ql-cover-foot` (alttan hizalı kapak) için aynı mantık tersten: `inset: auto 0 0 0`, `padding-bottom` ve gradient `to top`.

### 4. Netleştirme sorusu

Gerekmiyor. Beş söz birlikte yeterince açık; bir soru daha sahibini "yine mi anlamadın" noktasına götürür. Uygula, ekran görüntüsüyle göster.
