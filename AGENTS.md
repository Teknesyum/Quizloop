# Quizloop — agent guide

Cross-platform spaced-repetition quiz engine. Electron + React + TypeScript +
Vite, packaged with electron-builder for Windows, macOS and Linux. AGPL-3.0-or-later.

- `docs/PLAN.md` — architecture and milestones. Read before touching code.
- `docs/kararlar/` — decision log (Turkish, internal). It overrides the plan.
- `docs/taramalar/` — prior-art survey (Turkish, internal, historical).
- `src/AGENTS.md` — process layout and the IPC rule. Each subfolder has its own.
- `schema/` — generated JSON Schema. Edit the zod source, run `npm run schema:gen`.
- `modules/` — content packages, git-ignored. Only `modules/_ornek/` ships.

Commands: `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`,
`npm run ui:scan`. All five must pass before a commit.

Rules: never commit a real module. Never write comments in code. Question
records must carry their `kaynak` (file, page, quote) so claims stay traceable.
User-facing repository documents are English; internal notes stay Turkish.
