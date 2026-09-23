# Oturum Başlatma Ve Bellek — Dalga 3 Kabulü

Tarih 2026-09-23. Paketli yapı `dist/win-unpacked` (v0.1.0), Windows 11 Pro, CDP 9333.
Modül `lange-anestezi-7`, 3030 soru.

## Oturum Başlatma

`window.quizloop.session.start(moduleId)` beş kez, her birinin ardından `session.end`:

```
{"module":"lange-anestezi-7","cards":3030,"ms":[34,34,27,29,29]}
```

Kabul 300 ms altı: **geçti** (en kötü 34 ms).

## Bellek

Dört süreç toplamı, `Get-Process quizloop`:

```
açılış (kütüphane) : 4 proses, working set 451 MB, private 379 MB
oturum açık        : 4 proses, working set 466 MB, private 369 MB
yoğun kullanım     : 4 proses, working set 473 MB, private 359 MB
```

Yoğun kullanım: soru bankası (3030 satır), istatistik, ayarlar ekranları gezildikten sonra.

Süreç kırılımı (açılış):

```
main        ws 185 MB  private 124 MB
gpu-process ws 107 MB  private 170 MB
utility     ws  57 MB  private  16 MB
renderer    ws 115 MB  private  56 MB
```

Kabul 400 MB altı: **private ile geçiyor, working set ile geçmiyor.** Working set paylaşılan
Chromium DLL sayfalarını her süreçte yeniden sayıyor; kabulün hangi ölçüyle okunacağı karar
ister. Renderer'ın kendisi 56 MB private; en büyük pay GPU süreci ve main.

## Kurulumdan İlk Soruya

Temiz makine yok; ölçülen kısım pencere açılışından kütüphanenin çizilmesine: **884 ms**.
Kütüphaneden Enter, bölümlerden Enter ile ilk soru 2 tuş. Kurulum süresi v0.1.0 kurucusu ile
temiz makinede ölçülecek.
