# Dayanıklı hat — yeniden başlatılabilir toplu işleme

Üçü aynı soruyu farklı katmanda çözüyor: Nextflow "hangi iş zaten yapıldı"
(kimlik), LangGraph "yarım kalan adım nasıl temsil edilir" (kayıt biçimi),
BullMQ "aynı iş iki kez çalışırsa ve hız sınırı varsa" (yürütme). Eleneneler:
litellm (NOASSERTION lisans, 4909 açık issue), graphile-worker (Postgres şart,
etiketli sürüm yok), inngest (NOASSERTION, sunucu gerektirir).

## Depolar
- nextflow-io/nextflow · https://github.com/nextflow-io/nextflow · Apache-2.0 · push 2026-08-21, son sürüm v26.04.6 (2026-07-09) · 3.470 yıldız, 430 açık issue, ~74 MB, Groovy/JVM
- langchain-ai/langgraph · https://github.com/langchain-ai/langgraph · MIT · push 2026-08-22, son etiket sdk==0.4.3 (2026-08-19) · 40.242 yıldız, 709 açık issue, ~525 MB, Python + sdk-js
- taskforcesh/bullmq · https://github.com/taskforcesh/bullmq · MIT · push 2026-08-22, son sürüm v6.2.0 (2026-08-21) · 9.313 yıldız, 382 açık issue, ~250 MB, TS (Redis şart)

## Alınacak fikirler
- **İşin kimliği içerik hash'i olsun, sıra numarası değil.** Nextflow `-resume`,
  görev hash'ini girdiler + script + ortam + konteynerden hesaplar; hash eşleşiyor
  ve çıktı work dizininde duruyorsa görev atlanır. Quizloop'ta iş anahtarı =
  hash(PDF içerik hash + sayfa aralığı + prompt sürümü + model + şema sürümü).
  Prompt veya şema değişince ilgili parçalar kendiliğinden geçersizleşir, elle
  "cache temizle" yok. Nextflow'un `cache 'lenient'` dersi: zaman damgasına değil
  içerik hash'ine güven.
- **Commit-on-complete.** Nextflow çıktıyı hash'li görev klasörüne yazar, iş
  bitince cache'e girer; yarım çıktı asla "yapıldı" sayılmaz. Quizloop'ta:
  parça önce `.tmp` dosyaya yazılır, doğrulayıcıdan geçer, fsync + rename ile
  yerine oturur, en son ledger'a "tamam" satırı düşülür. Ters sırada çökme
  kalıcı boşluk üretir.
- **Kısmi başarı adım içinde temsil edilir.** LangGraph, bir süper adımda bir
  düğüm patlarsa aynı adımda tamamlanmış düğümlerin yazılarını "pending writes"
  olarak kalıcılaştırır; devam ederken başarılılar yeniden çalışmaz. Quizloop'ta
  10 sayfalık bir turda 7 soru üretildiyse o 7'si anında ledger'a yazılır,
  tekrar sadece kalan 3'ü kapsar. Bir turun tamamını "başarısız" saymak, ödenmiş
  token'ı çöpe atmak demek.
- **Kayıt alanları LangGraph'ten kopyalanabilir:** `values`, `next` (sırada ne
  var), `tasks` (hata/kesinti ile), `metadata.step`, `parent_config`. `next`
  ilerleme çubuğunu bedavaya verir, `parent` denetim izini.
- **Yeniden deneme tavanı ve global hız sınırı.** BullMQ'da hız sınırı kuyruk
  düzeyinde tanımlıdır — 10 worker da olsa saniyedeki iş sayısı sabit kalır; sınıra
  takılan iş kaybolmaz, `waiting`'de bekler. Kilidini yenileyemeyen iş "stalled"
  sayılıp beklemeye döner, `maxStalledCount`'a ulaşınca `failed`'a düşer.
  Karşılığı: "çalışıyor" damgası zaman aşımlı, deneme sayısı tavanlı olmalı —
  sonsuz yeniden deneme faturayı sessizce büyütür.

## Kaçınılacaklar
- **Redis/Postgres bağımlılığı.** Electron kurulumuna harici sunucu sokmak,
  çözdüğü sorundan büyük. BullMQ'dan desen alınır, paket alınmaz.
- **Genel iş kuyruğu soyutlaması.** Worker havuzu, DLQ, öncelik sınıfları —
  çok kiracılı sistemler için. Burada kuyruk zaten bir dizi.
- **Graph/workflow motoru.** LangGraph'ten kayıt biçimi alınır, Python çalışma
  zamanı ve DSL alınmaz; Nextflow'un JVM'i de aynı sebeple dışarıda.
- **Tek büyük JSON'u her yazımda baştan yazmak.** Dosya büyüdükçe her tik
  pahalılaşır, yazma anındaki çökme dosyayı tümden bozar.
- **Sıra numarasıyla ilerleme takibi** (`son_islenen_sayfa: 240`). Parçalar sırayla
  bitmez; tek imleç bunu temsil edemez. Durum parça başına tutulur.

## Karar önerisi
Düz tek JSON kontrol noktası yetmez, iş kuyruğu motoru da fazla — ortası doğru.
Append-only JSONL ledger (satır = parça durumu + iş hash'i + deneme + hata),
yanında temp+fsync+rename ile yazılan snapshot; iş kimliği içerik hash'i,
kısmi başarı parça düzeyinde, deneme tavanı ve basit token bütçesi.
Ek çalışma zamanı yok, harici sunucu yok, ~300 satır kendi kodumuz.
