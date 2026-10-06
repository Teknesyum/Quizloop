# src/web — browser shell (PWA)

Builds `window.quizloop` in a plain browser from `src/core`, then loads the renderer.
No Electron, Node or Capacitor imports. Decision 0015 explains the choices.
Built by `vite.web.config.ts` into `out/web` (`npm run web:build`); `npm run web:serve`
serves it locally. `.github/workflows/release.yml` calls `pages.yml` to publish it to GitHub Pages on a tag (0025).

- `boot.ts` — registers `sw.js`, waits until it controls the page, then shell and renderer.
- `shell.ts` — `createShell()`. Desktop-only calls are no-ops; capabilities follow the
  pointer type, so a phone gets the touch layout and a laptop gets the keys.
- `db/worker.ts` — SQLite WASM in a worker on the `opfs-sahpool` VFS: persistent and
  needs no COOP/COEP headers. One tab at a time; a second tab gets `web.oneTab`.
- `db/open.ts` — Kysely driver over that worker, `quick_check`, migrator.
- `store.ts` — `.qlmod` import: streamed unzip, one Cache Storage cache per install
  (`ql-mod-<stamp>`), module root `<scope>m/<stamp>`. Replacing a module deletes its old
  cache after the sync; `sweep()` drops caches no module row points at.
- `sw.js` — template; the build fills in the file list. Serves `<scope>m/…` from the module
  caches and the app from `ql-shell-<version>`. A new worker waits while a page runs; at
  load `boot.ts` asks for an update, waits for its install and hands over (0021, 0026).
- `settings.ts` — `localStorage`. `public/` — manifest and icon. Shared with Android:
  `../android/work.ts`, `ports.ts` (`loadBundle`), `pdfworker.ts`.
