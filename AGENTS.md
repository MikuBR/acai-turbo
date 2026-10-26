# Açaí Wave — AGENTS.md

PDV desktop para loja de açaí (Electron 32.3.3 + React 19 + Vite 8 + Tailwind 4 + Zustand 5 + better-sqlite3 + Sentry + Vitest + Playwright).
Repo: `MikuBR/acai-turbo` (package `acai-wave`, productName `Açaí Wave`). Caminho local: `/home/caue/Dev/repos/acai-turbo`.

## Setup

```bash
cd /home/caue/Dev/repos/acai-turbo
npm install          # postinstall: electron-builder install-app-deps + install-sqlite-bindings.cjs (rebuild nativo)
```

Node 20+ e npm 10+. Na Windows: Visual Studio Build Tools + Python 3.x (para node-gyp / better-sqlite3).

## Dev

```bash
npm run dev          # Vite + Electron em paralelo (concurrently)
npm run dev:vite     # só Vite
npm run dev:electron # só Electron (exige Vite já rodando em localhost:5173)
```

`vite.config.js`: porta 5173 base, mas `strictPort: false` + `tryPorts: [5173, 5174, 5175]` (fallback automático quando a porta principal está ocupada). `base: './'`, host `0.0.0.0`.

Build de produção: `drop_console` + `drop_debugger` via Terser (passes: 2). Source maps são **gerados** (`sourcemap: true`) mas **não publicados no bundle** — enviados ao Sentry via `@sentry/vite-plugin`.

## Build & package

```bash
npm run build        # vite build → dist/
npm run build:win    # vite build + electron-builder --win --x64 --publish never
npm run package:win  # só electron-builder (usa dist/ já-built)
```

Saída em `release/` (installer NSIS). Assets do instalador vêm de `build/`.

## Test

```bash
npm run test          # install-sqlite-bindings.cjs + vitest run
npm run test:ci       # vitest run --reporter=verbose
npm run test:watch    # install-sqlite-bindings.cjs + vitest (watch)
npm run test:coverage # install-sqlite-bindings.cjs + vitest run --coverage
```

E2E (Playwright): não há script npm — rode manualmente:
```bash
npm run rebuild:native                     # ABI do Electron (128) antes de E2E
npx playwright test --config e2e/playwright.config.ts
```
Specs: `e2e/*.spec.ts` (Electron headless, 1 worker). Exige o binding do Electron rebuildado antes (`rebuild:native`).

Vitest: `src/tests/`, cobertura V8. CI roda `npm test -- --coverage --reporter=verbose` (Node ABI 127).

## Lint & typecheck

```bash
npm run lint        # eslint src/ database/ scripts/
npm run typecheck   # tsc --noEmit
```

`tsconfig.json`: `strict`, `jsx: react-jsx`, `include: ["src", "database", "main.cjs", "preload.js", "vite.config.js"]`, `exclude: ["node_modules", "dist", "src/tests"]`.

## Native ABI (better-sqlite3) — crítico

Árvore tem dois ABI alvos: Node.js (ABI 127) e Electron (ABI 128). Trocar entre eles requer rebuild explícito:

```bash
npm run rebuild:node   # better-sqlite3 para Node.js corrente (testes)
npm run rebuild:native # electron-rebuild para Electron (ABI 128) (app + e2e)
npm run rebuild:all    # ambos

npm run swap:node      # ajusta package-lock ABI para Node
npm run swap:electron  # ajusta package-lock ABI para Electron
npm run swap:status    # mostra estado atual do ABI no lockfile

npm run check:node     # require('better-sqlite3') + log da ABI
npm run check:native    # valida ABI do Electron
```

CI exige `.npmrc` com `disturl=https://electronjs.org/headers` e `NODE_VERSION: '22'` + `ELECTRON_VERSION=32.3.3` no workflow. O job `abi-guard` falha se a versão do Electron no `package.json` != 32.3.3.

Credencial GitHub (publish/release): guardada em `~/.env.acai-turbo` (`GITHUB_PERSONAL_ACCESS_TOKEN`).

## Estrutura do projeto

```
src/
  components/
    atoms/             # Button, Badge, Input, Select, ProductCard, Card, Toast, etc. (.tsx)
    molecules/         # ModalHeader, ModalFooter, SettingsTabs, AdjustStockModal, etc.
    organisms/
      reports/         # Tipos de relatório individuais (SalesReport, DeliveryReport, etc.)
      ReportsPage.tsx   # Página de relatórios dedicada (full-page, não modal)
      ReportsModal.tsx  # Backward-compat: re-export de ReportsPage
      CartPanel, OrderSidebar, AcaiBuilderModal, CashModal, etc.
    forms/             # ProductForm, ClientForm, UserForm, CategoryForm, etc.
    ErrorBoundary.tsx
    SentryFeedbackButton.tsx
    SentryFeedbackWidget.tsx
  features/
    auth/              # LoginScreen, ChangePasswordScreen
    pdv/               # PdvScreen, CheckoutScreen, AcaiBuilderScreen, QuickBuilderScreen, NewTableScreen
    reports/           # ReportsScreen (route → ReportsPage)
    settings/          # SettingsScreen
  store/               # Zustand: useStore.ts, authStore.ts, loadingStore.js, toastStore.js
  styles/              # theme.css (variáveis CSS — Tailwind + modo escuro/grafite)
  hooks/               # useFocusTrap, useOnlineStatus, usePerformanceMark, usePreloadRoute, useTheme
  services/            # ipc.js, logger.js, catalog.ts, productCache.ts, permissions.ts, offlineQueue.ts,
                        # reports-pdf.ts (geração de PDF extraída), sentry.js, sourcemaps.ts, etc.
  types/               # index.ts (User, Order, Product, etc.)
  App.tsx, main.tsx, index.css
  tests/               # vitest + testing-library (excluído do tsconfig)
database/
  db.cjs               # init + queries SQLite (WAL mode)
  db-binding.cjs       # binding para Electron
  logger.cjs           # winston multi-transport (console dev, structured.log info, errors.log error, JSON)
  validate.cjs         # validação IPC allowlist (421 linhas)
  migrate.cjs          # engine de migrações (lock, backup, rollback, validação)
  crypto.cjs           # AES-256-GCM para secrets
  migrations/001-initial-schema.cjs  # schema base (18 tabelas)
  migrations/002-add-permutas.cjs
  migrations/003-add-mixed-payments.cjs
  migrations/004-encrypt-sensitive-config.cjs
  migrations/005-add-cash-sessions.cjs
main.cjs               # Electron main process (IPC handlers, createHandler pattern)
preload.js             # contextBridge + channel allowlist
e2e/
  playwright.config.ts
  ifood-integration.spec.ts  # único E2E spec
scripts/
  install-sqlite-bindings.cjs  # gerencia ABI (Node 127 + Electron 128)
  swap-native-abi.cjs
  generate-icons.cjs, generate-installer-header.cjs, generate-license-templates.cjs
  prepare-assets.cjs, log-viewer.cjs
```

**Schema principal (18 tabelas):** categorias, produtos, pedidos, itens (order_items), order_payments, caixa (cash_movements), cash_sessions, config, promoções, users, user_sessions, audit_logs, inventory, inventory_movements, financial_accounts, financial_transactions, clients, client_orders, product_price_history, ifood_pending_orders.

Colunas relevantes: `orders.is_delivery` (1=delivery, 0=retirada), `orders.is_exchange` (1=permuta), `orders.payment_method` (DINHEIRO/PIX/DÉBITO/CRÉDITO/PERMUTA/MISTO), `orders.payment_status` (PENDING/PAID).

## Convensões de código

- **CSS/Tailwind**: classes diretas no JSX (sem CSS modules). Tema em variáveis CSS em `src/styles/theme.css`; paleta grafite/cinza, verde sucesso, vermelho erro.
- **Componentes**: padrão atomic design em `src/components/` (atoms → molecules → organisms → forms). Extensão `.tsx` (PascalCase). Não usa barrel exports (`index.js`) — importação direta por caminho.
- **IPC**: contextBridge com allowlist explícita em `preload.js`. Validação em `database/validate.cjs`. Handlers no `main.cjs` via `createHandler(channel, fn, opts?)`. Padrão de resposta: `{ data, success, error }`.
- **Frontend IPC**: `getIPC()` de `src/services/ipc.js` — `invoke(channel, ...args)`, com fallback `{ success: false, error }` em falha.
- **Database**: better-sqlite3 sync, WAL mode, `database/db.cjs`. Migrações aditivas (nunca editar migration aplicada).
- **Nomes**: componentes PascalCase `.tsx`, scripts `.cjs`, stores Zustand camelCase.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`), branches a partir de `main`/`develop`.
- **Bug fix → teste de regressão obrigatório** em `src/tests/` (regra permanente: todo bug/problema corrigido deve vir acompanhado de teste de regressão, para precaver erros repetidos ou volta de bugs).
- **Reports**: página dedicada (`/reports` → `ReportsScreen` → `ReportsPage`) com tipos individuais: Vendas, Promoções Ativas, Delivery, Produtos Cadastrados, Contas a Pagar/Pagas. PDF extraído para `src/services/reports-pdf.ts`.

## Diretrizes de codação

Práticas gerais de programação para todos os contribuidores. Formato `situação → o que fazer` quando aplicável.

### Antes de codar
- Requisito ambíguo → declare suposições ou pergunte; múltiplas interpretações → apresente-as.
- Leia o código existente → siga convenções do projeto (estilo, estrutura, libs).
- Solução mais simples → prefira; sem abstrações para necessidades hipotéticas.
- Mudança pequena e focada → nada fora do escopo.
- Tarefa grande → planeje + divide em etapas verificáveis.

### Ao escrever
- Funções curtas, uma responsabilidade, nomes descritivos.
- Valide toda entrada externa (usuário, rede, arquivos, APIs).
- Trate erros explicitamente: não engula exceções, não retorne null/vazio em silêncio.
- Evite estado global mutável; prefira funções puras e imutabilidade.
- Feche recursos (arquivos, conexões, listeners); considere race conditions.
- Nunca coloque segredos no código; use variáveis de ambiente.
- SQL → queries parametrizadas; escape de saída (XSS, injeção de comandos).

### Eficiência
- Meça antes de otimizar (profiling, não intuição).
- Evite N+1 queries, I/O em loops, recomputação desnecessária.
- Em I/O e rede: paginação, batch e timeouts.

### Verificação (obrigatória)
- Execute o código de fato.
- Teste casos de borda: vazio, nulo, limites, unicode, fuso horário.
- Todo bug corrigido → teste de regressão em `src/tests/`.
- Rode linter, formatter e checagem de tipos.
- Revise o diff: remova debug, código morto, mudanças fora do escopo.

### Depuração
- Reproduza mínima → hipótese → uma variável por vez → causa raiz.

### Anti-alucinação
- Não invente bibliotecas, funções, flags ou APIs; confirme na versão instalada.
- Sem certeza → diga e verifique.
- Código gerado (mesmo por agente) nunca é presumido correto: leia, rode, teste.

## Relatórios (arquitetura pós-refatoração)

A rota `/reports` renderiza uma **página full-page** (não modal overlay) com 5 tipos de relatório individuais:

| Tipo | IPC channel | DB function | Dados principais |
|---|---|---|---|
| Vendas | `reports:daily` / `reports:by-period` | `getDailyReport` / `getReportByPeriod` | sales (pagamento/delivery), permutas, topProducts, peakHours, ticketAverage, cashMovements, cashSessions |
| Promoções Ativas | `reports:promotions-for-period` | `getPromotionsForPeriod` | promoções ativas no período |
| Delivery | `reports:delivery-orders` (novo) | `getDeliveryOrders` (nova) | pedidos is_delivery=1 com items + payments |
| Produtos Cadastrados | `reports:catalog` (novo) | `getCatalogReport` (nova) | produtos + estoque + categoria |
| Contas a Pagar e Pagas | `reports:financial-detailed` (novo) | `getFinancialAccountsDetailed` (nova) | payable/receivable × pending/paid |

- `ReportTypeSelector` — navegação por tiles (sales, promotions, delivery, catalog, financial)
- `SalesReport` — itens vendidos, ticket médio, horários de pico, permutas; histórico com estorno (`orders:delete`) preservado
- PDF via `reports-pdf.ts` → `dialog:save-pdf` (base64 + validação 1KB–50MB)
- Caixa (gaveta entrada/sangria via `cash:register`) e cash sessions são ações operacionais, não tipos de relatório

## CI (GitHub Actions)

`.github/workflows/ci.yml` — jobs: `lint-and-typecheck`, `test-node` (ABI 127, `npm test -- --coverage --reporter=verbose`), `test-electron` (ABI 128, `check:native`), `build`, `abi-guard`, `security-audit`, `dependency-review`, `summary`.
- Node 22, Electron 32.3.3 fixos.
- `abi-guard` falha se `package.json` electron version != 32.3.3 ou `.npmrc` ausente/inválido.
- CI roda `eval()`/`new Function()` scanner + alerta `dangerouslySetInnerHTML`.
- E2E (Playwright) **não** é executado no CI — apenas validação local.

## Pitfalls

- **Native modules quebrados após troca de Node/Electron**: rodar `npm run rebuild:all` (ou `rebuild:node` para testes, `rebuild:native` para app/e2e) antes de testar.
- **`strictPort: false`**: Vite tenta 5173 → 5174 → 5175 automaticamente. Se todas ocupadas, mate o processo anterior.
- **E2E necessita Electron rebuildado**: antes de `npx playwright test`, garantir `npm run rebuild:native` (ABI do Electron, não Node).
- **Windows-only packaging**: `build:win` requer NSIS; no Linux CI o build job gera apenas o frontend (`vite build`).
- **Commits após swap:abi**: `swap-native-abi.cjs` altera `package-lock.json` — commite o lockfile.
- **`generate:*` assets**: ícones/header/EULA vêm de `npm run generate:icons|generate:header|generate:license` e `npm run prepare:assets` — não editar à mão.
- **Credenciais**: não logar/expor senhas. `database/db.cjs` faz hash bcrypt (cost 10).
- **`npm run log`**: acompanha `userData/logs/structured.log`.
- **`dialog:save-pdf` size limit**: base64 > 2MB é rejeitado no `main.cjs` handler (linha ~713).

## Logging

- **Main process**: `database/logger.cjs` (winston) — console em dev, `structured.log` (info), `errors.log` (error), formato JSON. Env `CONTEXTO_DE_LOGGING` (`development` → debug + console; caso contrário info).
- **Renderer**: `src/services/logger.js` — `withScope()` factory; encaminha via IPC `logging:write`; fallback para console quando `window.electron` ausente (ex.: Vitest/jsdom).
- **User-action logging**: toasts auto-log com type→level (error→error, warning→warn, else info — `src/store/toastStore.js`); `ErrorBoundary` registra component stacks (`src/components/ErrorBoundary.tsx`); `createHandler` registra sucesso+erro com `channel`+`userId` (`main.cjs`).
- **Log dir override**: `CONTEXTO_LOGGING_DIR` sobrescreve o diretório de logs para `npm run log` (default `userData/logs`; ver `scripts/log-viewer.cjs` e `.env.example`).
- **Comando**: `npm run log` (últimas 50 linhas de `structured.log`).
- **Canal IPC**: `logging:write` (allowlist em `preload.js`, validado em `database/validate.cjs`).
