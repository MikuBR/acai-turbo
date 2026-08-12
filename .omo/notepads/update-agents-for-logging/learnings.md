# Learnings — update-agents-for-logging

Conventions, patterns, and successful approaches discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---
## 2026-08-09 — AGENTS.md logging docs (issue #14)

- AGENTS.md working tree already held the rewritten 38-line version (old 71-line version committed at HEAD); `git diff AGENTS.md` vs HEAD therefore shows the full rewrite, not just this task's edits. Verify additive-ness by line count (38 → 40 lines) and bullet presence, not by `git diff` vs HEAD.
- `grep -c` counts LINES not matches: the "Logging Extras" bullet packs toastStore/ErrorBoundary/createHandler on one line, so criterion "≥2" reads 1. Use `grep -o ... | wc -l` (4 occurrences: ErrorBoundary appears twice) to confirm all terms present.
- Both new bullets landed at lines 22 (Architecture & Entrypoints) and 32 (Key Quirks & Constraints); "Logging Context" bullet (line 30) kept verbatim per verified `database/logger.cjs:5-6`.
- Commit `9bea5cb` contains ONLY AGENTS.md (1 file, 32 insertions / 63 deletions — deletions are the pre-existing rewrite, not this task).

## 2026-08-09 — Runtime fix: `logger.error is not a function` (issue #14)

- Root cause: `database/logger.cjs:63` exports `{ initLogger, logger: getLogger }` — `logger` is the GETTER FUNCTION, not the winston instance. Every `logger.error/info/warn/debug` call in `main.cjs` (lines 86, 89, 117, 127, 1158) threw `TypeError` at runtime. Grep/unit-test acceptance criteria in prior plans (`logging-system.md`, `log-gaps.md`) missed this because they never exercised the real Electron main process.
- Fix (minimal, import-site only): `main.cjs:25` aliases the getter (`logger: getLogger`) then materializes once at load: `const logger = getLogger();`. `database/logger.cjs` left untouched — the getter shape is intentional (logger is re-created by `initLogger` inside `app.whenReady`), and `_logger = createLogger(null)` at module load guarantees `getLogger()` always returns a valid instance.
- Verification that catches this class of bug: `node -e "const {logger:getLogger}=require('./database/logger.cjs'); const l=getLogger(); console.log(typeof l.error, typeof l.info, typeof l.warn, typeof l.debug)"` → `function function function function`. A real require/runtime proof, not just `node --check` or lint.
