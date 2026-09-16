# Changelog

All notable changes to **Açaí Wave** are documented here.

This project adheres to [Semantic Versioning](https://semver.org/lang/pt-br/).

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
