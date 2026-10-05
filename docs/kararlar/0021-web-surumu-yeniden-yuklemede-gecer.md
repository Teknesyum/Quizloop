# 0021 — Web Sürümü Yeniden Yüklemede Geçer

Tarih: 2026-10-05

## Sorun

Sahibinin sözü: "tr en e basınca 3 nokta yok oluyor gibi". Dil değişimi sayfayı yeniden
yükler. Tarayıcı sürümünde yeni servis işçisi bekler (0015), eski işçi sayfayı yönetmeye
devam eder. Sayfa bir kez ağdan yeni sürümle açıldıysa (zorla yenileme), sonraki olağan
yenileme eski önbellekten eski sürümü getirir: yeni eklenen üç nokta menüsü kaybolur.

## Karar

Çalışan sayfa yine kendi dosyalarıyla kalır; işçi kendiliğinden devralmaz. Ama sayfa
açılırken bekleyen bir işçi varsa `boot.ts` ona `skip` iletisi yollar, işçi devralır ve
sayfa bir kez yeniden yüklenir. Böylece yeni sürüm "tüm sekmeler kapanınca" değil, ilk
yeniden yüklemede başlar. 0015'in "yeni sürüm sonraki açılışta başlar" maddesinin yerini alır.

## Sonuç

Bu düzeltme `boot.ts` içinde olduğu için ancak bu sürümü almış sayfalarda çalışır; eski
sürümde kalan tarayıcı bir kez tümüyle kapatılıp açılmalıdır.
