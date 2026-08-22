# docs — agent guide

Planning and research notes. Internal documents are written in Turkish; anything
published at the repository root is English.

- `PLAN.md` — the architecture and milestones. Single source of truth. Read it before
  touching code, and update it when a decision changes.
- `taramalar/` — prior-art survey, one file per topic, produced by scout agents.
  `RAPOR.md` merges them. Do not edit individual survey files by hand; they record what
  was measured at survey time.
- `kararlar/` — numbered decision log. One decision per file, `NNNN-konu.md`. A decision
  is appended, never rewritten; superseding it means writing a new file that says so.

When the survey and the plan disagree, the survey wins on facts (licences, versions,
measurements) and the plan wins on choices.
