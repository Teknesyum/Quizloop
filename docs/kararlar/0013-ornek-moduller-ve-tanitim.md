# 0013 — Örnek Modüller Ve İlk Açılış Tanıtımı

Tarih: 2026-10-04. Sahibin sözü: "modül ismi dahil açıklayıcı olsun, 'modül dosyasını
içeri aktar' ne demek diye soruyor insanlar, bizim çok açıklayıcı olmamız lazım."

**Karar.** Uygulama iki örnek modülle gelir, ilk açılışta bir kez tanıtım penceresi
gösterir, Kütüphane'deki düğme adları ne yaptığını söyler.

## Örnek Modüller

| Kimlik | Ad | İçerik |
|---|---|---|
| `quizloop-rehberi` | QuizLoop Rehberi: Uygulama Nasıl Kullanılır | Uygulamayı soru çözerek anlatır, 4 bölüm |
| `genel-kultur` | Genel Kültür: Kolaydan Zora | Kolay, orta, zor üç bölüm; özgün sorular |

Genel kültür modülü bir televizyon yarışmasının adını da sorularını da kullanmaz: ad
marka, sorular telif konusudur. Yalnızca "kolaydan zora" düzeni alındı.

Modüller metin düzeyinde kalır: kapak, görsel ve PDF yok. Her sorunun kaynağı modülün
kendi `notlar.md` dosyasıdır; alıntı o dosyada harfi harfine bulunur.

## Nerede Durur

- Taslak: `scripts/ornek/<ad>.json` (bölüm metinleri ve sorular, elle yazılır).
- Üretim: `npm run ornek` taslağı doğrular, şıkları karıştırır, özetleri hesaplar ve
  `resources/ornek/<kimlik>/` altına yazar. Çıktı elle düzeltilmez; özet tutmaz olur.
- `resources/` kod paketinin içindedir (karar 0011), yani örnekler kurucusuz güncellenir.

`electron-builder.yml` içindeki `modules/_ornek → ornek` satırı yerinde bırakıldı: o dosya
kabuk anahtarına girer, dokunmak sıradaki sürümü kurucuya zorlardı. Satır artık boş bir
kaynağı gösterir; kabuk başka bir nedenle değiştiğinde silinir.

Eski `modules/_ornek` test verisi olarak `src/core/testdata/ornek/` altına taşındı. Karar
0012'deki "`modules/` içinde yalnızca `_ornek/` depoda" satırı böylece düşer: `modules/`
bütünüyle depo dışıdır.

## Tanıtım Penceresi

Dört not: modül nedir, kendi modülün nasıl eklenir, nasıl çalışılır, veri nerede kalır.
`welcomeSeen` ayarı kapatınca `true` olur; pencere bir daha kendiliğinden açılmaz.
Kütüphane'deki "Nasıl kullanılır?" ve Ayarlar › Hakkında'daki "Tanıtımı yeniden göster"
aynı pencereyi açar.

Eski sürümden gelen kullanıcı da pencereyi bir kez görür; kurulu `ornek` modülü yerinde
kalır, yeni iki modül "Örnek modülleri kur" ile gelir.

## Düğme Adları

"İçeri aktar" yerine "Modül dosyası ekle"; "Klasör ekle" yerine "Klasörden kur"; her
düğmenin üzerine gelince ne yaptığı yazar. Boş kütüphane metni `.qlmod` dosyasının ne
olduğunu söyler.
