# Ajan Raporu — Quizforge Flags + B55 Görseli (Birebir)

Ajan: a0dd942d9a62531d5 (opus), 2026-09-23. Aşağısı ajanın döndürdüğü metnin aynısıdır.

---

İki iş de bitti. `flags` komutu çalışıyor. b55'in görseli yeniden kırpıldı, soru düşürüldü. Paket 3030 soruyla kuruldu. Commit ve push atmadım. Checkpoint'e dokunulmadı: md5 başta ve sonda aynı, `build/bayraklar/` hiç oluşmadı.

## Değişen dosyalar
- Yeni: `tools/quizforge/src/flags.ts`, `tools/quizforge/src/flags.test.ts`, `tools/quizforge/vitest.config.ts`, `tools/quizforge/README.md`
- Değişen: `tools/quizforge/src/cli.ts`, `generate.ts`, `brief.ts`, `ingest.ts`, `tools/quizforge/AGENTS.md`
- Build tarafı (gitignored): `build/figures/p1327-1.png`, `build/figures/index.json`, `build/units/b55-p1324-1328-gorsel.json`, `modules/lange-anestezi-7/`, kurulu modül

`git status`'ta görünen `src/**` değişiklikleri ve yeni dosyalar benim değil. Başka bir oturumun işi olmalı.

## İş 1 — `flags`
- **Eşleme:** Kimlik önce `build/units/*.json` içinde aranıyor. Bulunmazsa `raw/` ve `rawgorsel/` kullanılıyor: kimlik, `toQuestion` formülüyle (`sha256(unit.hash + '\n' + kök)`) yeniden hesaplanıyor. Son çare checkpoint'teki `questionIds`.
- **Kuyruğa alma:** Checkpoint'te birimin durumu `failed` oluyor, yanına `error: "bayrak: N soru"` yazılıyor. Böylece hem `run` hem `brief` birimi yeniden seçiyor.
- **Not:** Bayrak notları `build/bayraklar/<birim>.json` dosyasına yazılıyor. `run` ve `brief` bunu isteme "Önceki üretimde bu sorular bozuk bulundu…" satırı olarak ekliyor. Birim yeniden üretilince not `bayraklar/islendi/` klasörüne taşınıyor.
- **Eski raw:** Birimin eski raw dosyası `bayraklar/eski-raw/` klasörüne taşınıyor. Taşınmasaydı `ingest` eski cevabı yeniden alıp bayrağı boşuna tüketirdi.
- **`--gorsel`:** Metin ve görsel turu ayrı checkpoint anahtarları kullanıyor. Varsayılan metin turu; öbür tura ait bayraklar kuyruğa alınmıyor, yalnız listeleniyor. Bunun için `brief --gorsel` süzgeci de artık `hash:gorsel` anahtarına bakıyor.
- **Çıkış kodu:** Eşlenemeyen kimlik varsa 1.
- **Kapsama:** Kurulu modüldeki 3031 kimliğin tamamı eşlendi (2568 metin, 463 görsel, eşlenemeyen 0).

Gerçek veriyle dry-run (3 gerçek kimlik ve 1 uydurma), birebir çıktı:
```
4 bayrak, 3 eşlendi → 3 birim (metin turu)
  b01-p22-24: lange-anestezi-7-444e8d714c01
  b29-p666-668: lange-anestezi-7-34a190e65093
  b58-p1394-1399: lange-anestezi-7-5af08967401d
eşlenemeyen: 1 — lange-anestezi-7-000000000000
dry-run: hiçbir şey yazılmadı
```

**Testler:** Kök `vitest.config.ts` yalnız `src/**` altını tarıyor ve o dosya izin verdiğin alanın dışında. Bu yüzden `npm test` yeni testleri çalıştırmıyor; ayrı bir config ekledim.
```
npm test:                  Test Files 5 passed (5) · Tests 42 passed (42)
quizforge vitest config:   Test Files 1 passed (1) · Tests 5 passed (5)
```
quizforge'da tsc ve eslint temiz. `npm test` başta `abi.mjs node` çalıştırıyor. Uygulamayı paketlemeden açmadan önce `npm run dev` ya da `npm run abi:electron` gerekebilir.

## İş 2 — b55-p1324-1328
- **Eski görsel:** Eski `p1327-1.png` 476×216 boyutunda, 82 KB'lık bir parçaydı. Şekil 55-12'nin yalnız gömülü raster parçasını içeriyordu, üstüne de beyaz bir kutu binmişti.
- **Yeni kırpım:** PDF sayfası 1327 (kitap sayfası 1306, ofset 21), `clip [22,52,404,566]`, 2x render. `kaynak_kes.py` içindeki `get_pixmap(clip=…)` yöntemini kullandım; o betik WEBP'ye kilitli olduğu için doğrudan PNG'ye yazdım. `figures/index.json` güncellendi.
  - Yol: `sources/lange-anestezi-7/build/figures/p1327-1.png`, 764×1028 px, 968 KB.
  - Read ile açtım: nabızlı bradikardi algoritmasının tamamı görünüyor.
- **Düşürülen soru:** `lange-anestezi-7-39074e995dcb`. Soru "3 numaralı kutu hangi geometrik şekilde?" diye soruyordu, anahtar "Elmas". Doğru kırpımda kutu beşgen çıkıyor, yani anahtar yanlış; soru da klinik bir şey sınamıyor. Soru `dropped` listesine gerekçesiyle girdi. Birimin öbür 5 sorusunun görselleri (p1325, p1326, p1328) dolu.
- **Paket karşılaştırması:** Eski pakete göre tek fark bu soru. 3030 soru birebir aynı, farklı içerik 0.

```
verify: 509 birim, 3030 soru, 248 düşen, 0 hata, 0 uyarı, harfler {"C":595,"D":605,"E":590,"A":558,"B":543}
pack:   yazıldı: modules\lange-anestezi-7
robocopy /MIR: çıkış kodu 3 (1 dosya grubu kopyalandı + fazlalık silindi; 8'in altı başarı sayılır)
kurulu modül: questionCount 3030, gerçek 3030, düşen soru yok, p1327 referansı 0
```

Senden istediğim bir şey yok.
