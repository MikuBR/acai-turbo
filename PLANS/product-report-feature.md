# Feature: Relatório de Vendas por Produto — Açaí Wave

**Versão alvo:** v1.3.7 (próximo patch após v1.3.6)
**Prioridade:** Média
**Aba sugerida:** Dentro do ReportsModal existente (não nova tela)

> **Nota de mercado (17/09/2026):** Antes de implementar, investigou-se o que vendedores do nicho açaí/PDV esperam em relatórios PDF diários. PDVs especializados (NoxMob) e PDVs gerais (PDV Loja, Alterdata, Mais PDV) prometem "todos os números" — vendas, ticket médio, clientes, itens mais vendidos, formas de pagamento, sessões de caixa. Relatórios diários de restaurantes (Scribd, KwickOS, DineOpen, Toast, Smartsheet) padrão: revenue by channel, payment method breakdown, average check, compare to yesterday, delivery vs. pickup. O padrão do dono de loja: quer saber em 5 segundos se o dia foi bom ou ruim, sem vasculhar seções. Isso gerou as extensões de PDF na seção 11+ deste plano.


---

## 1. O que a feature faz

Dentro do ReportsModal atual — que já mostra relatório financeiro com período, top produtos e histórico de pedidos — adicionar
uma seção "Por Produto" que, ao selecionar um produto do cardápio, mostra:

- **Ficha do produto**: nome, preço atual, categoria
- **Vendas totais do produto** (no período selecionado, ou "hoje" se sem período):
  - Quantidade vendida (unidades)
  - Receita total (soma dos preços de venda)
  - Valor médio por unidade (receita / qtde)
  - % do total de vendas do período que esse produto representa (receita do produto ÷ total geral)
- **Evolução por dia** (gráfico ou tabela): para cada dia do período, quanto o produto vendeu (qtde + receita)
- **Formas de pagamento predominantes**: mêmes dados de vendas agrupados por payment_method para os pedidos que contêm esse produto
- **Lanhou em quais pedidos**: lista dos pedidos (nº, cliente, data, forma pagamento, outros itens do pedido) que continham esse produto — útil para saber quem comprou
- **Botão Exportar PDF**: gera PDF focado no produto (estilo relatório financeiro mas com seção de produto)

Tudo no estilo já existente do modal: mesma paleta, mesmas estilis, mesmas convenções.

---

## 2. Onde entrar no código

### Frontend (renderer)

**Arquivo modificado:** `src/components/organisms/ReportsModal.jsx`

- Adicionar estado: `selectedProduct` (null ou objeto { id, name, price, category })
- Adicionar estado: `productReportData` (null ou objeto com os dados calculados)
- Adicionar seletor de produto no sidebar esquerdo (abaixo de "Produtos Mais Vendidos" ou ao lado de "Filtrar por Período")
- Adicionar seção de relatório por produto na área principal (à direita), com layout semelhante à seção "Produtos Mais Vendidos (Período)"
- Adaptar `generatePDF()` para aceitar seção de produto e gerar página extra quando `selectedProduct` estiver definido
- Adaptar `handleExportPDF` para incluir dados do produto no PDF

**Arquivo criado (opcional, se ficar grande):** `src/utils/productReport.js` — funções de formatação de dados de produto (pontuação, % do total, etc.)

### Backend (main process)

**Arquivo modificado:** `database/db.cjs`

Adicionar exports:
- `getProductById(id)` — já existe? Não encontrei. Criar: `SELECT * FROM products WHERE id = ?`
- `getProductByName(name)` — opcional, útil para buscar por nome no seletor
- `getProductSalesReport(productId, startDate, endDate)` — query agregada para o relatório
- `getProductSalesByDay(productId, startDate, endDate)` — evolução diária (para gráfico/tabela)
- `getOrdersContainingProduct(productId, startDate, endDate)` — quais pedidos vendiam esse produto

**Arquivo modificado:** `main.cjs`

- Registrar novos handlers IPC para os canais de relatório por produto (ex: `reports:product-sales`, `reports:product-orders`)
- Validar que o usuário tem permissão (role admin/manager — ou qualquer um com `view_reports`; operador tem `view_reports` conforme `hasPermission` atual)

### Preload

**Arquivo modificado:** `preload.js`

- Adicionar canais na `ALLOWED_CHANNELS` para os novos IPCs
- Adicionar namespace `reports.product` (ou `reports.productSales`, etc.) no objeto `api`
- Adicionar ao `legacyIpc` se necessário (geralmente não, já que usa invoke via `safeInvoke`)

---

## 3. Modelo de dados em uso

### Como os pedidos são armazenados hoje

- **`orders`**: `id`, `customer_name`, `total`, `original_total`, `discount`, `promotion_id`,
  `promotion_name`, `payment_method`, `is_delivery`, `address`, `phone`, `is_exchange`,
  `exchange_for`, `total_paid`, `payment_status`, `created_at`
- **`order_items`**: `id`, `order_id`, `product_name` (STRING — nome como estava no momento da venda,
  não FK!), `price` (preço cobrado naquela linha), `notes`, `category`
- **`products`**: `id`, `name`, `price`, `category`, `ingredients`

### Implicação importante

Como `order_items.product_name` é uma string salva no momento da venda (não um ID de produto),
o relatório por produto precisa tomar uma decisão de identidade:

**Opção A (simples, rápida):** Usar `product_name` como chave de identidade. O seletor de produto
mostra os produtos do catálogo (`getProducts()`), mas o relatório filtra por `product_name = ?`
nos `order_items`. Se o nome do produto mudou desde uma venda antiga, aquela venda é de um produto
"antigo" com nome diferente — aparece como produto separado se houver venda com nome diferente.

**Opção B (robusta, mas mais trabalho):** Adicionar coluna `product_id INTEGER` em `order_items`
( FK para `products.id`) via nova migration, e migrar dados existentes (nome → id pelo `products.name`).
Permitiria histórico preciso mesmo se produto mudar de nome.

**Recomendação:** Começar com Opção A para validar a feature rápido (v1.3.7). Opção B pode vir depois
se o problema de nomes mudados for relevante.

### Querys necessárias (SQL)

Todas filtradas por `product_name = ?` (Opção A) e período `startDate`/`endDate` opcionais.

```sql
-- 1. Receita, qtde, média
SELECT
  COUNT(*) AS qty,
  SUM(oi.price) AS total_revenue,
  AVG(oi.price) AS avg_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_name = ?
  AND o.is_exchange = 0
  AND datetime(o.created_at, 'localtime') >= datetime(?, 'localtime')
  AND datetime(o.created_at, 'localtime') <= datetime(?, 'localtime');

-- 2. Por dia (evolução)
SELECT
  date(o.created_at, 'localtime') AS day,
  COUNT(*) AS qty,
  SUM(oi.price) AS revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_name = ?
  AND o.is_exchange = 0
  AND datetime(o.created_at, 'localtime') >= datetime(?, 'localtime')
  AND datetime(o.created_at, 'localtime') <= datetime(?, 'localtime')
GROUP BY day
ORDER BY day;

-- 3. Por forma de pagamento
SELECT
  o.payment_method,
  COUNT(DISTINCT o.id) AS orders_count,
  SUM(oi.price) AS revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_name = ?
  AND o.is_exchange = 0
  AND datetime(o.created_at, 'localtime') >= datetime(?, 'localtime')
  AND datetime(o.created_at, 'localtime') <= datetime(?, 'localtime')
GROUP BY o.payment_method;

-- 4. Pedidos que continham o produto (para "lanhou em")
SELECT DISTINCT
  o.id AS order_id,
  o.customer_name,
  o.payment_method,
  o.created_at,
  o.total AS order_total
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_name = ?
  AND o.is_exchange = 0
  AND datetime(o.created_at, 'localtime') >= datetime(?, 'localtime')
  AND datetime(o.created_at, 'localtime') <= datetime(?, 'localtime')
ORDER BY o.created_at DESC;
```

---

## 4. Componentes no ReportsModal

### Seletor de produto (sidebar esquerdo)

Após os botões "Hoje" / "Período", adicionar:

```
┌─────────────────────────────────────┐
│ Produto                             │
│ [select com os produtos do catálogo]│
│ (opcional: "Todos" = relatório geral)│
└─────────────────────────────────────┘
```

Quando um produto é selecionado:
- Sidebar mostra a ficha do produto (nome, preço, categoria)
- Modal direito muda de "Produtos Mais Vendidos" para "Relatório: {nome do produto}"
- Exibe: qtde, receita total, % do total, tabela de evolução diária, pagamentos, pedidos

### Renderização condicional

O modal pode estar em 3 modos:

| Modo | `advanceReportData` | `selectedProduct` | Conteúdo principal |
|------|---------------------|-------------------|--------------------|
| Hoje | null | null | Resumo de vendas do dia + histórico de pedidos |
| Período | populado | null | Métricas avançadas + top products + pedidos do período |
| Produto | (descartado) | populado | Relatório específico do produto + pedidos que o continham |

Realmente, o modo "produto" não precisa de `advanceReportData` — ele consulta os dados dele próprio.
Pode subscrever o요 `isPeriodView` e usar `startDate`/`endDate` diretamente.

### Exemplo de UI para a seção de produto

```
┌──────────────────────────────────────────────────────┐
│ Relatório: Açaí 500ml (Direito a 4 Adicionais)     │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Preço atual: R$ 20.00 │ Categoria: COPOS DE AÇAÍ │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ 47 vendas │ │ R$ 940,00│ │ R$ 20,00 │ │ 8,5%     ││
│ │ (qtde)   │ │(receita) │ │(média)   │ │(particip)││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                      │
│ Evolução diária (últimos 30 dias):                  │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 17/09 ─ 2 vendas ─ R$ 40,00  ████                │ │
│ │ 16/09 ─ 1 venda  ─ R$ 20,00  ██                  │ │
│ │ 15/09 ─ 0 vendas ─ R$ 0,00                     │ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Formas de pagamento:                                │
│ ┌──────────────────────────────────────────────────┐ │
│ │ DINHEIRO   ─ 30 pedidos ─ R$ 600,00             │ │
│ │ CARDINAL   ─ 12 pedidos ─ R$ 240,00             │ │
│ │ iFood      ─ 5 pedidos  ─ R$ 100,00             │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Pedidos que continham este produto (top 10):        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ #1234 ─ João Silva ─ 17/09 ─ DINHEIRO ─ R$ 20,00│ │
│ │ #1231 ─ Maria S.  ─ 16/09 ─ CARDINAL ─ R$ 20,00│ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ [Exportar PDF do Produto]                           │
└──────────────────────────────────────────────────────┘
```

---

## 5. Adaptação do PDF

O `generatePDF()` atual já aceita 7 parâmetros:
`generatePDF(data, isPeriodView, financialSummary, reportPeriod, storeInfo, allOrders, promotions)`

Para o relatório por produto, adicionar parâmetro opcional:
`generatePDF(data, isPeriodView, financialSummary, reportPeriod, storeInfo, allOrders, promotions, productReport)`

Quando `productReport` for passado (objeto com `{ productName, qty, totalRevenue, avgPrice, dailyData, payments, orders }`):
- Adicionar seção no PDF: "RELATÓRIO DE PRODUTO — {nome}"
- Mesma formatação que as outras seções (tabela com header, linha de totais)

O `handleExportPDF` precisará coletar os dados do produto antes de chamar `generatePDF` — similar ao
que já faz com `resStoreInfo`/`resOrders`/`resPromos`:
- Chamar novo IPC `reports:product-sales` com `{ productName, startDate, endDate }`
- Incorporar no `productReport` passado ao `generatePDF`

---

## 6. Plano de implementação (passo a passo)

### Passo 1 — Backend: query functions em db.cjs
Adicionar:
```javascript
function getProductSalesReport(productName, startDate, endDate) {
  // retorna { qty, totalRevenue, avgPrice }
}
function getProductSalesByDay(productName, startDate, endDate) {
  // retorna [{ day, qty, revenue }, ...]
}
function getOrdersContainingProduct(productName, startDate, endDate) {
  // retorna [{ order_id, customer_name, payment_method, created_at, order_total }, ...]
}
```

### Passo 2 — Backend: IPC handlers em main.cjs
Registrar:
- `reports:product-sales` → `getProductSalesReport(name, start, end)`
- `reports:product-daily` → `getProductSalesByDay(name, start, end)`
- `reports:product-orders` → `getOrdersContainingProduct(name, start, end)`

Cada um com validação de input (`validateIPC` ou equivalente) e tratamento de erro.

### Passo 3 — Preload: canais e api
- Adicionar 3 canais em `ALLOWED_CHANNELS`
- Adicionar methods em `api.reports` (ex: `productSales`, `productDaily`, `productOrders`)
- Não precisa de namespace separado, pode ir em `reports.*`

### Passo 4 — Frontend: ReportsModal — seletor de produto
- Adicionar `selectedProduct` state
- Adicionar `loadProducts()` para popular o select (usa `ipc.invoke('catalog:get-products')`)
- Renderizar select no sidebar, abaixo dos botões Hoje/Período

### Passo 5 — Frontend: ReportsModal — seção de relatório do produto
- Quando `selectedProduct` definido:
  - Chamar os 3 IPCs em paralelo (`Promise.all`)
  - Calcular `% do total` comparando com o total geral do período (que pode vir do `getReportByPeriod` também, ou calcular localmente)
  - Renderizar cards (qtde, receita, média, %), tabela diária, pagamentos, pedidos
  - Botão "Exportar PDF do Produto" que chama `handleExportPDF` com os dados do produto

### Passo 6 — PDF: incluir seção de produto
- Adaptar `generatePDF` para incluir `productReport` na seção adequada
- Adaptar `handleExportPDF` para buscar dados do produto via IPC antes de gerar PDF

### Passo 7 — Tests (opcional, se houver tempo)
- Adicionar teste em `src/tests/ReportsScreen.test.jsx` ou novo `ProductReport.test.jsx` para o select e a renderização da seção
- Testar backend: `db.test.js` ou novo teste para as queries de produto

### Passo 8 — Release
- Bumped versão 1.3.6 → 1.3.7
- Commit + tag + push + GitHub Release

---

## 7. Alternativas consideradas

### Alternativa A: Nova tela `ProductReportScreen.jsx` com roteamento
**Vantagem:** Isolamento total, não polui o ReportsModal.
**Desvantagem:** Mais código (novo componente, novo roteamento, mais estado, mais IPCs), menos coerente com
o fluxo atual (o ReportsModal já tem papel de "central de relatórios"). Recuperar menos valor do código existente.

**Decisão:** Não — manter no ReportsModal.

### Alternativa B: Relatório por produto dentro do ReportsScreen (não modal)
**Vantagem:** Simples.
**Desvantagem:** O ReportsScreen deixa tudo no modal; mover para o componente pai exigiria reestruturar o
controle de estado. Mais trabalho para menos ganho.

**Decisão:** Não.

### Alternativa C: Usar o seletor de Período e filtrar os "top products" do período por produto
**Vantagem:** Mínimo de código — reutilizar `topProducts` existente e filtrar por nome.
**Desvantagem:** `topProducts` tem LIMIT 10 — se o produto não está no top 10, não aparece. O usuário
quer ver UM produto específico, não os top. Não satisfaz o requisito.

**Decisão:** Não — usar como complemento (filtrar `allOrders` localmente pelo nome do produto é possível,
mas não é confiável porque `order_items` não está exposto diretamente via IPC atual).

---

## 8. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| `product_name` como string — nome mudado = produto "diferente" nas vendas | Médio | Ao selecionar produto, mostrar aviso se houver vendas com nome antigo; permitir busca por nome parcial |
| Muitas vendas = PDF grande | Baixo | Já existe guard de 2MB no `handleExportPDF`; PDF de produto tende a ser menor que relatório geral |
| Permissão de operador (view_reports) vs. acesso a todos os dados | Médio | Reutilizar `hasPermission('view_reports')` — operador já consegue ver relatórios hoje; produto é relatório |
| Select com muitos produtos (catálogo grande) | Baixo | Select normal HTML — lida com 100+ opções sem problema |

---

## 9. Dependências

- `getProducts()` já existe em `db.cjs` e já está exposto via IPC (`catalog:get-products`) — usa o canal existente para popular o select
- `getReportByPeriod()` já existe — pode ser reutilizado para obter o total geral do período (para calcular %)
- `getDailyReport()` já existe — pode ser usado para "hoje" em vez de reconstruir
- `generatePDF()` e `handleExportPDF` já funcionam — adaptar, não reescrever

**Nenhuma nova dependência de biblioteca.**

---

## 10. Critério de aceitação

- [ ] Usuário logado vê botão "Relatórios" no menu → abre ReportsModal
- [ ] Dentro do modal, há um select "Produto" com os produtos do catálogo
- [ ] Ao selecionar um produto, a área principal mostra:
  - [ ] Nome, preço, categoria do produto
  - [ ] Cards: qtde vendida, receita total, preço médio, % do total
  - [ ] Tabela de evolução diária (dia, qtde, receita)
  - [ ] Formas de pagamento (lista: método, # pedidos, receita)
  - [ ] Pedidos que continham o produto (lista limitada, com nº, cliente, data, pagamento)
- [ ] Botão "Exportar PDF" gera PDF com seção de produto incluída
- [ ] Funciona para período "hoje" e "período personalizado"
- [ ] Funciona para roles admin, manager e operator (com view_reports)
- [ ] Erros de IPC (sem conexão, produto não encontrado, período inválido) mostram toast apropriado
- [ ] Tsc e lint passam

---

## 11. Extensão de PDF — tornar o relatório mais completo (investigação de mercado)

### 11.1 O que o mercado de PDV para loja de açaí / restaurantes espera em relatório PDF diário

**Fontes consultadas:**
- NoxMob Gourmet (PDV específico para açaí): "todos os números da loja — vendas, ticket médio, clientes"
- PDV Loja / Alterdata / Mais PDV (PDVs gerais): totais, quantidades, formas de pagamento, itens mais vendidos, sessões de caixa, fechamento de caixa
- Restaurant Daily Sales Reports (Scribd, KwickOS, DineOpen, Toast, template.net): revenue by channel, payment method breakdown, average check/ticket, covers, compare to yesterday/last week, labor hours, delivery vs. pickup
- Smartsheet: KPIs de vendas diários — receita, número de clientes, valor médio do pedido

**O que o dono de uma loja de açaí realmente quer ver no PDF (priorizado pelo valor para decisão de negócio):**

| Prioridade | O que é | Por que importa | Já temos? |
|------------|---------|-----------------|-----------|
| P0 (já existe) | Total de vendas do dia/período | Faturamento — o número mais importante | ✅ seção 1 + 3 |
| P0 (já existe) | Formas de pagamento (dinheiro vs card vs delivery apps) | Mix de pagamento — entender fluxo de caixa | ✅ seção 1 |
| P0 (já existe) | Itens mais vendidos | Mix de produtos — o que está vendando | ✅ seção 5 |
| P0 (já existe) | Sessões de caixa | Controle de gaveta — responsabilidade do operador | ✅ seção 5 |
| P0 (já existe) | Ticket médio | Valor por pedido — KPI de rentabilidade | ✅ seção 5 |
| P0 (já existe) | Horários de pico | Horário de pico — para escala | ✅ seção 5 |
| P1 (adicionar agora) | **Resumo Executivo** — todos KPIs num quadro no topo | Nox/MaisPDV prometem "todos os números" — dono não quer vasculhar seções | ❌ hoje está espalhado |
| P1 (adicionar agora) | **Comparativo vs. dia anterior** (ontem) | Padrão em restaurant daily reports — saber se hoje foi melhor ou pior que ontem | ❌ não temos |
| P1 (adicionar agora) | **Top categorias** (copos, adicionais, bebidas) | Ver mix macro — adicionais vendem muito mas pouco ticket; copos são ticket alto | ❌ não temos |
| P2 (v1.3.8+) | **Comparativo vs. semana passada** | Tendência de 7 dias — padrão em relatórios de restaurante | ❌ não temos |
| P2 (v1.3.8+) | **Gráfico de barras** no PDF (vendas por dia) | Visual — mas pdfmake charts precisa de configuração extra | ❌ não temos |
| P3 (não agora) | Labor cost %, sales tax/ICMS, clima, gorjeta, waste/perda, clientes novos vs. retornando | Sem dados ou fora do escopo do PDV simples | — |

### 11.2 Resumo Executivo — o que colocar no topo do PDF

Quadro no topo (antes da seção 1), com todos os KPIs do dia/período em um só lugar:

```
RELATÓRIO FINANCEIRO
Açaí Wave — Loja: [nome]
Data: 17/09/2026

╔══════════════════════════════════════════════════════════╗
║ RESUMO EXECUTIVO                                         ║
║                                                          ║
║ Total de Pedidos        R$ 1.250,00   ▲ +8% vs. ontem  ║
║ Total de Vendas         47 pedidos     ▲ +3 vs. ontem   ║
║ Ticket Médio            R$ 26,60       ◄ igual          ║
║ Total de Itens          98 itens       ▲ +12 vs. ontem  ║
║ Forma Pag. Predom.      DINHEIRO (60%)                  ║
║ Entregas / Retiradas    12 / 35                        ║
║ Horário de Pico         13h00 (8 pedidos)               ║
╚══════════════════════════════════════════════════════════╝

1. RESUMO DE VENDAS
...
```

**Como calcular cada item com dados existentes (ou com alterações mínimas):**

| KPI | Dados necessários | Como calcular |
|-----|-------------------|---------------|
| Total de Vendas | `salesTotal` (já calculado) | Soma das vendas por payment_method |
| Total de Pedidos | `totalOrders` (já calculado em generatePDF) | Soma de order_count de cada payment_method |
| Ticket Médio | `data?.ticketAverage` (já vem do backend) | getDailyReport / getReportByPeriod já retorna |
| Total de Itens | `allOrders` (precisa trazer via IPC) | Reduzir `o.items.length` de cada pedido |
| Forma Pagamento Predominante | `data.sales` | O payment_method com maior order_count |
| Entregas / Retiradas | `deliveryStats` (já existe no backend) | Precisa trazer via IPC novo ou incluir no `allOrders` |
| Horário de Pico | `data?.peakHours` (já vem do backend) | Primeiro elemento de peakHours |
| Permutas totais | `data?.exchanges` (já vem) | Soma de `ex.total` |

### 11.3 Comparativo vs. dia anterior

Necessário trazer dados de ontem. Backend precisa de:

```javascript
// db.cjs: nova function
function getDailyReportForDate(dateStr) {
  // Mesmo shape de getDailyReport(), mas para dateStr específico
  // Reusa a lógica de getDailyReport() com data parametrizada
}
```

IPC novo: `reports:daily-for-date` → recebe `{ date: '2026-09-16' }` → retorna o daily report para essa data

No modal/generatePDF:
- Se `isPeriodView` for false (modo "hoje"): buscar também `reports:daily-for-date` com ontem
- Comparar cada KPI com ontem: delta absoluto e delta percentual
- Renderizar na Seção 0 ou Seção 1 (linha comparativa)

**Formato do comparativo:**

```
Total de Vendas:     R$ 1.250,00   ▲ +120,00 (+10,7% vs. ontem)
Total de Pedidos:    47 pedidos     ▲ +5 vs. ontem
Ticket Médio:        R$ 26,60       ◄ igual vs. ontem
Total de Itens:      98 itens       ▲ +8 vs. ontem
```

**Por que não comparativo vs. semana passada agora:**

Requer 7 consultas de dia (ou consulta agregada de 7 dias) — mais complexo. Ficar para v1.3.8.

### 11.4 Top Categorias

Query simples (já temos `order_items.category`):

```sql
SELECT
  oi.category,
  COUNT(*) AS qty,
  SUM(oi.price) AS total_revenue,
  AVG(oi.price) AS avg_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.category != ''
  AND o.is_exchange = 0
  AND datetime(o.created_at, 'localtime') >= datetime(?, 'localtime')
  AND datetime(o.created_at, 'localtime') <= datetime(?, 'localtime')
GROUP BY oi.category
ORDER BY total_revenue DESC;
```

**Como fica no PDF:**

```
PRODUTOS POR CATEGORIA
┌─────────────────────────────────────────────┐
│ COPOS DE AÇAÍ    85 pedidos  R$ 1.700,00   │
│ ADICIONAIS DOCES 142 pedidos R$  284,00    │
│ BEBIDAS           12 pedidos  R$  120,00   │
└─────────────────────────────────────────────┘
```

**Por que é útil:**
- Adicionais vendem MUITO (volume) mas têm preço baixo (R$ 0 ou pouco) — o dono pode achar que "vende muito açaí" mas na verdade vende muito adicionais
- Copos de açaí têm ticket alto (R$ 15-25) — são a maior fonte de receita
- Bebidas podem ter margens diferentes

Isso ajuda o dono a entender o MIX de produtos — o que ele realmente ganha dinheiro.

---

## 12. Novas seções no PDF (implementação)

### 12.1 Seção 0 — RESUMO EXECUTIVO

Adicionar no início do `generatePDF()` (antes da seção 1), sempre que `isPeriodView` for false
(modos "hoje" e "produto"). Para modo período, pode ser omitido ou adaptado.

**Dados necessários para o resumo executivo:**
- `salesTotal` — já calculado
- `totalOrders` — já calculado em generatePDF linha 13
- `ticketAverage` — já vem em `data.ticketAverage`
- `totalItens` — precisa de `allOrders` (IPC existente `reports:all-orders-for-period`)
- `dominantPaymentMethod` — calcular de `data.sales` (o com maior order_count)
- `deliveryStats` — precisa de novo IPC ou trazer junto com `allOrders`
- `peakHours` — já vem em `data.peakHours`
- `exchangesTotal` — calcular de `data.exchanges`

### 12.2 Seção 1.x — COMPARATIVO VS. ONTEM

Adicionar após o resumo de vendas (ou dentro dele), quando em modo "hoje" e tiver dados de ontem.

**Novo IPC backend:** `reports:daily-for-date` (recebe `{ date: string }`)

**Lógica no frontend:**
```javascript
// No handleExportPDF ou na geração de relatório diário:
const todayReport = data; // já vem do reports:daily
const yesterdayDate = ...;
const yesterdayRes = await ipc.invoke('reports:daily-for-date', { date: yesterdayDate });
const yesterday = yesterdayRes?.data;

const comparison = {
  salesDelta: salesTotal - yesterday?.salesTotal,
  salesDeltaPercent: yesterday?.salesTotal ? ((salesTotal - yesterday.salesTotal) / yesterday.salesTotal * 100) : 0,
  ordersDelta: totalOrders - yesterday?.totalOrders,
  // ... etc
};
```

### 12.3 Seção Nova — PRODUTOS POR CATEGORIA

Adicionar no PDF como seção após "Produtos Mais Vendidos" ou no lugar dela.

**Novo IPC backend:** `reports:top-categories` (recebe `{ startDate, endDate }`)

**No generatePDF:**
```javascript
if (data?.topCategories && data.topCategories.length > 0) {
  content.push({ text: 'PRODUTOS POR CATEGORIA', style: 'sectionTitle', ... });
  // tabela igual às outras seções
}
```

---

## 13. Novos IPCs a adicionar (resumo completo para v1.3.7)

### Relatório por produto (feature principal)
- `reports:product-sales` → `getProductSalesReport(name, start, end)`
- `reports:product-daily` → `getProductSalesByDay(name, start, end)`
- `reports:product-orders` → `getOrdersContainingProduct(name, start, end)`

### Extensão do PDF (comparativo + categorias)
- `reports:daily-for-date` → `getDailyReportForDate(date)`
- `reports:top-categories` → `getTopCategories(start, end)`

### Reuso de IPCs existentes (não criar novos)
- `reports:daily` → já existe, para "hoje"
- `reports:all-orders-for-period` → já existe, para `totalItens` e outros detalhes
- `reports:store-info` → já existe
- `reports:promotions-for-period` → já existe

---

## 14. Novas functions backend (resumo)

### Já existe (não tocar)
- `getDailyReport()` — hoje
- `getReportByPeriod(start, end)` — período
- `getTopProducts(start, end)` — interno em getDailyReport / getReportByPeriod
- `getAllOrdersForPeriod(start, end)` — já exportado

### Criar agora (v1.3.7)
- `getDailyReportForDate(dateStr)` — dia específico (para ontem e comparação)
- `getTopCategories(startDate, endDate)` — agregação por categoria
- `getProductSalesReport(productName, startDate, endDate)` — relatório do produto
- `getProductSalesByDay(productName, startDate, endDate)` — evolução diária
- `getOrdersContainingProduct(productName, startDate, endDate)` — pedidos com o produto
- `getProductById(id)` — busca produto pelo ID (se necessário para o select)

### Deixar para v1.3.8
- `getLastWeekReport()` — agregação de 7 dias anteriores (comparativo semana)
- Funções de gráfico no PDF (pdfmake charts)

---

## 15. Atualização do critério de aceitação (v1.3.7)

- [ ] Usuário logado vê botão "Relatórios" no menu → abre ReportsModal
- [ ] Dentro do modal, há um select "Produto" com os produtos do catálogo
- [ ] Ao selecionar um produto, a área principal mostra:
  - [ ] Nome, preço, categoria do produto
  - [ ] Cards: qtde vendida, receita total, preço médio, % do total
  - [ ] Tabela de evolução diária (dia, qtde, receita)
  - [ ] Formas de pagamento (lista: método, # pedidos, receita)
  - [ ] Pedidos que continham o produto (lista limitada, com nº, cliente, data, pagamento)
- [ ] Botão "Exportar PDF" gera PDF com seção de produto incluída
- [ ] Funciona para período "hoje" e "período personalizado"
- [ ] Funciona para roles admin, manager e operator (com view_reports)
- [ ] Erros de IPC (sem conexão, produto não encontrado, período inválido) mostram toast apropriado
- [ ] Tsc e lint passam
- [ ] **PDF inclui Seção 0 — Resumo Executivo** (todos KPIs no topo)
- [ ] **PDF inclui comparativo vs. ontem** (quando em modo "hoje" e tiver dados)
- [ ] **PDF inclui Top Categorias** (agregação por categoria)

---

## 16. Por que essas extensões importam (justificativa de mercado)

**Resumo Executivo:**
PDVs especializados em açaí (NoxMob) e PDVs gerais (MaisPDV, PDV Loja) prometem ao dono "todos os números da loja" em um lugar. Hoje nosso PDF espalha os KPIs pelas seções 1-8. O dono quer ver em 5 segundos: quanto vendi hoje, quantos pedidos, qual foi o ticket, qual forma de pagamento dominou, quantos delivery vs. retirada, quando foi o pico. Um quadro no topo resolve isso.

**Comparativo vs. ontem:**
Template de relatório diário de restaurantes (Scribd, KwickOS, DineOpen, Toast) inclui sempre "compare to yesterday" — é o padrão da indústria porque o dono quer saber se o negócio está crescendo ou declinando dia a dia, não apenas o absoluto de hoje. No Brasil, lojistas de açaí e restaurantes usam planilhas que fazem exatamente isso.

**Top Categorias:**
É a forma mais rápida de entender o MIX de produtos. Lojas de açaí têm três categorias óbvias (copos de açaí, adicionais doces, bebidas) e o dono precisa saber qual delas é a que mais fatura — não apenas qual produto vende mais unidades (adicionais vendem muito, mas quase gratuitos; copos de açaí entregam o ticket). Isso é insight de negócio real, não decorativo.

---

*Plano atualizado em 17/09/2026 após investigação de mercado de PDV para açaí e restaurantes.*
