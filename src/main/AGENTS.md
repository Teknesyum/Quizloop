# src/main — Electron shell

Platform logic lives in `src/core`; this folder adapts it to Electron.

- `ports.ts` — `nodePorts`, the Node implementation of `CorePorts`.
- `ipc/` — `ipcMain.handle` wiring. Parse args with zod, call `createCore()`
  commands, and keep only shell work here: dialogs, windows, file writes.
- `db/index.ts` — better-sqlite3 + kysely, WAL, runs `@core/db/migrations`.
- `modules/` — `install.ts` (copy into the user folder, then core validate and
  sync), `paket.ts` (`.qlmod` unzip), `catalog.ts` (catalog fetch, hashed download; 0029).
- `assets/` — `quizloop://module/<id>/assets/...` and the source-book protocol.
- `settings.ts`, `transfer.ts`, `update.ts`, `window.ts`, `fstree.ts`, `work.ts`.
- `boot.ts` — the package entry. Loads a downloaded code bundle from
  `userData/kod/` or the installed `index.js` (decision 0011). `kod.ts`
  downloads and verifies a bundle, `kodstate.ts` keeps `durum.json`.

better-sqlite3 is native and ABI-split: `npm test` needs the Node build,
`npm run dev` the Electron one. `scripts/abi.mjs` swaps them; the npm scripts
already call it, so do not rebuild by hand.
