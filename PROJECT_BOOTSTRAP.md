# Açaí Wave — PROJECT_BOOTSTRAP.md

**Repositório:** `MikuBR/acai-turbo` (SSH: `git@github.com:MikuBR/acai-turbo.git`)
**Caminho local:** `/home/caue/Documentos/projetos/vscode-projects/acai-turbo`
**Stack:** React 19 + Vite 8 + Electron 32.3.3 + better-sqlite3 + SQLite WAL

---

## ÍNDICE

1. [Arquitetura](#1-arquitetura)
2. [Fluxos de Dados (4 camadas)](#2-fluxos-de-dados-4-camadas)
3. [Decisões do Audit + Correções 08/09/2026](#3-decisões-do-audit--correções-08092026)
4. [Verificação Segunda Onda](#4-verificação-segunda-onda)
5. [Arquivos de Referência (completo)](#5-arquivos-de-referência-completo)
6. [Configurações e Build](#6-configurações-e-build)
7. [Convenções de Código](#7-convenções-de-código)
8. [Estado Atual](#8-estado-atual)

---

## 1. Arquitetura

### Main Process (Electron)
- `main.cjs` — IPC handlers, auth, printer, logger init, GPU toggle, window creation
- `preload.js` — `contextBridge`, `window.api`, `ALLOWED_CHANNELS` allowlist (segurança)
- Native: `better-sqlite3` (SQLite, WAL mode)

### Frontend (Vite)
- `src/main.jsx` — entry point
- `src/AppLayout.jsx` — live main layout (Outlet + OrderSidebar + CartPanel)
- `src/store/` — Zustand stores: `useStore.ts`, `authStore`, `toastStore`, `loadingStore`
- `src/components/` — Atoms, Molecules, Organisms, Forms, Templates, UI
- `src/features/` — Screens: PDV, Checkout, Settings, Reports, Login, Financial, iFood, Stock
- `src/services/` — `ipc.js`, `logger.js`, `errorService.js`
- `src/utils/` — `promotion.js` (motor de desconto)

### Database (SQLite)
- `database/db.cjs` — schema init, queries, migrations
- `database/validate.cjs` — IPC input validation
- `database/migrations/` — 6 migration files (.cjs modules)
- WAL mode: write-ahead logging para performance

### Security
- Rate limiter para `auth:verify-password` (5 tentativas → lock 15 min)
- No raw `ipcRenderer` — todo IPC passa por `ALLOWED_CHANNELS` + `validateIPC`
- `createHandler()` em `main.cjs` valida antes de executar

---

## 2. Fluxos de Dados (4 camadas)

### Camada 1: UI → Store
- Componente chama `useStore()` ou `useToastStore()`
- State mutation via actions (ex: `setNewPromo`, `updateCart`)
- Toast auto-log com type→level (error→error, warning→warn, else info)

### Camada 2: Store → IPC
- Componente chama `getIPC()` → retorna namespace da API (`window.api` via contextBridge)
- Ex: `const ipc = getIPC(); await ipc.promotions.create(promo)`
- `safeInvoke()` wrapper envia canal + args

### Camada 3: IPC → Main
- `ipcRenderer.invoke(channel, ...args)` → main process recebe
- `createHandler(channel, fn)` em `main.cjs` valida input via `validateIPC`
- Se validação falha: retorna `{ success: false, error: 'mensagem' }`
- Se passa: executa função (DB query, file ops, etc)

### Camada 4: Main → DB/Service
- `main.cjs` chama funções exportadas de `database/db.cjs`
- DB functions usam `better-sqlite3` (sync API)
- Retorna resultado para renderer via IPC

---

## 3. Decisões do Audit + Correções 08/09/2026

### 3.1 UI Deletion Audit (16 componentes removidos)
**Verificado:** `git ls-files --deleted` confirma 18 arquivos removidos (12 .jsx + 2 .js barrels + 4 assets)
- `ui/` e `templates/` directories **não existem mais**
- Barrels restantes só exportam componentes vivos
- ⚠️ 7 referências em `component-audit-report.json` e `docs/audit-report-2026-09-08.md` (artefatos de auditoria, não imports)

### 3.2 IPC Channel Consistency (4 canais)
- `app:check-unsaved-orders` → **REMOVIDO** do `ALLOWED_CHANNELS`
- `app:shutdown` → **REMOVIDO** do `ALLOWED_CHANNELS`
- `clients:get-by-phone` → **PRESENTE** em `preload.js` + `main.cjs` + `validate.cjs`
- `ifood:start-polling` → **PRESENTE** (corrigido em commit anterior)
- Testes: `ipc-channels.test.js` (8 testes passam)

### 3.3 Promotion Engine (BUY_X_GET_Y)
- `src/utils/promotion.js` criado — motor de desconto
- `CheckoutScreen.jsx` e `CheckoutModal.jsx` importam `calculateDiscount`
- `PromotionForm.jsx` mostra `Compre X Leve 1` (não `R$ value`)
- 19 testes passam (`promotion.test.js`)

### 3.4 Security
- Rate limiter: 5 tentativas → lock 15 min (`main.cjs:54-66`)
- `auth:verify-password` presente no `ALLOWED_CHANNELS`
- **Verificação encontrou:** `database/security/verify-password.js` **NÃO EXISTE** no repo

---

## 4. Verificação Segunda Onda

10 agentes de verificação (2 ondas × 5 blocos):

| Bloco | Alegação | Verificação | Verdict |
|---|---|---|---|
| 1 — UI Deletion | 16 componentes removidos | 18 removidos, todos órfãos | ✅ CORRETO |
| 2 — IPC Channels | 4 canais verificados | 4 canais corretos, 8/8 testes passam | ✅ CORRETO |
| 3 — Dependency Chain | 17 dependências | **Só 4 import edges reais** | ❌ INFLADO |
| 4 — Promotion Engine | 8 itens verificados | Todos 8 passam | ✅ CORRETO |
| 5 — Security | `verify-password.js` com PBKDF2 | **Arquivo não existe** | ❌ NÃO EXISTE |

**Conclusão:** Código funciona, gates passaram (365 testes). Documento de verificação tinha claims incorretas (17 deps, verify-password.js).

---

## 5. Arquivos de Referência (completo)

### Raiz do projeto
- `README.md` — Visão geral + setup
- `AGENTS.md` — Guidance para agentes de IA
- `caue-notes.txt` — Notas pessoais
- `structural-integrity-check.md` — Verificação estrutural pós-fix
- `component-audit-report.json` — Relatório de auditoria de componentes
- `investigation_summary.json` — Resumo de investigação
- `screen_analysis.json` — Análise de telas

### docs/
- `docs/audit-report-2026-09-08.md` — Audit completo (13 KB)
- `docs/audit-report-2026-09-08.json` — Versão JSON do audit
- `docs/color-tokens.md` — Tokens de cores
- `docs/meeting-henrique.md` — Notas de reunião
- `docs/pricing.md` — Pricing
- `docs/scope.md` — Escopo

### .omo/ (OpenCode workflows)
- `.omo/plans/` — 7 planos de feature/issue
- `.omo/notepads/` — Notas de decisões/issues/learnings/problems
- `.omo/drafts/` — Drafts de updates
- `.omo/evidence/` — Evidências de builds/testes

### .opencode/agents/
- `dev-cleaner.md` — Agente cleaner
- `qa-tester.md` — Agente QA

### .github/
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/release.yml` — Release automation
- `.github/workflows/OPTIMIZATION_PROTOCOL.md` — Protocolo de otimização
- `.github/dependency-review-config.yml` — Dependency review config

### build/
- `build/EULA.txt` — End-user license agreement
- `build/LICENSE.txt` — Licença

### Scripts (utils)
- `scripts/check-deps.cjs` — Verifica dependências críticas
- `scripts/check-native-abi.cjs` — Verifica ABI do Electron
- `scripts/generate-icons.cjs` — Gera ícones
- `scripts/log-viewer.cjs` — Viewa logs
- `scripts/prepare-assets.cjs` — Prepara assets
- `scripts/smoke-test-db.cjs` — Smoke test do DB
- `scripts/swap-native-abi.cjs` — Troca ABI (Node/Electron)

---

## 6. Configurações e Build

### Ambiente
- Node 20 (`.nvmrc`, `.node-version`)
- npm 10+
- Electron 32.3.3 (fix no workflow)
- better-sqlite3 ABI 128 (Electron) ou 127 (Node)

### Scripts npm
- `npm run dev` — Vite + Electron
- `npm run build` — Vite build (frontend)
- `npm run build:win` — Vite + electron-builder
- `npm test` — `npm run rebuild:node` + Vitest
- `npm run lint` — ESLint flat config
- `npm run typecheck` — `tsc --noEmit`
- `npm run rebuild:native` — Recompila better-sqlite3 para Electron ABI
- `npm run rebuild:node` — Recompila para Node ABI
- `npm run check:native` — Verifica ABI atual

### Vite
- Port 5173 (strictPort)
- `base: './'`
- Build: strips console/debugger, sem source maps

### CI (GitHub Actions)
- `lint-and-typecheck` → `test-node` (ABI 127) → `test-electron` (ABI 128) → `build` → `abi-guard` → `security-audit` → `dependency-review` → `summary`
- Node 22, Electron 32.3.3 fixos

---

## 7. Convenções de Código

### Componentes
- PascalCase, `.jsx`
- Atômico design: atoms → molecules → organisms
- Export via `index.js` por pasta

### Database
- `.cjs` para Node scripts
- Better-sqlite3 sync API
- WAL mode
- Queries em `database/db.cjs`

### IPC
- `contextBridge` com allowlist explícita
- Validação em `database/validate.cjs`
- `createHandler()` no main

### Testes
- Vitest + testing-library
- Arquivos: `src/tests/**/*.test.{js,jsx}`
- E2E: Playwright (Electron headless)

### Lint/Typecheck
- ESLint flat config (`eslint.config.js`)
- TypeScript strict mode
- JSX: `react-jsx`

---

## 8. Estado Atual

**Última atualização:** 08/09/2026 (correções do audit aplicadas)

### O que foi feito
- 18 arquivos removidos (UI dead code + barrels vazios)
- 3 canais IPC resolvidos (2 removidos, 1 implementado)
- `promotion.js` criado (motor de desconto)
- `ipc-channels.test.js` criado (testes de consistência)
- `promotion.test.js` criado (19 testes)
- `router.test.jsx` corrigido (mock removido)

### O que NÃO existe (confirmado na verificação)
- `database/security/verify-password.js` — não existe
- `.pm/plugins/deep-code-review.nix` — não existe
- `promoterHash` / `PBKDF2` — zero ocorrências no repo

### O que passou nos gates de QA
- `npm run lint` — 0 erros, 7 warnings (pre-existentes)
- `npm run typecheck` — limpo
- `npm test` — 365 testes / 21 arquivos PASS

### Pendências conhecidas
- `allow-scripts` no `~/.npmrc` bloqueia `npm rebuild` (política do ambiente)
- 7 referências em docs/audit-report (artefatos de auditoria, não código)
- `atoms/index.js` exporta componentes não usados (harmless)

---

**Documento gerado automaticamente.** Para atualizar: rode o script de geração ou edite manualmente.
