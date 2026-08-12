# Plan draft — update AGENTS.md

status: awaiting-approval
intent: clear
review_required: false
slug: update-agents-md
date: 2026-08-12

## Deliverable
In-place update of `/home/caue/Documentos/VSCODE/acai-turbo/AGENTS.md`.

## Approach
Keep verified guidance. Correct codebase contradictions. Add missing high-signal facts. Delete nothing useful; tighten prose. Stay ~40-55 lines.

## Corrections (verified against executable sources)
1. IPC channel list: add `config:*` group (in preload, missing from current list).
2. preload exposes BOTH `window.api` AND a legacy allowlist-gated `window.electron.ipcRenderer` (used by getIPC in App.jsx + src/services/ipc.js). "raw ipcRenderer never exposed" stays true (it's gated). Clarify so agents aren't surprised window.electron exists.
3. Window: `fullscreen:true`, not "maximized" (main.cjs line 228-240).
4. DB path: note tmpdir fallback when Electron app unavailable (tests).
5. Frontend root note: App.jsx is one ~930-line file; src/router/ is empty (no routing despite react-router-dom dep).

## Additions (high-signal, verified)
- CI paths-ignore: *.md/.gitattributes/.gitignore/.env.example skip CI -> editing AGENTS.md alone won't trigger CI.
- CI pipeline order: lint -> audit -> test (matrix ubuntu+windows, --ignore-scripts + npm rebuild better-sqlite3 for NODE ABI) -> build-windows.
- Test job uses Node ABI for better-sqlite3, NOT Electron ABI: `npm test` works without `rebuild:native`; rebuild:native only needed for `npm run dev`/packaging.
- Coverage scope (vitest.config.js): only src/store/**, src/components/atoms/**, database/validate.cjs.
- iFood: main-process polling + push events (ifood:new-order / ifood:order-cancelled) main->renderer; only non-invoke IPC direction. Adding a push channel needs preload `on` allowlist + renderer listener.
- database/crypto.cjs + Electron safeStorage: master key at app.whenReady(); DB encryption depends on Electron runtime.

## Not added (low signal)
- one-off root fix_*.cjs / fix-*.js scripts (not referenced by package.json).
- husky hooks are empty stubs (no real pre-commit/pre-push commands) -> do NOT claim hooks enforced.

## Verification plan (agent-executable)
- Re-read every changed line against its cited source line.
- Run `npm run lint` + `npm run typecheck` (should remain green; AGENTS.md is .md, lint targets src/ + database/).
- Confirm no factual claim is unsourced.

## Approval gate
Awaiting user explicit okay to write the file.
