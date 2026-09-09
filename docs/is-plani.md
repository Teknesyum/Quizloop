# Plan — Oturum ekranı düzeltmeleri ve konu hiyerarşisi

Tarih: 2026-09-09. Kaynak: kullanıcının on maddelik listesi ve iki ekran görüntüsü.
Danışma: `docs/netlestirme/004-quizloop-un-oturum-soru-sorma-ekraninin--girdi.md`.

## A — Doğruluk düzeltmeleri (ucuz, önce)

1. **Şıklar görünmeden A–E kilidi.**
   `store/session.ts` içindeki `pick`, `phase === 'stem'` durumunu da kabul
   ediyor; `Session.tsx` tuş bağlamaları evreye bakmadan kuruluyor. İkisi de
   yalnız `choices` evresinde çalışacak. `B` tuşu `stem` evresinde "biliyorum"
   olarak kalır.
   Dosya: `src/renderer/src/store/session.ts`, `src/renderer/src/screens/Session.tsx`

2. **Her oturumda farklı sıra.**
   `buildQueue` bugün `rank` sonra `due.localeCompare` ile tamamen belirlenimci.
   Aynı `rank` içindeki kartlar oturum tohumuyla karıştırılacak; `rank`
   önceliği (gecikmiş → günü gelmiş → yeni) bozulmayacak, yalnız eşitler
   karışacak. Tohum oturum kimliğinden türer, böylece test edilebilir kalır.
   Dosya: `src/main/scheduler/queue.ts`, `src/main/session/machine.ts`

3. **Kısayol satırı metni.**
   `session.keys` "1 2 3 puanla" yerine ne puanlandığını, `F` işaretin ne işe
   yaradığını söyleyen bir metinle değişir. Renk düzeni pembe+mavi tutarlı
   olur (bugün tümü `--tk-purple-text`).
   Dosya: `locale/tr.json`, `locale/en.json`, `src/renderer/src/styles/app.css`

4. **"Anlamadım" düğmesi.**
   Bugün `tk-btn-danger`, yani dolgu `#ff00ea` + siyah metin. Üç puan
   düğmesinin hiyerarşisi fable'ın cevabına göre yeniden kurulur.
   Dosya: `src/renderer/src/screens/Session.tsx`, `styles/app.css`

## B — Okunabilirlik

5. **Taban font büyütme + kullanıcı ayarı.**
   Ölçeğe ara boyut eklenmez; `Settings`'e bir `fontScale` alanı gelir, kök
   üzerinde çarpan olarak uygulanır. Ayar ekranına düğme, oturumda kısayol.
   Dosya: `src/main/settings.ts`, `src/shared/ipc.ts`, `screens/Settings.tsx`,
   `styles/app.css`, `locale/*.json`

6. **Saf beyaz metin.** `--tk-text` zaten `#ffffff`; gri izlenimi veren
   gerçek kaynak (opaklık, `tk-hint`, daktilo imleci) bulunup düzeltilir.

7. **Stem içinde vurgulama + soru cümlesinin ayrılması.**
   Üretim tarafında stem markdown'ı, soru cümlesi ayrı paragraf olacak ve
   anahtar terimler işaretlenecek biçimde yazılır; oynatıcı tarafında bu
   işaretler token renklerine bağlanır. Eski 2532 soru için tek seferlik bir
   dönüştürücü.
   Dosya: `tools/quizforge/*`, `screens/Session.tsx`, `styles/app.css`

## C — Şık tasarımı

8. Şıkların ölçüsü, rozeti, durumları fable'ın kararına göre yeniden yazılır.
   Yalnız token bileşimi; `teknesyum-ui/css/` dokunulmaz. Doğrulama:
   paketlenmiş uygulamada CDP ile 1280 ve 2560 genişlikte ekran görüntüsü.

## D — 59 bölümlük konu hiyerarşisi

Veri hazır: her sorunun `source.chapter` alanı dolu ve kitabın 59 bölümüyle
birebir örtüşüyor (ör. "5 Kardiyovasküler Monitorizasyon" → 55 soru). Şema
değişikliği gerekmiyor; `ModuleMeta.blocks` düz kalabilir.

9. `card` tablosuna `chapter` sütunu (migration), kurulumda doldurulur.
10. `buildQueue`'ya isteğe bağlı bölüm süzgeci; `countDue` bölüm kırılımı verir.
11. Kütüphane'de modül → bölüm listesi → oturum. Daha ince ayrım gerekirse
    `tags` üzerinden ikinci düzey.
Dosya: `src/main/db/migrations.ts`, `db/types.ts`, `scheduler/queue.ts`,
`main/ipc/handlers.ts`, `shared/ipc.ts`, `screens/Library.tsx`

## Sıra
A (1–4) → B (5–6) → C (8) → B (7) → D (9–11).
Her aşama sonunda `npm test`, `typecheck`, `lint`, `ui:scan`.
