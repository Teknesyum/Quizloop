# Görsel envanteri — LANGE 7. Baskı

Ölçüm betiği: `scratchpad/olc3.py` (pymupdf 1.26.4), altyazılar `sources/lange-anestezi-7/pages.jsonl`.

## PDF'in yapısı

PDF taranmış. Her gövde sayfası (PDF 22–1411) tam sayfa arka plan görüntüsü taşıyor;
metin katmanı bunun üstünde OCR olarak duruyor. `pypdf` metni temiz UTF-8 veriyor,
`pymupdf` aynı metni bozuk kod sayfasıyla veriyor — altyazılar korpustan okunmalı.

Karar 0005'teki "2550 gömülü görsel" sayımı bu tam sayfa taramalarını da içeriyordu.
Gerçek şekil sayısı aşağıdaki gibi.

## Sayılar

    sayfa başına büyük görsel dağılımı   {1: 973, 2: 256, 3: 119, 4: 30, 5: 9, 6: 2, 7: 1}
    tam sayfa tarama                     1390 (her gövde sayfasında 1)
    şekil taşıyan sayfa                  415
    toplam şekil                         634
    altyazısı bulunan şekilli sayfa      394 / 415
    altyazı (ŞEKİL n-m)                  492
    altyazılı sayfadaki şekil            612 / 634
    şekil taşıyan birim                  187 / 322

Şekiller tam sayfa taramanın üstünde ayrı görüntü nesneleri olarak duruyor, bbox'ları
sayfanın küçük bir bölgesi. Kırpma gerekmiyor; nesne doğrudan çıkarılabilir.

## Uygulama tarafı

Şema ve arayüz hazır: `src/shared/schema/question.ts` `imageRef`,
`src/renderer/src/screens/Session.tsx` gövde ve şık görselini basıyor,
`tools/quizforge/src/verify.ts` eksik varlığı hata sayıyor. Kod işi yok.
