# 0026 — Web Sürümü İlk Açılışta Güncellenir

Tarih: 2026-10-07

## Sorun

0021 yeni sürümü "ilk yeniden yüklemede" başlatıyordu. Yayından sonraki ilk açılışta yeni
servis işçisi henüz kurulurken sayfa eski önbellekten açılıyor, yeni sürüm ancak ikinci
açılışta geliyordu. Sahibi düzeltmenin gelmediğini sanıyordu.

## Karar

Sayfa açılırken `boot.ts` güncellemeyi kendisi sorar (`reg.update()`, en çok 3 saniye),
kurulmakta olan işçiyi en çok 15 saniye bekler, sonra `skip` yollayıp sayfayı bir kez
yeniden yükler. Çalışan sayfa yine kendi dosyalarıyla kalır; devir yalnız açılışta olur.
0021'in "ilk yeniden yüklemede" maddesinin yerini alır.

## Sonuç

Ağ yoksa ya da kurulum süreyi aşarsa sayfa eldeki sürümle açılır, yeni sürüm sonraki
açılışta başlar. Her açılışa bir `sw.js` isteği eklenir. Bu düzeltme de `boot.ts` içinde
olduğu için 0.7.46 öncesinde kalan tarayıcı yeni sürümü bir kez iki açılışta alır.
