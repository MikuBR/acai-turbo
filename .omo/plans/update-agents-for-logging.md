# update-agents-for-logging - Work Plan

## TL;DR (For humans)

**What you'll get:** O arquivo `AGENTS.md` do projeto passa a documentar, de forma completa, o sistema de logging da issue #14 (que já está implementado no código): o logger do processo principal, o logger da interface, a variável de ambiente `CONTEXTO_LOGGING_DIR` e as convenções de log de ações do usuário.

**Why this approach:** A implementação da #14 já existe no código (winston multi-transporte, canal IPC `logging:write`, `withScope`, toast auto-log, ErrorBoundary) — o que falta é só o arquivo de instruções refletir isso, para que futuras sessões de agente não "redescubram" o sistema. Escopo cirúrgico: duas edições aditivas no AGENTS.md, sem reescrever nada que já esteja correto.

**What it will NOT do:** Não altera nenhum arquivo de código. Não commita o código da #14 que ainda está não-commitado no working tree (isso é execução separada). Não reescreve nenhum bullet existente verificado. Não abre/fecha issues.

**Effort:** Quick
**Risk:** Low - docs-only, edição aditiva de um único arquivo, toda a verificação por grep
**Decisions to sanity-check:** (1) as 4 adições exatas ao AGENTS.md (2 bullets novos + 1 bullet estendido); (2) o commit contém SOMENTE o AGENTS.md.

Your next move: execute via `/start-work update-agents-for-logging`, or optionally run a high-accuracy review first. Full execution detail follows below.

---

> TL;DR (machine): Quick | Low | docs-only AGENTS.md edit adding 4 verified issue-#14 logging facts; 1 impl todo + F1-F4; commit contains only AGENTS.md.

## Scope
### Must have
- Edit `AGENTS.md` (single file, docs-only) to add 4 verified logging-system facts for issue #14:
  1. **Architecture bullet** (`* **Logging**: ...`) in `## Architecture & Entrypoints` — names `database/logger.cjs` (main-process winston: console in dev, `structured.log` info, `errors.log` error, JSON format) and `src/services/logger.js` (renderer logger, `withScope()`, forwards via IPC `logging:write`, falls back to console when `window.electron` absent — e.g. Vitest/jsdom).
  2. **`CONTEXTO_LOGGING_DIR`** — extend the existing "Logging Context" quirk bullet (AGENTS.md:30): env var overrides the log dir for `npm run log` (default platform userData/logs; read by `scripts/log-viewer.cjs:38`; already documented in `.env.example:13-14`).
  3. **User-facing logging conventions** — same bullet or adjacent: toast auto-log with type→level mapping (`src/store/toastStore.js:9-14`: error→error, warning→warn, else info); ErrorBoundary logs component stacks (`src/components/ErrorBoundary.jsx:15`); main `createHandler` logs success+error with `channel`+`userId` (`main.cjs:86,89`).
  4. Keep `npm run log`, `CONTEXTO_DE_LOGGING`, IPC security rule, and `logging:write` channel-group entries exactly as-is (all verified correct).
- QA: grep-based verification (exact commands in todo + F-wave).

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NO changes to any file other than `AGENTS.md`.
- NO commit of the uncommitted issue #14 product code (working tree is dirty: `database/logger.cjs`, `scripts/log-viewer.cjs`, `src/services/logger.js`, `src/tests/logger.test.js` untracked; `main.cjs`, `preload.js`, `database/validate.cjs`, `src/App.jsx`, `src/components/ErrorBoundary.jsx`, `src/store/toastStore.js`, `.env.example`, `package.json`, `package-lock.json` modified). Only `git add AGENTS.md` and commit it alone.
- NO rewrite/deletion of existing correct bullets (npm run log, CONTEXTO_DE_LOGGING, ABI quirk, IPC security, channel groups, CI/CD).
- NO new sections beyond the two surgical edits; telegraphic bullet style only.
- NO `question`/interview; NO git history rewrites; NO issue open/close on GitHub.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: none (docs-only, no code paths) — QA is grep + git-diff assertions.
- Evidence: `.omo/evidence/task-1-update-agents-for-logging.md` + `.omo/evidence/task-F<1-4>-update-agents-for-logging.md`

## Execution strategy
### Parallel execution waves
- Wave 1: single todo (1) — edit AGENTS.md. No parallelism needed (docs-only, one file).
- Wave 2 (final): F1-F4 in parallel after todo 1.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. AGENTS.md logging facts | none | F1-F4 | none (single-file edit) |
| F1-F4 | 1 | - | each other |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Add the 4 verified issue-#14 logging facts to AGENTS.md
  What to do / Must NOT do: Edit ONLY `/home/caue/Documentos/VSCODE/acai-turbo/AGENTS.md` (38 lines today; 4 sections). Make exactly two surgical edits, preserving every existing bullet verbatim:
  (a) In `## Architecture & Entrypoints`, AFTER the existing bullet ending `database/validate.cjs` (IPC input validation).` (line 21) and BEFORE the `Global State` bullet (line 22), insert one new bullet:
  `* **Logging**: main-process winston logger `database/logger.cjs` (dev console + `structured.log` info + `errors.log` error, JSON). Renderer sends logs via IPC `logging:write` through `src/services/logger.js` (`withScope()` factory; falls back to console when `window.electron` absent — e.g. Vitest/jsdom).`
  (b) In `## Key Quirks & Constraints`, REPLACE the existing single "Logging Context" bullet (line 30) with TWO bullets (keep the original text intact, extend, do not delete anything):
  `* **Logging Context**: `CONTEXTO_DE_LOGGING` env var (`development` → debug + console; otherwise info). Files: `userData/logs/structured.log` (info) + `errors.log` (error).` (unchanged original)
  `* **Logging Extras**: `CONTEXTO_LOGGING_DIR` overrides the log dir for `npm run log` (default platform userData/logs; see `scripts/log-viewer.cjs`, also in `.env.example`). User-action logging: toasts auto-log with type→level (error→error, warning→warn, else info — `src/store/toastStore.js`), ErrorBoundary logs component stacks (`src/components/ErrorBoundary.jsx`), and `createHandler` logs success+error with `channel`+`userId` (`main.cjs`).`
  Must NOT do: do NOT touch any file other than AGENTS.md; do NOT run git add/commit on anything except AGENTS.md (working tree has uncommitted issue #14 product code — leave it untouched); do NOT rewrite the `npm run log`, IPC security, ABI, CI/CD, or channel-group bullets; do NOT add new `## ` sections; do NOT alter `.env.example`. Keep telegraphic bullet style (no prose paragraphs).
  Parallelization: Wave 1 | Blocked by: none | Blocks: F1-F4
  References (executor has NO interview context - be exhaustive):
  - Current AGENTS.md exactly: lines 1-38 as read in this plan's exploration; bullet to extend is line 30 (`* **Logging Context**: ...`); insert point for (a) is between line 21 and line 22.
  - Source of truth for each fact — `database/logger.cjs:1-63` (transports: Console dev-only line 18-27, structured.log info line 32-35, errors.log error line 37-40, JSON baseFormat line 8-11); `scripts/log-viewer.cjs:38` (reads `process.env.CONTEXTO_LOGGING_DIR`); `.env.example:13-14` (CONTEXTO_LOGGING_DIR documented); `src/services/logger.js:1-43` (withScope factory line 39-42, console fallback in each method); `src/store/toastStore.js:9-14` (type→level mapping); `src/components/ErrorBoundary.jsx:15` (componentDidCatch log); `main.cjs:86,89` (createHandler success/error log with channel+userId); `main.cjs:1157-1161` (logging:write IPC handler); `preload.js:80` + `database/validate.cjs:363-370` (channel allowlist + validator — already referenced in existing IPC Security bullet).
  - Existing verified bullets to PRESERVE: AGENTS.md:14 (npm run log), AGENTS.md:28 (IPC Security), AGENTS.md:38 (IPC Channel Groups).
  Acceptance criteria (agent-executable):
  1. `grep -c "database/logger.cjs" AGENTS.md` returns at least 1.
  2. `grep -c "src/services/logger.js" AGENTS.md` returns at least 1.
  3. `grep -c "CONTEXTO_LOGGING_DIR" AGENTS.md` returns at least 1.
  4. `grep -c "toastStore\|ErrorBoundary\|createHandler" AGENTS.md` returns at least 2.
  5. `grep -c "CONTEXTO_DE_LOGGING\|npm run log\|logging:write\|ALLOWED_CHANNELS" AGENTS.md` returns at least 3 (original content preserved).
  6. `git diff AGENTS.md` shows ONLY the intended additions (one new bullet in Architecture, one extended bullet + one new bullet in Key Quirks) — no deleted lines.
  QA scenarios: happy — all 6 greps pass and `git diff AGENTS.md` shows only additive changes. failure — if grep for a term returns 0, the edit missed that fact (re-check insertion point); if `git status --short` shows any file other than AGENTS.md newly staged by you, you violated the guardrail (unstage — you must never commit #14 product code). Evidence `.omo/evidence/task-1-update-agents-for-logging.md`
  Commit: Y | `docs: document issue #14 logging system (logger.cjs, services/logger.js, CONTEXTO_LOGGING_DIR, user-action conventions) in AGENTS.md`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit — re-run all 6 acceptance greps from todo 1 against the final AGENTS.md; every term present (`database/logger.cjs`, `src/services/logger.js`, `CONTEXTO_LOGGING_DIR`, and at least 2 of `toastStore|ErrorBoundary|createHandler`, and at least 3 of `CONTEXTO_DE_LOGGING|npm run log|logging:write|ALLOWED_CHANNELS`). Evidence `.omo/evidence/task-F1-update-agents-for-logging.md`
- [x] F2. Code quality review — `git diff AGENTS.md` shows only the intended additive edits (1 new Architecture bullet, 1 extended + 1 new Key-Quirks bullet); no original line deleted; style matches surrounding telegraphic bullets (no prose paragraphs, no new `## ` headers). Evidence `.omo/evidence/task-F2-update-agents-for-logging.md`
- [x] F3. Real manual QA — `git status --short` confirms NO file other than AGENTS.md was changed by this execution (pre-existing dirty tree untouched: the 9 other modified + 5 untracked #14 files must remain exactly as they were before). Evidence `.omo/evidence/task-F3-update-agents-for-logging.md`
- [x] F4. Scope fidelity — confirm no commit includes #14 product code: `git log -1 --stat` for the AGENTS.md commit lists ONLY `AGENTS.md`; no GitHub issue open/close happened; no `question`/interview required leftover. Evidence `.omo/evidence/task-F4-update-agents-for-logging.md`

## Commit strategy
- ONE commit, AFTER todo 1 and BEFORE the F-wave: `git add AGENTS.md` only, then `git commit -m "docs: document issue #14 logging system (logger.cjs, services/logger.js, CONTEXTO_LOGGING_DIR, user-action conventions) in AGENTS.md"`.
- Must NOT include any other file in the commit — the issue #14 product code in the working tree stays uncommitted (it belongs to its own execution, not this docs-only plan).
- No amend, no squash, no force-push.

## Success criteria
- AGENTS.md documents all 4 issue-#14 logging facts: `database/logger.cjs` (main-process winston), `src/services/logger.js` (renderer, `withScope()`, console fallback), `CONTEXTO_LOGGING_DIR` env, and user-action logging conventions (toast auto-log, ErrorBoundary component stacks, createHandler channel+userId logs).
- All 6 acceptance greps pass; `git diff AGENTS.md` is purely additive; no other file touched; the commit contains only AGENTS.md.
- All existing verified content preserved (npm run log, CONTEXTO_DE_LOGGING, IPC security rule, channel groups, ABI/CI quirks).
- Final verification wave F1-F4 all APPROVE by the agent with receipts in `.omo/evidence/`.
