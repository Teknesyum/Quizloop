# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Repository skeleton: README, agent guide, ignore rules, documentation layout.
- Architecture plan (`docs/PLAN.md`) covering the scheduler, module format, progress
  database, application boundaries and the module generation pipeline.
- Prior-art survey across 17 topics (`docs/taramalar/`).
- Decision log (`docs/kararlar/`), starting with the stack and licence stance.
- Application skeleton: Electron 42 with electron-vite, React 19, TypeScript,
  and the security trio (context isolation, sandbox, no node integration) on
  every window. The preload bridge exposes a single typed `window.quizloop`.
- Progress database: SQLite through kysely and better-sqlite3, WAL mode,
  append-only migrations, integrity check on open.
- Scheduler: FSRS-6 via `ts-fsrs`. Self-assessment blends with objective
  signals — answering before revealing the options, and wrong picks — to
  produce the rating. Retirement writes a timestamp; rows are never deleted.
- Session engine: relearn queue, concept burying for the rest of the day, a
  configurable day boundary, and one review log row per graded answer.
- Module format: read-only JSON packages validated by zod, with JSON Schema
  generated from the same source, content hashing for change detection and a
  root-scoped `quizloop://` protocol for assets.
- Screens: library, session, summary and settings, keyboard-driven, styled
  against the teknesyum-ui token set.
- `modules/_ornek/` — a five-question sample module, every wrong option
  explained and every record carrying its source quote.
- Continuous integration on Linux, macOS and Windows; a tag-triggered release
  workflow that drafts a GitHub release from the three packaged builds.

### Changed

- Distribution licence is AGPL-3.0-or-later, replacing MIT. Copyleft
  dependencies are now allowed; see `docs/kararlar/0003-lisans-agpl.md`.
