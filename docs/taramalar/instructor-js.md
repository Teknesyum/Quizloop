# instructor-js

## Depo
`567-labs/instructor-js` · https://github.com/567-labs/instructor-js · MIT · son sürüm `v1.7.0` (2025-01-27; npm `@instructor-ai/instructor` 1.7.0, aynı tarih) · 802 yıldız · 14 açık issue · ~2,8 MB; son commit de 2025-01-27 — yaklaşık 19 aydır hareket yok, arşivlenmemiş. Bağımlılıklar: `zod-stream` **3.0.0** (tam pin; npm'de güncel 4.0.0), `zod-validation-error`; peer `openai >= 4.58` ve `zod >= 3.23.8`.

## Ne için bakıldı
quizforge'un çıktı disiplini "şemaya uymayan cevabı onar, uyduramıyorsan hata ver" üzerine kurulu. Soru: şema uyumsuzluğunda otomatik yeniden deneme değerli mi, zod ile nasıl kuruluyor, SDK'nın kendi `json_schema` zorlaması varken bu katman gerekli mi.

## Alınacak fikirler
- **Onarım turu aynı konuşmada yapılır.** `src/instructor.ts` akışı: yanıtı JSON'a çevir → `schema.safeParseAsync` → başarısızsa modelin ham çıktısını `assistant` mesajı olarak konuşmaya geri koy, hemen ardından `user` rolüyle "önceki çağrıyı düzelt, karşılaşılan hatalar: …" mesajı ekle, deneme sayacını artır. Model neyi yanlış yazdığını görüyor, sıfırdan üretmiyor. quizforge'un onarım katmanı bu şeklî deseni alabilir — biçim düzeltilir, içerik uydurulmaz.
- **Zod hatası modele ham gitmez.** `zod-validation-error`'ın `fromZodError`'ı ile insan-okunur tek metne çevrilip gönderiliyor. Bizde de `ZodError.issues` doğrudan istem yüküne konmaz; yol + mesaj listesi kısaltılır (Anthropic SDK'nın kendi zod yardımcısı da ilk 5 issue ile sınırlıyor — `anthropic-sdk.md`).
- **Yeniden deneme opt-in.** `MAX_RETRIES_DEFAULT = 0`; kullanıcı `max_retries` vermezse tek deneme. Sessiz maliyet artışına karşı doğru varsayılan; bizde de birim başına deneme tavanı açıkça yazılıp ledger'a düşmeli, örtük olmamalı.

## Kaçınılacaklar
- **Bağımlılık olarak almak.** Bakım durmuş (son commit ve son sürüm 2025-01-27), `openai` paketi zorunlu peer, Anthropic yalnız üçüncü taraf `llm-polyglot` üzerinden destekleniyor. Biz doğrudan Anthropic SDK kullanıyoruz; araya OpenAI uyumlu bir istemci koymak saf yüzey artışı.
- **zod v4 ile kullanmak.** Genel tipler `z.AnyZodObject` üstüne kurulu; zod ana dalının v4 kaynağında (`packages/zod/src/v4/classic/schemas.ts`) bu isim geçmiyor — v3'e özgü. Peer aralığı `>=3.23.8` bunu gizler, tip hatası derlemede patlar. Ayrıca `zod-stream` 3.0.0 tam pinli.
- **Akışta onarım beklemek.** Streaming yolunda `max_retries` desteklenmiyor, yalnız uyarı basılıyor. Akış + doğrulama-yeniden-deneme aynı anda çalışmıyor.
- **Katmanı gereksiz yere kurmak.** Anthropic SDK sunucu tarafında `json_schema` ile çıktıyı kısıtlıyor; geriye kalan gerçek risk şemaya çevrilemeyen kurallar (`.refine()`, alıntının kaynak metinde geçmesi, şık sayısı tutarlılığı gibi anlamsal kontroller). Onarım turunu yalnız bunlar için kurarız, genel bir "LLM istemcisi sarmalayıcısı" için değil.

## Karar
`desen` — onarım turunun mesaj kurgusu ve "yeniden deneme varsayılan kapalı" tercihi alınır.
Paket alınmaz: bakımsız, OpenAI istemcisine bağlı, zod v3 tiplerinde.
Uygulaması bizde ~50 satırlık bir döngü; bağımlılık maliyeti buna değmiyor.

## Kaynaklar
GitHub API (2026-08-22): repo, `releases/latest`, `commits`; `README.md`, `src/instructor.ts`, `package.json`; npm `@instructor-ai/instructor`, `zod-stream`; zod ana dal kaynağında `AnyZodObject` araması.
