# src/android — Capacitor shell

Builds `window.quizloop` on Android from `src/core`, then loads the renderer.
Never import Electron or Node here. Logcat shows a `[quizloop] boot` line with timings.
Built by `vite.android.config.ts` into `out/android`; `npm run android:apk` makes the APK.

- `boot.ts` — creates the shell, then imports `@renderer/main`; shows a boot error.
- `shell.ts` — `createShell()`: database, bundled modules, settings, `createCore`.
  Desktop-only calls (window, updater, zoom, pickers, transfer) are safe no-ops.
  `ANDROID_CAPABILITIES` tells the renderer what to hide.
- `db/dialect.ts` — Kysely dialect over `@capacitor-community/sqlite`. One mutex,
  no `RETURNING`, no streaming. Reopens once if the native connection was lost.
- `db/open.ts` — opens, WAL with DELETE fallback, `quick_check`, migrator,
  generation counter, `resume()` on return from background.
- `ports.ts` — reads bundled modules from `/bundled` (APK assets). No `.gz`/`.mjs`.
- `settings.ts` — `@capacitor/preferences`; `work.ts` — `work:progress` events for the modal.
- `paket.ts` — `.qlmod` import over the `QuizloopPaket` Java plugin (`PaketPlugin.java`):
  native unzip to `files/modules/.tmp-*`, verify, atomic move, sync. Files via `convertFileSrc`.
- `pdfworker.ts` + `polyfill.js` — pdf.js worker from a blob module that loads the WebView 113
  polyfills first. Books open as chapter PDFs (`source.bolumler`), fetched whole: no Range.
