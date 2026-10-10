# bildirim — agent guide

Relay for in-app problem reports (decisions 0028, 0031). A Cloudflare Worker, deployed on its
own; an app only knows its URL. One relay and one private repository serve every Teknesyum app.

- `src/worker.ts` — `POST /bildir` takes `{ app, note, shot, image, ctx }`, stores the screenshot
  under `g/<app>/<month>/` in the reports repository and opens an issue titled
  `<app>: <first words of the note>`. `app` must be a plain name or it becomes `Bilinmeyen`.
- `wrangler.toml` — `REPO` is the private reports repository `Teknesyum/privateissues`. The one
  secret `GITHUB_TOKEN` (fine-grained, that repository only: Issues and Contents read/write) is
  set with `npx wrangler secret put GITHUB_TOKEN`; a token in git would be revoked by GitHub
  secret scanning.
- Deploy: `npx wrangler deploy` from this folder. The printed URL goes into `REPORT_URL` in
  `src/shared/bildirim.ts` and into `connect-src` of the four CSP strings (`src/main/index.ts`,
  `src/renderer/index.html`, `src/web/index.html`, `src/android/index.html`).
- User text is flattened or fenced before it reaches an issue, so a report cannot mention people
  or inject markup.
