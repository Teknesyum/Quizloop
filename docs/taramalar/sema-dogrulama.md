# Şema doğrulama: zod, ajv, typebox

## Depolar

- **zod** · https://github.com/colinhacks/zod · MIT · son push 2026-08-20, son sürüm v4.4.3 (2026-05-04) · 43.5K yıldız, 116 açık issue, ~24 MB monorepo (packages/zod, docs, bench)
- **ajv** · https://github.com/ajv-validator/ajv · MIT · son push 2026-05-12, son sürüm v8.20.0 (2026-04-24) · 14.8K yıldız, 376 açık issue, ~39 MB
- **typebox** · https://github.com/sinclairzx81/typebox · MIT (GitHub "NOASSERTION" diyor, license dosyası MIT metni) · son push 2026-08-19, GitHub release yok (changelog/ klasörü kullanılıyor) · 6.9K yıldız, 7 açık issue, ~19 MB
- Not: TypeBox ikiye bölünmüş. Bu depo 1.x = npm `typebox` (1.3.16), **TypeScript 6.0–7.0+ ve yalnız ESM**. Eski hat npm `@sinclair/typebox` 0.34.52, ayrı depo `sinclairzx81/sinclair-typebox` (10 yıldız, 2 issue, son push 2026-07-18) — LTS etiketli, düşük etkinlik.

## Alınacak fikirler

- **Tek kaynak Zod, JSON Schema türetilmiş çıktı.** Zod v4'te `z.toJSONSchema(schema, { target })` çekirdekte; draft-2020-12, draft-07, draft-04 ve openapi-3.0 hedefleri var (docs/json-schema.mdx). Quizloop'ta modül şeması `packages/schema` içinde tek yerde durur; uygulama yükleme anında `safeParse`, üretim hattı aynı şemadan üretilen JSON Schema'yı modele "structured output" olarak verir. Değerli: şema ile modele verilen sözleşmenin ayrışması imkânsız hâle gelir.
- **`unrepresentable` ve `override` kancaları.** JSON Schema'ya çevrilemeyen kısımlar (Date, bigint, `refine` ile yazılmış "doğru şık listede var mı" gibi çapraz kurallar) varsayılan olarak hata fırlatır; her biri için tek tek yerine koyma veya kendi hata metnini yazma imkânı var. Quizloop'ta: modele giden şema "yapısal" kalır, çapraz kurallar (görsel dosya diskte mi, alıntı kaynakta geçiyor mu) yalnız çalışma zamanında koşar. Değerli: modelden dosya sistemi bilgisi beklemeyen net bir sınır.
- **Ajv'yi ikinci aşamada, derlenmiş doğrulayıcı olarak tut.** Ajv'nin standalone kod üretimi ve `discriminator` anahtar kelimesi var (README, ajv.js.org/standalone.html). Quizloop'ta yalnız üretim hattı binlerce kaydı toplu tararken devreye alınır: Zod'dan üretilen JSON Schema, Ajv ile bir kez derlenir. Değerli: hız gerekirse ikinci bir şema tanımı yazmadan gelir; gerekmezse hiç kurulmaz.

## Kaçınılacaklar

- **TypeBox 1.x'e bugün bağlanmak.** Readme "TypeScript 6.0–7.0+, ESM only" diyor. Electron + mevcut TS sürümüyle bu, derleyici ve paketleme tarafında gizli bir taşınma maliyeti. 0.x hattı ayrı depoya taşınmış ve orada etkinlik düşük — iki hat arasında hangisinin uzun ömürlü olduğu dışarıdan okunmuyor.
- **TypeBox readme'sindeki AJV8 karşılaştırma tablosunu karar dayanağı yapmak.** Rakamlar (ör. `Union_Or` 95M vs 7.9M ops/s) projenin kendi ölçümü, bağımsız doğrulaması yok — **doğrulanamadı**. Ayrıca Quizloop'un ölçeği "binlerce kayıt"; bu ölçekte üç kütüphane de milisaniyeler mertebesinde kalır, hız seçim kriteri değil.
- **JSON Schema'yı elle yazıp tipi ayrıca tanımlamak (saf Ajv yolu).** Ajv tip çıkarımı için `JSONSchemaType<T>` ister; tip ile şema iki ayrı yerde tutulur ve sessizce ayrışır. Ayrıca format desteği (`ajv-formats`) ve okunur hata mesajı (`ajv-errors` / `better-ajv-errors`) ayrı paketlerdir — bağımlılık yüzeyi büyür. Ajv'nin 376 açık issue'su ve v8 hattının uzun süredir küçük sürümlerle ilerlemesi de not edilmeli.
- **Ham `ZodError` nesnesini modül yazarına göstermek.** İç içe `issues` dizisi okunmaz. `z.prettifyError()` / `z.treeifyError()` / `z.flattenError()` üçlüsünden biri seçilip tek bir raporlama katmanında sabitlenmeli (docs/error-formatting.mdx).

## Karar önerisi

Zod v4 tek şema kaynağı olsun; TypeScript tipi `z.infer`, doğrulama `safeParse`, modele giden JSON Schema `z.toJSONSchema(..., { target: "draft-2020-12" })`.
Blok tipleri `z.discriminatedUnion("type", [...])` ile yazılsın — ayrıştırıcı alan hem tip daraltmayı hem de yanlış blokta doğru hata yolunu verir.
Şema sürümü modül JSON'ında `schemaVersion` alanı olarak taşınsın; sürüm ayrıştırıcının kendisi olsun, eski sürümler ayrı şema olarak durup göç fonksiyonuyla yenisine çevrilsin (Zod'un `codecs` başlığı bu çift yönlü dönüşüm için doğrudan yol sunuyor).
Ajv şimdilik kurulmasın; üretim hattında toplu doğrulama ölçülebilir şekilde yavaşlarsa, üretilmiş JSON Schema'yı derleyen ikinci aşama olarak eklensin.
TypeBox okunmaya değer ama bağımlılık olarak alınmasın: JSON Schema'yı birincil temsil sayan tasarımı ve JIT derleme fikri, Ajv aşamasına geçilirse yeniden değerlendirilir.

## Kaynaklar

- `gh api repos/{colinhacks/zod, ajv-validator/ajv, sinclairzx81/typebox, sinclairzx81/sinclair-typebox}` — yıldız, açık issue, lisans, son push (22.08.2026)
- `gh api repos/.../releases/latest` — zod v4.4.3, ajv v8.20.0; typebox'ta release yok
- `npm view` — zod 4.4.3, ajv 8.20.0, @sinclair/typebox 0.34.52, typebox 1.3.16
- zod docs: packages/docs/content/json-schema.mdx, error-formatting.mdx, codecs.mdx
- typebox readme (Schema/Compile, Performance, Versions bölümleri) · ajv README (discriminator, standalone, ajv-formats)
