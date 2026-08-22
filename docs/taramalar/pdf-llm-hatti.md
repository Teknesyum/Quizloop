# PDF → yapay zekâya hazır metin hattı

## Depolar

- **marker** · https://github.com/datalab-to/marker (eski `VikParuchuri/marker` buraya taşındı) · kod Apache-2.0, **model ağırlıkları değiştirilmiş AI Pubs OpenRAIL-M** ($5M altı gelir/fon için serbest) · son push 2026-08-07, son sürüm v2.0.0 (2026-07-20) · ~21 MB depo, 39.0k yıldız, 454 açık issue.
- **docling** · https://github.com/docling-project/docling (`DS4SD/docling` bu depoya yönlenir) · kod MIT, `docling-ibm-models` MIT, granite-docling-258M Apache-2.0 · son push 2026-08-21, son sürüm v2.121.0 (2026-08-20) · ~353 MB depo, 65.4k yıldız, 988 açık issue. LF AI & Data projesi.
- **nougat** · https://github.com/facebookresearch/nougat · kod MIT, **ağırlıklar CC-BY-NC** (ticari kullanım yok) · son push 2025-02-21, son sürüm 0.1.0-base (2023-08-22) · ~4.8 MB depo, 10.1k yıldız, 143 açık issue. Arşivli değil ama üç yıldır etiketli sürüm yok.

## Sorulara doğrudan cevap

- **Temiz metin katmanı varken gerekli mi?** Ham metin için değil — pypdfium/pdftext zaten çıkarır. Gerekli olan şey metin katmanında **bulunmayan** bilgi: okuma sırası, başlık hiyerarşisi, tablo hücre yapısı, şekil–altyazı eşleşmesi, formül sınırı. 1468 sayfalık kitabı bölüm bölüm işleyeceksek bu katman kazandırır; yoksa iki sütun, dipnot ve tablolar tek düz metin akışına karışır.
- **Tablo/formül kalitesi.** marker tabloyu her iki modda PDF metin katmanından yeniden kurar, `<table>` HTML verir; düşük güvende VLM'e düşer. docling tabloyu TableFormer ile çıkarır, Markdown/HTML'e verir; formülü `do_formula_enrichment` ile LaTeX'e çevirir (docs/usage/enrichments.md). Sayısal kalite kıyası **doğrulanamadı** — marker README'sindeki olmocr-bench tablosu (balanced %76.0, docling'in üstünde) deponun kendi ölçümü, bağımsız değil.
- **GPU.** docling: opsiyonel, `AcceleratorDevice.AUTO/CPU/CUDA/MPS`, CPU'da çalışır. marker v2: surya VLM'i yerel bir çıkarım sunucusuyla çalıştırır (NVIDIA'da vLLM+Docker, aksi hâlde llama.cpp binary'si) — ama README'ye göre "formülsüz temiz dijital belge VLM sunucusunu hiç başlatmaz", `--disable_ocr` tüm VLM çağrılarını kapatır. nougat: pratikte GPU ister; CPU/eski GPU'da yanlış `[MISSING_PAGE]` üretildiği README'de kabul edilmiş.
- **Türkçe.** OCR devre dışıyken dil sorunu yok, metin katmanı zaten Türkçe. marker OCR'ı çok dilli (surya). nougat README açıkça "en iyi İngilizce, diğer Latin temelli diller **olabilir**" diyor — Türkçe için doğrulanmamış risk.
- **Çıktı bizim bloklara oturuyor mu?** Evet, ikisi de. marker JSON'da `block_type` (Table, Figure, Equation, TextInlineMath, Picture, Caption, SectionHeader, Code …) ve blok bazlı HTML var. docling `DoclingDocument` JSON'ında etiketli öğe + sayfa/bbox provenance var. nougat tek bir `.mmd` düz metin verir — blok tipi yok, ayrıştırmayı bize bırakır.

## Alınacak fikirler

- **Etiketli ara belge, Markdown değil.** PDF → tip+sayfa+bbox taşıyan blok JSON → soru üretimi. Quizloop'ta PDF alma adımının çıktısı olur; çözüm bloklarımız (metin/tablo/görsel/formül) blok tipine bire bir eşlenir ve üretilen soru kaynak sayfaya geri bağlanabilir. Düz Markdown saklarsak bu bilgi geri getirilemez.
- **Yapı farkında parçalama.** docling `HybridChunker` / marker `chunks` formatı: sayfa değil blok sınırından böler, bölüm başlığı bağlamını parçayla taşır. 1468 sayfayı LLM'e verirken parça sınırı tablo veya soru ortasından geçmez; kural dosyasının "bölüm bazlı modül" beklentisiyle uyumlu.
- **Pahalı modeli ikinci geçişe ayır.** Birinci geçiş saf metin katmanı (marker `--disable_ocr` ya da docling'de enrichment kapalı); yalnız formül/tablo yoğun ya da güveni düşük sayfalar için ikinci, ağır geçiş. Kitabın büyük kısmı düz metin olduğu için süre ve maliyet birkaç kata düşer, kalite kaybı yerel kalır.

## Kaçınılacaklar

- **nougat'ı bağımlılık yapmak.** Ağırlıklar CC-BY-NC — Quizloop ileride ücretli olursa lisans ihlali. Üstüne 2023'ten beri etiketli sürüm yok, Türkçe doğrulanmamış, tekrar döngüsü/`[MISSING_PAGE]` sorunu README'de açık. Tasarımı (sayfa görüntüsü → tek geçişte markup) öğretici, bağımlılığı değil.
- **marker ağırlıklarını gelir eşiği düşünmeden kullanmak.** Kod Apache-2.0 ama ağırlıklar OSI onaylı değil; $5M üstü gelir/fonda ticari lisans gerekiyor. Bugün sorun değil, "sonra değiştiririz" varsayımı riskli.
- **marker v2'yi kurulum maliyetini ölçmeden seçmek.** Docker+NVIDIA Container Toolkit ya da llama.cpp binary'si gerekiyor; Windows'ta bu gizli bir kurulum yükü. Ölçmeden karar verme.
- **Her sayfayı VLM'e sokmak** (marker balanced modu). Temiz metin katmanında ödenen bedelin karşılığı yok.
- **README benchmark'ına dayanarak seçim.** İki depo da kendi ölçümünü yayınlıyor. Karar, kendi kitabımızdan 20-30 sayfalık örnekle verilmeli.

## Karar önerisi

1. Bu katman gerekli — ama OCR için değil, **yapı** için: okuma sırası, başlık hiyerarşisi, tablo ve formül sınırları.
2. Birincil seçim **docling**: MIT kod + MIT/Apache model, GPU zorunlu değil, `DoclingDocument` bizim blok tiplerimize doğrudan oturuyor, ek çalışma zamanı (Docker/vLLM) istemiyor.
3. **marker** yedek/ikinci geçiş olarak dursun: docling'in tablo veya formül çıktısı yetersiz kaldığı sayfalarda `--disable_ocr` ya da `fast` modda karşılaştırma için.
4. **nougat** dışarıda — CC-BY-NC ağırlıklar ve terk edilmişliğe yakın bakım hızı.
5. Kararı kesinleştirmeden önce kitabın tablo/formül yoğun 20-30 sayfasını her iki araçla çevirip elle karşılaştır.

## Kaynaklar

- `gh api repos/datalab-to/marker`, `.../releases/latest`, README (Commercial usage, Inference backend prerequisites, JSON bölümleri) — 2026-08-22.
- `gh api repos/docling-project/docling`, `.../releases/latest`, README, `docs/usage/gpu.md`, `docs/usage/enrichments.md` — 2026-08-22.
- `gh api repos/facebookresearch/nougat`, `.../releases/latest`, README (License, FAQ dil notu) — 2026-08-22.
- `gh api repos/datalab-to/surya` (Apache-2.0), `gh api repos/docling-project/docling-ibm-models` (MIT), HF `ibm-granite/granite-docling-258M` (Apache-2.0).
