# Zustand

## Depo
pmndrs/zustand · https://github.com/pmndrs/zustand · MIT · v5.0.15 (2026-08-13) · 58.595 yıldız · ~7,9 MB depo, 6 açık issue. **Runtime bağımlılığı yok**; peer olarak `react >=18`, opsiyonel `immer`, `use-sync-external-store`. Kaynak yüzeyi küçük: `src/vanilla.ts`, `src/react.ts`, `src/shallow.ts`, `src/middleware/` (combine, devtools, immer, persist, redux, ssrSafe, subscribeWithSelector). Lisans engeli yok.

## Ne için bakıldı
Sınav oturumu beş durumlu bir makine (hazırlık → soru → cevap/geri bildirim → sonraki karta geçiş → özet). Soru: zustand bu makineyi ayrıştırıcı birleşimle taşıyabilir mi, yoksa XState gerekir mi.

## Alınacak fikirler
- **Birleşimi tek alanda topla, aksiyonları kökte bırak.** `docs/learn/guides/immutable-state-and-merging.md`: `set` yalnız bir seviye derinlikte birleştirir. Yani store kökü `{ phase: SessionPhase, ...aksiyonlar }` olmalı ve geçiş `set({ phase: yeniPhase })` ile yapılmalı — yeni `phase` nesnesi eskisinin yerine tümüyle geçtiği için önceki varyantın alanları sızmaz, aksiyonlar da kaybolmaz. Değerli: `replace` bayrağına hiç gerek kalmaz, TypeScript ayrıştırıcı birleşimi `phase.kind` üzerinden daraltır.
- **Geçişi store dışında saf fonksiyon olarak yaz.** `transition(phase, event) => phase` ayrı bir modülde dursun, store yalnız çağırsın. Değerli: geçiş tablosu tek yerde okunur (XState'in asıl faydası buydu), testi React'sız koşar — `src/vanilla.ts`'in `createStore`'u veya doğrudan saf fonksiyon yeter. `src/main` tarafındaki zamanlayıcı testleriyle aynı disiplin.
- **Seçici + `useShallow` ile yeniden çizimi sınırlamak.** `zustand/react/shallow`. Soru ekranı yalnız `phase.kind` ve o varyantın alanlarına abone olur; geri bildirim durumuna geçiş tüm ağacı yeniden çizmez. Değerli: maliyet tek import, kazanç uzun oturumlarda gözle görülür.

## Kaçınılacaklar
- **Store kökünü doğrudan ayrıştırıcı birleşim yapmak.** `set` birleştirdiği için eski varyantın alanları kökte kalır; `set(x, true)` ile zorlarsan aksiyonlar silinir — `docs/learn/guides/advanced-typescript.md` bunu açıkça uyarıyor (`set({ bears: 0 }, true)` `increase`'i siler) ve tipleme buna izin verdiği için hata derleme zamanında yakalanmaz. Birleşim daima `phase` alanının içinde.
- **Dinamik `replace` bayrağı.** Aynı belgede `Parameters<typeof set>` ile `as` kaçamağı gerektiren bir bölüm var; tip güvenliğini elle kırıyor. Bizde `replace` hiç kullanılmamalı.
- **`persist` ile oturum durumunu diske yazmak.** İlerleme SQLite'ta ve tek doğruluk kaynağı orası; `localStorage`'a düşen yarım oturum ikinci bir doğruluk kaynağı yaratır. Yarıda kalan oturumu sürdürmek gerekirse kayıt main sürecine, veritabanına yazılır.
- **Zustand'ı ana süreçte ortak durum sanmak.** Vanilla store Node'da çalışır ama süreçler arası senkron yoktur; renderer store'u daima türev, kalıcı gerçek main tarafında.
- **XState'i "ileride lazım olur" diye şimdi eklemek.** Tek yönlü, beş durumlu ve iç içe olmayan bir akış için ağır. Eşik: hiyerarşik/paralel durum, gecikmeli otomatik geçiş veya geçiş sayısının elle bakılamayacak kadar artması. XState bu taramada incelenmedi; karşılaştırma bizim değerlendirmemiz, ölçüm değil.

## Karar
`bağımlılık` — zustand v5, oturum makinesi ve UI durumu için tek store; sıfır runtime bağımlılığı ve MIT olması Electron paketleme yüzeyini büyütmüyor.
Kurulum: kökte `phase` alanı + saf `transition` fonksiyonu; `replace` bayrağı ve `persist` yasak.
XState v1'de gerekmiyor; yukarıdaki eşiklerden biri gerçekleşirse geçiş tablosu zaten ayrı dosyada olduğu için taşıma ucuz.

## Kaynaklar
`gh api repos/pmndrs/zustand` + `/releases/latest` (2026-08-22) · `npm view zustand dependencies/peerDependencies` · `docs/learn/guides/immutable-state-and-merging.md` · `docs/learn/guides/advanced-typescript.md` · depo kök/`src` listesi.
