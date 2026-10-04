<!-- lang -->

[<img src="assets/badge-lang.svg" alt="English selected, switch to Türkçe" width="124" height="44">](README.tr.md)

# QuizLoop

Adaptive spaced-repetition quiz engine. Turn a book into a question module and
drill it until it sticks.

QuizLoop separates the **engine** from the **content**. The engine is this
repository: a desktop application for Windows, macOS and Linux that schedules
questions, scores answers and explains mistakes. The content lives in
*modules*, question banks generated from source material. Modules are not part
of this repository; only a five-question sample ships with it.

## Install

**Recommended on Windows: Teknesyum Base.**

1. Download [`Teknesyum-Base.exe`](https://github.com/Teknesyum/Teknesyum-Base/releases/latest/download/Teknesyum-Base.exe) ([`.sha256`](https://github.com/Teknesyum/Teknesyum-Base/releases/latest/download/Teknesyum-Base.exe.sha256)) and run it. No admin rights are needed.
2. Find **Quizloop** in the list and install it. Base also updates and removes it later.

Base is not code-signed yet, so Windows SmartScreen may warn on first launch: choose *More info*, then *Run anyway*. More: [Teknesyum Base](https://github.com/Teknesyum/Teknesyum-Base).

**Other platforms, or manually:**

Download the latest build from
[Releases](https://github.com/Teknesyum/Quizloop/releases):

| Platform | File | Updates |
| -------- | ---- | ------- |
| Windows  | `quizloop-<version>-setup.exe` | Asks before it downloads and again before it installs |
| macOS    | `quizloop-<version>-unsigned.dmg` | The app tells you when a new version is out |
| Linux    | `.AppImage` or `.deb` | The app tells you when a new version is out |

**iPhone, iPad, or any browser:** open
<https://teknesyum.github.io/Quizloop/>. Nothing is downloaded from a store.
On an iPhone or iPad, open it in Safari, tap *Share*, then *Add to Home Screen*;
it then starts like an app and works offline. Your progress and the modules you
import stay in that browser on that device, so keep using the same one, and use
one tab at a time.

The macOS build is unsigned, so Gatekeeper blocks the first launch. Clear the
quarantine attribute once:

```
xattr -cr /Applications/Quizloop.app
```

## How a round works

1. The question appears **without its options**. You think first.
2. You ask for the options. Answering without them earns a bonus.
3. A correct pick scores. A wrong pick costs points, removes that option and
   prints an explanation written for *that specific* wrong answer.
4. When the question closes, the solution plays back with its source: file,
   pages and the quoted passage. If the book is on disk, the page opens in a
   built-in viewer with the passage highlighted.
5. You mark the question **understood**, **partly understood** or **not
   understood**. Scheduling runs on FSRS-6; understood questions retire.

Sessions, the library, chapters and the question bank work from the keyboard;
the session and the bank list their keys at the bottom of the screen.

## Modules

A module is a folder with `module.json`, `blocks/` and `assets/`. Drop the
folder on the library, or pick it with **Klasör seç**. The JSON Schema for
every file is in [`schema/`](schema/).

The **question bank** lists every question of a module with its state. Flag a
broken question with `F` and export the flags as JSON; the generator reads
that file and regenerates only the affected units.

## Building modules

[`tools/quizforge`](tools/quizforge/README.md) is the production line. It
extracts the text layer of a PDF, plans units, generates questions, verifies
them and packs the module. Every question carries its `kaynak`: file, pages and
quote.

## Moving to another computer

**Ayarlar → Taşıma paketi** writes progress, modules and settings to one
folder. Carry it on a USB stick and import it on the other machine. The old
database is kept as a backup.

## Development

Node 22 and npm are the only prerequisites.

```
npm install
npm run dev
```

`npm test`, `npm run typecheck`, `npm run lint` and `npm run ui:scan` must pass
before a commit. Packaged builds come from `npm run build:win`, `build:mac` or
`build:linux`. Pushing a `v*` tag builds all three on GitHub Actions and opens a
draft release.

See [`docs/PLAN.md`](docs/PLAN.md) for the architecture.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).

Privacy: see the [Privacy Policy](PRIVACY.md).

Copyright (C) 2026 Teknesyum
