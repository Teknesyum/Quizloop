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

## Status

Planning. See `docs/PLAN.md` for the architecture and milestones, and
`docs/taramalar/` for the prior-art survey.

## License

MIT
