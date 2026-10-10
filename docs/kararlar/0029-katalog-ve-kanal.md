# 0029 — Katalog Ve Kanal

Tarih: 2026-10-10

## Sorun

Sahibinin sözü: "dosyayı içeri aktar değil de falana abone ol, o her güncellendiğinde
güncellensin" ve "kanalları biz sunmayacağız, kanal içeriğinden mesul olmamalıyız".

Ardından: "kullanıcı tek bir link yapıştıracak onaylayacak, oradan bir kanal listesi çıkacak,
istediğine abone olacak ... bu istediklerini gelecekte de değiştirebilecek".

## Terimler

- **Katalog**: bir yayıncının tek adresi. O adreste bir JSON dosyası durur; kanalları sayar.
- **Kanal**: katalogdaki tek satır. Bir modülü ve onun güncel paketini gösterir.
- **Abonelik**: kullanıcının bir kanalı seçmesi. Modül kurulur, yeni sürümü kendiliğinden gelir.

Sahibi konuşurken "sokak" ve "dükkân" demişti; bunlar anlatım içindi, üründe kullanılmaz.
"Kaynak" sözü seçilmedi: projede o söz sorunun kitaptaki dayanağıdır (`kaynak`).

## Karar

Uygulama yalnız okuyucudur. Katalog dosyasını da paketleri de yayıncı kendi adresinde tutar.
Biz sunucu, arama, öneri ya da liste barındırmayız; kimin neye abone olduğunu bilmeyiz.

Katalog dosyası (`schema/catalog.schema.json`):

```json
{
  "schemaVersion": 1,
  "name": "Katalog Adı",
  "publisher": "Yayıncı",
  "contact": "iletisim@ornek.dev",
  "channels": [
    {
      "id": "modul-kimligi",
      "name": "Görünen Ad",
      "description": "Bir iki cümle.",
      "version": "1.2.0",
      "package": "paket/modul-kimligi-1.2.0.qlmod",
      "size": 1048576,
      "sha256": "64 onaltılık hane",
      "questionCount": 450
    }
  ]
}
```

`package` katalog adresine göre ya da tam adres olarak yazılır.

## Kurallar

1. Adres `https` olmalıdır. Yalnız `localhost` ve `127.0.0.1` için `http` açıktır; yayıncı
   kendi makinesinde dener. Adreste kullanıcı adı ya da parola olamaz.
2. Katalog eklenmeden önce uyarı çıkar: içerik QuizLoop'a ait değildir. Yayıncı adı ve adres
   katalog panelinde hep görünür; kütüphane kartının etiket satırına alan adı eklenir.
3. İndirilen paketin boyutu ve SHA-256 özeti katalogdakiyle karşılaştırılır. Tutmazsa kurulmaz,
   eski sürüm yerinde kalır. Paketin içindeki modül kimliği kanal kimliğiyle aynı olmalıdır.
4. Yeni sürüm sormadan kurulur (0017). Eski sürüme dönüş sorulur.
5. Yoklama açılışta ve en çok 12 saatte bir yapılır; oturum sırasında yapılmaz.
6. Aboneliği bırakmak ya da kataloğu kaldırmak modülü ve ilerlemeyi silmez; yalnız güncelleme
   durur. Modülü kütüphaneden silmek aboneliğini de kapatır.
7. Bir modüle aynı anda tek katalogdan abone olunur.
8. Kanal yalnız veri taşır; `.qlmod` içinde çalışan kod yoktur.
9. Hiçbir üçüncü taraf kataloğu uygulamaya gömülmez, sitede ve README'de önerilmez.
10. Kendi adımızla yayınladığımız katalogdan biz sorumluyuz. Lange ve hafızlık modülleri açık
    bir kataloğa konmaz.

## Güvenlik Notu

Web sürümünün içerik güvenlik kuralı `connect-src 'self' https:` oldu; yoksa tarayıcı
yayıncının adresine ulaşamaz. Betik kuralı değişmedi, dışarıdan kod yüklenemez. Web sürümü
ayrıca yayıncının sunucusunun CORS izni vermesine bağlıdır.

Masaüstünde yönlendirilen adres yeniden denetlenir; katalog dosyası 1 MB ile sınırlıdır.

## Platformlar

Masaüstü ve web: açık. Android: kapalı (`capabilities.catalogs: false`). Play'in "Kullanıcı
Tarafından Oluşturulan İçerik" politikası okunmadan açılmaz.

## Kalan İşler

`docs/later.md` içinde: `quizforge` katalog yayınlama komutu, Play politika kontrolü, sitede
şikâyet için iletişim satırı.

## Doğrulama

2026-10-10, gerçek masaüstü penceresi, yerel deneme kataloğu: adres yapıştırma, uyarı, kanal
listesi, abonelik, kartta alan adı, sürüm yükselince kendiliğinden güncelleme, bozuk özetin
reddi, aboneliği bırakma ve kataloğu kaldırma denendi. Gerçek bir `https` yayıncısı ve web
sürümü denenmedi.
