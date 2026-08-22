# Quizloop — agent guide

Cross-platform spaced-repetition quiz engine. Electron + React + TypeScript +
Vite, packaged with electron-builder for Windows, macOS and Linux.

- `docs/PLAN.md` — architecture and milestones. Read before touching code.
- `docs/taramalar/` — prior-art survey (Turkish, internal).
- `docs/kararlar/` — decision log (Turkish, internal).
- `schema/` — JSON Schema for the module format. The validator is the contract.
- `modules/` — content packages, git-ignored. Only `modules/_ornek/` ships.

Rules: never commit a real module. Never write comments in code. Question
records must carry their `kaynak` (file, page, quote) so claims stay traceable.
User-facing repository documents are English; internal notes stay Turkish.
