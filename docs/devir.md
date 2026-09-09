# Devir — LANGE 7. Baskı Modülü

Son güncelleme: 2026-09-09. Bu dosya yeni bir oturumun "git pull ve devam et"
dedikten sonra okuyacağı tek dosyadır.

## Nerede kaldık

Metin geçişi bitti: `build/units/` içinde 322 birim, toplam **2564 soru**.
Sekiz sorunun altında kalan 5 birim var — `b19-p363-365` kaynakça bölümü olduğu
için kalıcı olarak 0; `b16-p286-290`, `b23-p531-534`, `b41-p913-917`,
`b52-p1260-1267` yedişer soruda kaldı (ingest bir soruyu düşürdü).

Görsel geçişi yarıda: 187 birimin **150'si** bitti, `build/rawgorsel/` içinde
**429 görsel soru** duruyor. Kuyrukta **37 birim** kaldı. Bu sorular henüz
`raw/` ile birleştirilmedi, dolayısıyla `units/` ve paket bunları görmüyor.

## Kaldığın yerden sürme

Kuyruk dosyaya bağlı değil, farktan üretilir:

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

## Kuyruk boşalınca

1. `rawgorsel` → `raw` birleştirme (ekleme; ingest kötü olanı zaten düşürür):

        cd sources/lange-anestezi-7/build
        node -e "const fs=require('fs');let a=0;for(const f of fs.readdirSync('rawgorsel')){const x=JSON.parse(fs.readFileSync('rawgorsel/'+f,'utf8'));const o=JSON.parse(fs.readFileSync('raw/'+f,'utf8'));o.sorular=o.sorular.concat(x.sorular);a+=x.sorular.length;fs.writeFileSync('raw/'+f,JSON.stringify(o,null,2));}console.log('eklenen',a)"

2. `ingest` → `verify` → `pack`, hepsi aynı kural dosyasıyla:

        node --experimental-strip-types tools/quizforge/src/cli.ts ingest --rules "sources/lange-anestezi-7/rules.yaml"

   Kural dosyasının adı `rules.yaml`, `.yml` değil.

## Bilinmesi gerekenler

Kaynak PDF taranmış, üstünde OCR katmanı var. Altyazılar `pages.jsonl`'den
okunur; pymupdf bozuk karakter döndürüyor.

Sayfa sözleşmesi karar 0004'te: gövde PDF 22–1411, `source.pages` kitap
sayfasını taşır, `sayfaOfseti: 21`.

Görsel kuralları karar 0005'te: sabit kota yok, şekil başına en çok bir soru,
cevap sızıntısı olan şekil kökte gösterilmez — `gorsel` boş bırakılıp
`cozumGorseli` doldurulur.

Şema yuvaları: `stem.imageRef`, `choice.imageRef`, çözümde `image{ref, caption}`.
`pack` referans verilen PNG'leri `assets/img/` altına kopyalar, `verify` dosyası
yoksa `asset` hatası verir.

## Git dışında kalanlar

`sources/**/build/`, `sources/**/pages.jsonl` ve `database/` gitignore'da —
telifli kaynak ve ondan türeyen her şey depoya girmez. Bunların yedeği
`D:\!Tmp\Projeler\QuizLoop` altındadır. Yeni makinede çalışılacaksa bu klasör
`sources/lange-anestezi-7/` içine geri konmalıdır.
