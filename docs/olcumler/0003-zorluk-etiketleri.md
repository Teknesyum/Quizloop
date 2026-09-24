# Zorluk Etiketleri — Tek Ölçütle Yeniden Etiketleme

Tarih 2026-09-24. Modül `lange-anestezi-7`, 3030 soru. Ölçüt `tools/quizforge/src/zorluk.ts`
(`ZORLUK_OLCUTU`), karar `docs/kararlar/0007-zorluk-olcutu.md`. Etiketleyici: sonnet alt
ajanları, 100 soruluk 31 parti, 8 ajan.

## Ölçüt v1 — Terk Edildi

İlk sürümde K1 "alıntıda birebir geçen bilgi" idi. Her sorunun cevabı alıntıda geçtiği için
mekanizma soruları da kolaya kaydı ve ajanlar arasında kolay oranı partiden partiye değişti:

```
001 K1 73  O1 17  O2 8   Z2 2
006 K1 87  O1 7   O2 4   Z2 1  Z3 1
009 K1 57  O1 20  O2 11  Z2 5  Z3 7
017 K1 85  O1 8   O2 4   Z2 2  Z3 1
```

Koşu durduruldu. v2'de seviye, kaynağı görmeyen adayın yapacağı işe göre verildi; alıntı ve
eski etiket girişten çıkarıldı.

## Pilot — v2, İki Bağımsız Etiketleyici

Aynı rastgele 150 soru (tohum 42), birbirini görmeyen iki ajan:

```
{ n: 150, same: 128, adj: 22, far: 0, pct: '85.3', kappa: '0.72' }
A→B: kolay>kolay 71, orta>orta 54, zor>zor 3, kolay>orta 12, orta>kolay 5, orta>zor 4, zor>orta 1
```

## Tam Koşu

`zorluk apply`:

```
3030 soru, 1864 etiket değişti
eski → yeni       kolay   orta    zor
  kolay             596    222      8
  orta             1011    549     43
  zor               346    234     21
yeni dağılım: kolay 1953 (64.5%), orta 1005 (33.2%), zor 72 (2.4%)
ölçüt: K1 1953, O1 786, O2 219, Z1 9, Z2 60, Z3 3
```

`zorluk uyum` (tam koşu, pilottaki 150 soruyla):

```
pilot A: 150 soru: aynı 114 (76.0%), bir seviye fark 36 (24.0%), iki seviye fark 0 (0.0%)
pilot B: 150 soru: aynı 115 (76.7%), bir seviye fark 34 (22.7%), iki seviye fark 1 (0.7%)
```

Ayrışma hemen hep kolay/orta sınırında. Eski etiketlerin yeni ölçütle uyumu %38,4
(596+549+21 / 3030); eski etiket içerikle ilişkisizdi.

## Uygulamada

`verify`: 509 birim, 3030 soru, 0 hata, 0 uyarı. `pack` sonrası kurulu modüle kopyalandı.
Paketli uygulamada `module.questions('lange-anestezi-7')`:

```
{"n":3030,"c":{"kolay":1953,"orta":1005,"zor":72}}
```
