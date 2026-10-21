# iskelet-talepleri — agent guide

Inbox from module sessions to the app skeleton session. A module session that finds
something the engine must change (schema field, renderer bug, standard gap, loader
limit) writes one file here instead of touching `src/`.

- One request per file: `YYYY-MM-DD-kisa-konu.md`, copied from `_sablon.md`. Turkish.
- Neutral wording only: no book names, quotes or screenshots of real content (0032).
  Refer to a module by its folder name and a question by its `id`.
- Module sessions never edit `src/`, `schema/` or `docs/modul-standardi.md` themselves.
- The skeleton session reads this folder at the start of its work, answers inside the
  file under `## Yanıt`, and moves a closed request to `kapandi/`.
- Requests are git-ignored; only this guide and the template are tracked.
