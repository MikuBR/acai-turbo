# Açaí Wave — AGENTS.md

## Stack
- **Frontend**: React 19 + Vite 8 + Tailwind CSS 4 + Zustand
- **Desktop**: Electron 28 (contextIsolation, no nodeIntegration)
- **Database**: SQLite via better-sqlite3 (WAL mode, auto-migration on startup)
- **Printing**: node-thermal-printer (TCP/IP)
- **Build**: electron-builder (NSIS Windows)
- **Node**: 20.x (`.nvmrc`)

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite + Electron in parallel (concurrently) |
| `npm test` | Vitest (unit + integration) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with v8 coverage |
| `npm run lint` | ESLint (`src/` + `database/`) |
| `npm run build` | Vite build only |
| `npm run build:win` | Vite build + electron-builder NSIS |
| `npm run package:win` | electron-builder NSIS only (skip Vite build) |

## Architecture & entrypoints
- **Electron main**: `main.cjs` — window creation, all IPC handlers, session/auth, printer logic
- **Preload**: `preload.js` — `contextBridge` with **explicit channel allowlist** + legacy `window.electron` compat
- **Frontend entry**: `index.html` → `src/main.jsx` → `App.jsx` (single monolithic component)
- **Database**: `database/db.cjs` — schema, queries, seed data, all as CJS (`require`)
- **IPC validation**: `database/validate.cjs` — per-channel input validation allowlist
- **State**: `src/store/useStore.js` — single Zustand store
- **Components**: Atomic Design (`atoms/`, `molecules/`, `organisms/`, `forms/`)

## Testing
- **Vitest** with `jsdom` environment, globals enabled
- Tests in `src/tests/` matching `*.test.{js,jsx}` or `*.spec.{js,jsx}`
- Setup file: `src/tests/setup.js` (imports `@testing-library/jest-dom`)
- Coverage targets: `src/store/`, `src/components/atoms/`, `database/validate.cjs`
- Tests run **without Electron** — validation tests import `database/validate.cjs` directly
- CI runs on ubuntu and windows; native addons skipped with `npm ci --ignore-scripts`

## Important quirks
- **Postinstall** runs `electron-builder install-app-deps` (rebuilds native addons for Electron). Can fail on plain Node — use `--ignore-scripts` if not targeting Electron.
- **GPU acceleration** disabled on Linux by default (GPU driver instability). Override via `ENABLE_GPU=true` / `DISABLE_GPU=true`.
- **Security warnings** suppressed in dev (`ELECTRON_DISABLE_SECURITY_WARNINGS`).
- App runs **fullscreen** by default (1280x800, maximized).
- **Vite dev server** listens on `0.0.0.0:5173` (strict port). Electron tries `localhost:5173` then `127.0.0.1:5173`.
- **IPC channels** are validated at two levels: preload allowlist (`preload.js`) + input schema validation (`validate.cjs`). Both must be updated when adding a channel.
- **Auth sessions**: token-based, 8h expiry. Rate-limited: 5 failed attempts → 15 min lock.
- **Database location**: `app.getPath('userData')/acai_turbo_v4.db`. Falls back to OS temp dir.

## Commits
- No TypeScript — plain JSX throughout
- ESLint flat config (v10), covers `src/` and `database/`
- Husky hooks present (no pre-commit config found — adding one may break CI if not synced)

## CI pipeline (`.github/workflows/ci.yml`)
1. lint (ubuntu)
2. audit (ubuntu, `--audit-level=high`, continue-on-error)
3. test (ubuntu + windows, dependent on lint+audit)
4. build-windows (windows, push to main only, publishes to GitHub Releases)
