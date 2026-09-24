# quizforge

Module production line for Quizloop. It turns a source book into a question module:
extract the text layer, plan units, generate questions, verify them, pack the module.

Every command takes `--rules sources/<id>/rules.yaml`. Build state lives in
`sources/<id>/build/` and is never committed.

```
npx tsx tools/quizforge/src/cli.ts <command> --rules sources/<id>/rules.yaml [options]
```

| Command  | What it does                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `init`   | Extract the PDF text layer into `pages.jsonl` and `chapters.json`.                                      |
| `plan`   | Split chapters into generation units: `build/plan.json`.                                                |
| `run`    | Send pending units to the API. Needs `ANTHROPIC_API_KEY` and `--max-usd <n>`.                           |
| `brief`  | Write per-unit prompts for session subagents. `--gorsel` for the figure pass, `--force` for every unit. |
| `ingest` | Turn `build/raw/*.json` (or `build/rawgorsel/` with `--gorsel`) into questions.                         |
| `verify` | Deterministic checks: schema, quotes, pages, assets. Writes `build/verify-report.json`.                 |
| `pack`   | Write `modules/<id>/`. Refuses without a clean `verify`.                                                |
| `flags`  | Requeue units whose questions users flagged in the app.                                                 |
| `zorluk` | Relabel difficulty with one rubric: `export`, `apply`, `uyum`.                                          |
| `doctor` | Check Python, pypdf, the API key and the corpus files.                                                  |

## flags

The app exports flagged questions as `flags.json`:

```json
{
  "modul": "lange-anestezi-7",
  "surum": "0.1.0",
  "disaAktarim": "2026-09-23T10:00:00.000Z",
  "bayraklar": [
    {
      "soru": "lange-anestezi-7-09fbb757331e",
      "not": "choice C is also correct",
      "ts": "…",
      "kaynak": { "file": "LANGE 7. BASKI.pdf", "pages": [39, 39] }
    }
  ]
}
```

`not` may be null and `kaynak` may be missing.

```
npx tsx tools/quizforge/src/cli.ts flags --rules sources/<id>/rules.yaml --flags flags.json [--gorsel] [--dry-run]
```

- Each question id is mapped to the unit that produced it, from `build/units/*.json`,
  then `build/raw*/` (ids recomputed from the unit hash and stem), then the checkpoint.
- The text pass is the default; `--gorsel` works on the figure pass. Flags that belong to
  the other pass are listed, not queued.
- For each mapped unit the checkpoint entry is reset so `run` and `brief` pick it up again,
  the old raw answer moves to `build/bayraklar/eski-raw/`, and the flag notes go to
  `build/bayraklar/<unit>.json`. The next prompt for that unit lists the flagged stems
  and notes. After the unit is regenerated (`run` or `ingest`) the note moves to
  `build/bayraklar/islendi/`.
- `--dry-run` prints the mapping and changes nothing.
- Exit code is 1 when any id could not be mapped.

## zorluk

Difficulty is judged by one rubric, `ZORLUK_OLCUTU` in `src/zorluk.ts`, and the
generation prompt carries the same text. There is no per-unit quota: a unit gets as many
hard questions as its content supports.

| Level   | Criterion                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------- |
| `kolay` | K1 — recall one fact that sits almost verbatim in the quote.                                          |
| `orta`  | O1 — one inference step; O2 — apply one rule in a scenario.                                           |
| `zor`   | Z1 — multi-step clinical reasoning; Z2 — combine two concepts; Z3 — near distractors or an exception. |

```
npx tsx tools/quizforge/src/cli.ts zorluk export --rules sources/<id>/rules.yaml
npx tsx tools/quizforge/src/cli.ts zorluk apply --rules sources/<id>/rules.yaml [--dry-run]
npx tsx tools/quizforge/src/cli.ts zorluk uyum --rules sources/<id>/rules.yaml
```

- `export` writes batches of 100 to `build/zorluk/in/` and the labelling prompt to
  `build/zorluk/istem.md`. Subagents write `[{id, zorluk, olcut}]` to `build/zorluk/out/`.
- `apply` rejects a criterion that disagrees with its level, writes only when every
  question has a label, and prints the old → new matrix.
- `uyum` compares `out/` with an independent second labelling in `build/zorluk/kontrol/`.

## Tests

```
npx vitest run --config tools/quizforge/vitest.config.ts
```
