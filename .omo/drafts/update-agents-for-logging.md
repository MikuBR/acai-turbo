---
slug: update-agents-for-logging
status: approved-plan-ready
intent: clear
review_required: false
plan_path: .omo/plans/update-agents-for-logging.md
plan_sha256: null
review_round_id: null
pending-action: handoff presented -> user runs /start-work update-agents-for-logging (or opts into high-accuracy review)
approach: Update AGENTS.md only — add the verified logging-system facts (issue #14) that are currently missing: CONTEXTO_LOGGING_DIR env, main-process logger database/logger.cjs, renderer logger src/services/logger.js with withScope + console fallback, toast auto-log and ErrorBoundary stack-trace conventions, createHandler success/error logging with channel+userId. No code changes, no commits of the uncommitted #14 code.
review:
  momus:
    status: not-run (infra)
    workspace_root: null
    runtime_home: null
    target: .omo/plans/update-agents-for-logging.md
    round_id: null
    plan_sha256: null
    launch_id: null
    session: null
    result: null
  independent:
    status: not-run (infra)
    workspace_root: null
    runtime_home: null
    target: .omo/plans/update-agents-for-logging.md
    round_id: null
    plan_sha256: null
    launch_id: null
    session: null
    result: null
metis_note: Metis gap analysis failed 2x on model-infra errors (github-copilot/claude-opus-5 PAT unsupported; opencode/kimi-k3 not found). User directed "Faça sem subagentes". Gap analysis performed inline by planner: draft-vs-repo consistency verified line-by-line (AGENTS.md:14,30,38 vs logger.cjs:5-6, log-viewer.cjs:38, toastStore.js:9-14, ErrorBoundary.jsx:15, main.cjs:86,89); guardrail for dirty worktree #14 code added; acceptance criteria grep-based, no human dependency. No blockers found.
---

# Draft: update-agents-for-logging

## Components (topology ledger)
```csv
id | outcome (one line) | status: active|deferred | evidence path
agents-md | AGENTS.md gains 4 verified logging facts (CONTEXTO_LOGGING_DIR, database/logger.cjs, src/services/logger.js, user-facing logging conventions) | ACTIVE | AGENTS.md, git status (10 M + 5 ??)
```

## Open assumptions (announced defaults)
- The uncommitted working-tree state (git status: 10 modified + logger.cjs/log-viewer.cjs/logger.js/logger.test.js untracked, .omo/ untracked) is the REAL #14 implementation, already complete and validated by its own plans (`.omo/plans/logging-system.md`, `.omo/plans/log-gaps.md` all `[x]`). AGENTS.md must describe THIS state, not the committed one.
- Task scope = AGENTS.md content only. No code edits, no commits of the #14 code, no git operations beyond the AGENTS.md file's own commit (defaut: commit AGENTS.md alone, conventional `docs:`).

## Findings (cited - path:lines)
- `AGENTS.md:14` — Quick Start already documents `npm run log` (tails structured.log). KEEP.
- `AGENTS.md:28` — IPC quirk already requires preload + validate.cjs for new channels incl. `logging:write`. KEEP.
- `AGENTS.md:30` — Logging Context bullet documents `CONTEXTO_DE_LOGGING` + files. VERIFIED correct vs `database/logger.cjs:5-6` (development→debug+console, else info; file transports at info/error). KEEP, no change needed.
- `AGENTS.md:38` — IPC Channel Groups already lists `logging:write`. KEEP.
- MISSING from AGENTS.md (verified absent): `CONTEXTO_LOGGING_DIR` (used by log-viewer per `scripts/log-viewer.cjs:38`, documented in `.env.example:13-14`), main-process logger module `database/logger.cjs`, renderer logger `src/services/logger.js` with `withScope` + console fallback when `window.electron` absent (`src/services/logger.js:5-43`), toast auto-log with type→level mapping (`src/store/toastStore.js:9-14` error→error, warning→warn, else info), ErrorBoundary componentDidCatch logs componentStack (`src/components/ErrorBoundary.jsx:15`), createHandler logs success+error with channel+userId (`main.cjs:86,89`).
- `git status --short` — 10 files modified (AGENTS.md, .env.example, validate.cjs, main.cjs, package.json, package-lock.json, preload.js, App.jsx, ErrorBoundary.jsx, toastStore.js) + 5 untracked (database/logger.cjs, scripts/log-viewer.cjs, src/services/logger.js, src/tests/logger.test.js, .omo/). #14 code is fully written but UNCOMMITTED.

## Decisions (with rationale)
- D1: Docs-only scope — the request is "create or update AGENTS.md"; the #14 implementation already exists and is planned/executed separately (`logging-system` / `log-gaps` plans done). No code change, no commit of product code.
- D2: Preserve all verified existing AGENTS.md content (quick-start commands, ABI quirk, IPC security rule, channel groups). Only ADD the missing logging facts + one Architecture line. No rewrites of correct bullets.
- D3: Where to add: (a) a bullet under "Architecture & Entrypoints" naming `database/logger.cjs` (main-process winston) and `src/services/logger.js` (renderer, `withScope`, console fallback); (b) extend the "Logging Context" quirk bullet with `CONTEXTO_LOGGING_DIR` + toast/ErrorBoundary/createHandler conventions.
- D4: review_required re-calibrated false — no explicit high-accuracy modifier; task is a small docs edit. High-accuracy review offered as an option at the stop gate (CLEAR path).

## Scope IN
- AGENTS.md (single file): 4 additions — CONTEXTO_LOGGING_DIR; database/logger.cjs; src/services/logger.js + withScope + fallback; logging conventions (toast auto-log, ErrorBoundary, createHandler).
- QA: `grep` checks for each added term in AGENTS.md.

## Scope OUT (Must NOT have)
- No changes to any file other than AGENTS.md.
- No commit of the uncommitted #14 code (logger.cjs, log-viewer.cjs, services/logger.js, logger.test.js, modified product files).
- No new sections beyond the needed additions; no rewrites of correct bullets.
- No `question` needed — repo answers everything.

## Open questions
- Resolved: none. The user's "Vamos continuar a #14" = make AGENTS.md accurately reflect the (already implemented) logging system so further #14 work has correct ramp-up. No owner-decision survives exploration.

## Approval gate
status: awaiting-approval
- Approach: single small wave. Worker edits AGENTS.md only, then runs grep QA. One commit `docs: document issue #14 logging system in AGENTS.md`.
- Next action once approved: scaffold `.omo/plans/update-agents-for-logging.md` (no --draft-only), run Metis, fill template + todos.
