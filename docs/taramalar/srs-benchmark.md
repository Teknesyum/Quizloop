# open-spaced-repetition/srs-benchmark

## Depo
`srs-benchmark` · https://github.com/open-spaced-repetition/srs-benchmark · **lisans yok** (GitHub API `license: null`, kökte `LICENSE` dosyası yok, `pyproject.toml`'da `license` alanı yok) · **etiketli sürüm hiç yok**, son commit 2026-08-17 · ★251 · 17 açık issue · depo ~816 MB (sonuç dosyaları dahil), Python 3.12+, `torch`/`fsrs-optimizer`/`wandb` bağımlılıkları.

## Ne için bakıldı
Zamanlama seçimini (FSRS-6, `ts-fsrs`) ve "birinci sürümde varsayılan parametrelerle başla, optimizasyonu sonraya bırak" kararını dış veriyle sınamak. Bağımlılık adayı değil; ölçüt ve kanıt kaynağı.

## Alınacak fikirler
- **Üç metrik, iki farklı soru.** Log Loss ve RMSE(bins) kalibrasyonu (tahmin edilen hatırlama olasılığı gerçeğe uyuyor mu), AUC ayırt etmeyi (hatırlanan/unutulan ayrımı) ölçüyor; README ikisinin ayrı olduğunu açıkça söylüyor. `RMSE-BINS-EXPLOIT` satırı bunu kanıt olarak koyuyor: RMSE 0.0135 ile tabloda en iyi, Log Loss 4.6 ile en kötü. Yeri: `review_log` üzerinden ileride kendi ölçümümüzü yaparsak tek metriğe bakmamak. Değeri: "algoritmamız iyi çalışıyor" iddiasının nasıl ölçüleceği hazır.
- **Zamana göre bölme (`TimeSeriesSplit`).** Eski tekrarlarla eğit, yeni tekrarlarla ölç; ilk dilim değerlendirmeden çıkarılır. Yeri: parametre optimizasyonu geldiğinde aynı ayrım kullanılmalı, rastgele bölme gelecekten bilgi sızdırır.
- **Varsayılan parametrelerin nereye düştüğü.** README'deki tablo (9.999 koleksiyon, 349.923.850 tekrar, aynı günkü tekrarlar hariç): *FSRS-7 varsayılan param.* Log Loss 0.3629 / RMSE 0.0910 — kullanıcı başına optimize *FSRS-6* 0.3460 / 0.0653, taban çizgisi *AVG* 0.3945 / 0.1034. Yani varsayılanlar taban çizgisini ve FSRS v1–v3'ün tamamını geçiyor, optimize edilmişin belirgin gerisinde. Değeri: planın kararını doğruluyor — soğuk başlangıçta varsayılan yeterli, ama kazanç gerçek olduğu için `review_log` ilk günden tam alanlarla tutulmalı. **Bu sayılar depo README'sinden alındı, tarafımızdan koşturulup doğrulanmadı.**

## Kaçınılacaklar
- **Lisanssız depodan kod veya sonuç dosyası kopyalamak.** Lisans belirtilmemiş bir depo varsayılan olarak "tüm hakları saklı"dır; MIT bir ürüne kod, parametre listesi veya `result/` çıktısı taşınamaz. Okumak, atıf vermek ve yöntemi taklit etmek serbest — dosya almak değil.
- **Tablonun tepesini "seçilecek algoritma" diye okumak.** RWKV-P (Log Loss 0.2773) 2.762.884 parametreli bir sinir ağı ve tekrar süresi, kardeş kart, deste hiyerarşisi gibi bizde bulunmayan girdileri kullanıyor; LSTM/GRU de kullanıcı başına eğitim istiyor. Masaüstü uygulamasında çalıştırılabilir değiller ve `ts-fsrs` içinde yoklar.
- **FSRS-7 için beklemek.** Tabloda FSRS-7 (0.3437) ile FSRS-6 (0.3460) arası fark güven aralıklarıyla iç içe; `ts-fsrs` FSRS-7 sunana kadar sürümü ertelemenin ölçülebilir karşılığı yok.
- **Kendi doğrulamamızı planlamak.** Veri kümesi `open-spaced-repetition/anki-revlogs-10k` Hugging Face'te `license: other` etiketli ve `gated: auto` (erişim onayı gerekiyor), ~727 milyon tekrar; depo da ~816 MB. Ayrıca veri Anki kullanıcılarının serbest hatırlama akışından geliyor, bizim çoktan seçmeli + öz-değerlendirme akışımızdan değil — sonuçlar yön gösterir, bire bir geçerli değildir.

## Karar
`desen` — bağımlılık değil, dış kanıt ve ölçüm yöntemi kaynağı. FSRS ailesini ve varsayılan parametreyle başlama kararını destekliyor. **Lisansı olmadığı için hiçbir dosyası projeye alınmaz**, yalnız atıfla kullanılır.
