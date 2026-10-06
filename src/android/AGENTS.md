# src/android — Capacitor shell

Builds `window.quizloop` on Android from `src/core`, then loads the renderer.
Never import Electron or Node here. Logcat shows a `[quizloop] boot` line with timings.
Built by `vite.android.config.ts` into `out/android`; `npm run android:apk` makes the APK.

- `boot.ts` — shell, then `@renderer/main`, or a boot error. `shell.ts` — `createShell()`.
  Desktop-only calls (window, updater, zoom, pickers, transfer) are safe no-ops.
  `ANDROID_CAPABILITIES` tells the renderer what to hide.
- `db/dialect.ts` — Kysely dialect over `@capacitor-community/sqlite`. One mutex,
  no `RETURNING`, no streaming. Reopens once if the native connection was lost.
- `db/open.ts` — opens, WAL with DELETE fallback, `quick_check`, migrator,
  generation counter, `resume()` on return from background.
- `ports.ts` — reads bundled modules from `/bundled` (APK assets). No `.gz`/`.mjs`.
- `settings.ts` — preferences; `work.ts` — modal progress; `update.ts` — quiet check at
  start; `MagazaPlugin.java` tells Play from GitHub, and a Play install announces only what Play offers.
- `paket.ts` — `.qlmod` import over the `QuizloopPaket` Java plugin (`PaketPlugin.java`):
  native unzip to `files/modules/.tmp-*`, verify, atomic move, sync. Files via `convertFileSrc`.
- `pdfworker.ts` + `polyfill.js` — pdf.js worker from a blob module that loads the WebView 113
  polyfills first. Books open as chapter PDFs (`source.bolumler`), fetched whole: no Range.
