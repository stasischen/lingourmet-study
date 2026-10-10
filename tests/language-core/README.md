# Language Core browser smoke

This small Chromium smoke test serves the public `language-core/` candidate on a
loopback-only HTTP server and uses a new, isolated browser context. It checks the
two items, all nine UI/teaching-language combinations, missing French without
fallback, hidden/revealed answers, return/re-entry, duplicate result prevention,
and browser-local persistence. It is not a curriculum, audio, or linguistic review.

Run with Node 22:

```sh
cd tests/language-core
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright install --with-deps --only-shell chromium
npm test
```

The workflow runs on relevant pull requests, including drafts, or manually after
it is available on the default branch. It uses the standard `ubuntu-24.04` hosted
runner, a ten-minute timeout, pinned official actions, and a locked Playwright
version from npm. GitHub documents standard hosted runners as free for public
repositories: https://docs.github.com/en/billing/concepts/product-billing/github-actions

Only `contents: read` is granted; all unlisted token permissions are `none`:
https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions
Checkout does not persist credentials. No custom credentials, secrets, paid
service, self-hosted runner, deployment, repository write, or Pages permission is
used. Existing repository Actions policy still applies; this change does not
modify those settings.

Each run creates only synthetic practice events. Browser requests are restricted
to exact public runtime GETs; external URLs, query strings, and uploads are blocked
and fail the check. The test does not load any user profile or account. Output is
limited to fixed check names and failure stack locations. Actions retains step
logs and a short summary; there are no uploaded artifacts, screenshots, traces,
DOM dumps, or storage dumps. This covers the exercised browser flows, not a
complete security audit or the audio subsystem.

A local syntax check is not a browser pass. Only a successful Actions run for the
exact PR commit (or an actual local browser execution) establishes execution.
