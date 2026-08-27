# agents-md-hierarchy - Work Plan

## TL;DR (For humans)

**O que você vai receber:** Três arquivos de documentação para ajudar futuros agentes de IA a trabalhar no projeto sem quebrar nada: (1) o AGENTS.md da raiz corrigido (um caminho de arquivo desatualizado) e com links para os novos arquivos; (2) um AGENTS.md novo para a pasta de componentes de interface (src/components); (3) um AGENTS.md novo para a pasta do banco de dados (database).

**Por que essa abordagem:** O AGENTS.md da raiz já é bom e usado pelo projeto — não vamos reescrevê-lo. Vamos só corrigir o que está errado e criar dois arquivos de apoio nas pastas mais complexas (interface e banco), para que um agente que trabalhe nesses pontos encontre as regras específicas ali mesmo, sem precisar adivinhar.

**O que NÃO vai fazer:** Não tocar em código do produto, configurações, CI, README ou package.json. Não reescrever a estrutura atual do AGENTS.md da raiz. Não implementar nenhuma das issues do GitHub (#12, #13, #14) — só registramos o status delas como contexto. Não criar AGENTS.md para pastas menores que não precisam.

**Esforço:** Pequeno — 3 arquivos de documentação, 4 tarefas de execução, sem código novo. Pode ser concluído em uma única sessão de trabalho.

**Risco:** Baixo - Baixo. É documentação pura; nada de banco, nada de build, nada de binário nativo. O único cuidado é não duplicar conteúdo da raiz nos arquivos novos e manter cada arquivo entre 30 e 80 linhas.

**Decisões para conferir:** (a) corrigir o caminho do store de `.js` para `.ts` no AGENTS.md da raiz; (b) criar arquivos de documentação apenas em `src/components` e `database` (outras pastas ficam cobertas pelo arquivo da raiz); (c) manter o formato atual do AGENTS.md da raiz em vez de migrar para o template do init-deep.

Seu próximo passo: aprovar a execução — o trabalho roda em uma sessão separada de worker (por exemplo, `$start-work`). Os detalhes completos de execução estão abaixo.

---

## Scope
### Must have
- Edit root `AGENTS.md`: fix stale store path ref (line 16: `src/store/useStore.js` -> `src/store/useStore.ts`) and append an "AGENTS.md hierarchy" pointer section linking the two new sub-files.
- CREATE `src/components/AGENTS.md` (30-80 lines) documenting the 6 Atomic Design layers, the barrel export pattern, and the direct-import gotchas.
- CREATE `database/AGENTS.md` (30-80 lines) documenting db.cjs, validate.cjs, migrate.cjs, crypto.cjs, migrations/.
- Record GitHub issue statuses (#10 DONE, #12/#13/#14 NOT DONE) as context/roadmap notes in the plan Notes. Doc-only.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NO rewrite/reformat of root AGENTS.md into the init-deep template (keep existing Stack/Commands/Quirks structure).
- NO `--create-new` regeneration; no deletion of existing AGENTS.md.
- NO AGENTS.md for src/store, src/tests, scripts, .github, database/migrations as separate files (root covers them).
- NO edits to product/source code, CI workflows, configs, README, package.json.
- NO implementation of GitHub issues #12/#13/#14. NO gh CLI usage; NO opening/closing issues.
- NO duplicate content from root in sub-files: they must not restate Stack / Commands / Development quirks / CI pipeline / Key IPC channels.
- NO generic advice; telegraphic style only; sub-files 30-80 lines each.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: none (docs only) + manual markdown lint via grep in QA.
- Evidence: `.omo/evidence/task-<N>-agents-md-hierarchy.md` for each todo; final `.omo/evidence/task-f-*` receipts under the final verification wave.

## Execution strategy
### Parallel execution waves
- Wave 1 (1 todo): root AGENTS.md edit (stale ref + hierarchy pointer).
- Wave 2 (parallel todos): CREATE src/components/AGENTS.md and CREATE database/AGENTS.md (independent, parallelizable).

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 (root edit) | none | none | 2, 3 (but keep 1 first so pointer section refs exist) |
| 2 (components) | none | none | 3 |
| 3 (database) | none | none | 2 |

## Todos
> Implementation + evidence = ONE todo. Never separate.
<!-- APPEND TASK PLANS BELOW THIS LINE. -->

- [ ] 1. Edit root AGENTS.md: fix stale store path + hierarchy pointer
  **What to do / Must NOT do:** Read `AGENTS.md`. Change line 16 from `- **State**: `src/store/useStore.js` (Zustand)` to ``- **State**: `src/store/useStore.ts` (Zustand - only TS file in repo)``. Do NOT rename any existing header or restructure the file. Append at the very end (after the Key IPC channels list) a short section `## AGENTS.md hierarchy` with two bullets referencing `src/components/AGENTS.md` and `database/AGENTS.md`. Do not introduce any placeholder text.
  **Parallelization:** Wave 1 | Blocked by: none | Blocks: none
  **References:** /home/caue/Documentos/VSCODE/acai-turbo/AGENTS.md:16 (fix .js->.ts). Confirm actual TS file: /home/caue/Documentos/VSCODE/acai-turbo/src/store/useStore.ts exists (glob checked). Verified only .ts store.
  **Acceptance criteria (agent-executable):** After edit, run `git diff -- AGENTS.md` and assert (a) exactly one line changed in the Entrypoints & Core Tools section (the store line), (b) a new terminal `## AGENTS.md hierarchy` section exists linking both sub-files, (c) no header was renamed/removed.
  **QA scenarios (agent-executable):**
  - happy: `git status --short` shows only `M AGENTS.md`; `grep -n 'useStore.ts' AGENTS.md` matches exactly once; `grep -n 'src/components/AGENTS.md\|database/AGENTS.md' AGENTS.md` matches both in the appended section.
  - failure: `grep -n 'useStore.js' AGENTS.md` returns 1 hit (if stale `useStore.js` still present -> fail, fix). Evidence: `.omo/evidence/task-1-agents-md-hierarchy.md`.
  **Commit:** Y | `docs(agents): fix stale useStore path + link AGENTS.md hierarchy` - commit full AGENTS.md only.

- [ ] 2. CREATE src/components/AGENTS.md
  **Files: New file /home/caue/Documentos/VSCODE/acai-turbo/src/components/AGENTS.md**
  **Content (30-80 lines, telegraphic):** OVERVIEW (1-2 lines: Atomic Design UI layer, React 19, status theming via Tailwind CSS vars). STRUCTURE: list the 6 layers with file counts (atoms 10, forms 8, molecules 6, organisms 14, templates 3, ui 4) + index.js barrel + ErrorBoundary.jsx. WHERE TO LOOK table: primitive controls -> atoms; CRUD screens/forms -> forms; business modals/panels -> organisms; page scaffolding -> templates; generic UI extras -> ui.
  **Gotcha to document:** `src/components/atoms/index.js` barrel exports only Button/Input/Select/Badge/Card; ProductCard, Toast, LoadingOverlay, ConfirmDialog are imported directly by App.jsx (NOT via barrel) - do not rely on barrel to re-export them. `src/components/molecules` index does not export AdjustStockModal; `src/components/templates` index exports MainLayout/ModalLayout.
  **ANTI-PATTERNS:** do NOT add a component to a layer/barrel unless it fires a linter violation; do NOT import atoms into molecules or organisms directly (respect the layer chain atoms -> molecules -> organisms, except documented direct imports).
  **Must NOT:** repeat root Stack/Commands/Development quirks/CI content.
  **Parallelization:** Wave 2 | Blocked by: none | Blocks: none
  **References:** list via `ls src/components/*; glob src/components/**/*.{js,jsx}`. Verify barrel at src/components/index.js (re-exports all 6 layers). atoms/index.js shows only 5 exports (Button,Input,Select,Badge,Card) - confirmed.
  **Acceptance criteria (agent-executable):** (a) `wc -l src/components/AGENTS.md` in [30,80]; (b) `grep -i 'atoms\|molecules\|organisms\|templates' src/components/AGENTS.md` non-empty; (c) `grep -n '## Stack\|## Commands\|Development quirks\|Key IPC' src/components/AGENTS.md` returns nothing (no root duplication).
  **QA scenarios:**
  - happy: file exists, line count 30-80, mentions 6 layers atomically, documents direct-import gotcha (ProductCard/Toast/LoadingOverlay/ConfirmDialog).
  - failure: file missing or >80 lines or duplicates root sections -> flag and rewrite.
  **Commit:** Y | `docs(components): add Atomic Design layer AGENTS.md`

- [ ] 3. CREATE database/AGENTS.md
  **Files: New file.** /home/caue/Documentos/VSCODE/acai-turbo/database/AGENTS.md
  **Content (30-80 lines):** OVERVIEW (SQLite/better-sqlite3 v12, WAL, auto-migration). STRUCTURE: db.cjs (~834 lines, ~70 exported query fns, organized by domain categories/products/orders/cash/reports/promotions/users/audit/inventory/financial/clients/sessions/ifood), validate.cjs (validateIPC(channel,data) allowlist; missing validator = permissive pass-through). CONVENTIONS: db path `app.getPath('userData')/acai_turbo_v4.db`; migration engine runs migrations/, backup, lock, dry-run via DRY_RUN_MIGRATIONS. crypto.cjs AES-256-GCM with master key via Electron safeStorage; sensitive config encrypted.
  **ANTI-PATTERNS:** do NOT add a new query function to db.cjs without adding a matching validator in validate.cjs (else permissive). Do NOT bypass migrations (use migrations/, not direct ALTER). File lock in migrate.cjs auto-forces stale locks (pid check).
  **Must NOT:** repeat root Stack/Commands/quirks; avoid the full IPC channel list (root AGENTS.md already has "Key IPC channels (validate.cjs)").
  **Parallelization:** Wave 2 | Blocked by: none | Blocks: none
  **References:** skim `/home/caue/Documentos/VSCODE/acai-turbo/database/db.cjs` (79 header-level query functions per explorer), `database/validate.cjs:369-375` (validateIPC; permissive pass-through when no validator registered), `database/migrate.cjs:19-106` (lock acquire/release, stale-pid takeover), `database/crypto.cjs` (AES-256-GCM via Electron safeStorage master key). Do NOT execute `database/db.cjs` (better-sqlite3 native addon may not be compiled in this environment); read files only.
  **Acceptance criteria (agent-executable):** (a) `wc -l database/AGENTS.md` in [30,80]; (b) `grep -q 'db.cjs\|validate.cjs\|migrate.cjs\|crypto.cjs' database/AGENTS.md`; (c) `grep -n 'npm run\|dev\|build\|test\|lint' database/AGENTS.md` empty (no commands repeated).
  - QA: happy = existing; failure = empty/too long -> fix.
  **Evidence:** `.omo/evidence/task-3-agents-md-hierarchy.md`
  **Commit: Y |** `docs(database): add DB layer AGENTS.md`

- [ ] 4. Cross-check / final md hygiene (docs-only verification)
  **Files: None/product code edited.** Run a full consistency pass: `git status --short` must show exactly `M AGENTS.md` + `?? src/components/AGENTS.md` + `?? database/AGENTS.md` (plus `.omo/` artifacts, which are untracked tooling). Assert no other tracked files modified. Assert `wc -l` each sub-file in [30,80]. Assert root `useStore.js` no longer referenced. Assert no sub-file imports github issues.
  **Parallelization:** Wave 3 | Blocked by: 1,2,3 | Blocks: none
  **References:** AGENTS.md, src/components/AGENTS.md, database/AGENTS.md
  **Acceptance criteria (agent-executable):** the 3 assertions above pass.
  **QA:** grep for forbidden duplication; exit 0 when clean.
  **Evidence:** `.omo/evidence/task-4-agents-md-hierarchy.md`
  **Commit: no** (verification only)

## Final verification wave
> Parallel; ALL must APPROVE; surface results and wait for the user's explicit okay before declaring complete. Agent-executed - zero human intervention.
- [ ] F1. Plan compliance audit - verify deliverables match the plan exactly.
  **Run:** `git status --short`. Assert exactly `M AGENTS.md` + `?? src/components/AGENTS.md` + `?? database/AGENTS.md` (plus `.omo/` untracked tooling) and nothing else modified. Assert `git diff --stat AGENTS.md` touches only the line-16 store fix + appended `## AGENTS.md hierarchy` block.
  **Evidence:** `.omo/evidence/task-F1-agents-md-hierarchy.md`
- [ ] F2. Content/quality review - each sub-file is 30-80 lines (`wc -l`), telegraphic, and does NOT duplicate root Stack/Commands/quirks/Key-IPC (`grep -n '## Stack\|## Commands\|Development quirks\|Key IPC\|## CI pipeline\|Pre-release'` returns nothing). Assert file naming matches root pointer.
  **Evidence:** `.omo/evidence/task-F2-agents-md-hierarchy.md`
- [ ] F3. Real manual QA - read each generated file end-to-end; verify every claim has a supported path: atoms/index.js really has 5 exports, App.jsx really imports ProductCard/Toast/etc directly (grep confirms), db.cjs query/validate correlation, migrations dir exists. No business-logic claim without cited evidence.
  **Evidence:** `.omo/evidence/task-F3-agents-md-hierarchy.md`
- [ ] F4. Scope-fidelity audit - confirm NO product code/CI/config/README edits, NO issue implementation, NO gh CLI in commit history. `git log --oneline -3` shows only 3 `docs(agents):` commits.
  **Evidence:** `.omo/evidence/task-F4-agents-md-hierarchy.md`

## Commit strategy
- One commit series, each commit pushed to its own logical unit so partial review is possible:
  1. `docs(agents): fix stale useStore path + link AGENTS.md hierarchy` - root AGENTS.md only.
  2. `docs(agents): add src/components/AGENTS.md` - Atomic Design layer file only.
  3. `docs(agents): add database/AGENTS.md` - DB layer file only.
  4. `docs(agents): final triage` - nothing (todo 4 is verify-only).
- Doc commits do not trigger CI build/native rebuild; no native addon compile needed.
- MSG style: conventional commit `docs(...)`. No emojis.

## Success criteria
- User receives 3 deliverable artifacts under the repo: (1) edited root AGENTS.md with corrected `useStore.ts` path and a hierarchy-pointer section; (2) new `src/components/AGENTS.md` (30-80 lines, no root duplication); (3) new `database/AGENTS.md` (30-80 lines, no root duplication).
- GitHub issues #12/#13/#14 status recorded as context only - no issue was implemented, no issue was opened/closed, no gh CLI usage in the commit history.
- Final verification wave (F1) passes with receipt `.omo/evidence/F1-*`.
- Zero product-code/CI/README/config edits in `git status` - every artifact is documentation.