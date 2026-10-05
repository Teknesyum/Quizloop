# 0019 — Hedef Bildirimi Ve Soru Cümlesi

Tarih: 2026-10-05

## Sorun

Sahibinin sözü: "hedef tuşuna basınca sekmeyi değiştirsin ve kullanıcıya ayrıntılı güzel bir
bilgilendirme yapılsın eğer hedef seçilirse bildirimi aç şeklinde bir buton çıkcak basılırsa
uygulamada bildirim izni istensin" ve hafızlık sorusu için "arapça yazıldığında bile türkçe
... soru metnini türkçe güzelce bas".

## Karar

1. Karttaki Hedef düğmesi menü açmaz, Hedef sekmesine götürür. Süre orada seçilir.
2. Hedef sekmesi "Hedef Nasıl Çalışır?" açıklamasıyla başlar.
3. `Settings.goalNotify`. En az bir hedef varsa "Bildirimi Aç" çıkar; basınca tarayıcının
   `Notification.requestPermission()` izni istenir. İzin verilirse 19.00'dan sonra, hedef
   bitmemişse günde bir kez bildirim gösterilir (`renderer/remind.ts`, on dakikada bir bakar).
4. Bildirim yalnızca uygulama açıkken ya da arka planda çalışırken gelir. Android kabuğunda
   `Notification` yoktur; orada düğme yerine "henüz desteklenmiyor" yazar.
5. Soru kökünün son paragrafı soru işaretiyle bitiyorsa ayrı soru cümlesi olarak basılır
   (`splitAsk`). Kök sağdan sola ise kök ve soru cümlesi kartın tamamında ortalanır.
6. Kapak görseli kendi oranını korur (en çok genişliğin 1,5 katı yükseklik).

## Sonuç

Android bildirimi yerel eklenti (`@capacitor/local-notifications`) ve yeni Play derlemesi
ister; ayrı iştir. Hafızlık modülüne Türkçe soru cümlesini modül ajanı ekler.
