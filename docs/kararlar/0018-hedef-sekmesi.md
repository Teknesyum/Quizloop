# 0018 — Hedef Sekmesi

Tarih: 2026-10-05

## Sorun

Sahibinin sözü: "hedef diye bir sekme olacak ve bu sekmeden takip edicez her bir modül için
hedeflerimizi".

## Karar

1. Üst çubuğa Kütüphane ile İstatistik arasına **Hedef** sekmesi eklendi (`Route` `goals`,
   ekran `screens/Goals.tsx`).
2. Her kurulu modül bir satırdır: bugün emekli edilen / günlük hedef, çubuğu, kalan gün,
   bitiş tarihi, kalan soru, genel emekli yüzdesi. Hedefi olanlar üstte durur.
3. Hedef koyma, değiştirme ve kaldırma aynı düğmeyle hem bu sekmeden hem karttan yapılır
   (`GoalMenu`, `components/CardMenu.tsx`).
4. Kalan gün aşağı yuvarlanır: 30 günlük hedef ilk gün 30 gösterir (0017'de 31 çıkıyordu).

## Sonuç

Hedef modeli 0017'deki gibidir; yeni veri tutulmaz. Geçmiş günlerin hedef tutma kaydı yoktur.
