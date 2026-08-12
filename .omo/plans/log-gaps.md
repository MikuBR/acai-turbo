# log-gaps - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** A logging system that captures every user action (orders, payments, catalog changes, config saves) with structured context (who did it, from which module, when), completing issue #14's remaining gaps.

**Why this approach:** The base logging infrastructure (winston multi-transport, JSON, IPC forwarding, ErrorBoundary, toast auto-log) is already done and tested. The gaps are narrow: no context in renderer logs, no success-path logging in business ops, undocumented env vars. One wave keeps the change atomic and reviewable.

**What it will NOT do:** Will NOT change the DB schema, add new IPC channels, refactor App.jsx into a router, or modify the existing audit_logs system. Business-op logging goes to structured.log, not the audit_logs table.

**Effort:** Short
**Risk:** Low - additive only; no behavioral changes to existing IPC handlers or store logic
**Decisions to sanity-check:** Renderer context is explicit (via `logger.withScope('module')`) because App.jsx is a monolithic modal-driven app with no global screen state; auto-detection is not feasible without a router refactor.

Your next move: run `$start-work log-gaps` to execute. Full execution detail follows below.

---

> TL;DR (machine): Short | Low risk | Close issue #14 logging gaps: renderer context logger, main createHandler success logging, env docs, tests.

## Scope
### Must have
- `src/services/logger.js`: add `withScope(scope)` factory returning a logger that injects `scope` into `meta.module` for every method call.
- `src/App.jsx`: log key user actions via scoped logger (login, checkout, save configs, add/update/delete products, add/update/delete users, add/update/delete inventory, add/update/delete financial accounts, add/update/delete clients, iFood actions, password changes, cash register, report views).
- `main.cjs:75-92`: in `createHandler`, log `logger.info` on success with `{channel, userId: currentSession?.user?.id}` and keep existing error log enriched with operator.
- `.env.example` + `AGENTS.md`: document `CONTEXTO_LOGGING_DIR`; correct env semantics (development→debug+console, anything else→info-only file).
- `src/tests/logger.test.js`: test `withScope` returns scoped logger that injects `module` into meta; test IPC fallback with scope.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No DB schema change or migration.
- No new IPC channel (reuse `logging:write`).
- No change to `audit_logs` table or `createAuditLog` usage.
- No App.jsx router refactor or global screen state provider.
- No auto-route-based context detection.
- No change to winston transports, file layout, or logger.cjs env logic.
- No new npm dependencies.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + vitest (jsdom, globals: true)
- Evidence: `.omo/evidence/` — `task-1-log-gaps.*`, `task-2-log-gaps.*`, etc.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. Logger withScope | - | 3, 4 | 2, 5 |
| 2. Env docs | - | - | 1, 3, 4, 5 |
| 3. App.jsx key-action logging | 1 | - | 2, 4, 5 |
| 4. Main createHandler logging | 1 | - | 2, 3, 5 |
| 5. Tests | 1 | - | 2, 3, 4 |
| F1-F4. Final wave | 1-5 | - | - |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Add `withScope` to `src/services/logger.js`
  What to do / Must NOT do: Add a `withScope(scope)` function to `src/services/logger.js` that returns a new logger object with the same `error/warn/info/debug` methods but injects `{ module: scope }` into every `meta` object before forwarding to IPC `logging:write`. Keep the existing four methods unchanged (backwards compatible). Keep the `window.electron` IPC fallback + console fallback pattern exactly as-is. Do NOT create a new file. Do NOT add imports. Do NOT change the export shape (default export stays the same object).
  Parallelization: Wave 1 | Blocked by: none | Blocks: 3, 4, 5
  References (executor has NO interview context - be exhaustive): `src/services/logger.js:1-33` — the existing logger object with 4 methods that forward via `ipcRenderer.invoke('logging:write', {level, message, meta})`. Keep this exact pattern.
  Acceptance criteria (agent-executable): `npm test` passes. `import logger from '../services/logger'` still works. `logger.withScope('test')` returns object with `.error/.warn/.info/.debug`. Scoped method sends `{ level, message, meta: { module: 'test', ...extraMeta } }` over IPC.
  QA scenarios: happy — `logger.withScope('orders').info('test', {action:'x'})` sends meta with `module:'orders'`. failure — `logger.withScope(null).info('test')` still works (null scope = no module injected). Evidence `.omo/evidence/task-1-log-gaps.*`
  Commit: Y | feat(logger): add withScope context factory for renderer logging

- [x] 2. Document `CONTEXTO_LOGGING_DIR` + correct env semantics
  What to do / Must NOT do: (a) Add `# CONTEXTO_LOGGING_DIR=<path>` (commented out) to `.env.example`. (b) In `AGENTS.md` under the "Logging" section, add a bullet: "`CONTEXTO_LOGGING_DIR` — override log directory (used by `npm run log`); defaults to platform userData path." (c) In `AGENTS.md` under "Logging", correct the env semantics line: it currently says "Log level controlled by `CONTEXTO_DE_LOGGING` env (values: `development` → debug + console, anything else → info only). Defaults from `NODE_ENV` when unset." — this is already correct from the prior AGENTS.md rewrite. Confirm no change needed. Do NOT touch `database/logger.cjs` env logic.
  Parallelization: Wave 1 | Blocked by: none | Blocks: none (standalone docs)
  References (executor has NO interview context - be exhaustive): `scripts/log-viewer.cjs:38` reads `process.env.CONTEXTO_LOGGING_DIR`. `.env.example` currently has NODE_ENV, VITE_DEV_PORT, printer vars. `AGENTS.md` "Logging" section documents `CONTEXTO_DE_LOGGING` but not `CONTEXTO_LOGGING_DIR`.
  Acceptance criteria (agent-executable): `.env.example` contains `CONTEXTO_LOGGING_DIR`. `AGENTS.md` mentions `CONTEXTO_LOGGING_DIR`. No other files changed.
  QA scenarios: happy — `grep CONTEXTO_LOGGING_DIR .env.example AGENTS.md` returns at least 2 matches. failure — files unchanged. Evidence `.omo/evidence/task-2-log-gaps.*`
  Commit: Y | docs: document CONTEXTO_LOGGING_DIR env var for log viewer

- [x] 3. Log key user actions in `src/App.jsx` via scoped logger
  What to do / Must NOT do: Import `logger` from `../services/logger.js` at the top of `src/App.jsx`. Create scoped loggers at the top of the `App()` function body for each module: `const orderLog = logger.withScope('orders'); const catalogLog = logger.withScope('catalog'); const settingsLog = logger.withScope('settings'); const authLog = logger.withScope('auth'); const inventoryLog = logger.withScope('inventory'); const financialLog = logger.withScope('financial'); const clientsLog = logger.withScope('clients'); const ifoodLog = logger.withScope('ifood'); const reportsLog = logger.withScope('reports'); const cashLog = logger.withScope('cash');`. Then add `logger.info` calls at key user-action sites (see References for exact locations). Do NOT refactor existing logic. Do NOT add new state. Do NOT touch the IPC getIPC pattern. Do NOT remove or modify existing `addToast` calls.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: none
  References (executor has NO interview context - be exhaustive): Key action sites in `src/App.jsx`:
  - Line ~138: `syncDB()` success → `catalogLog.info('sync')`
  - Line ~148: `loadUsers()` success → `usersLog.info('users loaded')`
  - Line ~160: `loadInventory()` success → `inventoryLog.info('inventory loaded')`
  - Line ~188: `loadFinancialAccounts()` success → `financialLog.info('financial loaded')`
  - Line ~204: `loadClients()` success → `clientsLog.info('clients loaded')`
  - Line ~220: `loadReports()` success → `reportsLog.info('reports loaded')`
  - Line ~282: `savePrinterConfig()` success → `settingsLog.info('printer config saved')`
  - Line ~318: `saveIfoodConfig()` success → `ifoodLog.info('ifood config saved')`
  - Line ~346: `handleTestIfoodConnection()` success → `ifoodLog.info('ifood connection tested')`
  - Line ~376: `handleIfoodAction()` success → `ifoodLog.info('ifood action', { action })`
  - Login success (wherever `setCurrentUser` is called after IPC success) → `authLog.info('user logged in')`
  - Checkout success (wherever `checkoutActiveTable` is called) → `orderLog.info('order checked out')`
  - Cash register (wherever `cash:register` IPC is called) → `cashLog.info('cash movement registered')`
  - Any `addProduct` / `updateProduct` / `deleteProduct` / `addCategory` / `deleteCategory` calls → `catalogLog.info('product added/updated/deleted')` etc.
  - Any `addUser` / `updateUser` / `deleteUser` calls → `usersLog.info('user added/updated/deleted')`
  - Any `addInventory` / `updateInventory` / `adjustInventory` calls → `inventoryLog.info('inventory updated')`
  - Any `addFinancialAccount` / `updateFinancialAccount` / `deleteFinancialAccount` / `addFinancialTransaction` calls → `financialLog.info('financial account updated')`
  - Any `addClient` / `updateClient` / `deleteClient` calls → `clientsLog.info('client updated')`
  - Password change calls → `authLog.info('password changed')`
  Acceptance criteria (agent-executable): `npm test` passes. `npm run lint` passes. No new warnings. Scoped logger calls are present at the listed sites.
  QA scenarios: happy — grep `logger.withScope\|orderLog\.\|catalogLog\.\|settingsLog\.\|authLog\.\|inventoryLog\.\|financialLog\.\|clientsLog\.\|ifoodLog\.\|reportsLog\.\|cashLog\.` in `src/App.jsx` returns ≥10 matches. failure — no imports, no scoped loggers. Evidence `.omo/evidence/task-3-log-gaps.*`
  Commit: Y | feat(renderer): log key user actions with scoped context in App.jsx

- [x] 4. Log business-op success in `main.cjs` `createHandler`
  What to do / Must NOT do: Modify `main.cjs:75-92` `createHandler` to: (a) on success, log `logger.info('[channel] success', { channel, userId: currentSession?.user?.id })` after `return { success: true, ...result }` — capture the result first, log, then return. (b) on error (existing catch block), enrich the existing `logger.error` to include `{ channel, userId: currentSession?.user?.id, message: e.message }`. Do NOT change handler logic. Do NOT change the return shape. Do NOT add validation. Do NOT touch any other `createHandler` calls. Do NOT change `currentSession` (it's already in scope at main.cjs:13/75). Check whether `currentSession` is a variable or a function — if it's `getCurrentSession()`, call it; if it's a bare variable, use it directly.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: none
  References (executor has NO interview context - be exhaustive): `main.cjs:75-92` is the `createHandler` function. `main.cjs:13` imports `createAuditLog, getAuditLogs` — `currentSession` is used at lines 912, 966, 1002, 1033 (e.g., `currentSession?.user?.id`). Verify how `currentSession` is accessed in main.cjs before using it.
  Acceptance criteria (agent-executable): `npm test` passes. `npm run lint` passes. `createHandler` logs info on success and error with channel + userId.
  QA scenarios: happy — grep `logger.info` in the createHandler function returns ≥1 match. failure — no userId logged. Evidence `.omo/evidence/task-4-log-gaps.*`
  Commit: Y | feat(main): log business-op success in createHandler with operator context

- [x] 5. Extend `src/tests/logger.test.js` for `withScope`
  What to do / Must NOT do: Add tests to `src/tests/logger.test.js` for the new `withScope` behavior: (a) `withScope` returns object with `error/warn/info/debug` methods. (b) Scoped method injects `{ module: scope }` into meta when forwarding to IPC. (c) `withScope(null)` still works (no module injected). (d) IPC fallback with scoped logger still falls back to console. Do NOT remove existing tests. Do NOT change the test framework. Do NOT add new dependencies.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: none
  References (executor has NO interview context - be exhaustive): `src/tests/logger.test.js:1-34` — existing tests. Pattern: vi.resetModules(), set globalThis.window mock, import logger, assert IPC invoke called with correct args. Follow this exact pattern.
  Acceptance criteria (agent-executable): `npm test` passes. New tests present and green.
  QA scenarios: happy — `npm test` passes with ≥4 new test cases. failure — test failures. Evidence `.omo/evidence/task-5-log-gaps.*`
  Commit: Y | test(logger): add withScope context injection tests

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit — verify every todo row is implemented: `src/services/logger.js` has `withScope`, `main.cjs` createHandler logs on success, `src/App.jsx` has scoped loggers at key sites, `.env.example` and `AGENTS.md` document `CONTEXTO_LOGGING_DIR`, `src/tests/logger.test.js` has `withScope` tests. Run `npm test` and `npm run lint` — both pass.
- [x] F2. Code quality review — no new warnings from eslint. No `console.log` added in production code (only `console.error`/`console.warn`/`console.debug` where existing). No `// TODO` or `// FIXME` left behind. No hardcoded strings that should be constants.
- [x] F3. Real manual QA — `node scripts/smoke-test-db.cjs` passes. `npm run build` produces `dist/` without errors. Verify the plan's Must NOT have: no `audit_logs` table changes, no new IPC channel in `preload.js`, no new files in `database/migrations/`.
- [x] F4. Scope fidelity — confirm no scope-creep: no router refactoring in App.jsx, no new npm dependencies in `package.json`, no changes to `database/logger.cjs` env logic, no changes to `database/validate.cjs` logging:write validator.

## Commit strategy
- One commit per todo (5 commits total): `feat(logger)`, `docs`, `feat(renderer)`, `feat(main)`, `test(logger)`.
- Atomic commits: each commit should leave the codebase in a working state (`npm test` + `npm run lint` pass).
- No squash: each commit is independently reviewable.

## Success criteria
- `npm test` passes (all existing + new withScope tests).
- `npm run lint` passes (no new warnings).
- `npm run build` succeeds (dist/ produced).
- `node scripts/smoke-test-db.cjs` passes.
- `grep CONTEXTO_LOGGING_DIR .env.example AGENTS.md` returns ≥2 matches.
- `grep withScope src/services/logger.js` returns ≥1 match.
- `grep logger.info.*channel src/App.jsx` returns ≥10 matches.
- `grep logger.info.*channel main.cjs` returns ≥1 match in createHandler.
- No new files created (except test additions to existing file).
- No changes to `audit_logs`, `preload.js`, `database/migrations/`, or `database/logger.cjs`.
