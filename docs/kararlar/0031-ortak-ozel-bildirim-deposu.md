# 0031 — Ortak Özel Bildirim Deposu Ve Açık Görüntü Onayı

Tarih: 2026-10-10. Karar 0028'in iki maddesini değiştirir: deponun adı ve görüntünün
kullanıcıya sorulmadan alınması.

## Sahibin Sözü

"özel depo kalsın ancak ismini değiştireceğiz privateissues şeklinde bir repo kuracağız ve tüm
uygulamalarımızdan bu repoya issue alabileceğiz gelen issuelerin başlığı uygulama olacak".

"uygulama görüntüsü varsayılan olarak tikli olsun kullanıcının bilmediği bişeyi yapmayalım
kapatmak istediğinde sorunu net anlamamız için uygulama görüntüsü önemli ipuçları
içerebilmekte yinede kapatmak istiyor musun gibi bi uyarı çıksın".

## Karar

1. **Tek özel depo.** `Teknesyum/quizloop-bildirim` deposunun adı `Teknesyum/privateissues`
   oldu. Bütün Teknesyum uygulamaları aynı aktarıcıya (`tools/bildirim`) yazar. İstek `app`
   alanı taşır; issue başlığı `<uygulama>: <notun ilk sözcükleri>` biçimindedir, görüntüler
   `g/<uygulama>/<ay>/` altında durur. Uygulama adı düz bir ad değilse `Bilinmeyen` yazılır.
2. **Görüntü kullanıcının gözü önünde.** "!" tuşu artık hemen göndermez; bir pencere açar:
   not alanı, işaretli gelen "Uygulama görüntüsünü ekle" kutusu ve ne gönderildiğini söyleyen
   bir satır. Kutu kapatılmak istenirse uyarı çıkar; kullanıcı onaylarsa görüntü alınmaz.
   Not ve görüntü ikisi birden boşsa "Gönder" pasiftir.
3. **Tek çağrı.** Not ilk istekle birlikte gider. Sonradan not ekleme yolu (`/not`) ve onun
   imza anahtarı (`IMZA`) kaldırıldı; aktarıcının tek gizli değeri `GITHUB_TOKEN` kaldı.

## Neden

Habersiz alınan görüntü, özel depoda dursa bile kullanıcının bilmediği bir şeydi. 0028'deki
"onay istemeyen" hedef korunuyor: varsayılan yol hâlâ iki dokunuş (tuş, gönder), yalnız
kullanıcı neyin gittiğini görüyor.

Elle yazılan şikâyet ve öneriler (karar 0030, "Bize Ulaş") açık Quizloop deposunda kalır;
görüntü taşıyan bildirimler açık depoya konmaz.

## Açık Kalanlar

- Aktarıcı henüz yayınlanmadı; `REPORT_URL` boş olduğu için tuş görünmüyor. Yayın için
  Cloudflare hesabı ve yalnız `privateissues` deposuna yetkili bir GitHub anahtarı gerekir;
  ikisini de sahip girer.
- Uçtan uca gönderim (aktarıcı, issue, görüntü) yayından sonra denenecek.
- Play Store veri güvenliği formundaki satır "isteğe bağlı, kullanıcı onayıyla" olarak
  güncellenmeli.
