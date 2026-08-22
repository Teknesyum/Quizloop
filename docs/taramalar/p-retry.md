# p-retry

## Depo
`sindresorhus/p-retry` · https://github.com/sindresorhus/p-retry · MIT · son sürüm `v8.0.0` (2026-03-26; npm 8.0.0 aynı gün) · 1.028 yıldız · 1 açık issue · ~92 KB, tek çalışma zamanı bağımlılığı `is-network-error`, `engines.node >= 22` (v7.1.1 `>=20`, v6.2.1 `>=16.17`).

## Ne için bakıldı
quizforge hattı kontrol noktalı: her birim ayrı iş, başarısız birim yeniden denenir. Sorular: geçici hata ile kalıcı hatayı ayırmanın kurulumu, üstel geri çekilme varsayılanları bize uyuyor mu, deneme sayısı nereye yazılmalı.

## Alınacak fikirler
- **Karar üç ayrı kancaya bölünmüş.** `shouldRetry` (tekrar denenir mi), `shouldConsumeRetry` (bu hata deneme bütçesinden düşsün mü), `onFailedAttempt` (her başarısızlıkta çağrılır). Ayrım tam bizim ihtiyacımız: 429/hız sınırı beklenir ama bütçe yakmaz, şema hatası bütçe yakar, 401/400 hiç denenmez. Tek bir boolean'a sıkıştırılan yeniden deneme mantığı bu üç durumu ayıramıyor.
- **Deneme sayısı kancadan gelir, bellekte tutulmaz.** `onFailedAttempt(context)` içinde `attemptNumber`, `retriesLeft`, `retriesConsumed`, `retryDelay` hazır. Kontrol noktalı hatta doğru yer burası: her başarısız denemede JSONL ledger'a bir satır (`iş kimliği`, deneme no, hata sınıfı, sıradaki gecikme) yazılır; sayaç iş kaydının alanı olur, süreç ölse de kaybolmaz.
- **Kalıcı hata için `AbortError` sınıfı.** Sarmalanan hata `AbortError` ile atıldığında döngü anında biter ve hiçbir kanca çalışmaz. quizforge'un "eksik alan hatadır, uydurma yok" kuralıyla uyumlu bir sınıflandırma noktası: doğrulama hatası → onarım turu, kimlik/istek hatası → `AbortError`.
- **Duvar-saati tavanı `maxRetryTime`,** `performance.now()` ile monotonik ölçülüyor; sistem saati oynasa bile birim başına süre tavanı kilitlenmez. İptal `signal` (AbortController) ile — CLI'da Ctrl+C bunun üstüne oturur.

## Kaçınılacaklar
- **Varsayılanları olduğu gibi almak.** `retries: 10`, `factor: 2`, `minTimeout: 1000`, `maxTimeout: Infinity`, `randomize: false`. LLM çağrısı için 10 deneme hem para hem süre; tavansız `maxTimeout` üstel gecikmeyi dakikalara taşır. Bizde 2-3 deneme, `maxTimeout` 8-30 s, `randomize: true`.
- **İki katmanın çarpışması.** Anthropic SDK kendi içinde 2 kez deniyor (`anthropic-sdk.md`); üstüne 3 denemeli p-retry sarmak tek birim için 6 HTTP isteği demek. Ya SDK'ya `maxRetries: 0` verip her şey p-retry'de toplanır ya da p-retry yalnız şema/onarım turuna konur — ikisi birden değil.
- **`randomize: false` ile paralel çalışmak.** Aynı anda düşen birimler aynı gecikmeyle geri gelir; hız sınırına toplu çarpma riski. Paralellik varsa jitter açılır.
- **Node sürümünü varsaymak.** v8 `node >= 22` istiyor. quizforge daha eski bir Node'u hedefliyorsa v7 (`>=20`) alınır; sürüm seçimi hedef Node kararına bağlı, kararın kendisi bu tarama sırasında doğrulanmadı.
- **Kendi hata sınıflarını `TypeError`'dan türetmek.** Ağ hatası olmayan `TypeError`'lar `shouldRetry`/`shouldConsumeRetry` ne derse desin yeniden denemeyi koşulsuz iptal ediyor.

## Karar
`bağımlılık` — MIT, ~92 KB, tek transitif bağımlılık, aktif bakımda (2026-03-26), 1 açık issue.
Üç kancalı ayrım kendi yazacağımız döngüden daha iyi; varsayılanlar ezilerek kullanılır.
Yeniden deneme tek yerde toplanır: SDK'nın HTTP denemesiyle üst üste binmez.

## Kaynaklar
GitHub API (2026-08-22): repo, `releases/latest`; `readme.md`, `package.json`; npm `p-retry` (8.0.0, 7.1.1, 6.2.1 `engines` alanları).
