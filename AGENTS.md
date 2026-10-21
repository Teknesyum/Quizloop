# Quizloop — agent guide

Cross-platform spaced-repetition quiz engine. Electron + React + TypeScript +
Vite, packaged with electron-builder for Windows, macOS and Linux. AGPL-3.0-or-later.

- `docs/PLAN.md` — architecture and milestones. Read before touching code.
- `docs/kararlar/` — decision log (Turkish, internal). It overrides the plan.
- `docs/taramalar/` — prior-art survey (Turkish, internal, historical).
- `src/AGENTS.md` — process layout and the IPC rule. Each subfolder has its own.
- `docs/modul-standardi.md` — versioned module standard. "Update the module to the standard" means apply it.
- `schema/` — generated JSON Schema. Edit the zod source, run `npm run schema:gen`.
- `sources/` — per-book rules and build state, git-ignored except the neutral
  `sources/example/` template. Book names, quotes and screenshots of real content stay local (0032).
- `modules/` — content packages, git-ignored. `resources/varsayilan/` holds the bundled
  defaults: `genel-kultur` from `scripts/ornek/*.json` (`npm run ornek`), `arapca` and
  `ingilizce-lite` from `modules/` (`npm run varsayilan`). Open licences only; a hand edit breaks hashes.
- `docs/iskelet-talepleri/` — module sessions file engine change requests here, never edit `src/`.
- `dist/` — build output: `desktop/`, `android/`, `modules/` (0012). `out/web` — PWA (0015).

Commands: `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`,
`npm run ui:scan`. All five must pass before a commit.

Rules: never commit a real module. Never write comments in code. Question
records must carry their `kaynak` (file, page, quote) so claims stay traceable.
User-facing repository documents are English; internal notes stay Turkish.
