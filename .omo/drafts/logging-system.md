---
slug: logging-system
status: approved
intent: clear
review_required: false
pending-action: execute .omo/plans/logging-system.md via $start-work
approach: Implement GitHub issue #14 (Sistema de Logging Robusto) — winston no processo principal com múltiplos transportes, handlers globais de erro, canal IPC logging:write com allowlist + validador, logger do renderizador, mapeamento toast->severidade, ErrorBoundary com stack trace, script npm run log e documentação (AGENTS.md). Executável em uma sessão de worker; sem dependências externas.
---

# Draft: logging-system

## Components (topology ledger)
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

- C1 main-process winston logger | `database/logger.cjs`: createLogger, transportes Console(dev)+File structured.log+File errors.log(ERROR), formato JSON, níveis ERROR/WARN/INFO/DEBUG | active | package.json:75-81 (build.files inclui database/**), issue #14 body
- C2 global error handlers | main.cjs:113-124 uncaughtException/unhandledRejection redirecionados p/ logger (mantém dialog.showErrorBox + app.quit) | active | main.cjs:113-124
- C3 IPC channel logging:write | preload.js ALLOWED_CHANNELS + validate.cjs validador (level whitelist + message string) + handler em main.cjs via createHandler | active | preload.js:3-80, validate.cjs:369-375, main.cjs:74-91
- C4 renderer logger | `src/services/logger.js` (ESM): envia {level,message,meta} via window.electron ipcRenderer; fallback console.* quando IPC ausente (testes/CI) | active | src/services/errorService.js:44-51 (padrão existente)
- C5 user-level logging (toast) | toastStore.js addToast emite log estruturado com mapeamento tipo->nível (error, warning, info) | active | src/store/toastStore.js:5-11
- C6 ErrorBoundary stack-trace | ErrorBoundary.jsx componentDidCatch:14 envia error+componentStack p/ logger | active | src/components/ErrorBoundary.jsx:13-16
- C7 script npm run log + docs | `scripts/log-viewer.cjs` imprime cauda do structured.log; seção Logging no AGENTS.md; env CONTEXTO_DE_LOGGING documentada | active | package.json:7-22 (scripts), AGENTS.md

## Open assumptions (announced defaults)
<!-- intent is CLEAR: record any default adopted instead of asking so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

- Local do logger main | `database/logger.cjs` (CJS, junto aos demais módulos do main) | package.json build.files só empacota dist/, main.cjs, preload.js, database/**, package.json; root-level novo arquivo precisaria alterar build.files; database/ já é empacotado | yes
- Renderer não usa winston | logger ESM `src/services/logger.js` encaminha via IPC logging:write | winston é Node-only; bundle Vite do renderer não pode importar Node core | yes
- Nível por ambiente | CONTEXTO_DE_LOGGING env (development|test|production), default app.isPackaged?'production':'development'; level debug em dev, info em prod | issue #14 pede a env; default por packaged é padrão Electron | yes
- Caminho dos logs | `app.getPath('userData')/logs/structured.log` + `errors.log` | issue #14 especifica explicitamente | no (spec da issue)
- Script npm run log | `scripts/log-viewer.cjs` (tail do structured.log) | aceitação da issue pede "API de logging padronizada (npm run log)"; interpretação defensável: comando p/ visualizar logs | yes
- Toast actions (undo/retry/details) | FORA de escopo | estão no corpo da issue mas NÃO nos critérios de aceitação; adicionariam superfície UX nova | no
- Version winston | ^3.17.0 (v3 estável, compatível Node 20, CJS) | winston v4 não é GA mainstream; v3 é a linha LTS de fato | yes
- Testes de logging no CI | unit test de logger main (initLogger com dir temporário) + renderer fallback; roda no job test existente (ubuntu+windows) | task list da issue pede testes de logging no CI Windows; sem Electron rodando, testar a lib diretamente | yes

## Findings (cited - path:lines)

- package.json:5 type=module, mas main.cjs e preload.js são CJS (require). Renderer (src/) é ESM bundlado pelo Vite.
- build.files (package.json:75-81) empacota dist/**, main.cjs, preload.js, database/**, package.json — qualquer módulo novo do processo principal precisa ficar em database/ ou ser listado.
- main.cjs:26 usa console.log bruto; main.cjs:86 `console.error([${channel}] Error:)` no catch do createHandler — ponto de substituição por logger estruturado.
- main.cjs:113-124 já tem handlers globais uncaughtException (com dialog.showErrorBox + app.quit) e unhandledRejection — precisam logar estruturado, não só console.error.
- preload.js:3-80 ALLOWED_CHANNELS é allowlist explícita; safeInvoke:82-88 rejeita canal fora da lista — logging:write precisa ser adicionado aqui.
- validate.cjs:369-375 validateIPC retorna pass-through quando não há validador — anti-padrão a evitar; logging:write terá validador dedicado (level whitelist + message).
- main.cjs:74-91 createHandler centraliza validação + requireRole + retorno {success}. Handler de logging:write deve usar createHandler (sem minRole) p/ consistência.
- errorService.js:44-51 logError já centraliza console.error no renderer — logger novo pode substituir/encapsular, mantendo compat.
- toastStore.js:5-11 addToast tem type info|error|warning|success — mapeamento direto p/ níveis do winston.
- ErrorBoundary.jsx:13-16 componentDidCatch já captura error+errorInfo — falta rotear p/ logger.
- CI ci.yml:70-105 job test roda npm test em ubuntu+windows (matrix) — teste de logging roda aí, sem precisar tocar no workflow (winston é dependência JS pura, npm rebuild better-sqlite3 não afeta).
- CI ci.yml:7-18 paths-ignore ignora **.md — commits só de AGENTS.md não disparam CI (conveniente).
- Issue #14 body: transportes pedidos = Console(dev), userData/logs/structured.log, userData/logs/errors.log (só ERROR); formato padrão timestamp, nível, mensagem, metadados; env CONTEXTO_DE_LOGGING.
- Issue #14 critérios de aceitação: winston multi-transporte; JSON produção; handler global com stack trace; API padronizada (npm run log); logs automáticos user-level; envs documentadas.
- Nuance: issue #14 também pede "middleware para capturar erros não tratados" (== handler global C2) e "API unificada para ambos os processos" (== canal IPC C3+C4).

## Decisions (with rationale)

- Implementar #14 inteira dentro dos critérios de aceitação; excluir undo/retry/details toasts (não está nos critérios).
- Logger main em database/logger.cjs para herdar o empacotamento existente sem mexer em build.files.
- Canal único `logging:write` com payload {level, message, meta} — simples, permite evolução (ex: logging:read) sem inflar a allowlist.
- Validator dedicado para logging:write (whitelist de níveis + string não-vazia + meta objeto opcional) — evita o pass-through permissivo.
- Renderer: `src/services/logger.js` com API {error,warn,info,debug}; se window.electron ausente, espelha no console (testes/CI e fallback).
- toastStore: cada addToast também chama logger[level]('toast:message', {type}) — logs automáticos de ações/erros de UI.
- ErrorBoundary: componentDidCatch envia logger.error com stack + componentStack.
- npm run log → node scripts/log-viewer.cjs (tail -n 50 do structured.log, caminho do userData).
- AGENTS.md: nova seção "Logging" (comando, paths, env, níveis). NOTA de ordenação: plano agents-md-hierarchy também edita AGENTS.md (linha 16 + seção hierarchy anexada no fim) — sem conflito de texto; ambos anexam no fim, mas recomenda-se executar agents-md-hierarchy primeiro.
- CI: nenhuma mudança no workflow; testes de logging entram via npm test (job test matrix já cobre Windows).

## Scope IN

- Adicionar winston (^3.17.0) ao package.json dependencies.
- Criar database/logger.cjs (initLogger(userDataPath) + logger exportado; transports Console dev / structured.log / errors.log; format json; exitOnError false).
- main.cjs: substituir console.error do createHandler (linha 86) por logger; handlers globais (linhas 113-124) logam estruturado mantendo dialog+quit; registrar ipcMain.handle('logging:write') via createHandler.
- preload.js: adicionar 'logging:write' ao ALLOWED_CHANNELS.
- validate.cjs: adicionar validador 'logging:write'.
- Criar src/services/logger.js (ESM renderer).
- toastStore.js: emitir logs automáticos por tipo.
- ErrorBoundary.jsx: rotear componentDidCatch p/ logger.
- Criar scripts/log-viewer.cjs + script npm "log".
- AGENTS.md: seção "Logging".
- Testes: database/logger test (initLogger em dir temporário, assert arquivos + JSON) + src/services/logger test (fallback console sem IPC) + toastStore logging (opcional).
- Rodar npm test, npm run lint, npm run typecheck, build para validar.

## Scope OUT (Must NOT have)

- NO mudanças no CI workflow (ci.yml) — testes rodam no job test existente.
- NO alteração de build.files / electron-builder config.
- NO toast actions undo/retry/details.
- NO logger remoto / transporte HTTP / winston-transport custom.
- NO logging de dados sensíveis (senhas, tokens, dados financeiros brutos) — apenas mensagens e metadados não-sensíveis.
- NO mudança de comportamento de login/rate-limit/sessão.
- NO implementar #12/#13/#7 (outras issues) — apenas #14.
- NO mexer na hierarchy AGENTS (agents-md-hierarchy continua plano separado).
- NO gh CLI / fechar issues.

## Open questions

- Nenhuma. Decisões de dono registradas acima como defaults anunciados (vetáveis no gate).

## Approval gate
status: approved
approach: Implementar #14 (Logging) — winston multi-transporte no main, canal IPC logging:write (allowlist+validador), logger do renderer, toasts automáticos, ErrorBoundary, script npm run log, AGENTS.md + testes. Sem CI workflow change.
Nota de validação: o gap-analysis do subagent Metis falhou por indisponibilidade de modelo/infra (2 tentativas: erro de autenticação PAB e ProviderModelNotFound). Substituído por manual self-review do plano (todos com refs+acceptance+QA+failure), formato verificado (10 checkboxes: 6 todos numerados 1-6 + F1-F4). Nenhum gap material encontrado; pequenos typos de prosa corrigidos.
Approval authorizes writing ONE plan only; execution via $start-work after.
<!-- When exploration is exhausted and unknowns are answered, present a brief once and wait for the user's explicit okay. -->
