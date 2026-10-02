# QuizLoop Gizlilik Politikası

Yürürlük tarihi: 2026-10-02

QuizLoop, Teknesyum tarafından yayımlanan; Android, Windows, macOS ve Linux için
ücretsiz, açık kaynaklı (AGPL-3.0-or-later) bir aralıklı tekrarlı soru çalışma
uygulamasıdır. Bu politika uygulamanın verilerle ne yaptığını anlatır. Kısaca:
**çalışma verileriniz cihazınızda kalır; hesap, reklam ve analitik yoktur.**

English version: [PRIVACY.md](../PRIVACY.md)

## Uygulamanın sakladıkları

Aşağıdakilerin tümü yalnızca cihazınızda saklanır ve bize gönderilmez:

- Çalışma ilerlemeniz: cevaplar, puanlar, tekrar takvimi, emekli olan sorular ve
  oturum geçmişi.
- İşaretlediğiniz sorular ve işarete isteğe bağlı yazdığınız not.
- Ayarlarınız (gün başlangıç saati, yazı hızı, yazı boyutu vb.).
- Kurduğunuz soru modülleri: uygulamayla gelen örnek modül ve kendiniz içeri
  aldığınız `.qlmod` paketleri (içindeki kaynak kitap PDF'i dahil).

QuizLoop içerik getirmez. Hangi modülü içeri alacağınızı siz seçersiniz. Seçtiğiniz
dosyalar cihazda okunur, hiçbir yere yüklenmez.

## Uygulamanın yapmadıkları

- Hesap, oturum açma ya da kayıt yoktur.
- Reklam ve reklam kimliği yoktur.
- Analitik, çökme raporlama, izleme ya da profilleme kitaplığı yoktur.
- Rehbere, konuma, kameraya, mikrofona, fotoğraflara ya da telefon
  tanımlayıcılarına erişilmez.
- Kişisel veri toplanmadığı için satılacak ya da paylaşılacak bir şey yoktur.

## Ağ kullanımı

Uygulama tümüyle çevrim dışı çalışır. Ağa yalnızca bir durumda bağlanır: Ayarlar'da
**Güncellemeleri denetle** düğmesine bastığınızda. Uygulama o zaman en son sürüm
etiketini kurulu sürümle karşılaştırmak için
`https://api.github.com/repos/Teknesyum/Quizloop/releases/latest` adresini ister.
Sizinle ya da çalışma verilerinizle ilgili hiçbir bilgi göndermez. Her web
isteğinde olduğu gibi GitHub IP adresinizi ve olağan istek başlıklarını görür ve
bunları
[GitHub Gizlilik Beyanı](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)
uyarınca işler. Uygulama kendiliğinden güncelleme denetimi yapmaz.

Güncelleme bildirimini ya da kaynak kodu bağlantısını açarsanız tarayıcınızda bir
GitHub sayfası açılır. O ziyaret GitHub'ın politikasına tabidir.

Masaüstü sürümleri de aynıdır: tek ağ isteği, kendi başlattığınız güncelleme
denetimidir.

## Android izinleri

- `INTERNET`: yalnızca yukarıdaki güncelleme denetimi için.
- Uygulama depolama, konum, kamera, mikrofon ya da rehber izni istemez. Modüller
  Android'in sistem dosya seçicisiyle içeri alınır; uygulama yalnızca seçtiğiniz
  dosyaya erişir.

## Yedekleme

Android'de sistem, QuizLoop verisini Google'ın otomatik yedeğine (Android Auto
Backup) ve cihazdan cihaza aktarıma dahil edebilir. Yedek ilerleme veritabanını ve
ayarları içerir. Kurulu modüller ve uygulamanın `backups/` klasöründeki yerel
veritabanı kopyaları dışarıda bırakılır. Bu yedeği Google ve Google hesabınız kendi
şartlarıyla yönetir; Android sistem ayarlarından kapatabilirsiniz. Biz yedeğe
erişmeyiz.

## Saklama ve silme

Veri yalnızca cihazınızda durduğu için denetim sizdedir. Bir modülün ilerlemesini
**Sıfırla** ile, modülü **Modülü kaldır** ile silebilir; uygulamayı kaldırarak
uygulamanın sakladığı her şeyi silebilirsiniz. Android yedeği kullandıysanız onu
Google hesap ayarlarınızdan silersiniz.

## Çocuklar

QuizLoop genel amaçlı bir çalışma aracıdır; 13 yaşından küçük çocuklara yönelik
değildir. Kimseden kişisel bilgi toplamaz.

## Değişiklikler

Politika değişirse yeni sürüm yeni yürürlük tarihiyle bu depoda yayımlanır.

## İletişim

<https://github.com/Teknesyum/Quizloop/issues> adresinde bir konu açın.
