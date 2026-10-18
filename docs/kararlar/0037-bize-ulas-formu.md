# 0037 — Bize Ulaş Uygulama İçi Form Olur, Özel Depoya Konu Açar

Tarih: 2026-10-18. 0028 ve 0031'in yerini alır; 0030'un "Bize Ulaş bağlantı açar" maddesini
kaldırır.

## Sahibin Sözü

"Bize ulaş kısmı gite yönlendirmeyecek, direkt uygulama içinden bize bir form dolduracaklar;
Teknesyum Private'a bir issue atabilecekler. Okuma ve yazma anahtarını gömmeyi göze almıştık."

## Karar

- Bize Ulaş (Ayarlar, üst menü, Katalog) artık `ContactDialog` penceresini açar. Form
  teknesyum-ui'nin hazır `bildirim` parçasıdır (`teknesyum-ui/bildirim/`): not, isteğe bağlı
  iletişim satırı, isteğe bağlı tek görüntü (JPEG, uzun kenar ≤1600 px, ≤150 KB).
- Gönderim `Teknesyum/Teknesyum-Private` deposuna konu olarak gider; etiketler `bildirim`,
  `app:quizloop`. Görüntü ilk yorumdur.
- Anahtar ince taneli, yalnızca o depo, yalnızca Issues okuma-yazma. Derlemede
  `TEKNESYUM_BILDIRIM_KEY` ortam değişkeninden parçalanarak gömülür
  (`npm run bildirim:anahtar`); üretilen dosya git'e girmez. `build`, `web:build` ve
  `android:build` anahtar yoksa durur. Geliştirme sunucusunda anahtar yoksa form kapalı
  görünür.
- Herkese açık `issues/new` bağlantısı ve `app.openContact` köprüsü kaldırıldı.
- CSP `connect-src`'ye `https://api.github.com` eklendi (masaüstü, Android; web zaten
  `https:` açık).

## Sonuç

Anahtar sızarsa yapılabilecek en kötü şey özel depoya konu yazmak ya da okumaktır; 401
gelirse form "uygulamayı güncelle" der, anahtar yenilenip yeni sürüm çıkarılır. Gizlilik
metinleri (PRIVACY.md, docs/PRIVACY.tr.md) ve Play veri güvenliği formu buna göre güncellenir.
