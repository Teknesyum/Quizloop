# Quizloop

Adaptive spaced-repetition quiz engine — turn any PDF into a question module and
drill it until it sticks.

Quizloop separates the **engine** from the **content**. The engine is this
repository: a cross-platform desktop application that schedules questions,
scores answers and explains mistakes. The content lives in *modules* — packaged
question banks generated from source material by an AI. Modules are not part of
this repository.

## How a round works

1. The question appears **without its options**. You think first.
2. You ask for the options. Answering without them earns a bonus.
3. A correct pick scores. A wrong pick costs points, removes that option and
   prints an explanation written for *that specific* wrong answer.
4. When the question closes, the full solution plays back — text, tables,
   figures and formulas, revealed progressively.
5. You mark the question **understood**, **partly understood** or **not
   understood**. Understood questions retire; the rest come back, the ones you
   did not understand first.

## Running it

Node 22 and npm are the only prerequisites.

```
npm install
npm run dev
```

`npm test`, `npm run typecheck` and `npm run lint` cover the engine. Packaged
builds come from `npm run build:win`, `build:mac` or `build:linux`.

On macOS the first launch of an unsigned build is blocked by Gatekeeper. Clear
the quarantine attribute once:

```
xattr -cr /Applications/Quizloop.app
```

## Status

Early. The engine runs end to end — modules install, sessions schedule through
FSRS-6, progress persists — and ships with a five-question sample module. PDF
extraction into modules is not built yet. See `docs/PLAN.md` for the
architecture and milestones, and `docs/taramalar/` for the prior-art survey.

## License

AGPL-3.0-or-later — see [LICENSE](LICENSE).

Copyright (C) 2026 Teknesyum
