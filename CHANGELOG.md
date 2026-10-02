# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- On first launch the interface follows the device language: Turkish on a Turkish
  device, English otherwise. A language chosen in the title bar still wins.

## [0.7.1] - 2026-10-02

### Changed

- The Android application id is `com.teknesyum.QuizLoop`. An APK installed from
  0.7.0 does not update in place: export a transfer package, uninstall it and
  install 0.7.1.
- The title bar follows teknesyum-ui 0.34.0: logo, two-part name and version on
  the left; update badge, language switch, support and Teknesyum on the right.
- The interface can switch between Turkish and English.

## [0.7.0] - 2026-10-02

### Added

- An Android app, built with Capacitor on the same screens and the same core
  as the desktop app. It keeps progress in a native SQLite database, imports
  a `.qlmod` package from the system file picker without copying it through
  the WebView, and opens the source book one chapter at a time.
- Phone layout: bottom tab bar, single-column screens, larger touch targets,
  safe-area insets, pinch zoom in the book and a back button that steps from
  the session to the chapters to the library.
- `quizforge paket --android` splits the book into chapter PDFs.
- Android checks GitHub for a newer release and backs up its database before
  a migration.
- Settings links to the source code, and the repository has a privacy policy.
- The release workflow also builds a signed APK and an Android App Bundle.

### Changed

- The app is shown as QuizLoop.
- Platform-free logic moved to `src/core`, shared by both shells.
- New cards are written in batches, and the startup sync skips modules whose
  `module.json` has not changed.

### Fixed

- The font size setting is saved.
- Finishing a session on its last question shows the summary instead of the
  empty screen.

## [0.6.0] - 2026-10-02

### Added

- A "Mixed" button on each module card and a "Mixed from all topics" button
  on the chapter screen start a session drawn from every chapter.
- The module version is shown on the chapter screen.
- The book viewer zooms with Ctrl + mouse wheel, from 100% to 400%.
- `quizforge secenek` measures, exports and applies choice rewrites so the
  correct answer is no longer given away by being the longest choice.

### Changed

- Question text types in place without reflowing: a word no longer jumps to
  the next line halfway through.
- Tables and figures sit centred above the question, tables are narrower and
  cells wrap at a readable width.
- The session uses more of the screen on wide displays and stays anchored to
  the top instead of jumping between short and long questions.
- Choice letters read as "A)" instead of boxed keys.
- Chapter covers show the whole picture under an even tint.
- A correct answer moves straight to the next question, with a short cross
  fade between questions.
- The book opens about three times faster, reopens almost at once and renders
  sharp at any zoom.
- The startup database check is faster.

### Removed

- The difficulty label on questions.
- Installing a `.qlmod` package no longer moves the package file to the
  Recycle Bin.

## [0.5.1] - 2026-10-01

### Added

- The title bar shows the app version. Clicking it checks for an update and
  says when you are already on the latest one.
- A found update opens an update panel with download, install and cancel
  steps and a progress bar.

## [0.5.0] - 2026-10-01

### Added

- Long jobs show a progress dialog: installing and removing a module, and
  exporting or importing a transfer package. It names the current step and
  counts files as they move.
- `quizforge paket` embeds the source book PDF in the `.qlmod` under
  `kaynak/`, so an installed module finds its book without asking for it.

### Changed

- File copies and removals run in parallel and no longer block the app.
  Removing a large module drops from about 17 s to under a second.
- Chapter and cover images on library cards are easier to see.

## [0.4.2] - 2026-10-01

### Changed

- Module titles on library cards are one step larger.

## [0.4.1] - 2026-10-01

### Changed

- Installing a `.qlmod` package by pick, drop or double-click now moves the
  package file to the recycle bin once the module is in place. A package on a
  USB stick, memory card, external or network drive is left where it is. The
  install message says which happened.
- Module tags are shown in Title Case on library cards; they stay lowercase in
  `module.json`.
- The Teknesyum Base manifest names the Windows setup asset and install method,
  so Base never picks another file from the release.

## [0.4.0] - 2026-10-01

### Added

- Single-file module packages (`.qlmod`). Install one with **Pick module file**, by dropping it
  on the library, or by double-clicking it once Quizloop is installed.
- Modules carry tags (`tags` in `module.json`), shown as badges on the library card.
- quizforge `paket` wraps a built module and its tags into `dist-modules/<id>-<version>.qlmod`.

### Changed

- Quizloop runs as a single instance; opening a package while it runs installs it in the open window.

## [0.3.2] - 2026-10-01

### Fixed

- Library card buttons wrap instead of overflowing the card on narrow windows or large text.
- A module without a cover no longer shows a broken image on its card.

## [0.3.1] - 2026-10-01

### Changed

- quizforge `verify` now rejects a stem or solution image without alt text.
- `kaynak_kes.py` keeps only the densest cluster of matched words, so source excerpts are
  cropped to the quoted passage instead of whole columns.

### Fixed

- `kaynak_kes.py` falls back to window matching for quotes that are split across columns or
  pages, and skips blank crops instead of saving them.

## [0.3.0] - 2026-10-01

### Added

- Three visual question types: a stem that carries a structured table, a
  figure with one label masked, and marking questions whose choices are boxes
  on the figure (decision 0008).
- Solutions can carry a figure or a table next to the text.
- Figure lightbox with zoom, drag and fit; it opens fitted to the view.
- quizforge: `--tur tablo` and `--tur etiket` lanes, table OCR and label
  extraction (`py/tablo.py`, `py/etiket.py`), `geri-al` for rolling back a lane.
- quizforge verify checks table cells against the source page and its OCR,
  masked labels leaking into the stem, and duplicate marking choices. Tables
  checked by eye against the page image are recorded in `build/tablo/onay.json`.

### Changed

- Tables without a real header row render without an empty `<thead>`.

## [0.2.2] - 2026-09-30

### Changed

- Interface moved to teknesyum-ui 0.32.0; the title bar drops the site link.
- Open and save dialogs no longer create a hidden window when no parent
  window is found.

## [0.2.1] - 2026-09-27

### Changed

- New program icon, generated from the theme tokens (`npm run icon:gen`): a
  review ring around a brain, replacing the default Electron icon.

## [0.2.0] - 2026-09-27

### Changed

- Interface moved to teknesyum-ui 0.26.0: the owner's refreshed palette
  (primary, accent and support colours) and a 4 px corner radius.
- Every screen audited at 100, 125 and 150% scale in the packaged app with no
  contrast or target-size errors; dialog and toast titles, the source line,
  the bank row ellipsis and the sticky grade row were fixed along the way.

## [0.1.0] - 2026-09-23

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
