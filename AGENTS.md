# Açaí Wave — AGENTS.md

## Stack
- Frontend: React 19 + Vite 8 + Tailwind CSS 4 + Zustand
- Desktop: Electron 28 (contextIsolation, validated IPC)
- Database: SQLite via better-sqlite3 (WAL with auto-migration)
- Printing: node-thermal-printer (TCP/IP + Windows printer:NOME)
- Build: electron-builder (NSIS Windows)
- Node: 20.x (managed by `.nvmrc`)

## Entrypoints & Core Tools
- **Electron main**: `main.cjs` — IPC handlers, auth, printer logic
- **Preload**: `preload.js` — contextBridge with explicit channel allowlist
- **Frontend**: `src/main.jsx` → `App.jsx` (monolithic component)
- **Database**: `database/db.cjs` (schema/queries) + `validate.cjs` (IPC allowlist)
- **State**: `src/store/useStore.js` (Zustand)
- **Components**: Atomic Design (`atoms/`, `molecules/`, `organisms/`, `forms/`)
- **PDF**: `src/components/organisms/ReportsModal.jsx` (pdfmake → main.cjs:dialog:save-pdf → preload.js:reports:exportPdf)
- **iFood**: Integration subsystem spanning `main.cjs`, `validate.cjs`, `db.cjs`

## Commands | Purpose
| `npm run dev` | Vite + Electron in parallel |
| `npm test` | Vitest (unit + integration) |
| `npm run lint` | ESLint (`src/` + `database/`) |
| `npm run rebuild:native` | Recompile better-sqlite3 native addon |
| `npm run check:native` | Verify native module ABI |
| `npm run build:win` | Vite build + NSIS installer |
| `npm run build` | Vite build only |
| `npm run package:win` | electron-builder only (skip Vite) |
| `npm run test:watch` | Vitest watch |
| `npm run test:coverage` | Vitest with v8 coverage |

## Development quirks | Agent would need help with this
- Postinstall: `electron-builder install-app-deps` + `npm run rebuild:native`
- Native addon build: Requires Visual Studio Build Tools + Python for Windows CI
- GPU: Linux default is disabled; set `ENABLE_GPU=true` (or `DISABLE_GPU=true`) per platform
- Security: Set `ELECTRON_DISABLE_SECURITY_WARNINGS` in `main.cjs:104` for dev
- Fullscreen: Maximized (1280x800) by default
- Vite: `host: '0.0.0.0:5173'` (strict port)
- IPC validation: Double-verified (preload allowlist + schema in `validate.cjs`)
- Sessions: Token-based (8h expiry). Login throttled: 5 attempts → 15-min lock + DB-side counter
- Database: Primary path `app.getPath('userData')/acai_turbo_v4.db`. Migration engine includes file lock, pre-migration backup, and dry-run mode
- Versioning: Official releases use `vX.Y.Z`. CI creates `vX.Y.Z-ci.N` pre-releases on non-tag pushes
- Package hierarchy: All native addons (better-sqlite3) are at-repo permission boundaries; built by CI on both lint and build jobs
- Node version: `.nvmrc` pins 20; CI uses matrix (ubuntu + windows) with isolated caches
- Printing: Requires Windows printer driver for `printer:NOME` connections (client-side scripts only)

## Testing workflow
- Agent should **run tests without Electron** (no UI, faster). Use `npm test` unless you need IPC tests (requires Electron).
- Database migration validation: `node scripts/smoke-test-db.cjs`
- Coverage targets: `src/store/**/*.js`, `src/components/atoms/**/*.jsx`, `database/validate.cjs`
- Verification: After CI rebuild (`npm run rebuild:native`), run `npm run check:native` (compares Electron ABI)

## CI / Build pipeline
- Single-phase: lint → audit → test (ubuntu + windows) → package:win (Windows-only, full npm ci for native rebuild)
- Version strategy: Official releases on tags use first-party LTS standard; CI jobs automatically increment patch for pre-releases
- Safe guards: paths-ignore blocks .md/.gitignore changes; minimal permissions; cache strategy per OS includes lockfile hash key
- Note: No typecheck step present (type checking is minimal; use `npm run lint` only)
