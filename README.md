# Açaí Wave

PDV desktop para loja de açaí — pedidos, catálogo, estoque, financeiro, relatórios e impressão de comandas.

## Stack

- **Frontend**: React 19 + Vite 8 + Tailwind CSS 4 + Zustand
- **Desktop**: Electron 32.3.3 (contextIsolation + IPC seguro via contextBridge)
- **Database**: SQLite via better-sqlite3 (WAL mode) + migrations
- **Impressão**: node-thermal-printer (TCP/IP + Windows serial)
- **Build**: electron-builder (NSIS para Windows)

## Pré-requisitos

- Node.js 20+
- npm 10+

### Windows (para desenvolvimento e build)

- **Visual Studio Build Tools** (ou VS 2022) — necessário para compilar `better-sqlite3`
- **Python 3.x** — necessário para `node-gyp`
- **Git Bash** (ou WSL) — recomendado para scripts e hooks

## Instalação

```bash
npm install        # instala dependências + recompila addons nativos para Electron ABI
```

Durante a instalação, o `postinstall` executa `electron-rebuild` para `better-sqlite3` (ABI 128 do Electron). Na primeira instalação ou após troca de versão do Node/Electron, verifique a seção [Native ABI](#native-abi).

## Desenvolvimento

```bash
npm run dev        # inicia Vite (port 5173) + Electron simultaneamente
```

`vite.config.js`: porta 5173 fixa (`strictPort: true`), host `0.0.0.0`, `base: './'`. Se a porta estiver ocupada, matar o processo anterior — não configure outra porta sem alterar o Vite config.

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Vite + Electron em paralelo |
| `npm run dev:vite` | Apenas Vite (port 5173) |
| `npm run dev:electron` | Apenas Electron (exige Vite rodando em localhost:5173) |
| `npm run build` | Vite build (frontend → dist/) |
| `npm run build:win` | Vite build + electron-builder --win --x64 (NSIS installer em release/) |
| `npm run package:win` | Apenas electron-builder (usa dist/ já-built) |
| `npm test` | Vitest (unit + integração) |
| `npm run test:ci` | Vitest run --reporter=verbose |
| `npm run test:watch` | Vitest em watch mode |
| `npm run test:coverage` | Vitest com cobertura V8 |
| `npm run test:e2e` | Playwright E2E com Electron headless |
| `npm run lint` | ESLint (src/ + database/ + scripts/) |
| `npm run typecheck` | tsc --noEmit (valida @ts-check em .cjs) |
| `npm run rebuild:native` | electron-rebuild -f -w better-sqlite3 (Electron ABI 128) |
| `npm run rebuild:node` | better-sqlite3 para Node.js corrente (ABI 127) |
| `npm run rebuild:all` | Ambos os rebuilds acima |
| `npm run check:native` | Verifica se better-sqlite3 está compilado para Electron ABI |
| `npm run swap:status` | Mostra ABI alvo atual no package-lock |
| `npm run swap:node` / `npm run swap:electron` | Alterna ABI alvo no package-lock |
| `npm run ci` | Roda lint + typecheck + test para verificação local antes do push |
| `npm run log` | Acompanha logs do app (userData/logs/structured.log) |

## Estrutura

```
src/
├── main.jsx                 # Entry point React (mount do app)
├── index.css                # CSS global + Tailwind directives
├── components/
│   ├── atoms/               # Button, Badge, Card, Input, LoadingOverlay, ProductCard, Select, Toast
│   ├── molecules/           # SettingsTab, SettingsTabs
│   ├── organisms/           # AcaiBuilderModal, CartPanel, CashModal, CheckoutModal, LoginModal,
│   │                         ManagerAuthModal, NewTableModal, OrderSidebar, PasswordModal,
│   │                         QuickBuilderModal, ReportsModal, SettingsModal
│   ├── forms/               # CategoryForm, ClientForm, FinancialForm, InventoryForm,
│   │                         ProductForm, PromotionForm, UserForm
│   ├── ErrorBoundary.jsx    # Boundary de erro global
│   └── index.js             # Barrel export (atoms + molecules + organisms + forms)
├── features/                # Features organizadas por domínio
│   ├── auth/                # LoginScreen, ChangePasswordScreen
│   ├── pdv/                 # PdvScreen, AcaiBuilderScreen, QuickBuilderScreen,
│   │                         NewTableScreen, CheckoutScreen
│   ├── reports/             # ReportsScreen
│   └── settings/            # SettingsScreen
├── layouts/                 # AppLayout (shell da aplicação)
├── router/                  # createHashRouter (authGuard, routes, index)
├── store/                   # Zustand: authStore, loadingStore, toastStore, useStore
├── services/                # IPC helper (ipc.js), logger (logger.js), errorService
├── hooks/                   # useFocusTrap
├── utils/                   # promotion.js (motor de desconto: BUY_X_GET_Y, PERCENTAGE, FIXED_AMOUNT)
├── styles/                  # theme.css (variáveis CSS)
└── tests/                   # 21 arquivos de teste (Vitest + Testing Library)
    ├── setup.js             # Setup global (jsdom, providers)
    ├── validate.test.js     # Testes de validação IPC (validate.cjs)
    ├── ipc-channels.test.js # Coerência allowlist × handlers × validadores
    ├── promotion.test.js    # Motor de desconto (19 testes)
    └── ...                  # Componentes, telas, stores, router, segurança

database/
├── db.cjs                   # Inicialização SQLite + queries (WAL mode)
├── migrate.cjs              # Roda migrations versionadas
├── validate.cjs             # Validação de entrada IPC (58+ canais, @ts-check)
├── crypto.cjs               # Utilitários criptográficos (hash de senhas)
├── logger.cjs               # Logger de estrutura (Winston)
├── adapters/                # Camadas de acesso a dados (abstraem db.cjs)
├── backups/                 # Scripts/rotinas de backup
└── migrations/
    ├── 001_initial.sql
    ├── 002_products.sql
    ├── 003_orders.sql
    ├── 004_cash.sql
    ├── 005_clients.sql
    └── 006_client_addresses.sql   # (renomeada de 005 para evitar versão duplicada)

scripts/
├── rebuild-native.cjs       # Rebuild do better-sqlite3 (Electron)
├── check-native-abi.cjs     # Verifica ABI corrente vs alvo
├── swap-native-abi.cjs      # Alterna ABI alvo no package-lock
├── check-deps.cjs           # Verifica deps críticas antes do build/test
├── smoke-test-db.cjs        # Sanity check do banco + migrations
├── log-viewer.cjs           # Visualizador de logs estruturados
├── prepare-assets.cjs       # Gera assets para build (icon, header, etc.)
├── generate-icons.cjs       # Gera ícones em múltiplas resoluções
├── generate-installer-header.cjs
├── generate-license-templates.cjs
├── validate-migrations.cjs  # Checa integridade do schema e duplicatas
├── analyze_bundle.js
├── check_dist.js
└── debug_routes.js

main.cjs                     # Electron main process: IPC handlers, auth, printer, logger
preload.js                   # contextBridge + ALLOWED_CHANNELS (allowlist explícita)
```

## IPC Security

Comunicação entre renderer e main via `contextBridge` com **allowlist explícita** de canais. Nenhum `ipcRenderer` bruto é exposto ao frontend.

Regras para adicionar um novo canal:

1. Adicionar ao `ALLOWED_CHANNELS` em `preload.js`.
2. Adicionar handler em `main.cjs`.
3. Adicionar validador em `database/validate.cjs` (ou confirmar se é canal somente-leitura sem payload).
4. O job `Lint & TypeCheck` do CI executa `tsc --noEmit` sobre `database/validate.cjs` — propriedades duplicadas ou erros de tipo falham o build.

Canais organizados em grupos: `catalog:*`, `orders:*`, `cash:*`, `reports:*`, `promotions:*`, `auth:*`, `users:*`, `inventory:*`, `financial:*`, `clients:*`, `audit:*`, `dialog:*` (PDF export), `ifood:*`, `logging:write`.

## Native ABI (better-sqlite3)

O projeto mantém dois ABI alvos: **Node.js (ABI 127)** para testes e **Electron (ABI 128)** para execução e build. Trocar entre eles requer rebuild explícito.

```bash
npm run rebuild:all      # recompila para ambos os ABIs
npm run check:native     # valida se o módulo está compilado para Electron ABI
npm run swap:status      # verifica ABI alvo atual no package-lock
npm run swap:node        # ajusta package-lock para Node ABI
npm run swap:electron    # ajusta package-lock para Electron ABI
```

CI exige `.npmrc` com `disturl=https://electronjs.org/headers` e `ELECTRON_VERSION=32.3.3`.

## Build & Releases

### Build local (Windows)

```bash
npm run build:win       # Vite + electron-builder → release/ (NSIS installer)
```

Saída: `release/`. Installer NSIS com icon em `build/icon.ico`, header em `build/installer-header.bmp`, EULA em `build/EULA.txt`.

### CI

GitHub Actions: `.github/workflows/ci.yml` (dispara em push de main/develop e tags `v*`) + `.github/workflows/release.yml` (gera Windows Installer e anexa .exe à release).

- **Push de main sem tag** → pré-release (`edge-main`) com versão baseada no commit.
- **Tag `v*`** → release oficial com versão da tag.

### Versões atuais

Última release oficial: **v1.2.0**. Pré-release contínua: **edge-main** (build automática a cada push de main que passa o CI).

## Testes

```bash
npm test                # rebuild:node + vitest run (365 testes / 21 arquivos)
npm run test:ci         # vitest run --reporter=verbose
npm run test:e2e        # Playwright + Electron headless (exige rebuild:native antes)
```

Cobertura de código via V8. O job `Tests on Node.js (ABI 127)` roda no CI; o `Tests on Electron (ABI 128)` roda em máquina Windows com Electron pré-instalado.

## Licença

Privado — uso interno.
