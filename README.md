<!-- lang -->

[<img src="assets/badge-lang.svg" alt="English selected, switch to Türkçe" width="124" height="44">](README.tr.md)

# QuizLoop

Adaptive spaced-repetition quiz engine. Turn a book into a question module and
drill it until it sticks.

QuizLoop separates the **engine** from the **content**. The engine is this
repository: a desktop application for Windows, macOS and Linux that schedules
questions, scores answers and explains mistakes. The content lives in
_modules_, question banks generated from source material. Modules are not part
of this repository; only a five-question sample ships with it.

## Install

**Recommended on Windows: Teknesyum Base.**

1. Download [`Teknesyum-Base.exe`](https://github.com/Teknesyum/Teknesyum-Base/releases/latest/download/Teknesyum-Base.exe) ([`.sha256`](https://github.com/Teknesyum/Teknesyum-Base/releases/latest/download/Teknesyum-Base.exe.sha256)) and run it. No admin rights are needed.
2. Find **Quizloop** in the list and install it. Base also updates and removes it later.

Base is not code-signed yet, so Windows SmartScreen may warn on first launch: choose _More info_, then _Run anyway_. More: [Teknesyum Base](https://github.com/Teknesyum/Teknesyum-Base).

**Other platforms, or manually:**

Download the latest build from
[Releases](https://github.com/Teknesyum/Quizloop/releases):

| Platform | File                              | Updates                                               |
| -------- | --------------------------------- | ----------------------------------------------------- |
| Windows  | `quizloop-<version>-setup.exe`    | Asks before it downloads and again before it installs |
| macOS    | `quizloop-<version>-unsigned.dmg` | The app tells you when a new version is out           |
| Linux    | `.AppImage` or `.deb`             | The app tells you when a new version is out           |

**iPhone, iPad, Android, or any browser:** use QuizLoop Web, described under
[Web version](#web-version).

The macOS build is unsigned, so Gatekeeper blocks the first launch. Clear the
quarantine attribute once:

```
xattr -cr /Applications/Quizloop.app
```

## Web version

**QuizLoop Web** is the same engine running in a browser:
<https://teknesyum.github.io/Quizloop/>. Nothing comes from a store, there is
no account, and it works offline after the first visit. Your progress and your
modules stay on the device.

**Install**

- **iPhone, iPad:** open the address in Safari, tap _Share_, then
  _Add to Home Screen_, then _Add_.
- **Android:** open it in Chrome, tap the three dots, then _Install app_ (or
  _Add to Home screen_), then _Install_.
- **Computer:** open it in Chrome or Edge. It runs as a tab; the install icon
  in the address bar turns it into its own window.

**First use.** _Install The Sample Modules_ adds two samples to try.
_Add A Module File_ imports a `.qlmod` file. The three-dot menu at the top right holds text size, language
and the support link. The first visit needs a connection.

**Updates** arrive on their own: a new version downloads in the background and
takes over the next time the page is reloaded or reopened. The running version
is shown next to the title. Progress is kept.

**Limits to know about**

- No backup or export yet. Clearing the browser's site data, or removing the
  home-screen app, erases your progress.
- Nothing syncs between devices or browsers.
- On an iPhone the Safari tab and the home-screen icon keep separate data.
  Pick one and stay with it.
- One tab at a time; a second tab is told the app is already open.
- No reminder notifications.
- Tapping a `.qlmod` file does not open the app; import it from inside.
- Older phones may not run it. iOS 17 or later is a safe floor.

## How a round works

1. The question appears **without its options**. You think first.
2. You ask for the options. Answering without them earns a bonus.
3. A correct pick scores. A wrong pick costs points, removes that option and
   prints an explanation written for _that specific_ wrong answer.
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

## Catalogs

A catalog is one address a publisher gives you. **Catalogs** in the library takes that
address, shows a warning that the content is not QuizLoop's, and lists the publisher's
channels. Subscribe to the ones you want: each installs its module and takes new versions
on its own. Unsubscribing or removing the catalog keeps the module and your progress.

QuizLoop hosts and recommends no catalog. Catalogs work on the desktop and the web
version; the Android app does not have them yet.

To publish one, put a JSON file and your `.qlmod` packages on any `https` host:

```json
{
  "schemaVersion": 1,
  "name": "My Catalog",
  "publisher": "Your Name",
  "contact": "you@example.org",
  "channels": [
    {
      "id": "my-module",
      "name": "My Module",
      "version": "1.2.0",
      "package": "packages/my-module-1.2.0.qlmod",
      "size": 1048576,
      "sha256": "<sha256 of the package file>"
    }
  ]
}
```

`package` is relative to the catalog address or a full address. `id` must equal the
module id inside the package, and `size` and `sha256` must match the file or the app
refuses it. Raise `version` and replace the three package fields to ship an update.
The schema is [`schema/catalog.schema.json`](schema/catalog.schema.json). For the web
version the host must allow cross-origin requests.

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

## Contact

A problem, an idea, or a complaint about content someone publishes for QuizLoop: open an
[issue](https://github.com/Teknesyum/Quizloop/issues/new). The app has the same link under
Settings, About.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).

Privacy: see the [Privacy Policy](PRIVACY.md).

Copyright (C) 2026 Teknesyum
