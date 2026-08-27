---
slug: agents-md-update
status: awaiting-approval
intent: clear
review_required: true
pending_action: approve brief, then write .omo/plans/agents-md-update.md
approach: Rewrite AGENTS.md to be compact + high-signal; fix stale useStore.js->.ts ref; reconcile all content against executable sources; preserve verified hard-earned facts, drop generic/fluff.
---

# Plan: Update AGENTS.md (compact high-signal rewrite)

## TL;DR (For humans)
The existing AGENTS.md is already strong. The rewrite tightens it against the "Would an agent miss this?" filter, fixes one stale reference (`src/store/useStore.js` -> `src/store/useStore.ts`), and reconciles every claim against executable sources (package.json, eslint.config.js, vitest.config.js, ci.yml, .nvmrc). No product code touched.

## Findings (cited - path:lines)
- AGENTS.md:11 says `src/store/useStore.js`; real file is `src/store/useStore.ts` (verified: `src/store/useStore.ts`).
- AGENTS.md:22 says test glob `src/tests/**/*.test.{js,jsx}`; vitest.config.js:10 ALSO includes `*.spec.{js,jsx}`. Current doc undersells the test glob.
- package.json:17 postinstall = `electron-builder install-app-deps && npm run rebuild:native` (matches AGENTS.md:17).
- package.json:18/19 build:win uses `--publish never`; package:win is `--publish never` (not in current AGENTS.md but not high-signal).
- eslint.config.js:22 lists the exact CJS files scoped to node globals (matches AGENTS.md "Node globals scoped to CJS files" — accurate, keep).
- ci.yml:94-98 test job uses `npm ci --ignore-scripts` + `npm rebuild better-sqlite3` + `npm test` + `node scripts/smoke-test-db.cjs` + `npm run build` (matches AGENTS.md:71).
- ci.yml:128-130 build-windows installs MSBuild + `pip install setuptools` (matches AGENTS.md:40).
- ci.yml:163-189 release calc: patch auto-increment from latest stable `v*` tag; non-tag pushes -> `vX.Y.Z-ci.<run_number>` prerelease (matches AGENTS.md:73).
- .nvmrc pins Node 20 (matches AGENTS.md:79).
- validate.cjs confirms `dialog:save-pdf`, `ifood:*` IPC channels exist (matches AGENTS.md:65 IPC groups).
- No other instruction files exist (no CLAUDE.md, .cursorrules, .cursor/, copilot-instructions.md, opencode.json).

## Decisions (with rationale)
- Fix stale ref: `useStore.js` -> `useStore.ts` (verified).
- Test glob: add `.spec.*` alongside `.test.*` to match vitest config truth.
- Keep all current sections — each has at least one hard-earned fact (ABI rebuild, dual IPC gating, migration locks, logging env var, CI release mechanics) that an agent would miss.
- Trim prose density: shorter bullets, remove redundant restatements of obvious framework defaults.
- Exclude generic advice, tutorials, file trees, speculative claims.
- Do NOT touch README.md roadmap in THIS plan (out of scope for "AGENTS.md" task; prior plan touched it separately).

## Scope IN
- Edit `AGENTS.md` (root): fix stale ref, add spec glob, condense to high-signal.

## Scope OUT (Must NOT have)
- NO product/source code edits.
- NO README.md edits (separate concern).
- NO new instruction files, NO opencode.json creation.
- NO subagent edits product code (planner pledge).

## Todos
- [ ] 1. Rewrite AGENTS.md fixing: (a) stale `src/store/useStore.js` -> `src/store/useStore.ts` (AGENTS.md:11), (b) test glob adds `*.spec.{js,jsx}` (AGENTS.md:22), (c) condense bullets so every line passes "would an agent miss this?" filter - expect compact high-signal AGENTS.md verified against package.json/vitest.config.js/eslint.config.js/ci.yml.

## Final verification wave
- [ ] F1. Grep AGENTS.md for `useStore.js` - expect ZERO matches; `useStore.ts` present.
- [ ] F2. Grep AGENTS.md for `spec` - expect the vitest spec glob documented.
- [ ] F3. Read AGENTS.md top-to-bottom: every section has >0 non-obvious fact; no generic advice, no file trees, no speculative claims.
