# bildirim — agent guide

Relay for the in-app "Report A Problem" button (decision 0028). A Cloudflare Worker, deployed on
its own; the app only knows its URL.

- `src/worker.ts` — `POST /bildir` stores the screenshot in the reports repository and opens an
  issue; `POST /not` adds the reporter's note as a comment. The note call carries the HMAC key
  the first call returned, so only the reporter can comment.
- `wrangler.toml` — `REPO` is the private reports repository. Secrets `GITHUB_TOKEN` (fine-grained,
  that repository only: Issues and Contents read/write) and `IMZA` (random string) are set with
  `npx wrangler secret put`; a token in git would be revoked by GitHub secret scanning.
- Deploy: `npx wrangler deploy` from this folder. The printed URL goes into `REPORT_URL` in
  `src/shared/bildirim.ts` and into `connect-src` of the four CSP strings (`src/main/index.ts`,
  `src/renderer/index.html`, `src/web/index.html`, `src/android/index.html`).
- User text is flattened or fenced before it reaches an issue, so a report cannot mention people
  or inject markup.
