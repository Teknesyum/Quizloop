# Danışma 001 girdi: Quizloop Android (Capacitor) Geçişi — Görüş İsteği

Ajana giden metin:

---

[[danisma:001]]

# Quizloop Android (Capacitor) Geçişi — Görüş İsteği

## Proje

- Quizloop: aralıklı tekrar (FSRS-6, ts-fsrs) quiz motoru. Electron + React 19 + Vite + TypeScript, AGPL-3.0. Sürüm 0.6.0, Windows/macOS/Linux.
- Üç dünya: `src/main` (~2600 satır, Node), `src/preload` (115 satır, contextBridge), `src/renderer` (~4600 satır, React), `src/shared` (~650 satır, tipler + zod + saf yardımcılar).
- Renderer ana süreçle yalnızca `window.quizloop` sözleşmesiyle konuşur (`src/shared/ipc.ts`). Ad alanları: app, window, settings, module, flags, update, transfer, session, source, work, stats.
- Main bağımlılıkları: better-sqlite3 (WAL) + kysely, node:fs (asenkron havuzlu kopya), fflate (zip), electron-updater, özel protokol `quizloop://module/<id>/assets/...`.
- Saf ve taşınabilir: scheduler (ts-fsrs), session state machine, zod şemaları, migrations (append-only).
- Renderer: zustand, tinykeys (Space, A–E, F, Esc, B), CSS Custom Highlight API ile daktilo, View Transitions, pdf.js kitap görüntüleyici (Ctrl+tekerlek zoom), teknesyum-ui token tabanlı koyu tema, masaüstü özel başlık çubuğu.

## Modül paketi

- `.qlmod` = tek zip, 0.3.0 sürümü ~686 MB açılmış: kitap PDF'i 412 MB (1465 sayfa), assets/img 210 MB, assets/kaynak 52 MB, blocks (soru JSON) 9 MB.
- `sources/.../chapters.json` her bölüm için PDF sayfa aralığını tutuyor (body 22–1411).
- Modül telifli kitaptan üretiliyor; Play Store'a konamaz, uygulamaya gömülmez.

## Ortam

- Windows 11, JDK 21, Android SDK (platform 34 ve 36, build-tools 36), emülatör AVD `a8_test`.
- Release akışı GitHub Actions + electron-builder. Kullanıcı Play Console için 25 $ ödemeye hazır.

## Kullanıcının kararları (aynen)

1. Modül APK'ya girmez, sonradan içeri alınır.
2. 650 MB veri sorun değil, tek parça `.qlmod` olarak alınabilir.
3. Veritabanı better-sqlite3 yerine Android'e uygun bir SQLite.
4. Dokunmatik arayüz: kısayollar yerine dokunma, pencere düğmeleri yok, kitapta iki parmakla yakınlaştırma, telefon yerleşimi.
5. Kitap: "telefonda rasgele soru modunda ilgili sayfayı yüklersin biraz geç açılabiliriz ancak bölüm bölüm çalışırken ilgili pdfin ilgili bölümünü yükleyeceğiz yani pdf i parçalara ayırıp öyle işlem yapıcağız hem hızlı hem sadece 1 bölüm aktif"
6. Güncelleme: electron-updater gider; Play Store veya GitHub APK.
7. Daktilo ve geçiş animasyonları korunur.

## Araştırma

- `docs/inceleme/01-capacitor-teknik.md` — Capacitor, SQLite, büyük dosya, PDF, güncelleme, WebView özellikleri.
- `docs/inceleme/02-acik-kaynak.md` — benzer açık kaynak projeler.

## Sorular

1. Platform katmanı: `window.quizloop` sözleşmesini Android'de nasıl uygulamalı? Main'in saf kısmını (session, scheduler, sync, loader) `src/shared` benzeri ortak bir çekirdeğe mi taşımalı, yoksa ayrı `src/android` adaptörü mü? Tek repo, tek sözleşme korunarak.
2. SQLite seçimi: native eklenti (@capacitor-community/sqlite) mi, WebView içi WASM (wa-sqlite/OPFS) mi? kysely ve migration'lar korunmalı.
3. 650 MB `.qlmod` içeri alma: akışla açma, native unzip, kesintiye dayanıklılık, ilerleme çubuğu.
4. PDF bölme: bölümlere ayırma işi nerede yapılmalı — `quizforge paket` aşamasında (masaüstü, pdf-lib/qpdf) mi, telefonda kurulumda mı? Rastgele modda tek sayfa açılışı nasıl hızlı olur?
5. İlk ince dilim için doğru kapsam ve sıra nedir; en büyük riskler ve erken sınama yolları?
6. Gözden kaçan tuzaklar (bellek, WebView sürümü, Play politikaları, AGPL, imzalama, depolama izinleri).

Kısa, kararlı bir görüş istiyoruz: her soruya bir öneri + gerekçe + risk.
