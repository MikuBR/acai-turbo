---
slug: agents-md-hierarchy
status: approved
intent: clear
review_required: false
pending-action: execute .omo/plans/agents-md-hierarchy.md via $start-work
approach: Update root AGENTS.md (fix stale refs, add sub-file pointers), create 2 sub-AGENTS.md files (src/components, database) per the init-deep scoring matrix; update-mode, max-depth 3.
---

# Draft: agents-md-hierarchy

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

- C1 root AGENTS.md update | existing comprehensive doc kept; fix `src/store/useStore.js`->`.ts` stale ref (line 16); add pointers to sub-files | active | AGENTS.md:16
- C2 src/components/AGENTS.md | new sub-file: atomic-design layers, barrel exports, direct-import gotchas | active | src/components/index.js, *.jsx
- C3 database/AGENTS.md | new sub-file: db.cjs schema/queries, validate.cjs allowance, migrate engine, crypto | active | database/*.cjs

## Open assumptions (announced defaults)
<!-- intent is CLEAR: record any default adopted instead of asking so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

- init-deep mode | update (not --create-new) | existing root AGENTS.md is high-quality; regenerate would lose ported knowledge; skill's default mode is update | no
- max depth | 3 | init-deep default; repo depth is 2 anyway | yes
- Root AGENTS.md format | keep existing structure (Stack/Commands/Quirks/...), NOT force into init-deep template | doc is already project-recognized; rewriting template adds churn without value | yes
- Review required | false | user gave no high-accuracy / 高精度 modifier | no

## GitHub issues — status (per user request, GB checked)
<!-- Roadmap context recorded; init-deep scope unchanged (doc-only, issue-independent). -->
- #10 PERMUTA: DONE. 58 refs / 8 files (migrations/002-add-permuta.cjs, validate.cjs:45/67/76/102, db.cjs, main.cjs:377, CheckoutModal.jsx, tests). Can be closed.
- #14 Logging (winston): NOT DONE. No winston/package.json; partial infra exists: src/services/errorService.js handleIPCError + ErrorBoundary.jsx. Issue asks "Atualizar AGENTS.md" with logging tools.
- #13 Playwright E2E: NOT DONE. No e2e/, no @playwright/test. CI has no running-app target (only package:win). Issue asks "Incluir no AGENTS.md".
- #12 Decompose App.jsx: NOT DONE. No src/features|router|layouts, no react-router-dom; App.jsx 904-line monolith. NOTE: #12 changes src/components shape → would reshape a future components AGENTS.md; init-deep doc describes current state only.

## Findings (cited - path:lines)

- Root AGENTS.md (71 lines) exists, comprehensive, matches repo (verified vs package.json:6,20,21,46-48:50; vitest.config.js:14-18). Coverage targets AGENTS.md:49 == vitest.config.js:14-18. Confirmed accurate.
- **Stale ref**: AGENTS.md:16 says `src/store/useStore.js`; actual file is `src/store/useStore.ts` (only .ts in repo; migrated in commit dc6dacc per explorer). Must fix to `.ts`.
- Components: 47 files, 6 sublayers (atoms 10, forms 8, molecules 6, organisms 14, templates 3, ui 4) + ErrorBoundary + barrel index.js. src/components/index.js re-exports all layers. atoms/index.js exports only 5 (Button,Input,Select,Badge,Card); ProductCard/Toast/LoadingOverlay/ConfirmDialog imported directly by App — gotcha to document.
- Database: db.cjs (834 lines, ~70 query fns, 79 header matches), validate.cjs (375 lines, validateIPC allowlist, permissive pass-through when no validator), migrate.cjs (file lock, backup, dry-run), crypto.cjs (AES-256-GCM via safeStorage), migrations/ (001-004).
- ESLint gotcha: eslint.config.js:22 main-process allowlist must be extended for new Electron `.cjs` files.
- More gotchas: db.cjs:92 hardcoded admin/admin123 seed; migrate.cjs:77 stale-lock force-delete; main.cjs:104 dev-only security-warning suppression; husky v9 shim deprecated (`.husky/_/husky.sh:1`).
- No LSP/codegraph tools available → code-map symbol-density estimated, centrality unmeasured.

## Decisions (with rationale)

- Create 2 sub-AGENTS.md: `src/components/` (score 14, distinct UI domain) + `database/` (score 9, strong module boundary). Skip src/store, src/tests, scripts (root covers, scores <8).
- Root: keep existing content; edit AGENTS.md:16 `.js`→`.ts`; append a short "AGENTS.md hierarchy" note pointing to the 2 new sub-files + where sub-files are not needed.
- Each sub-file: 30-80 lines, OVERVIEW / WHERE TO LOOK / CONVENTIONS (deviations only) / ANTI-PATTERNS; NEVER repeat parent (root) content; telegraphic style.

## Scope IN

- Root AGENTS.md edit: fix stale store path, add hierarchy pointer section.
- CREATE `src/components/AGENTS.md`.
- CREATE `database/AGENTS.md`.
- Record GitHub issue statuses (#10 DONE, #12/#13/#14 NOT) as context/roadmap in the draft + plan Notes — doc-only, no code/CI/doc changes.

## Scope OUT (Must NOT have)

- NO rewrite of root into the init-deep template (keep existing structure).
- NO --create-new regeneration / deletion of existing AGENTS.md.
- NO AGENTS.md for src/store, src/tests, scripts, .github, database/migrations subdirs individually.
- NO edits to product/source code, CI, configs. Documentation-only.
- NO implementation of GitHub issues #12/#13/#14 (only their status is recorded as context/roadmap).
- NO closing/opening of GitHub issues (no gh CLI use).
- NO external/CI doc changes, no README changes.

## Open questions

- None. All forks resolved by repo evidence or adopted init-deep defaults (below gate for veto).

## Approval gate
status: awaiting-approval
approach: Update root (stale ref + hierarchy pointers), create src/components/AGENTS.md and database/AGENTS.md per init-deep template.
Approval authorizes writing ONE plan only; execution via $start-work after.
<!-- When exploration is exhausted and unknowns are answered, present a brief once and wait for the user's explicit okay. -->