[[netlestirme:006]]

# Netleştirme: Koyu neon bir arayüzde kaynak alıntısı bloğu nasıl kağıt gibi ve nostaljik yapıl

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

Koyu neon bir arayüzde kaynak alıntısı bloğu nasıl kağıt gibi ve nostaljik yapılır

## Elde olan olgular

# Kaynak alıntısı için tasarım

Kullanıcının cümlesi, birebir:

> kaynak basımı kısmının tasarımı sanki yapay kağıt üzerine yazılmış gibi olmalı biraz nostaljik olaiblir belki bir kağıt vb fable a sorabilirsin ama alıntı olduğu belli olsun

## Bağlam

Quizloop, Electron + React bir aralıklı tekrar uygulaması. Arayüz koyu: zemin `#08090a`,
metin açık gri, vurgular neon camgöbeği (`#00f3ff`), pembe ve mor. Tüm renk ve ölçüler
`teknesyum-ui` token'larından geliyor; token dışı renk/ölçü uydurulamıyor. Mevcut
token'lar arasında kağıt tonu (bej, krem, kahve) **yok**.

Soru çözüldükten sonra ekranda "Kaynak" bloğu açılıyor. İçeriği: kitaptan birebir bir
alıntı (tırnak içinde, 1-3 cümle), altında dosya adı ve sayfa aralığı.

Şu anki biçimi düz: soldan 2px gri çizgi, iç boşluk, üstte "KAYNAK" etiketi, ortada
tırnaklı paragraf, altta küçük gri künye satırı. Yani alıntı olduğu yeterince belli değil
ve hiç karakteri yok.

## Sorum

Koyu, neon bir arayüzün ortasında "yapay kağıt üzerine yazılmış, biraz nostaljik, alıntı
olduğu belli" bir blok nasıl kurulur? Özellikle:

1. Kağıt hissi koyu temada nasıl verilir — açık renkli gerçek bir kağıt yüzeyi mi
   (kontrast sıçraması pahasına), yoksa koyu kalıp doku/kenar/tipografi ile mi?
2. Doku için CSS ile üretilebilecek (harici görsel olmadan, `repeating-linear-gradient`,
   `radial-gradient`, `box-shadow` gibi) hangi yöntem inandırıcı olur, hangileri ucuz
   durur?
3. "Alıntı" işareti olarak ne kullanılmalı — büyük açılış tırnağı, kenar çizgisi, daktilo
   tipografisi, eski kitap künyesi gibi bir alt satır?
4. Palet token'la sınırlıyken nostaljik his rengi olmadan nasıl elde edilir? Sadece
   `filter: sepia()` gibi bir hile önerir misin, yoksa kaçınmalı mıyım?

Somut CSS önerileri istiyorum, kısa gerekçelerle.
