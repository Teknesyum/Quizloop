[[netlestirme:001]]

# Netleştirme: LANGE 7. baskı PDF'ini Quizloop modülü için uygun hale getirmek somut olarak ne 

İşe başlamadan önce soruyu keskinleştir. Görüş verme, plan yazma, kod yazma.
Yalnız şunu döndür: soruda belirsiz kalan yerler, her biri için tek satırlık bir netleştirme sorusu, en fazla beş. Belirsizlik yoksa "net" yaz.

## Soru

LANGE 7. baskı PDF'ini Quizloop modülü için uygun hale getirmek somut olarak ne demek: yalnız kaynak hazırlığı mı (sayfa metni külliyatı + bölüm haritası + rules.yaml), yoksa soruların üretimi de mi? Kaynak külliyatı nerede ve hangi biçimde durmalı, source.pages PDF sayfası mı kitap sayfası mı, parça birimi alt başlık nasıl bulunacak, tablolar/görseller v1'de gerekli mi, modül kimliği ne olmalı, hangi bölümler atlanacak?

## Elde olan olgular

- Kaynak: `database/LANGE 7. BASKI.pdf` — Morgan & Mikhail Klinik Anesteziyoloji, 7. baskı, Türkçe çeviri (Güneş Tıp Kitabevleri, çeviri ed. Berrin Işık). 1465 PDF sayfası, 412 MB, Samsung tarayıcı çıktısı; OCR metin katmanı var.
- OCR kalitesi: 4,68 M karakter, sayfa başına ortanca 3604; 41 sayfa boş (<50 karakter, çoğu kısım kapakları), 67 sayfa ince. Gövde metin okunur; tablolar satır-sütun düzeni kaybetmiş, ok işaretleri "î/ü" gibi çıkmış; 18 867 yumuşak tire (U+00AD) var, birleştirilebilir; bozuk karakter (U+FFFD) yok.
- Sayfa eşlemesi: PDF sayfa = kitap sayfa + 21 (1224 sayfada doğrulandı). Ön madde 1-21, gövde 22-1411, indeks 1412-1465.
- Bölüm haritası: 59 bölümün tamamı tek sayfa üst bilgisinden ("BÖLÜM N Başlık") bulundu; başlangıç/bitiş PDF sayfaları elde. PDF `/Outlines` ağacı bozuk (21 girdi, başlıkları "1..7", hedefi yok) — planın "alt başlık birimi /Outlines'tan okunur" varsayımı bu kitapta çalışmaz; alt başlıklar metinden çıkarılmalı.
- Şema donmuş sayılıyor (`src/shared/schema/question.ts`, `module.ts`): `source { file, pages:[a,b], quote, chapter? }`, `ModuleMeta.source { title, file?, pages? }`, `id` regex `^[a-z0-9][a-z0-9-]{1,63}$`.
- Plan (`docs/PLAN.md` §4): `tools/quizforge/` CLI (init/plan/run/verify/pack), `rules.yaml` (module / kaynak / uretim / stil), parça birimi alt başlık 3-8 sayfa, alıntı-önce üretim, `verify` alıntıyı normalize edilmiş kaynak metinde arar. **Bunların hiçbiri henüz yazılmadı**: `tools/`, `modules/`, `schema/` klasörleri yok. `rules.yaml` alanları yalnız ad düzeyinde, tip ve zorunluluk yok.
- `.gitignore`: `modules/*` ve `sources/` yok sayılıyor; `database/` yok sayılmıyordu, bu turda eklendi (telifli 412 MB dosya git'e girmesin).
- Kullanıcının isteği tek cümle: "bu dosyayı modül için uygun hale getir; modül kurallarımız belli değilse t0 ile netleştir."
