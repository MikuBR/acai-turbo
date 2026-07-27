# Implementation Plan

## Overview

Projeto **Açaí Wave** — PDV desktop para loja de açaí, construído com Electron + React + SQLite.

## Windows Integration Plan

### Current State
- CI já faz build Windows (`.github/workflows/ci.yml`: `runs-on: windows-2022`)
- `electron-builder` configurado com NSIS installer
- `better-sqlite3` (native addon) já tem `asarUnpack` configurado
- Código usa `path.join()` — sem caminhos Unix hardcoded

### 1. Native Addon Compilation (better-sqlite3)

| Item | Status | Ação |
|------|--------|------|
| MSVC Build Tools | CI ✅ / Dev ❌ | Documentar necessidade de Visual Studio Build Tools no Windows |
| Python 3.x | CI ✅ / Dev ❌ | Documentar necessidade de Python 3.x no Windows |
| `electron-builder install-app-deps` | ✅ `postinstall` | Funciona automaticamente |
| `npm run build:win` | ✅ Configurado | Já testado no CI |

### 2. Path & Filesystem

| Item | Status | Risco |
|------|--------|-------|
| `path.join()` usage | ✅ Todos os paths usam | Baixo |
| Hardcoded `/` | ✅ Nenhum encontrado | Baixo |
| Database WAL files | ✅ `.gitignore` cobre `.db-shm` e `.db-wal` | Baixo |
| CRLF/LF line endings | ⚠️ Sem `.gitattributes` | **Médio** — criar `.gitattributes` |

### 3. Printer (node-thermal-printer)

| Conexão | Funciona no Windows? |
|---------|---------------------|
| `tcp://192.168.x.x` | ✅ Rede — cross-platform |
| `printer:NOME` | ✅ Windows — mas requer driver da impressora instalado |

### 4. Husky / Git Hooks

| Item | Windows | Solução |
|------|---------|---------|
| Shebang `#!/usr/bin/env sh` | ❌ Não funciona no CMD/PowerShell | Documentar uso de Git Bash ou WSL |
| Husky install | ⚠️ Requer Git Bash | `npm run prepare` roda com shell correto |

### 5. Electron Config

| Item | Windows | Risco |
|------|---------|-------|
| `app.disableHardwareAcceleration()` | ⚠️ Pode causar flickering em algumas placas | Baixo — documentar como desativar |
| `fullscreen: true` | ✅ Funciona | Baixo |
| `contextIsolation: true` | ✅ Cross-platform | Baixo |
| `backgroundColor: '#020617'` | ✅ Cross-platform | Baixo |

### 6. Database Path

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%/acai-wave/acai_turbo_v4.db` |
| Linux | `~/.config/acai-wave/acai_turbo_v4.db` |
| Dev (fallback) | `database/acai_turbo_v4.db` (relativo ao projeto) |

### Recommended Steps (sem comprometer código atual)

1. **Adicionar `.gitattributes`** para normalizar line endings (CRLF/LF)
2. **Criar `.env.example`** com variáveis de ambiente do Windows (se houver)
3. **Documentar setup Windows** no README (VS Build Tools, Python, Git Bash)
4. **Adicionar `windows` jobs no CI** para testes cross-platform (opcional)
5. **Verificar `node-thermal-printer`** no Windows — driver de impressora USB
6. **Testar `npm run dev`** no Windows com `concurrently`

### Non-issues (já funcionam)

- `bcryptjs` — pure JS, sem native addon ✓
- `zustand`, `react`, `lucide-react` — pure JS ✓
- Vite dev server — cross-platform ✓
- ESLint, Vitest — cross-platform ✓
- Tailwind CSS — cross-platform ✓

### Points of Attention for Code Changes

- Never hardcode `/` as path separator — use `path.join()` or `path.sep`
- Avoid Unix-specific commands in npm scripts (e.g., `rm -rf` → use `rimraf` or `del`)
- If adding shell scripts, ensure Windows compatibility (`.cmd` or Node.js scripts)
- Test Electron `fullscreen` + `autoHideMenuBar` on Windows 10/11

---

## Files Changed (theming — already in progress)

### Atoms
- `src/components/atoms/Button.jsx` — bg-surface, text-primary
- `src/components/atoms/Badge.jsx` — bg-surface, text-primary
- `src/components/atoms/Input.jsx` — bg-surface, text-primary
- `src/components/atoms/Select.jsx` — bg-surface, text-primary
- `src/components/atoms/ProductCard.jsx` — bg-surface, text-primary

### Molecules
- `src/components/molecules/ModalHeader.jsx` — bg-surface, text-primary
- `src/components/molecules/ModalFooter.jsx` — bg-surface, text-primary
- `src/components/molecules/SettingsTabs.jsx` — bg-surface, text-primary
- `src/components/molecules/SettingsTab.jsx` — bg-surface, text-primary

### Organisms
- `src/components/organisms/Sidebar.jsx` — bg-surface, text-primary
- `src/components/organisms/OrderSidebar.jsx` — bg-surface, text-primary
- `src/components/organisms/CartPanel.jsx` — bg-surface, text-primary
- `src/components/organisms/CatalogPanel.jsx` — bg-surface, text-primary
- `src/components/organisms/LoginModal.jsx` — bg-surface (remover bg-gray-900/98)
- `src/components/organisms/PasswordModal.jsx` — bg-surface
- `src/components/organisms/ManagerAuthModal.jsx` — bg-surface
- `src/components/organisms/AcaiBuilderModal.jsx` — bg-surface
- `src/components/organisms/QuickBuilderModal.jsx` — bg-surface
- `src/components/organisms/CheckoutModal.jsx` — bg-surface
- `src/components/organisms/NewTableModal.jsx` — bg-surface
- `src/components/organisms/SettingsModal.jsx` — bg-surface
- `src/components/organisms/ReportsModal.jsx` — bg-surface

### Forms
- `src/components/forms/UserForm.jsx` — text-muted
- `src/components/forms/ProductForm.jsx` — text-muted
- `src/components/forms/ClientForm.jsx` — text-muted
- `src/components/forms/InventoryForm.jsx` — text-muted
- `src/components/forms/CategoryForm.jsx` — bg-surface-light
- `src/components/forms/PromotionForm.jsx` — text-muted
- `src/components/forms/FinancialForm.jsx` — text-muted

### Root
- `src/components/ErrorBoundary.jsx` — bg-surface
- `src/App.jsx` — bg-surface
