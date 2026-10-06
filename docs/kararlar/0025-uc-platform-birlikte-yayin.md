# 0025 — Üç Platform Birlikte Yayınlanır

Tarih: 2026-10-07

## Sorun

Sahibinin sözü: "güncelleme protokolümüzü değiştir artık gplaya de sormana gerek yok ve 3
platformda senkron update edilecek".

Bir etiket (`vX.Y.Z`) üç ayrı yoldan gidiyordu. Web hemen yayınlanıyordu. Masaüstü taslak
sürüm olarak kalıyor, elle yayınlanana dek kimse görmüyordu: 0.7.43 ve 0.7.44 web'de ve
Play'de çıkmışken masaüstünde son sürüm 0.7.42 görünüyordu. Play ise elle tetikleniyordu.

## Karar

Etiket tek iş akışını (`release.yml`) başlatır. Masaüstü ve Android derlemeleri bitince üç
iş birlikte başlar:

- `publish` — GitHub sürümünü taslak olmadan, doğrudan yayınlar.
- `web` — `pages.yml` akışını çağırır. `pages.yml` artık etiketi kendi dinlemez.
- `play` — aynı derlemeden çıkan `.aab` dosyasını Play kapalı testine yükler.

Onay sorulmaz. Bir derleme kırılırsa üçü de çıkmaz; platformlar ayrı sürümde kalmaz.

## Elle Yol

- `pages.yml` elle çalıştırılabilir: etiketsiz bir web düzeltmesi için.
- `play.yml` elle çalıştırılabilir: Play yüklemesi tek başına düşerse yeniden denemek için.

## Bilinen Sınır

Üç iş aynı anda başlar ama aynı anda bitmez. Play'in kendi incelemesi sürümü telefonlara
dakikalar ya da saatler sonra ulaştırabilir; bu bizim elimizde değil.
