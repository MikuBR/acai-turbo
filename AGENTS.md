# Açaí Wave — AGENTS.md

## Stack
- Frontend: React 19 + Vite 8 + Tailwind CSS 4 + Zustand
- Desktop: Electron 28 (contextIsolation, IPC validation)
- Database: SQLite via better-sqlite3 (WAL mode with auto-migration)
- Printing: node-thermal-printer (TCP/IP + Windows printer:NOME)
- Build: electron-builder (NSIS Windows)
- Node: 20.x

## Commands | Purpose
| `npm run dev` | Vite + Electron in parallel |
| `npm test` | Vitest (unit + integration) |
| `npm run lint` | ESLint (`src/` + `database/`) |
| `npm run build:win` | Vite build + electron-builder NSIS installer |
| `npm run build` | Vite build only |
| `npm run package:win` | electron-builder only (skip Vite) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with v8 coverage |

## Architecture entrypoints
- **Electron main**: `main.cjs` — all IPC handlers, auth, printer logic
- **Preload**: `preload.js` — `contextBridge` with explicit channel allowlist
- **Frontend**: `src/main.jsx` → `App.jsx` (monolithic component)
- **Database**: `database/db.cjs` (CJS schema/queries) + `validate.cjs` (IPC validation)
- **State**: `src/store/useStore.js` (Zustand store)
- **Components**: Atomic Design (`atoms/`, `molecules/`, `organisms/`, `forms/`)

## Development quirks | Agent would need help with this
- Postinstall: `electron-builder install-app-deps` rebuilds better-sqlite3 native addon
- Windows: Requires Visual Studio Build Tools + Python 3.x for better-sqlite3 compilation
- GPU: Disabled on Linux by default (ENABLE_GPU=true / DISABLE_GPU=true)
- Security: `ELECTRON_DISABLE_SECURITY_WARNINGS` suppresses warnings in dev
- Fullscreen: App runs maximized (1280x800) by default
- Port: Vite listens on `0.0.0.0:5173`, Electron tries multiple addresses
- IPC: Validated twice — preload allowlist + validate.cjs schema
- Sessions: Token-based with 8h expiry, rate-limited (5 failures → 15 min lock)
- Database: `app.getPath('userData')/acai_turbo_v4.db`, falls back to temp dir

## Testing workflow
- Run **without Electron** (directly import `database/validate.cjs`)
- Database migration smoke test: `node scripts/smoke-test-db.cjs`
- Coverage: targets `src/store/`, `src/components/atoms/`, `validate.cjs`
- Pre-built native addon: `npm run rebuild better-sqlite3` (CI)

## Build pipeline (CI)
1. **lint** (ubuntu, `npx eslint src/ database/`)
2. **audit** (ubuntu, `npm audit --audit-level=high`, continue-on-error)
3. **test** (ubuntu + windows, depends on lint+audit)
4. **build-windows** (windows, push to main, publishes installer)

## Windows setup (if you use Windows)
- Install Visual Studio Build Tools + Python 3.x (required for better-sqlite3)
- Use Git Bash or WSL for husky hooks (shell scripts need POSIX)
- Printer driver required for `printer:NOME` connections
- Electron hardware acceleration may cause flickering (disable if needed)
