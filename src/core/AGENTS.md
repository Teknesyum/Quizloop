# src/core — platform-free logic

Shared by the Electron shell (`main/`) and the coming Android shell. Runs in Node
and in a WebView, so no `node:*`, `electron`, `better-sqlite3` or `@main/*` imports;
ESLint enforces it. Tests (`*.test.ts`) may use Node.

- `ports.ts` — `CorePorts` (`readText`, `exists`, `sha256`, `now`) and `SettingsStore`
  are injected by the shell. `joinPath` and `subtleSha256` are pure helpers.
- `db/` — `types.ts` and `migrations.ts`. Migrations are append-only. Cards keep
  history: retirement writes `retired_at`, a removed question sets `orphaned = 1`.
- `modules/` — `loader.ts` (async, port-driven) and `sync.ts`.
- `testdata/ornek/` — eight-question fixture module for the tests; not shipped.
- `scheduler/` — FSRS-6 (`fsrs.ts`) and the queue. Keep pure and tested.
- `session/machine.ts` — the session state machine; ids via `crypto.randomUUID()`.
- `commands/` — one file per IPC namespace. `createCore()` wires them into the
  object a shell exposes as `window.quizloop`. Inputs are typed; zod parsing of
  untrusted IPC args stays in the shell.

Dialogs, windows, protocol, updater, file copy and zip stay in the shell.
