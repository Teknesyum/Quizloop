# quizforge — agent guide

Module production line. Separate package, same repo, never bundled into the app.

- `src/cli.ts` — `init | plan | brief | ingest | run | verify | pack | geri-al | flags | zorluk | secenek | doctor`. Every command takes `--rules <file>`.
- `brief`/`ingest` lanes: text, `--gorsel`, `--tur tablo|etiket` (`src/tur.ts`); boxes come only from `build/etiket/index.json` (`src/etiket.ts`).
- `paket` zips `modules/<id>/` with `rules.yaml` `module.etiketler` as tags into
  `dist/modules/quizloop-<id>-<surum>.qlmod` (git-ignored); the app installs it by pick, drop or double-click.
  The book goes in as qpdf chapter PDFs (`kaynak/bolum/NN.pdf`, `source.bolumler`); one package for desktop and Android.
- `py/extract.py` — PDF text layer to `pages.jsonl` + `chapters.json` (pypdf, no AGPL).
- Rules: `sources/<id>/rules.yaml`, build state `sources/<id>/build/`; schema from `src/shared/schema`, never duplicated.
- Two production paths: `brief` writes per-unit prompts for session subagents and `ingest`
  turns their `build/raw/*.json` into questions; `run` calls the API directly and needs
  `ANTHROPIC_API_KEY` plus a `--max-usd` cap. `pack` refuses without a clean `verify`.
- `source.pages` are book pages (corpus is PDF-indexed, `sayfaOfseti`). `flags` maps app-exported flagged ids to units and requeues them; notes in `build/bayraklar/`.
- `zorluk` relabels difficulty with the single rubric in `src/zorluk.ts` (also used by the generation prompt): `export` batches, subagents write `build/zorluk/out/`, `apply` writes back.
- `secenek` (`src/secenek.ts`): `olc` measures choice bias, `export` batches 40 to `build/secenek/in/`,
  subagents write `out/`, `apply` validates and writes back; marking choices stay frozen.
- `hafizlik` (`src/hafizlik/`, no `--rules`): Qur'an memorisation module from pinned text, meal and mushaf PDF (`py/hafizlik_kitap.py` splits it, `py/hafizlik_satir.py` finds each verse's lines, decision 0016); 30 chapters by juz, review round (dönüş) as a note; writes `modules/kuran-hafizlik/` and its `.qlmod`.
- Tests: `npx vitest run --config tools/quizforge/vitest.config.ts`. No code comments; model prompts Turkish.
