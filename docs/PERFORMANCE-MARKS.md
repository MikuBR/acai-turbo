# Performance Marks — Operações Críticas Instrumentadas

Este documento descreve todas as operações críticas do frontend que foram instrumentadas com `performance.mark()` e `performance.measure()` para visibilidade no DevTools Performance tab.

## Serviço de Performance

**Arquivo:** `src/services/performance.ts`

O serviço utiliza a API nativa do browser (`PerformanceObserver`, `performance.mark()`, `performance.measure()`) sem dependências externas. Todas as marks usam o prefixo `acai:`.

### Web Vitals monitorados automaticamente

| Métrica | Descrição | Threshold (warning) | Threshold (critical) |
|---------|-----------|---------------------|----------------------|
| TTFB | Time to First Byte | 600ms | 1000ms |
| FCP | First Contentful Paint | 1800ms | 3000ms |
| LCP | Largest Contentful Paint | 2500ms | 4000ms |
| FID | First Input Delay | 100ms | 300ms |
| CLS | Cumulative Layout Shift | 0.1 | 0.25 |
| INP | Interaction to Next Paint | 200ms | 500ms |

---

## Operações Instrumentadas

### 1. App Startup (`main.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:app:startup:start` | Início do bootstrap da aplicação (antes do `createRoot`) |
| `acai:app:startup:end` | Fim do primeiro render |

**Medida:** `app:startup:start` → `app:startup:end` — Tempo total de inicialização do app.

---

### 2. Route Transitions (`LazyRoute.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:route:{path}:start` | Início da transição de rota (path anterior) |
| `acai:route:{path}:end` | Fim da transição de rota (path atual) |

**Medida:** `route:{prev}:start` → `route:{current}:end` — Tempo de transição entre rotas.

---

### 3. Auth Guard (`authGuard.js`)

| Marks | Descrição |
|-------|-----------|
| `acai:auth:guard:start` | Início da verificação de autenticação |
| `acai:auth:guard:end` | Fim da verificação (sucesso ou redirect) |

**Medida:** `auth:guard:start` → `auth:guard:end` — Tempo de verificação de auth.

---

### 4. Login (`LoginScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:login:start` | Início do processo de login |
| `acai:login:end` | Fim do login (sucesso ou erro) |

**Medida:** `login:start` → `login:end` — Tempo total de autenticação.

---

### 5. PDV — Carregamento de Produtos (`PdvScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:products:load:start` | Início do carregamento de produtos e categorias |
| `acai:products:load:end` | Fim do carregamento |

**Medida:** `products:load:start` → `products:load:end` — Tempo de carregamento do catálogo.

---

### 6. Change Password (`ChangePasswordScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:change-password:start` | Início da troca de senha |
| `acai:change-password:end` | Fim da troca (sucesso ou erro) |

**Medida:** `change-password:start` → `change-password:end` — Tempo de troca de senha.

---

### 7. Settings — Mount (`SettingsScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:settings:mount:start` | Início do mount da tela de configurações |
| `acai:settings:mount:end` | Fim do mount (dados carregados) |

**Medida:** `settings:mount:start` → `settings:mount:end` — Tempo de inicialização da tela de settings.

---

### 8. Settings — Sync DB (`SettingsScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:settings:sync:start` | Início da sincronização com o banco |
| `acai:settings:sync:end` | Fim da sincronização |

**Medida:** `settings:sync:start` → `settings:sync:end` — Tempo de sync do banco de dados.

---

### 9. Reports — Mount (`ReportsScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:reports:mount:start` | Início do mount da tela de relatórios |
| `acai:reports:mount:end` | Fim do mount |

**Medida:** `reports:mount:start` → `reports:mount:end` — Tempo de inicialização da tela de relatórios.

---

### 10. Reports — Load (`ReportsScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:reports:load:start` | Início do carregamento dos relatórios |
| `acai:reports:load:end` | Fim do carregamento |

**Medida:** `reports:load:start` → `reports:load:end` — Tempo de carregamento dos dados.

---

### 11. Checkout (`CheckoutScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:checkout:start` | Início do processo de checkout |
| `acai:checkout:end` | Fim do checkout (online ou offline) |

**Medida:** `checkout:start` → `checkout:end` — Tempo total de finalização do pedido.

---

### 12. App Bootstrap (`AppLayout.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:app:bootstrap:start` | Início do bootstrap do layout principal |
| `acai:app:bootstrap:end` | Fim do bootstrap (dados sincronizados) |

**Medida:** `app:bootstrap:start` → `app:bootstrap:end` — Tempo de inicialização do layout.

---

### 13. Acai Builder — Confirm (`AcaiBuilderScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:acai-builder:confirm:start` | Início da confirmação do build de açaí |
| `acai:acai-builder:confirm:end` | Fim da confirmação |

**Medida:** `acai-builder:confirm:start` → `acai-builder:confirm:end` — Tempo de confirmação do build.

---

### 14. Quick Builder — Confirm (`QuickBuilderScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:quick-builder:confirm:start` | Início da confirmação do build rápido |
| `acai:quick-builder:confirm:end` | Fim da confirmação |

**Medida:** `quick-builder:confirm:start` → `quick-builder:confirm:end` — Tempo de confirmação do build rápido.

---

### 15. New Table — Add (`NewTableScreen.tsx`)

| Marks | Descrição |
|-------|-----------|
| `acai:new-table:add:start` | Início da adição de mesa |
| `acai:new-table:add:end` | Fim da adição |

**Medida:** `new-table:add:start` → `new-table:add:end` — Tempo para adicionar mesa.

---

## Como visualizar

1. Abra o Chrome DevTools (F12)
2. Vá para a aba **Performance**
3. Clique em **Record** (ou Ctrl+E)
4. Execute a operação desejada (login, navegação, checkout, etc.)
5. Pare a gravação
6. Procure as marks com prefixo `acai:` na timeline
7. As medidas aparecem como entradas `measure` com a duração em ms

## Hook Auxiliar

**Arquivo:** `src/hooks/usePerformanceMark.ts`

```tsx
import { usePerformanceMark } from '../hooks/usePerformanceMark'

function MyComponent() {
  const { mark, measure } = usePerformanceMark()

  const handleAction = () => {
    mark('my-action:start')
    // ... operação ...
    mark('my-action:end')
    const duration = measure('my-action:start', 'my-action:end')
  }
}
```
