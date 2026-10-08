# 0028 — Tek Dokunuşla Sorun Bildirimi

Tarih: 2026-10-08

## Sorun

Sahibinin sözü: "debug tuşu olsun 1 kere basınca ekran görüntüsü alıp bize atsın ayrıca
kullanıcı ek not yazabilsin ekran görüntüsü aldığımızı söylemene gerek yok güzel hızlı
kullanışlı kullanıcıyı yormayan 10 tane onay istemeyen bir sorun bildirim sistemi yapalım".
Ardından: "bildirim githuba issue atılsın".

Bir hata telefonda görülünce elimize yalnızca bir fotoğraf geçiyordu; hangi sürüm, hangi modül,
hangi soru olduğu bilinmiyordu.

## Karar

Sol alt köşede küçük bir "!" tuşu durur. Bir dokunuş ekranın görüntüsünü alır ve gönderir;
onay sorulmaz. Başarı bildiriminde "Not Ekle" bağlantısı çıkar, isteyen birkaç satır yazar.

Bildirim özel `Teknesyum/quizloop-bildirim` deposuna issue olarak düşer. Başlıkta platform,
sürüm, ekran ve soru kimliği; gövdede dil, pencere ölçüsü, tarayıcı kimliği ve görüntü vardır.
Not, aynı issue'ya yorum olarak eklenir.

## Neden Araya Bir Aktarıcı Girdi

Uygulama herkese açık bir depodan derlenir ve tarayıcıda çalışır; içine konan bir GitHub
anahtarını herkes okuyabilir, GitHub da açığa çıkan anahtarı kendiliğinden iptal eder.

Bu yüzden anahtar bir Cloudflare Worker'da (küçük, sunucusuz bir aktarıcı) durur:
`tools/bildirim`. Uygulama yalnızca onun adresini bilir. Anahtar tek depoya, yalnızca Issues
ve Contents yetkisiyle sınırlıdır.

Aktarıcı ilk çağrıda issue numarasının imzasını (HMAC) döndürür. Not çağrısı bu imzayı taşır;
böylece bir issue'ya yalnızca onu açan kişi not ekleyebilir.

## Gizlilik

Görüntü yalnızca uygulamanın kendi penceresidir; başka bir uygulama ya da cihaz ekranı
alınmaz. Ad, e-posta ya da cihaz kimliği gönderilmez. Depo özeldir. Kullanıcının yazdığı metin
issue'ya düzleştirilerek ya da kod çiti içinde girer; kimseyi etiketleyemez.

Play Store veri güvenliği formuna "uygulama içi ekran görüntüsü, isteğe bağlı, hata tanılama
için" satırı eklenmelidir.

## Ölçüm

Yerel aktarıcı ve başsız Chrome ile: dokunuştan başarı bildirimine 2,4 saniye, görüntü 900
piksel genişlikte 42 KB. Görüntü 4 saniyede alınamazsa bildirim görüntüsüz gider.

Arka plandaki (gizli) bir sekmede tarayıcı çizim yapmadığı için görüntü alınamaz; kullanıcı
tuşa bastığına göre bu durum gerçek kullanımda oluşmaz.

## Açık Kalanlar

- `REPORT_URL` boşken tuş görünmez. Aktarıcı yayınlanınca adres `src/shared/bildirim.ts`
  dosyasına ve dört CSP satırına yazılır.
- Aktarıcıda hız sınırı yok. Kötüye kullanım görülürse Cloudflare'in hız sınırı kuralı eklenir.
- iOS Safari'de görüntünün doğruluğu cihazda denenmedi.
