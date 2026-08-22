# Vitest

## Depo
vitest-dev/vitest · https://github.com/vitest-dev/vitest · MIT · v4.1.11 (2026-08-18) · 16.992 yıldız · ~68,8 MB depo, 365 açık issue, npm `vitest@4.1.11`. Lisans engeli yok.

## Ne için bakıldı
FSRS zamanlamasının deterministik testi (saat kontrolü), ana süreç (Node) ile renderer (DOM) testlerinin tek yapılandırmada yaşayıp yaşayamayacağı, `electron-vite` ile birlikte çalışma.

## Alınacak fikirler
- **Saati sahtelemek yerine enjekte et; `vi.setSystemTime` yalnız yedek.** `docs/api/vi.md`: fake timers kapalıyken `setSystemTime` sadece `Date.*` ve `Temporal.Now.*` çağrılarını taklit eder, timer kuyruğuna dokunmaz. `ts-fsrs` zaten `now` parametresi aldığı için `src/main` zamanlayıcı testleri tarihi argüman olarak geçmeli; `setSystemTime` sadece tarihi dolaylı okuyan yerlerde (kayıt zaman damgası, "bugün due olanlar" sorgusu) devreye girsin. Değerli: zamanlayıcı testi tamamen saf kalır, saat sahteciliği yayılmaz.
- **`test.projects` ile tek kök yapılandırma, iki proje.** `main` projesi `environment: 'node'`, `renderer` projesi `jsdom`/`happy-dom`. `docs/config/workspace.md` v4'te boş — `workspace` kaldırılmış, yerine `projects` geçmiş. İstisna dosyalar için dosya başındaki `@vitest-environment` yorumu (`docs/config/environment.md`) yeterli. Değerli: tek `vitest` komutu iki dünyayı da koşar, CI matrisi büyümez.
- **`fakeTimers.toFake` / `toNotFake` ile sahtelemeyi daraltmak.** Varsayılan "global'de bulunan her şey, `nextTick` ve `queueMicrotask` hariç"; `--pool=forks` altında `nextTick` otomatik olarak `toNotFake`'e ekleniyor (`docs/config/faketimers.md`). Oturum içi süre sayacı testinde yalnız `setTimeout` + `Date` sahtelemek, sızıntıyı ve donmaları engeller. Değerli: maliyeti tek satır yapılandırma.

## Kaçınılacaklar
- **`electron-vite` yapılandırmasının vitest'e devredeceğini varsaymak.** `alex8088/electron-vite` deposunda "vitest" geçen tek dosya yok (`gh api search/code`, 0 sonuç, 2026-08-22). electron-vite'ın `main`/`preload`/`renderer` üçlü yapısını vitest anlamaz; ayrı bir `vitest.config.ts` ve alias'ların elle tekrarı gerekir. electron-vite'ın son etiketli sürümü v6.0.0-beta.1 (2026-04-12), npm latest 5.0.0 — beta ile v1'e girme.
- **Ana süreç testinde gerçek `electron` modülünü beklemek.** Testler düz Node'da koşar, `electron` orada yoktur. Zamanlayıcı, şema doğrulama ve SQLite erişimini `electron` API'sine dokunmayan modüllere ayır; sınırı `vi.mock` ile kes. Bu ayrım zaten planın "zamanlayıcı saf fonksiyon" kararıyla aynı yöne bakıyor.
- **Global setup'ta `vi.useFakeTimers()` açık bırakmak.** `Date` dahil her şey sahtelenince FSRS aralık aritmetiğindeki hata testte sessizce doğru görünebilir. Test başına aç/kapa.
- **Havuz seçimini rastgele bırakmak.** `better-sqlite3` native bir modül; ilerleme veritabanına dokunan testlerde `--pool=forks` daha güvenli görünüyor, ancak threads havuzunda native modülün kırıldığı iddiası bizim tarafımızda **doğrulanamadı** — ilk entegrasyon testinde ölç.
- **Sürüm tazeliği.** v4 hattı yeni ve 365 açık issue var; majör atlarken `projects`/`workspace` gibi kaldırılan alanlar tekrar kontrol edilmeli.

## Karar
`bağımlılık` — devDependency olarak Vitest 4, kökte tek `vitest.config.ts` + `projects: [main(node), renderer(jsdom)]`.
FSRS testleri saat enjeksiyonuyla yazılır; `setSystemTime` yalnız dolaylı tarih okuyan yerlerde kullanılır.
electron-vite ile ortak yapılandırma beklenmez, alias'lar iki dosyada ayrı tutulur.

## Kaynaklar
`gh api repos/vitest-dev/vitest` + `/releases/latest` (2026-08-22) · `docs/config/{faketimers,projects,environment,workspace}.md` · `docs/api/vi.md` · `gh api repos/alex8088/electron-vite` + kod araması.
