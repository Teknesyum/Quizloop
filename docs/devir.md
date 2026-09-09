# Devir — Quizloop

Son güncelleme: 2026-09-09 17:05. "git pull ve devam et" denince okunacak tek
dosya budur. Sonraki adım aşağıda **Sıradaki iş** başlığında.

## Ne aşamadayız

**Uygulama (motor) hazır ve yeşil.** Electron 42 + React 19 iskeleti çalışıyor;
kütüphane, oturum, özet ve ayarlar ekranları canlı, FSRS-6 zamanlaması ve SQLite
ilerleme veritabanı yerinde. `npm run typecheck`, `npm test` (29 test), `npm run
lint` (0 hata, 2 bilinen exhaustive-deps uyarısı) temiz; CI üç işletim
sisteminde yeşil. Son doğrulama bu devir turunda yapıldı.

**Modül üretimi (quizforge) yarıda.** LANGE 7. baskı için:

| Aşama | Durum |
| --- | --- |
| Metin geçişi | Bitti — `build/units/` 322 birim, 2564 soru |
| Görsel geçişi | **150 / 187 birim.** `build/rawgorsel/` içinde 429 soru bekliyor |
| Birleştirme | Yapılmadı — görsel sorular `raw/` içine eklenmedi |
| Paket | 2026-09-09 06:04 tarihli, 51 blok, 2532 soru, **görselsiz ve bir tur eski** |

Sekiz sorunun altında kalan beş birim var: `b19-p363-365` kaynakça olduğu için
kalıcı olarak 0; `b16-p286-290`, `b23-p531-534`, `b41-p913-917`,
`b52-p1260-1267` yedişer soruda kaldı (ingest birer soru düşürdü).

## Sıradaki iş

**1. Görsel kuyruğunu bitir (37 birim).** Kuyruk dosyaya bağlı değil, farktan
üretilir:

    cd sources/lange-anestezi-7/build
    ls gorsel | sed 's/\.md$//' | sort > /tmp/a.txt
    ls rawgorsel | sed 's/\.json$//' | sort > /tmp/b.txt
    comm -23 /tmp/a.txt /tmp/b.txt

Her birim için bir Sonnet alt ajanı, aynı anda en çok 20 tane. Ajan istemi
birebir şudur:

    Görev dosyası: C:\Users\Teknesyum\Desktop\Projeler\QuizLoop\sources\lange-anestezi-7\build\gorsel\<birim>.md

    Bu dosyayı oku ve içindeki talimatı harfiyen uygula. "## Bu tur: görsel sorular"
    bölümünde listelenen her PNG'yi Read aracıyla aç ve gerçekten bak. Sadece JSON'u
    üret ve `RAW:` yolundaki dosyaya Write ile yaz. Başka dosyaya dokunma.

    Kritik: `alinti` kaynak metinden HARFİ HARFİNE kopyalanmalı. `gorsel` alanına
    şekil dosya adını yaz. Bitince tek satır rapor: kaç soru, kaç şekil atlandı.

Tavan aşılırsa "Concurrent subagent limit reached" döner ve o gönderim kaybolur;
biriminin kuyrukta kalmasına dikkat et.

**2. Kuyruk boşalınca birleştir.** Ekleme yapar; ingest kötü olanı zaten düşürür:

    cd sources/lange-anestezi-7/build
    node -e "const fs=require('fs');let a=0;for(const f of fs.readdirSync('rawgorsel')){const x=JSON.parse(fs.readFileSync('rawgorsel/'+f,'utf8'));const o=JSON.parse(fs.readFileSync('raw/'+f,'utf8'));o.sorular=o.sorular.concat(x.sorular);a+=x.sorular.length;fs.writeFileSync('raw/'+f,JSON.stringify(o,null,2));}console.log('eklenen',a)"

**3. Yeniden üret.** Üçü de aynı kural dosyasıyla, adı `rules.yaml` (`.yml`
değil):

    node --experimental-strip-types tools/quizforge/src/cli.ts ingest --rules "sources/lange-anestezi-7/rules.yaml"

Sonra `verify`, sonra `pack`. Paket `assets/img/` altına PNG kopyalar; `verify`
dosyası eksikse `asset` hatası verir.

**4. Paketi uygulamada aç.** `npm run dev`, modülü kur, görselli bir soruya kadar
git. Bu tur hiç yapılmadı — görselli soru uygulamada henüz görülmedi.

## Bilinmesi gerekenler

Kaynak PDF taranmış, üstünde OCR katmanı var. Altyazılar `pages.jsonl`'den
okunur; pymupdf bozuk karakter döndürüyor.

Sayfa sözleşmesi karar 0004'te: gövde PDF 22–1411, `source.pages` kitap
sayfasını taşır, `sayfaOfseti: 21`.

Görsel kuralları karar 0005'te: sabit kota yok, şekil başına en çok bir soru,
cevap sızıntısı olan şekil kökte gösterilmez — `gorsel` boş bırakılıp
`cozumGorseli` doldurulur. Şekil envanteri `docs/olcumler/0001`'de: 634 şekil,
415 sayfada.

Şema yuvaları: `stem.imageRef`, `choice.imageRef`, çözümde `image{ref, caption}`.

Blok özetleri satır sonundan bağımsızdır: okuyucu da paketleyici de BOM'u atıp
CRLF'i LF'e katlayarak hash alır.

## Git dışında kalanlar

`sources/**/build/`, `sources/**/pages.jsonl`, `modules/*` (yalnız `_ornek`
girer) ve `database/` gitignore'da — telifli kaynak ve ondan türeyen her şey
depo dışıdır. Tamamının yedeği `D:\!Tmp\Projeler\QuizLoop` altındadır ve bu
turda tazelendi:

    build\        196 MB   birim, raw, rawgorsel, görev dosyaları, şekil PNG'leri
    pages.jsonl   4,9 MB   sayfa korpusu
    modules\      5,9 MB   paketlenmiş lange-anestezi-7
    database\     393 MB   LANGE 7. BASKI.pdf

Yeni bir makinede çalışılacaksa `build\` ve `pages.jsonl`
`sources/lange-anestezi-7/` içine, `modules\lange-anestezi-7` proje kökündeki
`modules/` içine, PDF ise `database/` içine geri konur.
