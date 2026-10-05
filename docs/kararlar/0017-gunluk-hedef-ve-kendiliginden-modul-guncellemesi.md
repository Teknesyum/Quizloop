# 0017 — Günlük Hedef Ve Kendiliğinden Modül Güncellemesi

Tarih: 2026-10-05

## Sorun

Sahibinin sözü: "modülü güncelle demek zorunda değilim daha güncel bir modül yüklendiğinde
otomatik güncellencek" ve "Hedef diye bir buton koyalım günlük hedefi belirlesin kullanıcı
1yıl 1 hafta 1 ay 3 ay 3 hafta 3 yıl gibi seçenekler seçsin ... 40/150 gibi hedefi de
gösterelim varsa".

## Karar

1. **Yeni sürüm sormadan kurulur.** Kurulan dosyanın sürümü kuruludan yeniyse onay penceresi
   çıkmaz (`mayInstall`). Eski sürüme dönüş hâlâ sorulur. Karttaki "Modülü güncelle"
   seçeneği kalktı; aynı işi "Modül dosyası ekle" görür.
2. **Hedef modül başınadır ve ayarlarda durur.** `Settings.goals[modülKimliği] = { days, until }`.
   Seçenekler 7, 21, 30, 90, 365, 1095 gün (`GOAL_DAYS`).
3. **Günlük hedef emekli soru sayısıdır.**
   `günlük = tavan((emekli olmamış + bugün emekli olan) / kalan gün)`; kalan gün en az 1.
   Gösterim `bugün emekli olan / günlük`. Gün atlanırsa hedef kendiliğinden yükselir.
4. Bitiş tarihi geçince ya da modül bitince hedef satırı gizlenir.

Danışma: `docs/danisma/008-fable-kart-liste-hedef.md`.

## Sonuç

Hedef yalnızca gösterimdir; oturumun soru sayısını değiştirmez (o `sessionLimit` ayarıdır).
Hedef bu cihazın ayarlarında durur; ilerleme aktarımıyla taşınmaz.
