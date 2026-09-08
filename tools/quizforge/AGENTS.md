# quizforge — agent guide

Module production line. Separate package, same repo, never bundled into the app.

- `src/cli.ts` — `init | plan | brief | ingest | run | verify | pack | doctor`. Every command takes `--rules <file>`.
- `py/extract.py` — PDF text layer to `pages.jsonl` + `chapters.json` (pypdf, no AGPL).
- Rules live next to the source: `sources/<id>/rules.yaml`; build state in `sources/<id>/build/`.
- Question schema is imported from `src/shared/schema` — never duplicated here.
- Two production paths: `brief` writes per-unit prompts for session subagents and `ingest`
  turns their `build/raw/*.json` into questions; `run` calls the API directly and needs
  `ANTHROPIC_API_KEY` plus a `--max-usd` cap. `pack` refuses without a clean `verify`.
- `source.pages` carries book pages; the corpus is PDF-indexed and converted with `sayfaOfseti`.
- No comments in code. Prompts to the model are Turkish.
