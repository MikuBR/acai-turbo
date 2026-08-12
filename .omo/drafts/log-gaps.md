---
slug: log-gaps
status: awaiting-approval
intent: clear
review_required: false
pending-action: write .omo/plans/log-gaps.md
approach: Close the remaining gaps of issue #14 (logging): (1) enrich renderer logger with module/action context + log key user actions; (2) log business-op success+error in main createHandler with current operator context; (3) document CONTEXTO_LOGGING_DIR + correct env docs; update AGENTS.md; cover with tests; mark issue complete.
---

# Draft: log-gaps

## Components (topology ledger)
```csv
id | outcome (one line) | status: active|deferred | evidence path
renderer-context | src/services/logger.js gains context/scope support + App key-action logging | ACTIVE | src/services/logger.js, src/App.jsx
main-createhandler | main.cjs:75 createHandler logs success+error with channel + operator context | ACTIVE | main.cjs:75-92
docs-env | CONTEXTO_LOGGING_DIR + correct env docs in .env.example + AGENTS.md | ACTIVE | scripts/log-viewer.cjs:38, AGENTS.md
tests | vitest for renderer logger context + any new pure helper | ACTIVE | src/tests/logger.test.js
```

## Open assumptions (announced defaults)
- renderer "context capture": app has NO global screen state — it is a monolithic modal/settingsTab-driven App.jsx. Therefore renderer context cannot be derived from a global; it is passed explicitly at action call-sites via `logger.withScope('module')` factory. Adopted default (reversible, internal).
- Operator context for main logging: reuse existing `currentSession?.user` (same source as main.cjs:912 audit logging). No new auth plumbing.
- No DB schema change; no new IPC channel; reuse `logging:write`.

## Findings (cited - path:lines)
- `src/services/logger.js:1-33` — four level methods forward to IPC `logging:write`; no context/scope support.
- `main.cjs:75-92` — `createHandler` logs ONLY `logger.error` on catch; no success-path log of channel.
- `main.cjs:912,966,1002,1033,1106,1136` — `createAuditLog` used only for AUTH actions (login/logout/password), not business ops.
- `main.cjs:1155` — `logging:write` handler maps level->logger[level], prefixes `[renderer]`.
- `main.cjs:13` — `currentSession` in scope (used for audit user id).
- `database/validate.cjs:363-370` — `logging:write` already validates level/message/meta; meta is an object.
- `src/App.jsx` — monolithic; modal state + settingsTab (`App.jsx:28,81`); no global screen selector.
- `scripts/log-viewer.cjs:38` — reads `CONTEXTO_LOGGING_DIR`; undoc'd.
- `database/logger.cjs:5-6` — `development`→debug; everything else→info; `test` not special.

## Decisions (with rationale)
- **D1 (user-approved): Renderer + main.** Enrich renderer logger with scope/context AND log success of business ops in main `createHandler`.
- **D2:** Renderer context is explicit (via `logger.withScope('module')`) — cannot be auto-derived; App.jsx is monolithic.
- **D3:** main logging uses operator from the existing `currentSession` (not a new mechanism).
- **D4:** no DB/schema/IPC-channel changes; reuse existing `logging:write` + winston.

## Scope IN
- `src/services/logger.js`: add `withScope(scope)` returning a scoped logger that injects `scope` into meta; keep `window.electron` IPC forwarding + console fallback.
- `src/App.jsx`: log key user actions (login, checkout, save config, add product, etc.) via scoped logger (concrete sites listed in plan).
- `main.cjs:75-92`: in `createHandler`, log success (`logger.info`) with `channel` + operator id + brief outcome, and keep the existing error log (enrich with operator).
- `.env.example` + `AGENTS.md`: document `CONTEXTO_LOGGING_DIR`; correct env semantics (remove `test` special, note production default).
- `src/tests/logger.test.js`: extend for `withScope` behavior.

## Scope OUT (Must NOT have)
- No change to `audit_logs` schema or auth audit coverage.
- No new IPC channel; no DB migration.
- No global screen/provider refactor of App.jsx (out of scope for the logging gap).
- No auto-route-based context detection.
- No change to winston multi-transport set or file layout.

## Open questions
- Resolved: Q1 -> Renderer + main (user).

## Approval gate
status: awaiting-approval
- Approach: single wave. Renderer scoped logger + main createHandler logging + env docs + AGENTS.md + tests.
- Next action once approved: scaffold `.omo/plans/log-gaps.md` (no --draft-only), run Metis, APPEND todos, fill TL;DR last.