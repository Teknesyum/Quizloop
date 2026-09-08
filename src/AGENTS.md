# src — process layout

Three sandboxed worlds, one shared vocabulary. Never import across the first
three folders; `shared/` is the only bridge.

- `main/` — Node side. Database, filesystem, scheduler, IPC handlers.
- `preload/` — the only place `contextBridge` runs. Exposes `window.quizloop`
  and nothing else. No business logic here.
- `renderer/` — React UI. Sandboxed: no Node, no `require`, no direct disk.
- `shared/` — types, zod schemas and pure text helpers used by both sides.

Every window keeps the security trio: `contextIsolation: true`,
`sandbox: true`, `nodeIntegration: false`. A change that loosens one of these
needs a decision record under `docs/kararlar/`.

Adding an IPC call means editing three files: the handler in
`main/ipc/handlers.ts`, the bridge in `preload/index.ts`, and the `QuizloopApi`
contract in `shared/ipc.ts`. Typecheck fails if you miss one.
