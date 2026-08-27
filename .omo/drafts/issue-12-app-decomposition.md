# Plan draft — issue #12 Decomposição do App.jsx

status: awaiting-approval
intent: clear
review_required: false
slug: issue-12-app-decomposition
date: 2026-08-12
issue: https://github.com/MikuBR/acai-turbo/issues/12

## Decisões tomadas (pós-exploração)
- **Rotas reais + URLs**: cada modal vira rota com path. UX muda (botão voltar funciona, sem X).
- **Guard via loader com `throw redirect('/login')`**: idiomático React Router v7.
- **Auth → useAuthStore (já existe em src/store/authStore.ts); resto dos estados locais às features.**

## Fatos verificados da codebase
- `src/features/{auth,pdv,reports,settings}/` existem mas VAZIOS.
- `src/layouts/` vazio; `src/router/` vazio.
- `src/components/templates/{MainLayout,ModalLayout}.jsx` existem (stubs) — App.jsx não os usa.
- `src/components/ui/{Divider,ScrollArea,ThemeToggle}.jsx` existem.
- `src/components/index.js` re-exporta atoms/molecules/organisms/forms/templates/ui.
- `src/store/authStore.ts` já existe: `useAuthStore(currentUser, authToken, login, logout)` — NÃO usado pelo App.jsx.
- `react-router-dom@^7.18.2` instalado, não usado.
- App.jsx = 926 linhas, ~35 useState, ~20 handlers; renderização condicional via `modals: {newTable,settings,checkout,reports,login,changePassword}`.
- Testes: src/tests/ cobre atoms + store + db + validate + logger. Setup: `@testing-library/jest-dom`. Sem testes de App.jsx nem de modais.
- main.jsx: mounta `<App/>` sob StrictMode + ErrorBoundary.
- Configs: vitest ({js,jsx} em src/tests/**, jsdom, globals); eslint flat config; tsconfig strict.
- IPC: preload.js allowlist; getIPC em src/services/ipc.js e duplicado em App.jsx.

## Mapeamento das "telas" (extração → feature)
- **auth**: LoginModal, PasswordModal, ManagerAuthModal → `src/features/auth/` (+ login screen, change-password screen, manager-auth route)
- **pdv**: catálogo/mesas/carrinho/builder/checkout/newTable → `src/features/pdv/` (PDVScreen + AcaiBuilder, QuickBuilder, Checkout, NewTable como rotas ou sub-componentes)
- **settings**: SettingsModal (produtos,categorias,promoções,usuários,estoque,financeiro,clientes,impressoras,ifood) → `src/features/settings/` (SettingsScreen)
- **reports**: ReportsModal → `src/features/reports/` (ReportsScreen)
- **layout com sidebar** → `src/layouts/AppLayout.jsx` (envolta das rotas autenticadas; consome OrderSidebar)

## Not used / guardrails (Must-NOT-Have)
- NÃO mover os 30+ useState de pdv/settings/reports para stores globais (exceto auth). Manter locais nas features.
- NÃO adicionar lazy/suspense (não pedido).
- NÃO alterar main.cjs/preload.js/db.cjs (changes são renderer-only).
- NÃO mudar a API IPC nem os channels.
- NÃO introduzir data fetching via loader do react-router para dados de negócio (só auth guard usa loader).

## Verification
- npm run lint + npm run typecheck + npm test (zero regressão).
- Smoke: npm run dev (Electron abre, login funciona, navegacao entre rotas funciona, checkout fecha e volta, settings abre, reports abre, iFood listeners ativos).
- Novos testes: router config + auth guard redirect + AppLayout render.

## Approval gate
Awaiting user explicit okay to write the plan file at .omo/plans/issue-12-app-decomposition.md.
