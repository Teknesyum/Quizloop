# Renk Tazelemesi — teknesyum-ui 0.26.0

Sahibin paleti değişti: renk-1 `#6fb7ff → #4da6ff`, renk-2 `#cba7d2 → #de7ef1`, renk-3 `#c3a3ff → #b68fff`, köşe yarıçapı `3 → 4 px`.

| Adım | Sonuç |
|---|---|
| `setup.js --apply` | 6 dosya yazıldı (`teknesyum-ui/css`, `teknesyum-ui/react`, `theme.tokens.json`) |
| `esle.js --denetle` | düzen eşleşmesi 0 fark |
| Elle yazılmış renk | Yok. Tek ham değer `app.css` içindeki iki `mask-image` siyahı; renk değil, saydamlık maskesi |
| Kayıtlı tema seçimi | Yok. Program yalnız koyu temayla çalışıyor, ayar dosyasında palet adı tutulmuyor |
| Gerçek profil | `%APPDATA%\quizloop` kopyasıyla açıldı, 12 ekran, 54 ölçüm: kesin 0, belirsiz 0, hedef 0 ([axe](kanit/renk)) |
| Önizleme ↔ uygulama | [düğmeler ↔ oturum](yanyana-dugmeler--oturum-siklar.png), [renkler ↔ kütüphane](yanyana-renkler--kutuphane.png) |

Kuruluş doğru: `src/renderer/src/main.tsx` temayı doğrudan `teknesyum-ui/css/theme.css` dosyasından alıyor, bileşenler yalnız `var(--tk-*)` okuyor. Tazeleme tek komutla bitti.

Simge: yeni simge sahibin onayını beklediği için bu sürümde eski simge geri kondu (`build/icon.*`, `resources/icon.png`, 4f2f08b öncesi). Üreteç `scripts/icon.mjs` duruyor.
