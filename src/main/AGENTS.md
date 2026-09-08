# src/main — Node side

- `db/` — kysely + better-sqlite3, WAL. `migrations.ts` is append-only; never
  edit a shipped migration, add the next one. Rows are never deleted; retirement
  writes `retired_at` and removed questions get `orphaned = 1`.
- `modules/` — read-only module packages. `loader.ts` parses and validates,
  `sync.ts` reconciles a module against the card table by `contentHash` and
  `core_hash`, `install.ts` copies a package into the user data folder.
- `scheduler/` — FSRS-6 through `ts-fsrs`. `mapRating` blends self-assessment
  with `knownWithoutChoices` and `wrongPicks`. Keep it pure and tested.
- `session/` — the session state machine. Holds the relearn queue in memory
  only, buries a concept for the rest of the day, and writes one `review_log`
  row per graded answer.
- `assets/protocol.ts` — `quizloop://module/<id>/assets/...`, root-scoped.

better-sqlite3 is native and ABI-split: `npm test` needs the Node build,
`npm run dev` the Electron one. `scripts/abi.mjs` swaps them; the npm scripts
already call it, so do not rebuild by hand.
