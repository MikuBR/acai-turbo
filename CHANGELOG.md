# Changelog

All notable changes to **Açaí Wave** are documented here.

This project adheres to [Semantic Versioning](https://semver.org/lang/pt-br/).

---

## [1.4.0] — 2026-10-26

### Adicionado
- **Relatórios reorganizados em página focada**: `ReportsScreen` agora é uma página com abas individuais (Vendas, Promoções, Delivery, Catálogo, Financeiro), filtro de período global e exportação PDF por aba.
- **Componentes de relatório por tipo**: `src/components/organisms/reports/` com `SalesReport`, `PromotionsReport`, `DeliveryReport`, `CatalogReport`, `FinancialReport` e barrel `index.ts`.

---

## [1.3.9] — 2026-10-22

### Corrigido
- **Auth: regressão síncrona de `session.cookies.set` no login (crítico)**: o handler `auth:login` chamava `session.cookies.set(name, value, opts)` — assinatura 3-arg com string no índice 0 — em vez da assinatura de objeto exigida pela API Electron (`{ url, name, value, ... }`). Isso lançava `TypeError` de forma síncrona, fazendo o login falhar com "Erro interno ao fazer login". Todos os handlers de cookie foram extraídos para `main/cookie-helpers.cjs` como funções puras e unit-testáveis; os quatro handlers IPC (`login`/`logout`/`refresh`/`check`) agora derivam a origem do renderer via `getCookieOrigin(e.sender)` e passam o `url` obrigatório.

### Alterado
- **Refatoração de auth**: `setAuthCookies`/`clearAuthCookies`/`getAuthTokenFromCookies`/`getRefreshTokenFromCookies` foram movidas de `main.cjs` para `main/cookie-helpers.cjs` (única fonte de verdade para nomes/TTL de cookies), com teste de regressão `src/tests/cookies.test.js` (9 casos).

---

## [1.3.8] — 2026-10-16

### Corrigido

- **CI: gate de release com falso positivo (crítico)**: o job *Release - Build Windows Installer* falhava no passo `Verify CI passed for this commit` desde o commit `1759fe3`. O gate lia a conclusão do CI no mesmo instante do push, quando a run ainda estava `in_progress` — `conclusion` é `null` nesse estado e o fallback `// "none"` transformava "ainda rodando" em "não passou". O job abortava **~68s antes** de o CI terminar com sucesso: o CI passava, mas o instalador nunca era gerado. O pipeline aparecia vermelho sem defeito real.
- **CI: gates de lint e typecheck que nunca rodavam**: o job *Lint & TypeCheck* falhava desde `1b1d68e` (17/set), antes da migração JSX→TSX. O ESLint não dava globals de Node para `src/tests/**` e não lintava arquivos `.tsx`, então **22 erros de tipo ficaram invisíveis** no CI. Corrigido: `ProductFormState`, `PromotionFormState`, `UserFormState`, `FinancialFormState` e `ClientFormState` criados em `src/types/index.ts`, removendo 14 casts `as` inseguros. Resultado: lint 11→0, typecheck 22→0.
- **CI: job `Build Production (Vite)` nunca executava** — bloqueado pelo lint que falhava antes. Agora roda.

### Alterado

- **`release.yml` migra de `push` para `workflow_run`**: o build do instalador agora dispara quando o *CI - Açaí Wave* **termina**, não no push. O gate virou `if:` no nível do job — o instalador só é gerado quando o CI concluiu com sucesso, eliminando a corrida por construção. A detecção de tag `v*` passou a ser por SHA do commit aprovado (o `ci.yml` não roda em push de tag).
- **Migração JSX → TSX**: 40+ componentes migrados, com tipos estritos. `AppLayout`, formulários e telas agora têm tipos de estado de formulário separados dos tipos de domínio.
- **Observabilidade**: `src/services/alerts.ts`, `analytics.ts`, `performance.ts`, `sourcemaps.ts`; componentes `SentryFeedbackButton`/`SentryFeedbackWidget`, `ConnectionIndicator`; hooks `useOnlineStatus`, `usePerformanceMark`, `useTheme`.
- **Cache de produtos**: `src/services/productCache.ts` com geração para evitar corrida entre limpeza e promise em voo.
- **E2E**: suíte Playwright com mock de integração iFood (`e2e/ifood-integration.spec.ts`).
- **Docs**: `docs/PERFORMANCE-MARKS.md`, `docs/WEB-VITALS.md`, `docs/SENTRY.md`, `docs/SOURCE-MAPS.md`.

### Notas de release

- **Ordem de push para release versionada**: como o `ci.yml` não roda em tags, o `release.yml` decide o destino comparando o SHA aprovado pelo CI com as tags `v*` do repo. Empurre `main` **e** a tag juntos: `git push origin main v1.3.8`. Se a tag subir depois, o commit cai na pré-release contínua `windows-installer-main`.
- Este release consolida todo o trabalho que estava entre `v1.3.7` e o HEAD (migração TSX, observabilidade e correções de CI).

---

## [1.3.7] — 2026-09-17

### Adicionado

- **Relatório por Produto**: nova seção no relatório financeiro em PDF (Seção 9) com ficha do produto (qtde vendida, receita total, preço médio, participação no total), evolução diária, formas de pagamento e pedidos que contêm o produto (até 50 pedidos). Modal dedicado com KPIs, tabelas de evolução diária, pagamento e pedidos.
- **Backend para relatório por produto**: 5 novas consultas SQL em `database/db.cjs` — `getProductSalesReport`, `getProductSalesByDay`, `getOrdersContainingProduct`, `getProductById`, `getTopCategories`.
- **IPC para relatório por produto**: 5 novos handlers em `main.cjs` (`reports:product-sales`, `reports:product-daily`, `reports:product-orders`, `reports:daily-for-date`, `reports:top-categories`) e exposição via `contextBridge` em `preload.js`.

### Melhorado

- **Exportação PDF**: `handleExportPDF` busca dados do produto via IPC quando um produto está selecionado, antes de montar o documento.
- **Carregamento do catálogo**: catálogo de produtos carregado via IPC ao abrir o modal de relatórios para alimentar o seletor de produto.

### Notas

- As funções `getProductById` e `getTopCategories` foram implementadas no backend mas não são ainda consumidas pelo frontend neste release (prontas para uso futuro).

---

## [1.3.6] — 2026-09-17

### Corrigido

- **Login falho**: `preload.js` usava `legacyIpc` antes de ser definido — com `contextIsolation: true`, `window.electron.ipcRenderer` era `undefined`, `getIPC()` retornava `null`, e o login nunca disparava. Movido `contextBridge.exposeInMainWorld('electron', ...)` para depois da definição de `legacyIpc`.

---

## [1.3.5] — 2026-09-16

### Corrigido

- **`TypeError: Cannot set properties of undefined (setting 'level')`**: crash ao iniciar em Windows. `main/update-manager.cjs` acessava `logger.transports.file.level` — padrão que não funciona em winston moderno (logger.transports é Array) e não existe no `NoOpLogger` do electron-updater. Substituído por `makeUpdaterLogger()` que retorna apenas `info/warn/error`, interface que o electron-updater espera.

---

## [1.3.4] — 2026-09-16

### Melhorado

- **Relatórios PDF**: acesso defensivo a campos numéricos em `ReportsModal.jsx` usando `Number(field?.key ?? 0)` em vez de `|| 0` ou acesso direto de propriedade.
- **Validação de base64**: verificação de tamanho (1KB–50MB) antes de decodificar no IPC de relatórios.
- **Mensagens de erro distintas**: diferença entre erro de módulo não encontrado, estrutura PDF inválida e falha genérica.
- **Acesso defensivo em relatórios avançados**: `ticketAverage`, `peakHours`, `topProducts`, `ordersHistory` e `financialSummary` usam `?.` + `?? 0` + `Number()` consistentemente.

### Corrigido

- **Integridade de base64**: variável errada (`data` em vez de `pdfData`) na decodificação de PDF em `main.cjs`.
- **Validação de sucesso de IPC**: `handleExportPDF` agora verifica o sucesso das chamadas paralelas (`reports:store-info`, `reports:all-orders-for-period`, `reports:promotions-for-period`) antes de gerar o PDF.

---

## [1.3.3] — 2026-09-15

### Corrigido

- **CI**: summary job corrigido que causava falha em 0s no parser.
- **CI**: hardening dos workflows GitHub Actions e melhoria do teste de segurança.
- **UI**: corrigido numeração 2→4 no AcaiBuilderModal.
- **Auth**: persistência de sessão no AppLayout + deleteTable wiring + remoção de código morto.
- **IPC**: remover handler fantasma `reports:inventory-for-report` que causava `ReferenceError`.

---

## [1.3.2] — 2026-09-14

### Corrigido

- **Auto-update**: allowlist dos canais de push do auto-update no preload.js para evitar IPC não autorizado.

---

## [1.3.1] — 2026-09-13

### Corrigido

- **Módulo Estoque**: removido módulo de estoque que causava inconsistência; integridade do sistema melhorada.
- **Auto-update**: nome de artefato com acento quebra `latest.yml` — nome customizado removido.

### Adicionado

- **Auto-update nativo**: integração com `electron-updater` para atualizações automáticas via GitHub Releases.

---

## [1.3.0] — 2026-09-12

### Adicionado

- **Relatório financeiro em PDF**: expansão com 8 seções (entradas, saídas, saldo, etc.).

### Corrigido

- **Checkout**: "Dinheiro Recebido" agora preenchido com valor do pagamento dinheiro.

---

## [1.2.2] — 2026-09-11

### Corrigido

- **CI**: NODE_VERSION alinhado para 22; rebuild:native endurecido para CI; `allowScripts` adicionado.
- **IPC**: remover handler duplicado.
- **UI**: XSS no modal de estoque corrigido; guard contra usuário null.

---

## [1.2.1] — 2026-09-10

### Corrigido

- **IPC**: duplicata `clients:get-by-phone` corrigida.
- **CI**: remover passo upload-artifact redundante; corrigir input `overwrite_files` e Node 24 no release.yml.
- **Release**: release.yml agora dispara em push de main (não só tags) e gera EXE.
- **Release automática**: adicionado release-on-success.yml via workflow_run para release edge-main.

### Adicionado

- **Release contínua**: release edge-main criada automaticamente a cada push de main que passa no CI.

---

## [1.2.0] — 2026-09-09

### Adicionado

- **Router**: createHashRouter para compatibilidade com Electron file://.
- **Cash**: caixa com conferência, média top produtos e troco misto (resolve #34, #35, #36).
- **Clientes**: endereço e telefone com autocomplete para entrega.
- **Receipts**: tickets de recepção com timestamp exato e preview.

### Corrigido

- **Database**: guard contra versões duplicadas de migrations.
- **CI**: publicar instalador Windows no GitHub Releases a cada push de main e tag.
- **UI**: CashModal, LoginModal, reports — 여러 correções de render e estado.

---

## [1.1.1] — 2026-09-08

### Adicionado

- **Safe close**: confirmação antes de sair com pedidos abertos (previne perda de dados).
- **Delivery mode**: melhorias de UX no NewTableModal para modo delivery (Issue #17).
- **Visual parity**: paridade visual Linux/Windows + feature deleteTable (Issue #21).
- **iFood polling**: integração com polling automático de pedidos iFood.
- **PDF export**: exportação de relatórios em PDF.
- **Logging**: sistema de logging padronizado via winston (Issue #14).
- **Security**: validação IPC, RBAC, rate-limit e configuração de impressoras.
- **Database**: engine de migrations com safeguards (lock, backup, rollback, versionamento).

### Corrigido

- **Electron**: compatibilidade nativa corrigida (upgrade 28 → 32, ABI 119 → 128).
- **Build**: encode de license files como Windows-1252 para NSIS; escape CRLF NSIS; uso de VERSION define em custom.nsh.
- **CI**: debugging steps adicionados; MSBuild configurado; verificação de installer; logging de debug no release workflow.

---

## [1.1.0] — 2026-09-07

_(Release anterior — detalhes em breve)_

---

## [1.0.1] — 2026-09-06

### Corrigido

- **CI**: seed password sincronizado com padrão da UI (admin123).
- **CI**: formatação de string escape corrigida no nome de release para evitar falha no parser YAML.

---

## [1.0.0] — 2026-09-05

Primeira release estável.

---

## Notas de versionamento

### Política de versionamento

Este projeto segue [Semantic Versioning 2.0.0](https://semver.org/lang/pt-br/).

- **MAJOR** (`1.x.x → 2.0.0`): mudanças quebradoras de API ou comportamento. Ex: remoção de funcionalidade, mudança de contrato IPC, mudança de schema database sem migration.
- **MINOR** (`1.3.x → 1.4.0`): nova funcionalidade retrocompatível. Ex: novo relatório, nova integração, nova opção de configuração.
- **PATCH** (`1.3.4 → 1.3.5`): correção de bug sem nova funcionalidade e sem quebra. Ex: crash fix, correção de cálculo, hardening defensivo.

### Regras de decisão

| Situação | Tipo | Exemplo |
|----------|------|---------|
| Bug que causa crash ou dado errado | **patch** | TypeError ao iniciar, cálculo de troco errado |
| Nova funcionalidade visível | **minor** | novo relatório, nova integração, novo modal |
| Remoção ou mudança quebratória | **major** | remover módulo, mudar IPC, mudar database schema sem migration reversa |
| Melhoria interna sem efeito visível | **patch** | refactor, CI improvement, hardening defensivo |
| Correção que também adiciona comportamento novo | **minor** (ponderado) | se o fix introduz comportamento novo visível, usar minor |

### Releases de correção vs. features

- Releases **patch** são correções. Não devem ser anunciadas como "novas versões com recursos".
- O GitHub Release para patch deve indicar natureza de correção no texto.
- O tag `latest` no GitHub deve apontar para a última release **stable** (não pre-release).
- Se uma release patch corrige algo crítico, ela deve ser distribuída como atualização imediata, não como "versão nova opcional".

### Qualidade mínima para release

Antes de criar uma tag e release:

1. **CI passando**: lint, typecheck, testes Node e Electron.
2. **Build Windows**: installer .exe gerado com sucesso (verificar release/ localmente se possível).
3. **CHANGELOG**: entrada adicionada para a nova versão com seções `Adicionado`, `Corrigido`, `Melhorado`, `Removido` conforme aplicável.
4. **package.json**: versão sincronizada com a tag.
5. **Commit de version bump**: commit separado com mensagem `chore: bump version X.Y.Z → W.V.U`.

### Pipeline de release

#### Release normal (patch/minor/major)

```bash
# 1. Bumped version via script
node scripts/bump-version.cjs patch

# 2. Push código + tag
git push origin main
git push origin v1.3.5

# 3. GitHub Actions gera installler Windows e publica release automaticamente
#    Workflow: .github/workflows/release.yml
#    Trigger: push de tag v*
```

#### Release com correção urgente (hotfix)

Quando há bug crítico em produção e não dá tempo de esperar CI:

```bash
# 1. Commit o fix em main
git commit -m "fix(main): descrição do fix"

# 2. Bumped version
node scripts/bump-version.cjs patch

# 3. Push + tag
git push origin main
git push origin v1.3.5

# 4. CI gera installer e publica release
#    ou build local:
npm run package:win
#    e upload manual via:
gh release create v1.3.5 --target main --verify-tag
#    com o .exe local
```

#### Release edge (contínua, automática)

Cada push de main que passa no CI dispara automaticamente:
- `release-on-success.yml` cria/atualiza release `edge-main` (pre-release)
- `release.yml` gera installer Windows e atualiza release `windows-installer-main`

Isso é para testes internos e validação — não é release oficial do usuário final.

### Tags no projeto

| Tag | Tipo | Finalidade |
|-----|------|------------|
| `v1.3.4`, `v1.3.5`, ... | release oficial | Release estável para usuários |
| `edge-main` | pre-release | Build contínua de main para testes |
| `windows-installer-main` | pre-release | Installer Windows de cada push em main |
| `v1.3.5-rc.1` | release candidate | Candidato a release — usar antes de release oficial se necessário validação extra |

### CHANGELOG

- Arquivo: `CHANGELOG.md` na raiz do projeto.
- Formato: Keep a Changelog (https://keepachangelog.com/pt-BR/).
- Idioma: Português Brasileiro.
- Seções por versão: `Adicionado`, `Corrigido`, `Melhorado`, `Removido`, `Segurança`.
- Cada versão listada com data no formato ISO (`2026-09-16`).
- Versões não lançadas (em desenvolvimento) listadas como `[Unreleased]` no topo.

### Versionamento do código vs. versionamento do installler

- `package.json` contém a versão do **código fonte**.
- O installler Windows gerado pelo electron-builder herda essa versão via `productName` e `version` do package.json.
- O `latest.yml` gerado pelo electron-updater também contém a versão para verificação de atualização.
- Sempre sincronizar package.json com a tag antes de criar release.

---

## Links

- [Repositório](https://github.com/MikuBR/acai-turbo)
- [Issues](https://github.com/MikuBR/acai-turbo/issues)
- [Releases](https://github.com/MikuBR/acai-turbo/releases)

---

_Última atualização: 2026-09-16_
