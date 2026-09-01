# AGENTS.md

elecV2P — Node.js MITM proxy / task scheduler / script runner with a Vue 3 web UI.

## Commands

| Command | What it does |
|---------|-------------|
| `node index.js` | Main entry. Default port 80; override with `PORT=8000`. |
| `yarn start` | pm2 start (`yarn`, not npm). `yarn.lock` tracked. |
| `npm run build` | Vite build → `web/dist`. **Rebuild + commit after any frontend edit** (`web/dist` is served directly by backend). |
| `npm run webdev` | Vite dev server (`web/src`). |
| `npm run dev` | nodemon on `index.js`. |

## Architecture

```
index.js → app.js → webmodule.js (Express, serves web/dist, auth gate `isAuthReq`, 404)
                  ├─ webser/*.js   one Express router per feature (settings/script/task/efss/run)
                  ├─ func/*.js     crontask, schedule, task, exec, crt
                  ├─ utils/*.js    logger, file/list/store, eaxios, websocket
                  ├─ script/*.js   runJSFile (JS/efh runner), context (VM sandbox), rule (MITM)
                  └─ config.js     loads script/Lists/config.json, merges env (PORT/TOKEN/CONFIG/PROXYEN/TZ)
```

Dirs: `script/JSFile/` user scripts · `script/Shell/` shell cwd · `script/Store/` key-value · `script/Lists/` config/rules/tasks/rewrites/MITM hosts · `./efss` virtual file server.

Security: webUI gated by IP whitelist + cookie/token auth. Webhook token (`wbrtoken`, a UUID) in `script/Lists/config.json`.

## Scripts, EFH & VM Context

`.efh` = one-file HTML+JS app (frontend `<script>` + exactly ONE `<script favend>` backend). Frontend uses Vue 3, calls `$fend('key', data)`; backend replies via `$fend(key, result)` / `$done(result)`.

| Global | Purpose |
|--------|---------|
| `$axios(req, proxy?)` | HTTP via axios. |
| `$cheerio` | HTML parsing. |
| `$exec(cmd, opts?)` | Shell via child_process (cwd `script/Shell`, timeout 60s). |
| `$download(url, opts?, cb?)` | File download with progress. |
| `$feed.push/title/desc/url` | Notifications. |
| `$store.get/put/set/delete` | Persistent key-value (`script/Store/`), `pass` = encrypted. |
| `$cache.*` | In-memory store (lost on restart). |
| `$evui / $message.* / $ws.send / $ws.sse` | Frontend UI / toasts / WebSocket / SSE. |
| `$fend(key, data)` | EFH frontend↔backend. |
| `$done(result)` | Return result (priority over last statement). |
| `$env` | Script-scoped env (incl. `process.env`). |
| `$task`, `$webhook` | Task mgmt / webhook calls (sudo only). |

Script vars (double-underscore): `__version __vernum __home __efss __name __dirname __filename __userid __md5hash __taskid __taskname`.

@grant: `sudo` ($task/$webhook) · `nodejs` · `require` · `calm` · `still` · `quiet` · `silent` (log/notify suppression combos).

## RULES & REWRITE

- **RULES** (`script/Lists/default.list`): modify req/res by matching url/host/useragent/reqmethod/reqbody/resstatus/restype/resbody — via JS, 307, block, `$HOLD`, or UA swap.
- **REWRITE** (`script/Lists/rewrite.list`): URL pattern → local file / 302 / JS.
- **MITM hosts** (`script/Lists/mitmhost.list`): HTTPS hosts to decrypt (needed for HTTPS rule match). Root CA: `rootCA/rootCA.crt` + `.key`.
- **Task list** (`script/Lists/task.list`): cron/countdown tasks — `runjs`, `exec`, `taskstart`/`taskstop`. Remote JS auto-update (default 86400s).

## Tests

Playwright e2e in `test/*.spec.mjs`, run individually (`node test/e2e.spec.mjs`), each starts server on `PORT=12521`. EFH suites write real data to `script/Store` and clean up. Requires chromium.

## Conventions

- Node >= 14.17; CommonJS, no TS/backend build.
- No formatter/linter; match surrounding style (tabs/4-space per file). New JS uses no trailing semicolons.
- Frontend i18n: add strings to both `web/src/i18n/locales/{zh,en}.json`.
- `web/dist` is generated — never hand-edit, rebuild.
- After any frontend `web/src` edit, run `npm run build` to repackage. No need to restart via `pm2`.
- List files are strict JSON — no comments.
- **Never traverse `node_modules/` or `.git/`**; target specific dirs (`webser/`, `func/`, `utils/`, `script/`, `web/src/`). When using `grep`, `Glob`, `Grep`, `find`, `rg`, or similar search/traversal commands, always exclude these dirs (e.g. `--exclude-dir=node_modules`, `--exclude-dir=.git`, or search within specific source dirs only). Only search them when explicitly requested.

## Links

- Docs: `https://github.com/elecV2/elecV2P-dei` (Chinese)
- Issues: `https://github.com/elecV2/elecV2P/issues`
- TG channel: `https://t.me/elecV2` · Group: `https://t.me/elecV2G`
