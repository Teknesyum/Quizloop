# Danışma 005 girdi: Kapak Kartında Yazının Arkasındaki Siyahlık

Ajana giden metin:

---

[[danisma:005]]

# Kapak Kartında Yazının Arkasındaki Siyahlık

## Durum

QuizLoop kütüphanesinde modül kartının arkasında modülün kapak resmi durur
(`.ql-cover-card`, resim `.ql-cover`, üstünde `--tk-scrim` = rgba(0,0,0,0.6) örtü).
Kartın üstünde: başlık (`.tk-h3`), yüzde (`.ql-percent`), etiketler (`.ql-tag`, "Sürüm 1.5.0",
"Kuran", "Hafızlık"), sayaçlar (`.tk-hint`), "⋯" ve "Karışık" düğmeleri (`.tk-btn-ghost`),
"Oturuma başla" (dolu düğme).

Kural: yalnızca `--tk-*` tokenları kullanılır (renk `--tk-bg-from` = #000000, `--tk-scrim`,
boşluk `--tk-sp-1..5`, `--tk-border-w`, yarıçap `--tk-r`). Elle renk ya da ölçü yazılmaz.

## Sahibin Sözleri, Sırasıyla, Aynen

1. (2026-10-04 11:08) "birde quizloop un arayüzü modülün arka planından çok etkileniyor ordaki
   yazıları daha belirgin basmalıyız belki siyah bir parlamamsı bir anahat bilmiyorum toparla
   işte anahat olmasın sürüm vb yazılarında bu tarz bir siyahlığın üstüne yazılsınlar ancak düz
   siyah panel değil dediğim gibi harf bazında"
2. (2026-10-04 15:11) "siyah arkaplanı biraz daha genişlet"
3. (2026-10-04, 0.7.15 sonrası) "şimdi sürümde farklı bir siyahlık var kuranı kerim hafızlık
   sağlama da farklı bir siyahlık var öncelikle parlama tarzı olsun ancak parlama olmasın yani
   bir anda siyah tona geçelim ve her yerde aynı düzeni istiyorum karışık ve 3 noktanın olduğu
   butonların arkasında yarı saydam siyah olabilir"
4. (0.7.16 sonrası) "bide istediğim bu değil kaç kere söyleyeceğim fable a danışır mısın şu
   yazının arkasındaki siyahlıktan kasteddiğim ne diye !!!"

## Ne Yapıldı

- 1 ve 2'den sonra (0.7.13 – 0.7.15): başlık, yüzde ve sayaçlara harf çevresinde yumuşak
  siyah hale verildi: on katlı `text-shadow`, hepsi `0 0 <bulanıklık> var(--tk-bg-from)`,
  bulanıklık `--tk-border-w`'den `--tk-sp-5`'e. Etiketler ("Sürüm …") ise kutu olarak kaldı:
  `background: var(--tk-scrim)`, kenarlık saydam. Yani aynı kartta iki ayrı siyahlık vardı.
- 3'ten sonra (0.7.16, sahibin "bu değil" dediği): hale tümden kaldırıldı. Başlık, yüzde,
  etiket, sayaç ve hayalet düğmelerin her birine dikdörtgen plaka verildi:
  `background: var(--tk-scrim)`, `padding: 0 var(--tk-sp-1|2)`, `border-radius: var(--tk-r)`.
  Sonuç: her yazının arkasında keskin kenarlı yarı saydam siyah kutu.

## Soru

Sahip yazının arkasındaki siyahlıktan tam olarak neyi kastediyor? Dört cümleyi birlikte oku
ve tek bir yorum ver:

1. Siyahlığın biçimi ne olmalı (harfin çevresini mi izler, kutu mu, başka bir şey mi)?
2. "parlama tarzı olsun ancak parlama olmasın yani bir anda siyah tona geçelim" ne demek?
3. "her yerde aynı düzen" hangi öğeleri kapsıyor; düğmeler ("yarı saydam siyah olabilir") ayrı mı?
4. Bunu yalnızca yukarıdaki tokenlarla veren CSS nasıl yazılır (örnek kural)?

Emin olmadığın yeri açıkça söyle; sahibe sorulacak tek bir soru varsa onu yaz.
