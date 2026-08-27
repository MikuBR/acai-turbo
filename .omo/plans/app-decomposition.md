# app-decomposition - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** O aplicativo Açaí Wave terá navegação por rotas em vez de uma única página gigante: tela de login separada, tela principal do PDV, e páginas dedicadas para Configurações e Relatórios — tudo preservando o mesmo comportamento de hoje.

**Why this approach:** O App.jsx atual é um monolito de 926 linhas, com 60 estados e dezenas de handlers em um único componente. Separar em rotas com React Router (usando hash routing para funcionar tanto no dev quanto no Electron empacotado) torna cada parte independente, testável e prepara o terreno para a issue #13 (testes E2E). Escolhemos manter modais rápidos (checkout, nova comanda, montagem de açaí) como overlays em vez de rotas — são interações breves que não justificam troca de URL.

**What it will NOT do:** NÃO adiciona nenhuma funcionalidade nova. NÃO muda a lógica de login, permissões ou persistência de sessão (ainda não persiste entre reinícios). NÃO altera o backend. NÃO converte modais rápidos em rotas.

**Effort:** Large
**Risk:** Medium - refatoração estrutural de arquivo central sem cobertura de testes nos organismos, mitigada por preservar 100% do comportamento e validar com testes existentes (Zustand store) + novos testes de ProtectedRoute/authStore.
**Decisions I made for you:** HashRouter em vez de BrowserRouter (necessário para Electron file://). Login vira rota dedicada em vez de modal. Settings e Reports viram rotas aninhadas (não telas isoladas). modais rápidos continuam overlays. Estado de auth sai do useState para um store Zustand dedicado (necessário para ProtectedRoute e LoginScreen compartilharem estado sem prop-drilling).

Your next move: run a high-accuracy review (recommended — questa refatoração é grande) ou execute direto com `/start-work`. Full execution detail follows below.

---

> TL;DR (machine): Large effort, Medium risk — decompor App.jsx monolítico (926 linhas) em rotas React Router (HashRouter) com ProtectedRoute, authStore Zustand, e 4 features extraídas (auth, pdv, settings, reports); preserva 100% do behavior, sem alterar backend; 9 todos em 4 waves, com review de alta precisão obrigatório.

## Scope
### Must have
- `react-router-dom` instalado e `RouterProvider` configurado em `src/main.jsx` substituindo o render direto de `<App />`
- Diretório `src/router/` com definição de rotas (`createBrowserRouter` ou `createHashRouter` — ver nota 1 abaixo)
- Diretório `src/layouts/` com `AppLayout.jsx` (sidebar + outlet) e `AuthLayout.jsx` (wrapper simples para login)
- Diretório `src/features/` com subdiretórios `auth/`, `pdv/`, `settings/`, `reports/`
- `ProtectedRoute.jsx` em `src/router/` que renderiza `<Navigate to="/login" />` quando `currentUser` é null
- Tela de login extraída para `src/features/auth/LoginScreen.jsx` (rota `/login`)
- Tela PDV principal extraída para `src/features/pdv/PdvScreen.jsx` (rota `/`, protegida) — sidebar + catálogo + carrinho
- Settings extraído para rota aninhada `/settings` (protegida, dentro de AppLayout)
- Reports extraído para rota aninhada `/reports` (protegida, dentro de AppLayout)
- Store de autenticação Zustand em `src/store/authStore.ts` com `currentUser`, `authToken`, `login()`, `logout()` — compartilhado entre LoginScreen, ProtectedRoute e PdvScreen
- Helper `getIPC()` extraído de `App.jsx` para `src/services/ipc.js` (módulo reutilizável)
- `App.jsx` reduzido a um componente raiz mínimo que monta o `RouterProvider`
- `npm test` passa sem alteração nos testes existentes (`store.test.js`, testes de atoms)
- Novo teste para `ProtectedRoute`: redireciona para `/login` quando não autenticado, renderiza children quando autenticado
- Novo teste para `authStore`: login/logout atualizam `currentUser` corretamente
- `npm run lint` e `npm run typecheck` passam

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NÃO mudar nenhum comportamento funcional: lógica de login, logout, permissões, limpeza de token no mount, fluxo de pedidos, iFood, impressão — tudo deve permanecer idêntico
- NÃO persistir sessão entre reinícios (preservar linha 553: `localStorage.removeItem('authToken')` no mount). A issue #13 (E2E) pode abordar isso depois
- NÃO converter modais rápidos em rotas: NewTableModal, CheckoutModal, AcaiBuilderModal, QuickBuilderModal, PasswordModal, ManagerAuthModal continuam como overlays
- NÃO adicionar novas funcionalidades, bibliotecas além de `react-router-dom`, ou mudar estilos/CSS
- NÃO alterar o backend (`main.cjs`, `database/`, `preload.js`) — esta refatoração é puramente frontend
- NÃO renomear ou alterar os componentes organisms/atoms/molecules/forms existentes — apenas mudar quem os importa
- NÃO quebrar `npm run build` (Vite precisa resolver os novos imports)
- NÃO adicionar lazy loading / code splitting nesta fase — estrutura primeiro, performance depois

### Notas de decisão (do diálogo de aprovação)
1. **HashRouter vs BrowserRouter**: Como o app roda em Electron carregando `dist/index.html` via `file://` (quando empacotado) ou `http://localhost:5173` (dev), usar `createHashRouter` — BrowserRouter quebra em `file://` porque não há servidor para resolver rotas. HashRouter funciona em ambos os ambientes.
2. **Rotas aninhadas**: `/settings` e `/reports` viram rotas filhas de um layout compartilhado (`AppLayout` com `<OrderSidebar>` + `<Outlet>`), não telas isoladas. Modais rápidos continuam como overlays dentro de `PdvScreen`.
3. **authStore**: Estado de auth sai do `useState` do App para um store Zustand dedicado, permitindo que `ProtectedRoute` e `LoginScreen` acessem o mesmo estado sem prop-drilling. `useStore` (mesas/catálogo) permanece inalterado.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after (refatoração estrutural — testes existentes devem continuar passando; novos testes para ProtectedRoute e authStore seguem padrão TDD após implementação)
- Framework: Vitest + Testing Library (jsdom, já configurado em `vitest.config.js`)
- Evidence: `.omo/evidence/ulw/app-decomposition/task-<N>/` — cada task grava output de `npm test`, `npm run lint`, `npm run typecheck`, e screenshots se aplicável
- Comandos de verificação por task:
  - `npm test` (deve passar: 0 failures, testes existentes + novos)
  - `npm run lint` (0 errors em `src/`)
  - `npm run typecheck` (0 errors)
  - `npm run build` (Vite build deve completar sem erros)

## Execution strategy
### Parallel execution waves
> Wave 1 (fundação): instalar router, criar stores/services, estrutura de diretórios. Wave 2 (extração de telas): paralelizar extração dos 3 módulos. Wave 3 (wiring): montar rotas, App.jsx raiz, main.jsx. Wave 4 (testes): novos testes + verificação completa.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. Instalar react-router-dom | — | 3,4,5,6,8 | 2 |
| 2. Criar authStore + extrair getIPC para ipc.js | — | 4,5,6 | 1 |
| 3. Criar ProtectedRoute + AuthLayout | 1 | 8 | 4,5,6 |
| 4. Extrair LoginScreen para /login | 2,3 | 8 | 5,6 |
| 5. Extrair PdvScreen para / (sidebar+catálogo+carrinho) | 2 | 7,8 | 4,6 |
| 6. Extrair SettingsScreen para /settings (rota aninhada) | 2 | 8 | 4,5 |
| 7. Extrair ReportsScreen para /reports (rota aninhada) + AppLayout | 5 | 8 | 6 |
| 8. Montar router em main.jsx + reduzir App.jsx a raiz | 3,4,5,6,7 | 9 | — |
| 9. Testes novos (ProtectedRoute + authStore) + verificação completa | 8 | F1-F4 | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Instalar react-router-dom e criar estrutura de diretórios
  What to do / Must NOT do: Instalar `react-router-dom` como dependency (NÃO devDependency — o bundle de produção precisa). Criar diretórios vazios `src/router/`, `src/layouts/`, `src/features/auth/`, `src/features/pdv/`, `src/features/settings/`, `src/features/reports/`. NÃO criar arquivos ainda — só estrutura. Confirmar que `package.json` tem `react-router-dom` em `dependencies`.
  Parallelization: Wave 1 | Blocked by: — | Blocks: 3,4,5,6,8 | Paralelizável com: 2
  References: `package.json:6` (`"type": "module"`), `package.json:24-33` (dependencies atuais), `src/main.jsx` (entrypoint atual)
  Acceptance criteria: `npm ls react-router-dom` retorna versão instalada; `ls src/router src/layouts src/features/auth src/features/pdv src/features/settings src/features/reports` confirma diretórios existem.
  QA scenarios: happy — `npm install` completa sem erros; failure — remover react-router-dom deve falhar build. Evidence: `.omo/evidence/ulw/app-decomposition/task-1/install.log`
  Commit: Y | feat(router): instalar react-router-dom e criar estrutura de diretórios

- [ ] 2. Criar authStore (Zustand) e extrair getIPC para src/services/ipc.js
  What to do / Must NOT do: Criar `src/store/authStore.ts` exportando um store Zustand com estado `{ currentUser: null, authToken: null }` e actions `{ login: (user, token) => void, logout: () => void }`. A action `login` faz `set({ currentUser: user, authToken: token })`; a action `logout` faz `set({ currentUser: null, authToken: null })`. NÃO incluir lógica de IPC dentro do store — ela fica no componente que chama o store. Extrair a função `getIPC()` de `src/App.jsx:56-71` para um módulo `src/services/ipc.js` exportando `getIPC` (mesma implementação, usando `window.electron`). NÃO alterar `src/store/useStore.ts` (mesas/catálogo) nem `toastStore`/`loadingStore`. NÃO remover `getIPC` do App.jsx ainda (task 8 fará a limpeza final).
  Parallelization: Wave 1 | Blocked by: — | Blocks: 4,5,6 | Paralelizável com: 1
  References: `src/App.jsx:56-71` (getIPC atual), `src/App.jsx:47-51` (estado auth atual), `src/store/useStore.ts` (padrão Zustand do projeto), `src/store/toastStore.js:1-4` (padrão de import/criação de store), `src/App.jsx:486-499` (handleLogin: chama auth:login, setCurrentUser, setAuthToken, localStorage), `src/App.jsx:509-518` (handleLogout: setCurrentUser null, setAuthToken null, localStorage.remove)
  Acceptance criteria: `npm run typecheck` passa (0 errors). `src/store/authStore.ts` existe com `currentUser`, `authToken`, `login`, `logout`. `src/services/ipc.js` existe e exporta `getIPC`. Importar ambos não causa erro.
  QA scenarios: happy — novo teste `src/tests/authStore.test.js` cria store, chama `login({id:1,role:'admin'},'token123')`, asserta `currentUser.id === 1` e `authToken === 'token123'`; chama `logout()`, asserta `currentUser === null`. failure — store vazio sem login deve ter `currentUser === null`. Tool: `npx vitest run src/tests/authStore.test.js`. Evidence: `.omo/evidence/ulw/app-decomposition/task-2/authStore.test.log`
  Commit: Y | refactor(auth): criar authStore Zustand e extrair getIPC para serviço

- [ ] 3. Criar ProtectedRoute e AuthLayout
  What to do / Must NOT do: Criar `src/router/ProtectedRoute.jsx` — componente que lê `currentUser` do `authStore`, se null renderiza `<Navigate to="/login" replace />`, senão renderiza `children`. Pode aceitar prop opcional `requiredRole` (admin/manager) que checa `currentUser.role` — se não tem role, renderiza `<Navigate to="/" replace />` (não bloqueia com erro, só redireciona). Criar `src/layouts/AuthLayout.jsx` — wrapper simples com `<div className="flex h-screen bg-surface"> <Outlet /> </div>` para a tela de login (mesma estética de fundo escuro atual). NÃO usar React Router `useNavigate` para auth checks — usar `<Navigate>` declarativo para evitar efeitos colaterais.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 8 | Paralelizável com: 4,5,6
  References: `src/App.jsx:47` (currentUser null = não logado), `src/App.jsx:794` (`modals.login` true inicial), `src/App.jsx:556-568` (hasPermission e roles), `src/components/ErrorBoundary.jsx` (padrão de componente do projeto)
  Acceptance criteria: `npm run typecheck` passa. `ProtectedRoute` renderiza `<Navigate>` quando `currentUser` é null. `AuthLayout` renderiza `<Outlet>`. 
  QA scenarios: happy — novo teste `src/tests/ProtectedRoute.test.jsx` mocka authStore com `currentUser: {id:1,role:'admin'}`, renderiza `<ProtectedRoute><div>content</div></ProtectedRoute>` dentro de `<MemoryRouter>`, asserta que `content` aparece. failure — mocka authStore com `currentUser: null`, asserta que renderiza `Navigate` (texto do destino `/login` ou usa `data-testid`). Tool: `npx vitest run src/tests/ProtectedRoute.test.jsx`. Evidence: `.omo/evidence/ulw/app-decomposition/task-3/ProtectedRoute.test.log`
  Commit: Y | feat(router): criar ProtectedRoute e AuthLayout

- [ ] 4. Extrair LoginScreen para /login
  What to do / Must NOT do: Criar `src/features/auth/LoginScreen.jsx` — tela full-screen (não modal) que contém o mesmo formulário do `LoginModal` atual (`src/components/organisms/LoginModal.jsx:1-88`) mas como página independente, centrada na tela (reutilizar o layout visual do LoginModal: logo, inputs usuário/senha, botão Entrar). Esta tela DEVE conter a lógica `handleLogin` atual (`src/App.jsx:474-507`): chamar `ipc.invoke('auth:login', loginForm)`, em sucesso chamar `useAuthStore.getState().login(res.user, res.token)` + `localStorage.setItem('authToken', res.token)` + `if (res.user.must_change_password) navigate('/change-password')` senão `navigate('/')`. Em erro, setar `loginError` local. Importar `getIPC` de `src/services/ipc.js`. NÃO reusar o componente `LoginModal` diretamente como modal — criar uma tela (sem o overlay `fixed inset-0`). NÃO alterar `LoginModal.jsx` (pode ser removido na task 8). Preservar exatamente a lógica de mostrar/ocultar senha (`showPwd`), estados `isLoggingIn`, `loginError`, e `must_change_password`.
  Parallelization: Wave 2 | Blocked by: 2,3 | Blocks: 8 | Paralelizável com: 5,6
  References: `src/App.jsx:474-507` (handleLogin — lógica completa), `src/components/organisms/LoginModal.jsx:1-88` (UI do login atual — inputs, showPassword, error display), `src/App.jsx:47-51` (loginForm, loginError, isLoggingIn states), `src/services/ipc.js` (getIPC extraído na task 2), `src/store/authStore.ts` (login action da task 2)
  Acceptance criteria: `npm run typecheck` passa. `LoginScreen.jsx` existe em `src/features/auth/`. Importa `getIPC` de `src/services/ipc.js`. Importa `useAuthStore` de `src/store/authStore`. Contém `handleLogin` com mesma lógica do App.jsx atual.
  QA scenarios: happy — testa render: `LoginScreen` renderiza inputs de usuário e senha e botão Entrar, dentro de `<MemoryRouter>`. failure — submeter form vazio mostra erro "Preencha todos os campos". Tool: `npx vitest run`. Evidence: `.omo/evidence/ulw/app-decomposition/task-4/LoginScreen.test.log`
  Commit: Y | feat(auth): extrair LoginScreen para rota /login

- [ ] 5. Extrair PdvScreen para / (sidebar + catálogo + carrinho + modais rápidos)
  What to do / Must NOT do: Criar `src/features/pdv/PdvScreen.jsx` — a tela principal do PDV. Contém o JSX atual do App.jsx return (linhas 716-920): `<OrderSidebar>` + área central (search + categorias + grid de produtos + botão Montagem) + `<CartPanel>` + TODOS os modais rápidos que continuam como overlays: NewTableModal, AcaiBuilderModal, QuickBuilderModal, CheckoutModal, PasswordModal, ManagerAuthModal. Esta tela gerencia TODOS os estados de PDV locais (`useState`s de builder, simpleBuilder, modals, searchTerm, selectedCategory, tableType, newTableName, delivForm, reportData, cashMove, etc. das linhas 39-124), TODOS os handlers (handleAddTable, handleItemSelect, handleFinalize, etc.), e TODOS os useEffects (syncDB, loadPrinterConfig, loadIfoodConfig, ifood listeners das linhas 411-472). Importar `getIPC` de `src/services/ipc.js` e `useAuthStore` para logout (botão Sair da OrderSidebar). Manter `useStore` (mesas/catálogo) e `toastStore`/`loadingStore` exatamente como estão. NÃO incluir Settings nem Reports aqui — eles viram rotas aninhadas (tasks 6 e 7). NÃO alterar nenhum componente importado (OrderSidebar, CartPanel, ProductCard, modais). O botão de Settings da OrderSidebar (`onOpenSettings`) muda de `runWithManagerAuth(() => setModals({settings:true}))` para `runWithManagerAuth(() => navigate('/settings'))` usando `useNavigate`. O botão de Reports (`onOpenReports`) muda de `setModals({reports:true})` para `navigate('/reports')`. Preservar `runWithManagerAuth`, `runWithAuth`, `hasPermission`, `isAuthValid`, `calculateDiscount`, `playBeep` exatamente como estão. Preservar a limpeza de token no mount (`useEffect(() => { localStorage.removeItem('authToken'); }, [])` linha 551-554).
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 7,8 | Paralelizável com: 4,6
  References: `src/App.jsx:716-920` (JSX completo do return — estrutura visual), `src/App.jsx:39-124` (todos os useState de PDV), `src/App.jsx:126-410` (playBeep, syncDB, loadUsers, loadInventory, loadFinancialAccounts, loadClients, loadReports, loadPrinterConfig, savePrinterConfig, loadIfoodConfig, saveIfoodConfig, handleTestIfoodConnection, handleIfoodAction), `src/App.jsx:411-472` (useEffects), `src/App.jsx:474-518` (handleLogin/logout — mas logout fica aqui com adaptação para authStore), `src/App.jsx:551-606` (hasPermission, runWithAuth, runWithManagerAuth, isAuthValid), `src/App.jsx:608-714` (handleAddTable, handleItemSelect, toggleRemoval, handleFinalize), `src/components/organisms/OrderSidebar.jsx` (props que PdvScreen deve passar), `src/components/organisms/CartPanel.jsx` (props), `src/services/ipc.js` (getIPC), `src/store/authStore.ts` (logout action)
  Acceptance criteria: `npm run typecheck` passa. `PdvScreen.jsx` existe em `src/features/pdv/`. Contém o JSX do sidebar + catálogo + carrinho. Importa `useNavigate` de `react-router-dom`. Botões de settings/reports chamam `navigate('/settings')` e `navigate('/reports')` respectivamente. `npm run build` completa sem erros de import.
  QA scenarios: happy — render PdvScreen dentro de `<MemoryRouter>` com mock de authStore (`currentUser: {id:1,role:'admin'}`), asserta que `<OrderSidebar>`, `<CartPanel>` e grid de produtos aparecem. failure — sem catalog mockado, deve mostrar "Nenhum produto disponível". Tool: `npx vitest run`. Evidence: `.omo/evidence/ulw/app-decomposition/task-5/PdvScreen.test.log`
  Commit: Y | feat(pdv): extrair PdvScreen principal para rota / protegida

- [ ] 6. Extrair SettingsScreen para /settings (rota aninhada)
  What to do / Must NOT do: Criar `src/features/settings/SettingsScreen.jsx` — tela de configurações. Esta tela contém toda a lógica de settings atualmente passada como props ao `SettingsModal` (`src/App.jsx:828-881`). Em vez de um modal overlay (`fixed inset-0`), esta tela é uma página dentro do `AppLayout` (com sidebar visível ao fundo). Renderizar o mesmo conteúdo do SettingsModal (tabs: products, promotions, inventory, financial, clients, printer, ifood, users) mas como página full. Importar `getIPC` de `src/services/ipc.js`. Os datos de catálogo, categories, promotions, users, inventory, financial, clients, printer config ficam como estado local desta tela OU (preferível) a maior parte já está no `useStore` ou pode ser carregada via IPC dentro da tela (loadUsers, loadInventory, loadFinancialAccounts, loadClients). NÃO alterar `SettingsModal.jsx` nem os forms (ProductForm, CategoryForm, PromotionForm, UserForm, InventoryForm, etc.) — eles são reutilizados como children. Preservar `runWithAuth`, `pwdForm`, `savePrinterConfig`, `saveIfoodConfig`, `handleTestIfoodConnection` exatamente. O botão de voltar/close muda para `navigate('/')`.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 8 | Paralelizável com: 4,5
  References: `src/App.jsx:828-881` (props atuais do SettingsModal — lista exaustiva), `src/App.jsx:160-168` (loadUsers), `src/App.jsx:170-189` (loadInventory), `src/App.jsx:201-214` (loadFinancialAccounts), `src/App.jsx:216-228` (loadClients), `src/App.jsx:279-311` (loadPrinterConfig, savePrinterConfig), `src/App.jsx:570-576` (runWithAuth), `src/components/organisms/SettingsModal.jsx` (componente atual — adaptar de modal para page), `src/App.jsx:94` (settingsTab state), `src/App.jsx:97-124` (todos os states de settings: users, newUser, inventory, financial, clients, printer, ifood)
  Acceptance criteria: `npm run typecheck` passa. `SettingsScreen.jsx` existe em `src/features/settings/`. Renderiza conteúdo de configurações (tabs). Tem botão de navegação de volta via `useNavigate('/')`. Importa `getIPC` de `src/services/ipc.js`.
  QA scenarios: happy — renderiza SettingsScreen dentro de `<MemoryRouter>` com mock authStore admin, asserta que tabs de configurações aparecem. failure — sem permissões de manager, deve redirecionar. `npm run build` sem erros. Tool: `npx vitest run` + `npm run build`. Evidence: `.omo/evidence/ulw/app-decomposition/task-6/SettingsScreen.test.log`
  Commit: Y | feat(settings): extrair SettingsScreen para rota aninhada /settings

- [ ] 7. Criar AppLayout e extrair ReportsScreen para /reports (rota aninhada)
  What to do / Must NOT do: Criar `src/layouts/AppLayout.jsx` — layout que renderiza `<OrderSidebar>` (com handlers de navegação para /settings e /reports, botão Sair) e `<Outlet />` (React Router) no espaço central. A sidebar neste layout usa `useNavigate` em vez de callbacks prop. O estado de mesas vem do `useStore`. Criar `src/features/reports/ReportsScreen.jsx` — tela de relatórios com a mesma lógica do `ReportsModal` atual (`src/App.jsx:792-808`). Contém `loadReports()`, `loadAdvancedReport()`, `loadFinancialSummary()`, estado de `reportData`, `ordersHistory`, `cashMove`, `reportPeriod`, `advancedReportData`, `financialSummary`. Botão de voltar via `navigate('/')`. Renderiza o conteúdo do ReportsModal como página (não overlay). Importar `getIPC` de `src/services/ipc.js`. NÃO alterar `ReportsModal.jsx`. Preservar todos os handlers de relatório. AppLayout NÃO renderiza o CartPanel — só sidebar + outlet (Reports e Settings são telas focadas, sem carrinho).
  Parallelization: Wave 3 | Blocked by: 5 | Blocks: 8 | Paralelizável com: 6
  References: `src/App.jsx:792-808` (props atuais do ReportsModal), `src/App.jsx:230-267` (loadReports, loadAdvancedReport, loadFinancialSummary), `src/App.jsx:84-89` (reportData, ordersHistory, cashMove, reportPeriod, advancedReportData, financialSummary states), `src/App.jsx:570-606` (runWithAuth, runWithManagerAuth — botão Reports precisa de auth), `src/components/organisms/OrderSidebar.jsx:18-119` (sidebar para adaptar), `src/components/organisms/ReportsModal.jsx` (componente atual — adaptar de modal para page)
  Acceptance criteria: `npm run typecheck` passa. `AppLayout.jsx` existe em `src/layouts/` com `<OrderSidebar>` + `<Outlet />`. `ReportsScreen.jsx` existe em `src/features/reports/`. Importa `getIPC`. `npm run build` sem erros.
  QA scenarios: happy — renderiza AppLayout dentro de `<MemoryRouter>`, asserta que sidebar + conteúdo do outlet aparecem. failure — sem auth, ProtectedRoute redireciona. Tool: `npx vitest run` + `npm run build`. Evidence: `.omo/evidence/ulw/app-decomposition/task-7/AppLayout.test.log`
  Commit: Y | feat(layouts): criar AppLayout e extrair ReportsScreen para /reports

- [ ] 8. Montar router em main.jsx e reduzir App.jsx a raiz (HashRouter)
  What to do / Must NOT do: Criar `src/router/index.js` (ou `.jsx`) exportando `createHashRouter` com rotas: `{ path: '/login', element: <AuthLayout><LoginScreen /></AuthLayout> }`, `{ element: <ProtectedRoute />, children: [{ path: '/', element: <PdvScreen /> }, { path: '/settings', element: <SettingsScreen /> }, { path: '/reports', element: <AppLayout><ReportsScreen /></AppLayout> }] }` — IMPORTANTE: settings e reports ficam aninhadas dentro de AppLayout que fica dentro de ProtectedRoute. Usar `createHashRouter` (NÃO `createBrowserRouter` — file:// no Electron empacotado quebra BrowserRouter). Atualizar `src/main.jsx` para renderizar `<RouterProvider router={router} />` em vez de `<App />` (manter `<StrictMode>` e `<ErrorBoundary>` envolvendo o RouterProvider). Reduzir `src/App.jsx` para um arquivo vazio ou removê-lo — se mantido, só reexporta de router. Limpar imports não usados do App.jsx. Configurar redirect: rota raiz sem match → `<Navigate to="/login" />`. NÃO remover `LoginModal.jsx`, `SettingsModal.jsx`, `ReportsModal.jsx` — deixar no diretório organism (podem ser úteis e removê-los pode quebrar imports do index.js). Confirmar que `npm run build` (Vite) completa sem erros de resolução de imports.
  Parallelization: Wave 3 | Blocked by: 3,4,5,6,7 | Blocks: 9 | Paralelizável com: —
  References: `src/main.jsx:1-13` (entrypoint atual — estrutura StrictMode/ErrorBoundary/App), `src/services/ipc.js` (getIPC), `src/store/authStore.ts` (authStore), `src/router/ProtectedRoute.jsx` (task 3), `src/layouts/AuthLayout.jsx` (task 3), `src/layouts/AppLayout.jsx` (task 7), `src/features/auth/LoginScreen.jsx` (task 4), `src/features/pdv/PdvScreen.jsx` (task 5), `src/features/settings/SettingsScreen.jsx` (task 6), `src/features/reports/ReportsScreen.jsx` (task 7), `package.json:67-93` (build config do Electron — appId, asarUnpack, files inclui dist/), `vite.config.js` (base: './' — compatível com HashRouter)
  Acceptance criteria: `npm run build` completa sem erros. `main.jsx` renderiza `RouterProvider`. `src/router/index.js` existe com `createHashRouter`. Rotas `/login`, `/`, `/settings`, `/reports` definidas. `npm test` passa (store tests + novos). `npm run lint` passa. `npm run typecheck` passa.
  QA scenarios: happy — `npm run build` produz `dist/index.html` + assets sem erro. `npm run dev` inicia e Vite compila. failure — BrowserRouter (não Hash) deve quebar em file:// (não usar). Tool: `npm run build && npm run dev`. Evidence: `.omo/evidence/ulw/app-decomposition/task-8/build.log`
  Commit: Y | feat(router): montar HashRouter em main.jsx e reduzir App.jsx a raiz

- [ ] 9. Testes novos + verificação completa (todos os testes existentes + novos)
  What to do / Must NOT do: Criar/atualizar testes novos: `src/tests/authStore.test.js` (testa login/logout do store), `src/tests/ProtectedRoute.test.jsx` (testa redirect quando não autenticado e render quando autenticado). Executar verificação completa: `npm test` (deve incluir testes antigos de store + novos — 0 failures), `npm run lint` (0 errors em src/ + database/), `npm run typecheck` (0 errors), `npm run build` (completa sem erros). Confirmar que `src/tests/store.test.js` (mesas/catálogo) passa sem alteração — ele não deve notar a refatoração. Confirmar que testes de atoms (Badge, Button, Card, Input) passam sem alteração. NÃO alterar testes existentes para fazê-los passar — se quebraram, a refatoração introduziu regressão que deve ser corrigida (não mascarada).
  Parallelization: Wave 4 | Blocked by: 8 | Blocks: F1-F4 | Paralelizável com: —
  References: `vitest.config.js:6-24` (config: jsdom, globals, setupFiles, coverage include), `src/tests/store.test.js` (testes existentes — devem passar), `src/tests/setup.js` (setup global), `src/tests/validate.test.js`, `src/tests/db.test.js`, `src/tests/logger.test.js` (outros testes existentes)
  Acceptance criteria: `npm test` — 0 failed, todos os testes passam (existentes + novos). `npm run lint` — 0 errors. `npm run typecheck` — 0 errors. `npm run build` — completa. `src/tests/authStore.test.js` e `src/tests/ProtectedRoute.test.jsx` existem.
  QA scenarios: happy — TODOS os comandos passam (test, lint, typecheck, build). failure — se qualquer teste existente falha, há regressão que deve ser corrigida antes de concluir. Tool: `npm test && npm run lint && npm run typecheck && npm run build`. Evidence: `.omo/evidence/ulw/app-decomposition/task-9/verify-all.log`
  Commit: Y | test(router): adicionar testes para authStore e ProtectedRoute + verificação completa

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Verificar: todas as rotas definidas (/login, /, /settings, /reports)? authStore criado? getIPC extraído? ProtectedRoute funciona? App.jsx reduzido a raiz? main.jsx usa RouterProvider? Nenhum backend alterado? Comando: `grep -r "createBrowserRouter" src/` deve retornar 0 matches (HashRouter sim, BrowserRouter não).
- [ ] F2. Code quality review
  Verificar: nenhum import não usado, nenhum console.log遗留, componentes extráidos mantêm memoização (OrderSidebar e CartPanel ainda usam `memo`), nenhum arquivo >250 LOC de lógica pura sem justificativa. Comando: `npm run lint` 0 errors. Confirmar que `src/App.jsx` foi reduzido (deve ter <30 linhas ou removido).
- [ ] F3. Real manual QA
  Verificar: `npm run dev` inicia Vite + Electron, janela abre, tela de login aparece (não modal), login funciona (admin/admin123), tela PDV aparece com sidebar + catálogo + carrinho, botão Settings navega para /settings, botão Reports navega para /reports, voltar retorna ao PDV, logout volta para login. Comando: `npm run dev` (manual, gravar screenshot ou descrição).
- [ ] F4. Scope fidelity
  Verificar: NENHUMA funcionalidade nova adicionada. Mesmas permissões. Token ainda limpo no mount (grep `localStorage.removeItem('authToken')` em PdvScreen ou raiz). Modais rápidos (NewTable, Checkout, builders, Password, ManagerAuth) ainda são overlays. Comando: `grep -rn "localStorage.removeItem" src/` confirma limpeza preservada.

## Commit strategy
Um commit por task (9 commits totais). Cada commit usa prefixo convencional: `feat(router:)`, `feat(auth:)`, `feat(pdv:)`, `feat(settings:)`, `feat(layouts:)`, `refactor(auth:)`, `test(router:)`. Branch: `feat/app-decomposition` (ou conforme convenção do repo). Não fazer squash — histórico granular ajuda no review e na issue #13 (E2E).

## Success criteria
1. `npm test` — 0 failures (testes existentes + novos: authStore, ProtectedRoute)
2. `npm run lint` — 0 errors
3. `npm run typecheck` — 0 errors
4. `npm run build` — completa sem erros, `dist/index.html` gerado
5. `src/App.jsx` reduzido a <30 linhas ou removido
6. Rotas funcionando: `/login` (login), `/` (PDV protegido), `/settings` (config aninhada), `/reports` (relatórios aninhados)
7. Nenhum arquivo de backend (`main.cjs`, `database/*`, `preload.js`) modificado
8. Nenhum componente organism/atom/molecule/form alterado — apenas quem os importa
9. Token ainda limpo no mount (behavior preservado)
10. Estrutura de diretórios: `src/router/`, `src/layouts/`, `src/features/{auth,pdv,settings,reports}/`
