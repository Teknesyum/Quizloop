# hash-wasm

## Depo
`Daninet/hash-wasm` · https://github.com/Daninet/hash-wasm · MIT (GitHub API `NOASSERTION` diyor, `LICENSE` dosyası düz MIT metni — sorun yok) · son etiketli sürüm **v4.12.0, 19.11.2024** (npm 4.12.0 aynı gün) · 1.152 yıldız · 9 açık issue · npm paketi ~1,8 MB açılmış, **sıfır bağımlılık**.

## Ne için bakıldı
Soru `contentHash`'i ve üretim hattında kaynak dosya sağlaması. Üç soru: node:crypto'ya göre ölçülebilir kazanç var mı, 400 MB PDF akışla sağlanabilir mi, tarayıcı/renderer tarafında da gerekiyor mu.

## Alınacak fikirler
- **Parçalı `update()` + `digest()` akış API'si.** 400 MB PDF'i belleğe almadan sağlamak mümkün. Ama aynısı node:crypto'nun `Hash` nesnesinde zaten var ve o bir Writable stream olduğu için `pipeline(createReadStream, hash)` tek satır. Fikir alınır, paket alınmaz.
- **Kriptografik olmayan hızlı sağlama seçenekleri** (xxHash64/128, BLAKE3). node:crypto'da yok. `contentHash` "değişti mi" sinyali olduğu için — PLAN.md satır 164 — kriptografik güç gerekmiyor; kısa ve hızlı bir hash uygun. Yine de SHA-256 zaten yeterince ucuz, kazanç teorik.
- **Durum kaydet/yükle (segmented hashing).** Yarım kalmış uzun hesabı sürdürebilme. Üretim hattının `-resume` mantığıyla (PLAN.md satır 290) kavramsal olarak örtüşüyor; büyük kaynaklar için ileride bakılabilir.

## Kaçınılacaklar
- **Hız iddiası bizim senaryomuzu kapsamıyor.** README'deki benchmark tablosunda karşılaştırılanlar spark-md5, crypto-js, node-forge, jsSHA gibi saf JS kütüphaneleri; **node:crypto tabloda yok**. Node tarafında OpenSSL'e karşı kazanç iddiası doğrulanamadı. Elektron ana sürecinde çalışacaksak varsayılan kabul: kazanç yok.
- **Bakım durgun.** Son commit ve son sürüm 19.11.2024 — bu taramada ~21 ay hareketsiz. Terk edilmiş demiyorum, ama Electron/Node sürüm geçişlerinde düzeltme beklenemez.
- **WASM ikilileri base64 olarak JS içine gömülü.** Kolay paketlenir ama ~1,8 MB'lık yüzey ve asar içinde çift kopya riski; tek bir SHA-256 için orantısız.
- Renderer tarafında akışlı hash gerekirse `crypto.subtle` parçalı çalışmaz — o zaman bu paket tek gerçekçi seçenek olur. Bugünkü planda dosya okuma ana süreçte, o yüzden gerek yok.

## Karar
`elendi`. Node tarafında `node:crypto` hem akışı hem SHA-256'yı bedavaya veriyor, ek bağımlılık yüzeyi karşılığı ölçülmüş bir kazanç yok.
Tek geri dönüş koşulu: hash hesabı renderer'a taşınır ve dosya 100 MB üstü olursa yeniden değerlendirilir.
