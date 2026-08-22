# pino

## Depo
pinojs/pino · https://github.com/pinojs/pino · MIT · son sürüm v10.3.1 (2026-02-09) ·
18.145 yıldız · ~3,5 MB, JS · push 2026-08-13, 165 açık issue, aktif bakımlı.

## Ne için bakıldı
`quizforge run` saatler sürüyor, kontrol noktasının yanında makine defteri tutuyor. JSONL
defteri pino ile mi tutulur, Electron ana sürecinde dosyaya yazmanın doğru yolu hangisi,
kullanıcıya gösterilen ilerleme bundan nasıl ayrılır.

## Alınacak fikirler
- **Bağlam çağrı yerinde değil logger'a bir kez bağlanır.** `logger.child()` ile
  `{ runId, unitId }` alt logger'a yapışır; birim başına bir child, her defter satırının
  hangi birime ait olduğunu tek yerde garantiler.
- **Olaylar `customLevels` ile adlandırılır, metne gömülmez.** `quote-miss`, `retry`,
  `checkpoint` alan olarak ayrılırsa rapor üretimi log'u ayrıştırmadan filtreyle yapılır.
- **Dosyaya yazımı transport değil doğrudan hedef akış yapar.** `pino(pino.destination({
  dest, sync: false }))` tek süreçte kalır, worker açmaz — Electron ana sürecinde doğru
  yol budur. `bundling.md` v7+ transport'ların Worker Threads üstüne kurulu olduğunu,
  paketleyicinin `thread-stream` worker dosyalarını ayrı üretip `__bundlerPathsOverrides`
  ile göstermesi gerektiğini söylüyor; `electron-vite` + asar ile bu ek iş demek.

## Kaçınılacaklar
- **Kullanıcı ilerlemesini log akışından türetmek.** Defter makineye, ilerleme arayüze
  ait; ayrı IPC olayı gider (`unit 12/48`), ortak noktaları yalnız `unitId` olur.
- **`pino-pretty`'i üretim yoluna koymak.** Ek paket ve transport yüzeyi; okunur çıktı
  geliştirici terminalinde kalsın, dosyadaki JSONL ham olsun.
- **Asenkron yazımda çıkışı boşaltmadan bırakmak.** `sync: false` tampon demek, süreç
  ölürken son satırlar kaybolabilir; `api.md`'deki `flushSync()` multistream bağlamında
  geçiyor, süreç çıkışı deseni **doğrulanamadı**. Kontrol noktası bu akışa bağlanmasın.

## Karar
`bağımlılık` — MIT, aktif, JSONL yerli biçimi; yalnız `pino.destination` ile
transport'suz kullanılır, ilerleme kanalı ayrı tutulur.
