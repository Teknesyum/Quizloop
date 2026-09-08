# quizforge — agent guide

Module production line. Separate package, same repo, never bundled into the app.

- `src/cli.ts` — `init | plan | run | verify | pack | doctor`. Every command takes `--rules <file>`.
- `py/extract.py` — PDF text layer to `pages.jsonl` + `chapters.json` (pypdf, no AGPL).
- Rules live next to the source: `sources/<id>/rules.yaml`; build state in `sources/<id>/build/`.
- Question schema is imported from `src/shared/schema` — never duplicated here.
- `run` needs `ANTHROPIC_API_KEY` and a `--max-usd` cap. `pack` refuses without a clean `verify`.
- No comments in code. Prompts to the model are Turkish.
