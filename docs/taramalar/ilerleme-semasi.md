# İlerleme şeması — tekrar günlüğü, içerik sürümleme, istatistik

Seçim: şema, istatistik, göç, yedekleme → **Anki**; içerik güncellenirken ilerlemenin
korunması → **CrowdAnki**; günlükten durum türetme → **ts-fsrs**. Duolingo klonları (ilerleme sunucuda, şema açık değil) ve `srs-benchmark` (araştırma aracı, lisanssız) elendi. Anki ve ts-fsrs bu depoda daha önce `anki-cekirdek.md` ve `fsrs.md` içinde tarandı; burada yalnız kimlik, sürümleme, göç ve yedek tarafı var.

## Depolar
- **Anki** · https://github.com/ankitects/anki · AGPL-3.0+ (API `NOASSERTION` döner; LICENSE AGPLv3+, bazı parçalar BSD-3) · son push 2026-08-22, son sürüm `26.08.1` (2026-08-05) · ~53 MB, 29.961 yıldız, 447 açık issue
- **CrowdAnki** · https://github.com/Stvad/CrowdAnki · MIT · son push 2026-07-11, son etiket `v0.9.5` (2023-10-30, ~2,5 yıl etiketsiz) · ~2,2 MB, 639 yıldız, 75 açık issue
- **ts-fsrs** · https://github.com/open-spaced-repetition/ts-fsrs · MIT · son push 2026-08-22, son release `@open-spaced-repetition/binding@0.5.0` (2026-06-06) · ~4,9 MB, 763 yıldız, 5 açık issue

## Alınacak fikirler

- **Günlük satırı = olay anındaki değerlerin donmuş kopyası.** Anki `revlog`: `id` (ms zaman
  damgası, aynı zamanda birincil anahtar), `cid`, `ease` (basılan düğme), `ivl` (yeni aralık),
  `lastIvl` (önceki), `factor` (cevap sonrası zorluk), `time` (ms), `type`. Quizloop'ta
  `reviews`: `soru_id`, `karar`, `onceki_aralik`, `yeni_aralik`, `puan_delta`, `sure_ms`,
  `tur`. Değerli: sonraki tarih ve toplam puan türev olur, günlükten yeniden hesaplanır.
- **`tur` alanı "bu bir cevap değildi" olaylarını da alır.** Anki `RevlogReviewKind` =
  Learning/Review/Relearning/Filtered/**Manual**/**Rescheduled**; `Manual` + `factor==0`
  "kart sıfırlandı" demek. Quizloop'ta içerik güncellemesi, elle sıfırlama ve modül silinmesi
  aynı tabloya yazılır. Değerli: "puanım neden değişti" sorusunun cevabı günlükte durur.
- **Kimlik = kararlı GUID; hash yalnızca sinyal.** Anki notta `guid` (dışa/içe aktarımda
  değişmez) ile `csum`'ı (ilk alanın sağlaması, sadece kopya tespiti) ayırıyor; içe aktarımda
  önce `guid` aranır, yoksa sağlamaya düşülür. CrowdAnki aynısını JSON'da yapıyor: her not
  kendi UUID'siyle serileşir, içe aktarımda UUID ile bulunan nesnenin üzerine yazılır, yenisi
  yaratılmaz. Quizloop'ta soru `id`'si bir kez atanıp asla değişmez, metin hash'i ayrı
  `icerik_hash` alanıdır. Değerli: yapay zekâ soruyu düzeltince ilerleme kendiliğinden
  taşınır, hash farkı istersen kartı yeniden öğrenmeye düşürür.
- **Silinen içerik için mezarlık.** Anki `graves(oid, type, usn)` silineni kaydeder, yok
  etmez. Quizloop'ta modülden çıkan soru `durum='arsiv'` olur, günlüğü kalır. Değerli: soru
  geri eklenirse ilerleme döner, istatistik geçmişi delinmez.
- **Durumu günlükten yeniden üretme (replay).** ts-fsrs `Reschedule` sınıfı kartın tüm
  geçmişini tekrar oynatıp güncel durumu ve sonraki tarihi baştan hesaplıyor. Değerli:
  puanlama veya aralık kuralı değişince geriye dönük uygulama veri kaybı olmadan yapılır.
- **Göç ve yedek, ikisi de sürümlü.** Anki `col.ver` tutuyor ve `schema14_upgrade.sql`,
  `schema18_upgrade.sql`, `schema18_downgrade.sql` gibi tek amaçlı dosyalarla ilerliyor —
  geri dönüş yolu da yazılı. `maybe_backup` değişiklik varsa ve asgari süre geçtiyse yedek
  alıyor, `thin_backups` günlük/haftalık/aylık kotayla eskiyi eliyor; CrowdAnki içe aktarım
  öncesi zorunlu yedek tetikliyor. Değerli: "güncelleme ilerlememi bozdu"nun tek çıkışı.
- **Motive eden istatistik = geçmiş + gelecek + geri bildirim.** Anki grafikleri: `today`,
  `reviews`, `card_counts`, `future_due`, `intervals`, `retention`, `retrievability`, `added`,
  `buttons`, `hours`, `eases`. Quizloop'a değeni üçü: bugün/seri, yarınki yük (`future_due`),
  gerçek tutma oranı (`retention`). Değerli: "bugün ne yaptım" ile "yarın ne bekliyor"
  birlikte gösterilince puanın tek başına taşımadığı sürekliliği taşırlar.

## Kaçınılacaklar
- **İçerik hash'ini birincil anahtar yapmak** — tek harflik düzeltme kartı sıfırlar.
- **Anki `cards` tablosunu kopyalamak** — `type`/`queue`/`due`/`odue`/`odid` filtreli deste mirası, Quizloop'ta karşılığı yok.
- **Anki'den satır almak** — AGPL-3.0+ bulaşıcı; desen serbest, kaynak değil. "Anki" ayrıca Ankitects markası, ürün adında kullanma.
- **CrowdAnki'ye bağımlılık kurmak** — son etiket 2023-10-30, 75 açık issue, kod Anki eklenti API'sine sıkı bağlı. Okunacak tasarım, çağrılacak kütüphane değil.
- **CrowdAnki'nin "içe aktarımda üzerine yaz" varsayılanı** — kullanıcının yerel düzenlemesi sessizce siliniyor.
- **`reviews` satırını sonradan güncellemek** — günlük append-only, düzeltme ters kayıtla yazılır.
- **ts-fsrs'i şimdi bağımlılık almak** — ihtiyaç üç seviyeli SM-2/Leitner; Node 20+ ve WASI optimizer gereksiz yüzey.

## Karar önerisi
`reviews` append-only, alan kümesi Anki `revlog` ile aynı; `tur` alanına Manual/Rescheduled
karşılıkları girer. Soru kimliği modül JSON'unda kalıcı `id`, metin hash'i ayrı `icerik_hash`
— hash değişince kart düşer, kimlik korunur. Silinen soru `arsiv` işaretlenir, günlüğü kalır.
Şemaya `sema_surumu` + sürüm başına ileri/geri SQL; modül güncellemesi öncesi DB kopyalanır,
günlük/haftalık seyreltilir.
