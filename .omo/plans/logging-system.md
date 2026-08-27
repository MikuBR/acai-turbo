# logging-system - Work Plan

## TL;DR (For humans)

**O que você vai receber:** Um sistema de registro (logging) unificado para o aplicativo: todos os erros e eventos importantes passam a ser gravados em arquivos estruturados no computador do usuário, em vez de só aparecerem no console do desenvolvedor. Inclui um comando para visualizar esses logs (`npm run log`).

**Por que essa abordagem:** Já existe parte da infraestrutura (captura de erros e notificações). Estamos adicionando a camada que faltava — o transporte estruturado via a biblioteca winston — para que diagnósticos de produção virem arquivos legíveis e pesquisáveis, sem depender de credenciais externas ou reestruturar o app.

**O que NÃO vai fazer:** Não muda o fluxo de trabalho do CI, não altera a configuração de empacotamento, não adiciona botões novos nos avisos, não envia logs para servidores remotos, e não registra dados sensíveis (senhas, tokens, valores financeiros). Também NÃO implementa as outras issues (#12, #13, #7) — apenas a #14.

**Esforço:** Médio — 6 blocos de trabalho, tudo em código + testes, sem dependência de internet ou serviço externo.

**Risco:** Baixo - Baixo. A biblioteca (winston) é JS puro, não toca no banco nem no binário nativo; o novo canal de comunicação segue o mesmo padrão de validação já usado no app.

**Decisões para conferir:** (a) o registro principal vive na pasta de banco de dados (para ser empacotado), (b) a interface envia os logs por um canal seguro de comunicação para o processo principal, (c) o nível de log muda conforme o ambiente (dev vs. produção), (d) o comando `npm run log` mostra as 50 últimas linhas.

Seu próximo passo: aprovar a execução — o trabalho roda em uma sessão separada de worker (por exemplo, `$start-work logging-system`). Os detalhes completos estão abaixo.

---

> TL;DR (machine): clear, medium, implement issue #14 logging (winston main-process + IPC logging:write + renderer logger + toasts + ErrorBoundary + npm run log + AGENTS.md + tests)

## Scope
### Must have
- Add winston ^3.17.0 to package.json dependencies.
- Create `database/logger.cjs`: `initLogger(userDataPath)` + exported `logger` (console transport in dev, File `structured.log` level info, File `errors.log` level error, JSON format, exitOnError:false). Levels ERROR/WARN/INFO/DEBUG. Per-env default from `CONTEXTO_DE_LOGGING` (development|test|production) or `app.isPackaged`.
- Wire `main.cjs`: call `initLogger(path.join(app.getPath('userData'),'logs'))` before window creation; replace `createHandler` catch `console.error` (main.cjs:86) with `logger.error({channel, message})`; wire global `error` handlers (main.cjs:113-124) to `logger.error` (keep dialog.showErrorBox + app.quit); register `createHandler('logging:write', ...)`.
- Add `'logging:write'` to `preload.js` ALLOWED_CHANNELS (preload.js:3-80).
- Add `'logging:write'` validator to `database/validate.cjs` validators map (whitelist level in [error,warn,info,debug], message non-empty string, meta optional object).
- Create `src/services/logger.js` (ESM renderer): API `{error,warn,info,debug}`; sends `{level,message,meta}` via `window.electron.ipcRenderer.invoke('logging:write', ...)`; if IPC unavailable (window.electron absent) mirrors to console.
- `src/store/toastStore.js`: `addToast` also logs automatically with level mapped from type (error->error, warning->warn, info->info, success->info) via src/services/logger.
- `src/components/ErrorBoundary.jsx` componentDidCatch (line 13-16): call logged `error` with `error.message` + `errorInfo.componentStack`.
- Create `scripts/log-viewer.cjs`: prints tail (last 50 lines) of `userData/logs/structured.log`; add `"log": "node scripts/log-viewer.cjs"` to package.json scripts.
- AGENTS.md: add a "Logging" section (command npm run log, log file paths, CONTEXTO_DE_LOGGING env, levels).
- Tests: main logger (initLogger to temp dir, assert structured.log + errors.log exist and emit JSON), renderer logger (console fallback when no IPC), and optional toast logging. All run via `npm test` (job test CI covers ubuntu+windows).

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NO changes to `.github/workflows/ci.yml` (logging tests run via existing `npm test`).
- NO changes to `electron-builder` build.files / config (logger placed in database/ already packaged).
- NO toast action buttons (undo/retry/details), NO remote/HTTP transport, NO custom winston-transport.
- NO logging of sensitive data (passwords, tokens, bcrypt hashes, raw financial values) — only message + non-sensitive meta.
- NO changes to login/rate-limit/session/auth logic.
- NO implementation of #12/#13/#7 (other issues) — scope is #14 only.
- NO touching the agents-md-hierarchy plan's AGENTS.md root edit beyond adding the required Logging section (avoid overlapping the `## AGENTS.md hierarchy` section if present).
- NO gh CLI usage; NO closing/opening issues.
- NO `.env` file creation or secrets.

## Verification strategy
> Zero human intervention - all verification is agent-executed. Tests run WITHOUT Electron (per AGENTS.md testing workflow).
- Test decision: tests-with-implementation (winston is a pure JS dep; renderer logger is unit-testable) + agent-executed QA per todo. Framework: Vitest (existing `npm test`).
- Evidence: `.omo/evidence/task-<N>-logging-system.md` per todo; `.omo/evidence/task-F<N>-logging-system.md` under the final wave.

## Execution strategy
### Parallel execution waves
- Wave 1 - Main-process foundation (T1, T2, T3; T2 depends on T1; T3 depends on T1). `database/logger.cjs` (T1) must exist before main.cjs wiring (T2) and before validator+allowlist (T3).
- Wave 2 - Renderer + UI logging (T4, T5 parallel). Independent of main-process; uses src/services/logger.js (T4 first).
- Wave 3 - escripts + docs (T6).
- Wave 4 - final verification (F1-F4 parallel, after all todos).

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1 winston + database/logger.cjs | none | T2 | T3 (independent files) |
| T2 main.cjs wiring (initLogger + handlers + IPC handler) | T1, T3 | none | - |
| T3 preload allowlist + validate.cjs validator | T1 (channel shape) | T2 | T1 |
| T4 src/services/logger.js (renderer) | none | T5 | T1,T3,T6 |
| T5 toastStore auto-logging + ErrorBoundary routing | T4 | none | T4, T6 |
| T6 scripts/log-viewer + npm log + AGENTS.md Logging section | none | none | T4, T5 |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE - never rewrite the headers above. -->

- [ ] 1. Add winston and create database/logger.cjs (initLogger + logger + transports)
  What to do / Must NOT do: Add `"winston": "^3.17.0"` to `dependencies` in package.json (run `npm install winston@^3.17.0` or manually add then `npm install`). Create `/home/caue/Documentos/VSCODE/acai-turbo/database/logger.cjs` (CommonJS, `require('winston')`). Export `initLogger(logsDir)` and `logger`. Within code: determine env `process.env.CONTEXTO_DE_LOGGING` or `app.isPackaged ? 'production' : 'development'` (do NOT require('electron') in logger.cjs to keep it unit-testable; pass env or infer `typeof require!==undefined && process.env.CONTEXTO_DE_LOGGING`); `level = env==='development' ? 'debug' : 'info'`; base format `winston.format.combine(winston.format.timestamp(), winston.format.json())`. Transports: always `new winston.transports.File({ filename: path.join(logsDir,'structured.log'), level:'info', format: baseFormat })` and `new winston.transports.File({ filename: path.join(logsDir,'errors.log'), level:'error', format: baseFormat })`; in development add `new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })`. Set `exitOnError:false`. Use `fs.mkdirSync(logsDir, { recursive: true })` before creating File transports. `logger` must expose `.error(msg, meta)` `.warn()` `.info()` `.debug()`.
    Must NOT: log anything to stdout from a transport in production; do NOT reference Electron `app` object at module top-level (only read `app.isPackaged` result via an option param default); do NOT hardcode Windows vs POSIX paths (use path.join). Do NOT commit node_modules changes beyond package.json + package-lock.json.
  Parallelization: Wave 1 | Blocked by: none | Blocks: T2
  References (executor has NO interview context - be exhaustive):
    - /home/caue/Documentos/VSCODE/acai-turbo/package.json:23-32 (dependencies block where winston goes; "type":"module" at line 5, but database/* are CommonJS). 
    - /home/caue/Documentos/VSCODE/acai-turbo/database/crypto.cjs (model for the pattern of a database/*.cjs module - confirm require style).
    - winston docs: winston.transports.File + File error.log level + format.timestamp/json/simple/colorize; exitOnError:false (context7 /winstonjs/winston).
    - Env var name is exactly `CONTEXTO_DE_LOGGING` per issue #14 body.
  Acceptance criteria (agent-executed):
    1. `node -e "const {initLogger,logger}=require('./database/logger.cjs'); const os=require('os');const p=require('path');const fs=require('fs');const dir=fs.mkdtempSync(p.join(os.tmpdir(),'logs-')); initLogger(dir); logger.info('boot-test',{k:1}); logger.error('boom',{stack:'x'}); setTimeout(()=>{const s=fs.readFileSync(p.join(dir,'structured.log'),'utf8');const e=fs.readFileSync(p.join(dir,'errors.log'),'utf8'); console.log(JSON.stringify({structured:JSON.parse(s.split('\n').filter(Boolean).pop()), errors:JSON.parse(e.split('\n').filter(Boolean).pop())}));},50);"` prints an object whose `.structured.level==='info'`/`.structured.message==='boot-test'` and `.errors.level==='error'`/`.errors.message==='boom'`, and both parsed entries contain a `"timestamp"` key.
    2. `grep -n '"winston"' package.json` returns a match.
  QA scenarios:
    - happy: command in AC-1 exits 0, stdout object matches the expected levels/messages and both entries have `timestamp`. Evidence `.omo/evidence/todo-1-logging-system.md`.
    - failure: if `winston` import throws (module not installed / wrong version) -> the one-liner throws at require -> re-run `npm install`. If structured.log or errors.log missing or empty -> re-check `fs.mkdirSync` + File filename args. Record output diff in evidence.
  Commit: Y | `feat(logging): add winston + database/logger.cjs with structured+error file transports`

- [ ] 2. Wire main.cjs: initLogger + structured error handling + logging:write handler
  What to do / Must NOT do:
    At main.cjs top (after `require('./database/db.cjs')` line ~15-16) add `const { initLogger: initMainLogger, logger } = require('./database/logger.cjs');`.
    Call `initMainLogger(path.join(app.getPath('userData'), 'logs'))` inside `app.whenReady().then(...)` (currently main.cjs:1151) BEFORE `createWindow()` — ideally right before the migrationError check or after crypto init (line ~1155).
    Replace `createHandler` catch body (main.cjs:85-89) so on error it calls `logger.error(`[${channel}] Error:`, { message, channel })` (keep `console.error` if desired, but `logger.error` is required) and still returns `{ success:false, error: message }`.
    Wire `uncaughtException` (main.cjs:113-120) and `unhandledRejection` (main.cjs:122-124) to also call `logger.error('main: uncaughtException', { error: error.message, stack: error.stack })` and `logger.error('main: unhandledRejection', { reason: String(reason) })` BEFORE/ALONGSIDE existing console.error + dialog.showErrorBox + app.quit. Do not remove the dialog / app.quit logic.
    - Register IPC handler at the same module-top-level block as other handlers (e.g. near main.cjs:1145 config handlers): `createHandler('logging:write', async ({ level, message, meta }) => { const fn = logger[level] || logger.info; fn(`[renderer] ${message}`, meta || {}); return { success: true }; });`. Note: since this handler does NOT touch DB, keep it minimal. Do NOT add `.minRole` (renderer-initiated logging must not require auth).
    Must NOT break existing auth/db calls; must not log token/password values.
  Parallelization: Wave 1 | Blocked by: T1 | Blocks: none
  References: main.cjs:1-26 (requires), main.cjs:74-91 (createHandler + catch), main.cjs:113-124 (global handlers), main.cjs:1151-1166 (whenReady), main.cjs:1145-1149 (config handlers insert point). package.json build.files includes main.cjs so the file is packaged.
  Acceptance criteria (agent-executed):
    1. `npx eslint main.cjs` passes (no new errors).
    2. `node --check main.cjs` parses (CommonJS top-level).
    3. `grep -n "require('./database/logger.cjs')\|initMainLogger(\|createHandler('logging:write'" main.cjs` — all three present.
  QA scenarios:
    - happy: `npm run lint` reports no new warnings from main.cjs; `node --check main.cjs` exit 0. Evidence `.omo/evidence/todo-2-logging-system.md`.
    - failure: if `initMainLogger` called before `app.whenReady` while userData is undefined -> ensure the call is strictly inside `.then()`. If handler name collides -> grep confirms single definition.
  Commit: Y | `feat(logging): wire structured logger into main process error handling + logging:write IPC`

- [ ] 3. IPC surface: preload allowlist + validate.cjs validator for logging:write
  What to do / Must NOT do:
    - In `preload.js` ALLOWED_CHANNELS object (preload.js:3-80) add `'logging:write': true,` (alongside other channels).
    - In `database/validate.cjs` `validators` map (line ~6) add key `'logging:write': (data) => { ... }` that: requires `data && typeof data==='object'`; `level` must be one of `['error','warn','info','debug']`; `message` must be non-empty string (trimmed); `meta` if present must be an object; returns `{ success:true, data }` (normalized `{level, message, meta: meta||{}}`). Must NOT whitelist arbitrary channels; must NOT weaken existing validators.
  Parallelization: Wave 1 | Blocked by: none | Blocks: T2  (channel name must match main.cjs handler)
  References (confirm exact locations): `/home/caue/Documentos/VSCODE/acai-turbo/preload.js:3-80` (ALLOWED_CHANNELS object), `/home/caue/Documentos/VSCODE/acai-turbo/database/validate.cjs:5-6` (validators map) and `36:369-375` (validateIPC fn). The `logging:write` main-process handler created in todo 2 registers the same channel name.
  Acceptance criteria (agent-executed):
    1. `node -e "const {validateIPC}=require('./database/validate.cjs'); const r=[validateIPC('logging:write',{level:'info',message:'hi',meta:{a:1}}),validateIPC('logging:write',{level:'bogus',message:'x'}),validateIPC('logging:write',{level:'warn',message:''})]; console.log(JSON.stringify(r.map(x=>({success:x.success,msg:x.data&&x.data.message}))))"` prints `[{"success":true,"msg":"hi"},{"success":false,"msg":null},{"success":false,"msg":null}]` — first accepted, others rejected.
    2. `node -e "const fs=require('fs'); process.exit(fs.readFileSync('preload.js','utf8').includes(\"'logging:write': true\")?0:1)"` exit 0.
  QA: happy = both one-liners pass; failure = if validator rejects a valid level -> check whitelist string exact níveis; if preload missing the channel -> re-add. Evidence `.omo/evidence/todo-3-logging-system.md`.
  Commit: Y | `feat(logging): allow + validate logging:write IPC channel`

- [ ] 4. Create renderer logger src/services/logger.js
  What to do / Must NOT do:
    Create `/home/caue/Documentos/VSCODE/acai-turbo/src/services/logger.js` (ESM export). Export object `logger` with hard-typed methods `.error(message, meta?)`, `.warn(message, meta?)`, `.info(message, meta?)`, `.debug(message, meta?)`. Each: if `window.electron` and `window.electron.ipcRenderer` and a `.invoke` method exist, call `window.electron.ipcRenderer.invoke('logging:write', {level, message, meta})` and ignore the returned promise errors (fire-and-forget; `.catch(()=>{})`). If IPC unavailable (e.g. in Vitest/jsdom or non-Electron), fall back to `console.error/warn/info/debug` with formatted prefix. Use defensive `typeof window!=='undefined'`. Do NOT import winston here (renderer bundle can't).
    Keep code small and side-effect-free at module load (only functions). 
  Parallelization: Wave 2 | Blocked by: none | Blocks: T5
  References: `src/App.jsx:43-58` (getIPC wrapper pattern showing window.electron.ipcRenderer.invoke), `src/services/errorService.js:44-51` (logError pattern to replace). Preload exposes `window.electron.ipcRenderer` (legacyIpc.invoke) — see preload.js:184-207.
  Acceptance criteria (agent-executed):
    1. Vitest test file `/home/caue/Documentos/VSCODE/acai-turbo/src/tests/logger.test.js` with two cases: (a) no-IPC: delete/undefined `global.window`, `vi.spyOn(console,'warn')`, call `logger.warn('boom')`, assert spy called with a string containing 'boom'; (b) IPC path: set `global.window = { electron: { ipcRenderer: { invoke: vi.fn().mockResolvedValue({success:true}) } } }`, call `logger.info('ok',{})`, assert `invoke` called with ('logging:write', {level:'info', message:'ok', meta:{}}).
    2. `npm test` runs green (logger.test included).
  QA scenarios: both conditions covered by the two Vitest cases (IPC + no-IPC); evidence `.omo/evidence/todo-4-logging-system.md`.
  Commit: Y | `feat(logging): add renderer logger service with IPC + console fallback`

- [ ] 5. Auto-log toasts + ErrorBoundary stack-trace routing
  What to do / Must NOT do:
    - In `src/store/toastStore.js` `addToast` (lines 5-11): import `{ logger } from '../services/logger.js'` at top. Inside, map `type` → level: `type==='error'?logger.error: type==='warning'?logger.warn:logger.info` and call like `.info(`toast:${message}`, { type, toastType:type })` (wrap in try/catch to never throw). Do NOT remove the existing toast behavior / setTimeout.
    - In `src/components/ErrorBoundary.jsx` `componentDidCatch` (lines 13-16): add import `{ logger } from '../../services/logger.js'`; call `logger.error('ErrorBoundary caught an error', { error: error?.message || String(error), componentStack: errorInfo?.componentStack })` alongside existing `console.error` + `this.setState({ error, errorInfo })`. Do NOT change render/UI or the reload button behavior.
    Must NOT change auth/session/rate-limit logic.
  Parallelization: Wave 2 | Blocked by: T4 | Blocks: T6
  References: `src/store/toastStore.js:5-11` (addToast fn), `src/components/ErrorBoundary.jsx:13-16` (componentDidCatch), `src/services/logger.js` (from todo 4). Note: toastStore has blast radius (used in App.jsx via useToastStore, 5 callers) — do not change its public API.
  Acceptance criteria (agent-executed):
    1. `grep -n "services/logger" src/store/toastStore.js src/components/ErrorBoundary.jsx` returns both imports.
    2. `npm test` still green (no existing test breaks).
    3. Vitest: mock `../services/logger` with `vi.mock` in a toastStore test and assert `addToast` calls `logger.info`/`warn`/`error` matching its `type`; an ErrorBoundary test renders a child that throws and asserts `logger.error` called with `componentStack`.
  QA scenarios:
    - happy: `npm test` green; both mocked assertions pass. Evidence `.omo/evidence/todo-5-logging-system.md`.
  Commit: Y | `feat(logging): auto-log toasts + ErrorBoundary stack traces`

- [ ] 6. npm run log + AGENTS.md Logging section
  What to do / Must NOT do:
    - Create `scripts/log-viewer.cjs` (CommonJS): require 'fs'/'path'. Determine logs dir in this priority: CLI arg `--dir <path>` > env `CONTEXTO_LOGGING_DIR` > default `process.env.APPDATA ? path.join(process.env.APPDATA,'AcaiWave','logs') : path.join(process.env.HOME||os.homedir(),'.config','AcaiWave','logs')` (Linux/mac). Read `structured.log` if present, print its last 50 lines to stdout; if missing, print `(no log yet)` and exit 0.
    - Add `"log": "node scripts/log-viewer.cjs"` to package.json scripts (keep existing scripts untouched).
    - In AGENTS.md add a `## Logging` section (telegraphic): command `npm run log`, structured.log/errors.log paths under userData (Linux `~/.config/AcaiWave`, Windows `%APPDATA%\AcaiWave`), env `CONTEXTO_DE_LOGGING` (development|test|production), levels ERROR/WARN/INFO/DEBUG, note: winston main-process only, renderer forwards via IPC. If the agents-md-hierarchy plan already added a `## AGENTS.md hierarchy` section, append `## Logging` after it without disturbing it; do not duplicate existing root Stack/Commands content.
  Parallelization: Wave 3 | Blocked by: none | Blocks: F2
  References: `package.json:7-22` (scripts), `AGENTS.md` (existing sections; add Logging after "Key IPC channels" or after the hierarchy section), `scripts/smoke-test-db.cjs` (existing script pattern in scripts/).
  Acceptance criteria (agent-executed):
    1. Create a temp dir with a `structured.log` containing 60 lines (`for i in $(seq 1 60); do echo "line $i"; done > /tmp/xtrace/structured.log`), then run `node scripts/log-viewer.cjs --dir /tmp/xtrace` and assert stdout has <= 50 lines via `| wc -l`.
    2. `grep -n '"log":' package.json` returns a match.
    3. `grep -n '## Logging' AGENTS.md` returns a match.
  QA scenarios: happy = all three asserts pass; failure = if AGENTS.md already has a duplicate "Logging" header, dedupe to a single section. Evidence `.omo/evidence/todo-6-logging-system.md`.
  Commit: Y | `docs(logging): add npm run log viewer + AGENTS.md Logging section`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit — verify deliverables match all 6 todos; run `git status --short` and confirm only expected files changed (package.json, package-lock.json, database/logger.cjs new, main.cjs, preload.js, validate.cjs, src/services/logger.js new, src/store/toastStore.js, ErrorBoundary.jsx, scripts/log-viewer.cjs new, AGENTS.md, src/tests/logger test new). Confirm no CI workflow / build config edits (ci.yml unchanged).
  Evidence: `.omo/evidence/task-F1-logging-system.md`
- [ ] F2. Code quality review — read every changed file; confirm no sensitive data logged (no password/token/financial literals in log calls); confirm every handler/transport uses JSON + structured API, no `console.log` of tokens; lint (`npm run lint`) and typecheck (`npm run typecheck`) pass; winston only in main process, renderer never imports winston.
  Evidence: `.omo/evidence/task-F2-logging-system.md`
- [ ] F3. Real manual QA — run the repo's own test: `npm run build` (vite build must compile renderer incl. new logger + ErrorBoundary changes); `npm test` runs green; the logger.cjs smoke one-liner (T1-AC1) writes valid structured.log + errors.log. No Electron needed. Capture outputs.
  Evidence: `.omo/evidence/task-F3-logging-system.md`
- [ ] F4. Scope fidelity audit — confirm nothing from Must-NOT-Have happened: `git diff HEAD -- .github/workflows/ci.yml` empty (CI untouched); `git diff` has no build.files/electron-builder change; no new winston-transport/HTTP dependency in package.json beyond winston; no toast-undoredo component; no #12/#13/#7 code in the diff; no gh CLI usage in commit list.
  Evidence: `.omo/evidence/task-F4-logging-system.md`

## Commit strategy
- Commit per todo (6 commits), conventional type `feat/logging` prefix: T1, T2, T3, T4, T5, T6 each a single logical change. MSG examples: `feat(logging): add winston + database logger transport`, `feat(logging): wire structured error handling in main`, `feat(logging): allow+validate logging:write`, `feat(logging): renderer logger with IPC+fallback`, `feat(logging): auto-log toasts and error boundary`, `docs(logging): log-viewer script + AGENTS.md section`.
- Debug no forced native rebuild. After change, run `npm run check:native` not needed (noDB addon change; winston is pure JS). Run `npm test` baseline.
- If single squash preferred, one commit `feat(logging): implement issue #14 standardized logging`.

## Success criteria
- Issue #14 logging system implemented: winston multi-transport (structured.log + errors.log + dev console), JSON logs in prod, structured global error handling with stack traces in main, unified IPC API `logging:write` (preload allowed + validate.com), automatic user-level (toast) logging and ErrorBoundary stack traces, `npm run log` viewer, AGENTS.md Logging section, winston env `CONTEXTO_DE_LOGGING` documented, tests passing on the CI test job (ubuntu + windows).
- Zero changes to CI workflow, electron-builder config, auth/rate-limit logic, or other issues' code.
- No sensitive data logged.
- Final verification wave (F1-F4) all APPROVE with receipts.