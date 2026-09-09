[[netlestirme:007]]

# Netleştirme: Turkce soru kokunde fiil icermeyen vurgu ifadelerini modele guvenmeden nasil gar

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

Turkce soru kokunde fiil icermeyen vurgu ifadelerini modele guvenmeden nasil garanti ederim

## Elde olan olgular

# Soru kökünde vurgulanacak ifadeleri kim seçmeli

Kullanıcının cümlesi, birebir:

> "yapay ventilasyon uygulanıyor" vurgulanmış mesela hiç bir fiil vurgulanmamalı bu işi sonnet yapamaz mı yada senin dediğin gibi mi yapmalıyım

## Bağlam

Quizloop, anestezi ders kitabından üretilmiş 2532 çoktan seçmeli sorudan oluşan bir
aralıklı tekrar uygulaması. Soru kökü Türkçe, ortalama 182 karakter.

Ekranda soru okunurken kökteki bazı ifadeler renklendiriliyor — biri camgöbeği, biri
pembe, sırayla. Amaç: kullanıcı sadece boyalı yerlere baksa klinik durumu ve sorunun
neyi sorduğunu anlayabilsin.

Önceki hal: vurgu, sorunun `tags` alanıyla metnin kelime kesişimiydi. Etiketlerde
olmayan bir tamlama hiç yakalanamıyordu. Bu yüzden vurgu, veriye taşındı: her soruya
`vurgu: string[]` alanı eklendi, kökte birebir geçen, en fazla üç kelimelik ifadeler.
Şema, arayüz ve uygulama betiği hazır ve çalışıyor.

Bir blok (50 soru) Sonnet ile pilot olarak işaretlendi. Sonuç mekanik olarak temiz:
150 ifade, hepsi kökte birebir geçiyor, en uzunu üç kelime. Ama dilbilgisel olarak
tutarsız. Kullanıcının yakaladığı örnek:

- "yapay ventilasyon uygulanıyor" — fiil çekimi içeriyor, olmamalı.
- "cerrahı sorumlu tutan" — sıfat-fiil, tartışmalı.
- "kabul görmeden önceki" — fiilimsi, olmamalı.
- "Perioperatif bakımın" — doğru.
- "genel anestezinin fizyolojisini" — doğru.

İlk turda ajana "tamlama olsun, fiil çekimi olmasın" denmişti; ikinci turda "en fazla
üç kelime" sınırı eklendi. Fiil sızıntısı iki turda da sürdü.

Maliyet: pilot blok iki turda 240 bin token yaktı, çünkü ajan blok dosyasının tamamını
(şıklar, çeldiriciler, çözüm, kaynak) okuyordu. Ucuzlatılmış tasarımda ajana yalnız
`id + stem.md` çifti veriliyor, blok başına ~15 bin token; 50 blok için ~750 bin token.

## Sorum

Kullanıcı iki yolu karşılaştırıyor: (a) bu işi bir dil modeline (Sonnet) yaptırmak,
(b) benim önerdiğim veri alanı + toplu model taraması yolu. Aslında ikisi aynı şey;
kullanıcının asıl derdi, modelin fiil seçmeye devam etmesi.

Bilmek istediğim: Türkçe bir soru kökünde "fiil içermeyen isim/sıfat tamlaması"
kısıtını modele güvenmeden nasıl garanti ederim? Model çıktısını kabul etmeden önce
deterministik bir süzgeçten geçirmek istiyorum — ekli fiil, fiilimsi (-en, -an, -dık,
-mış, -ıyor, -acak) ve çekimli yüklem içeren adayları eleyecek bir kural kümesi kurulabilir
mi, yoksa Türkçe'de bu ekler isimleşmiş sözcüklerde de geçtiği için yanlış eleme mi
yapar? Alternatif olarak modele mi güvenmeli, yoksa süzgeç eleyince ifade sayısı çok mu
düşer?
