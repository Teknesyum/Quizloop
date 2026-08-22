# anthropic-sdk-typescript

## Depo
`anthropics/anthropic-sdk-typescript` · https://github.com/anthropics/anthropic-sdk-typescript · MIT · son etiket `sdk-v0.120.0` (2026-08-19; npm `@anthropic-ai/sdk` 0.120.0) · 2.094 yıldız · 53 açık issue · monorepo ~6,4 MB, ana paket + 5 bulut paketi (bedrock, vertex, aws, foundry, google-cloud); çalışma zamanı bağımlılığı yalnız `standardwebhooks` ve `json-schema-to-ts`, `zod` isteğe bağlı peer (`^3.25 || ^4`).

## Ne için bakıldı
quizforge her birimi temiz bağlamda modele veriyor ve çıktının JSON şemasına uyması zorunlu. Sorular: şemayı zorlamanın yolu, uzun PDF bağlamında önbellek, hız sınırı/yeniden deneme SDK'da mı, kontrol noktalı hatta akış gerekli mi.

## Alınacak fikirler
- **`messages.parse()` + `output_config.format`.** `zodOutputFormat(schema)` şemayı sunucuya `json_schema` olarak gönderiyor, dönen içeriği `safeParse` ile doğrulayıp `parsed_output` alanına koyuyor; hata olursa ilk 5 issue'yu özetleyen `AnthropicError` atıyor (`src/helpers/zod.ts`). İçerde `zod/v4` import ediliyor — Quizloop'un zod v4 kararıyla birebir. Kendi JSON Schema üretimimizi ve doğrulama sarmalayıcımızı yazmayız.
- **İç şema ile modele giden şemayı ayırmak.** `src/lib/transform-json-schema.ts` `additionalProperties: false` ekliyor ve desteklenmeyen `format` değerlerini strict bloktan çıkarıyor. Aynı ayrım bizde de olmalı: `z.toJSONSchema` çıktısı doğrudan istem yükü değil, önce kırpılmış sürüm.
- **Ağ katmanı yeniden denemesi zaten içeride.** `maxRetries` varsayılan 2; `x-should-retry` başlığına uyuyor, 408/409/429/5xx yeniden deneniyor, `retry-after-ms`/`retry-after` okunuyor, yoksa 0,5 s'den 8 s'ye üstel geri çekilme + en çok %25 jitter (`src/client.ts`). Kendi yeniden deneme katmanımız yalnız **şema/içerik** hatasına baksın, HTTP'ye değil.
- **Önbellek kararı bizde.** SDK `CacheControlEphemeral` tipini veriyor ama otomatik breakpoint koymuyor; sabit önek (sistem istemi + şema + örnek) ile değişen birim metnini ayırmak bizim istem tasarımımızın işi.

## Kaçınılacaklar
- **Akışı gereksiz yere kurmak.** `calculateNonstreamingTimeout` beklenen süreyi `60 dk × max_tokens / 128000` ile tahmin edip 10 dakikayı aşarsa hata atıyor; eşik ≈ 21.300 `max_tokens` (koddan hesaplandı). Birim başına çıktı bunun altındaysa akış zorunlu değil — kontrol noktalı hatta tamamlanmış birimi tek parça yazmak daha basit.
- **Hata metnini olduğu gibi kullanıcıya geçirmek.** Bu hata `README#long-requests` bağlantısı veriyor, README'de öyle bir bölüm yok (60 satır: kurulum, gereksinimler, lisans). Kendi hatamız kendi belgemize işaret etsin.
- **Sürümü pinlememek.** 0.x hattı hızlı: 13-19 Ağustos 2026 arasında 0.117 → 0.120. `MIGRATION.md` ayrı bir belge olarak duruyor.
- **Hız sınırını SDK'ya bırakmak.** İstemci tarafında eşzamanlılık sınırı veya token bütçesi yok; 429 davranışı reaktif. Paralel birim işlemede kuyruk ve tavan bizim tarafımızda kalır.
- **Önbellek sayılarını depodan sanmak.** 0,1× okuma / 1,25× (5 dk) ve 2× (1 sa) yazma, en az 1.024 token (Sonnet 5), en çok 4 `cache_control` breakpoint — bunlar `platform.claude.com` belgesinden, depodan değil; fiyat ve eşikler değişebilir, plan bunlara sabitlenmemeli.

## Karar
`bağımlılık` — MIT, model çağrısının tek resmî yolu, yapılandırılmış çıktı ve HTTP yeniden denemesi hazır geliyor.
Sürüm tam pinlenir, `zod` peer'i zaten bizde var, ek bağımlılık yüzeyi iki paket.
Prompt caching ve hız sınırı politikası quizforge tarafında kalır — SDK bunları çözmüyor.

## Kaynaklar
GitHub API (2026-08-22): repo, `releases?per_page=15`; `README.md`, `helpers.md`, `api.md`, `src/client.ts`, `src/helpers/zod.ts`, `src/lib/transform-json-schema.ts`, `package.json`; npm `@anthropic-ai/sdk`; https://platform.claude.com/docs/en/build-with-claude/prompt-caching
