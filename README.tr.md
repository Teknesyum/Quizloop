<!-- lang -->

[<img src="assets/badge-lang.tr.svg" alt="Türkçe seçili, switch to English" width="124" height="44">](README.md)

# Quizloop

Uyarlanır aralıklı tekrar sınav motoru. Bir kitabı soru modülüne çevir, yerine
oturana kadar çalış.

Quizloop **motoru** **içerikten** ayırır. Motor bu depodur: soruları zamanlayan,
cevapları puanlayan ve yanlışları açıklayan Windows, macOS ve Linux masaüstü
uygulaması. İçerik *modüllerde* durur; modül, kaynak metinden üretilmiş soru
bankasıdır. Modüller bu deponun parçası değildir; yalnız beş soruluk bir örnek
birlikte gelir.

## Kurulum

**Windows'ta önerilen: Teknesyum Base.**

1. [`Teknesyum-Base.exe`](https://github.com/Teknesyum/Teknesyum-Base/releases/latest/download/Teknesyum-Base.exe) dosyasını ([`.sha256`](https://github.com/Teknesyum/Teknesyum-Base/releases/latest/download/Teknesyum-Base.exe.sha256)) indirip çalıştırın. Yönetici hakkı gerekmez.
2. Listeden **Quizloop** uygulamasını bulup kurun. Base sonradan güncellemeyi ve kaldırmayı da yapar.

Base henüz imzalı değil; Windows SmartScreen ilk açılışta uyarabilir: *Diğer bilgiler*'i, sonra *Yine de çalıştır*'ı seçin. Ayrıntı: [Teknesyum Base](https://github.com/Teknesyum/Teknesyum-Base).

**Diğer platformlar ya da elle:**

Son sürümü [Releases](https://github.com/Teknesyum/Quizloop/releases)
sayfasından indir:

| Platform | Dosya | Güncelleme |
| -------- | ----- | ---------- |
| Windows  | `quizloop-<version>-setup.exe` | İndirmeden önce, kurmadan önce ayrıca sorar |
| macOS    | `quizloop-<version>-unsigned.dmg` | Yeni sürüm çıkınca uygulama haber verir |
| Linux    | `.AppImage` ya da `.deb` | Yeni sürüm çıkınca uygulama haber verir |

macOS derlemesi imzasız, bu yüzden Gatekeeper ilk açılışı engeller. Karantina
özniteliğini bir kez temizle:

```
xattr -cr /Applications/Quizloop.app
```

## Bir tur nasıl geçer

1. Soru **şıkları olmadan** gelir. Önce sen düşünürsün.
2. Şıkları istersin. Şıksız cevap bonus kazandırır.
3. Doğru seçim puan getirir. Yanlış seçim puan götürür, o şıkkı kaldırır ve
   *o yanlış cevap* için yazılmış açıklamayı gösterir.
4. Soru kapanınca çözüm kaynağıyla birlikte oynar: dosya, sayfalar ve alıntı.
   Kitap diskteyse sayfa, alıntı işaretli olarak yerleşik görüntüleyicide açılır.
5. Soruyu **anladım**, **kısmen anladım** ya da **anlamadım** diye işaretlersin.
   Zamanlama FSRS-6 ile yürür; anlaşılan sorular emekliye ayrılır.

Oturumlar, kütüphane, bölümler ve soru bankası klavyeyle çalışır; oturum ve
banka tuşlarını ekranın altında listeler.

## Modüller

Modül; `module.json`, `blocks/` ve `assets/` taşıyan bir klasördür. Klasörü
kütüphaneye bırak ya da **Klasör seç** ile seç. Her dosyanın JSON Schema'sı
[`schema/`](schema/) altında.

**Soru bankası** modülün her sorusunu durumuyla listeler. Bozuk soruyu `F` ile
işaretle, işaretleri JSON olarak dışa aktar; üretici o dosyayı okur ve yalnız
etkilenen birimleri yeniden üretir.

## Modül üretmek

[`tools/quizforge`](tools/quizforge/README.md) üretim hattıdır. PDF'in metin
katmanını çıkarır, birimleri planlar, soruları üretir, doğrular ve modülü
paketler. Her soru `kaynak` taşır: dosya, sayfalar ve alıntı.

## Başka bilgisayara taşımak

**Ayarlar → Taşıma paketi** ilerlemeyi, modülleri ve ayarları tek klasöre
yazar. USB bellekte taşı, öbür makinede içe aktar. Eski veritabanı yedek olarak
saklanır.

## Geliştirme

Tek önkoşul Node 22 ve npm.

```
npm install
npm run dev
```

Commit'ten önce `npm test`, `npm run typecheck`, `npm run lint` ve
`npm run ui:scan` geçmeli. Paketli derlemeler `npm run build:win`, `build:mac`
ya da `build:linux` ile çıkar. Bir `v*` etiketi göndermek üçünü GitHub
Actions'ta derler ve taslak sürüm açar.

Mimari için [`docs/PLAN.md`](docs/PLAN.md).

## Lisans

AGPL-3.0-or-later. Bkz. [LICENSE](LICENSE).

Copyright (C) 2026 Teknesyum
