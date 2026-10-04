# src/renderer — UI

Sandboxed React 19. Reach the main process only through `window.quizloop`,
typed by `shared/ipc.ts`.

- `screens/` — one file per route: library, session, summary, settings.
- `components/` — presentational pieces. `Stem` resets its typewriter through
  its `key` prop, never by writing state during render.
- `store/app.ts` — zustand. Toasts cap at `TOAST_MAX`.
- `keys.ts` — tinykeys. Bindings match `event.code` (`Space`, `KeyB`, `Digit1`).
- `i18n.ts` — every user-facing string of three words or more comes from here.
  Headings are Title Case, Every Word Capitalised, in both languages: `*.title`,
  `*Title`, `work.task.*` and the list in `shared/locale.test.ts`, which fails otherwise.
- `styles/app.css` — project styles only. The teknesyum-ui sheets under
  `teknesyum-ui/css/` are vendored; edit them never.

House rules the scanner enforces: dark theme only, no raw hex, radius or
duration values, filled buttons take black text, no `info` role, skeletons
instead of spinners, no `placeholder=`, uppercase through
`toLocaleUpperCase('tr')`. Run `npm run ui:scan` before you call it done.
