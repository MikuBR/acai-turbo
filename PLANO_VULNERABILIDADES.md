# PLANO DE REMEDIAÇÃO DE VULNERABILIDADES — acai-turbo

**Objetivo:** Eliminar 3 CRITICAL + 28 HIGH + 22 MODERATE via updates controlados, sem quebrar producao.

**Fora de escopo:**
- Migracao Electron 32->43 (requer rebuild nativo + testes E2E + auto-updater) — roadmap separado
- Migracao electron-builder 25->26 (breaking API) — roadmap separado
- Vulnerabilidades em devDependencies que nao afetam runtime (concurrently, vitest, eslint)

**Suposições:**
- Node 20+ (package.json engines), npm 10+
- Better-sqlite3 dual ABI (Node 147 / Electron 128) — rebuild necessario apos Electron upgrade
- CI/CD roda `npm ci` + `npm run build:win` em Windows
- Testes: `npm run test:ci` (526 testes) + `npm run lint` + `npx tsc --noEmit`

---

## FASE 0 — Preparacao e Baseline (reduce incerteza)

| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 0.1 | Criar branch `fix/vulns-critical-high` a partir de `main` | `git checkout -b fix/vulns-critical-high && git log --oneline -1` | — |
| 0.2 | Snapshot de vulnerabilidades atuais: `npm audit --json > audit-baseline.json` | Arquivo existe, 53 vulns | 0.1 |
| 0.3 | Rodar suite completa baseline: `npm run ci` (lint + typecheck + test:ci) | 526 testes passam, 0 erros | 0.1 |
| 0.4 | Documentar versoes atuais chave: `npm list electron electron-builder @sentry/electron axios vite concurrently vitest eslint` | Versoes registradas | 0.1 |

---

## FASE 1 — CRITICAL (3 vulnerabilidades)

### 1.1 shell-quote (via concurrently) — CRITICAL
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 1.1.1 | `npm audit fix --force` (aplica concurrently@9.2.1+) | `npm list concurrently` -> >=9.2.1 | 0.4 |
| 1.1.2 | Verificar `npm run dev` sobe Vite + Electron sem erro | Dev server roda | 1.1.1 |
| 1.1.3 | Rodar `npm run test:ci` | 526 testes passam | 1.1.1 |

### 1.2 tar (via electron-builder chain) — CRITICAL
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 1.2.1 | **NAO corrigir via `npm audit fix --force`** (quebraria electron-builder 25->26) | — | — |
| 1.2.2 | Mitigacao: `npm config set ignore-scripts true` no CI de build (ja usado) + nao extrair tarballs nao confiaveis | Doc em `BUILD_SECURITY.md` | 0.4 |
| 1.2.3 | Agendar migracao electron-builder 25->26 como task separada (roadmap) | Issue criada | 1.2.2 |

> **Nota:** tar e transitive de `electron-builder@25.0.0` -> `app-builder-lib` -> `cacache` -> `make-fetch-happen` -> `node-gyp` -> `tar`. Fix real = upgrade electron-builder (breaking). Mitigacao ate roadmap.

---

## FASE 2 — HIGH (28 vulnerabilidades) — Priorizadas por impacto

### 2.1 Electron 32->43 (30+ CVEs) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.1.1 | **NAO corrigir agora** — breaking: ABI 128->?, better-sqlite3 rebuild, auto-updater, printing, IPC | — | — |
| 2.1.2 | Criar spike branch `spike/electron-43` para avaliar esforco | `npm i electron@43` + `npm run rebuild:native` | 0.4 |
| 2.1.3 | Documentar blockers em `ELECTRON_43_MIGRATION.md` | Doc completa | 2.1.2 |

### 2.2 electron-builder 25->26 (app-builder-lib, builder-util-runtime) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.2.1 | **NAO corrigir agora** — breaking API, NSIS installer changes | — | — |
| 2.2.2 | Agendar como dependencia da migracao Electron 43 | Issue vinculada | 2.1.3 |

### 2.3 vite 8.3.x (cross-origin, path traversal, command execution) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.3.1 | `npm audit fix` (atualiza vite para patch sem breaking) | `npm list vite` -> 8.3.3+ | 1.1.3 |
| 2.3.2 | `npm run dev` + `npm run build` | Build verde, dev sobe | 2.3.1 |
| 2.3.3 | `npm run test:ci` | 526 testes passam | 2.3.1 |

### 2.4 axios (10 CVEs: prototype pollution, ReDoS, SSRF) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.4.1 | Verificar se axios e usado em producao: `grep -r "axios" src/ --include="*.ts" --include="*.tsx"` | Se 0 ocorrencias -> dev only | 0.4 |
| 2.4.2 | Se so dev: `npm audit fix --force` (wait-on@9.0.5) | `npm list axios` -> patched | 2.4.1 |
| 2.4.3 | Se prod: upgrade axios para latest compativel + testar integracao | Testes passam | 2.4.1 |

### 2.5 @sentry/electron 7.x -> 7.20.1 (opentelemetry instrumentation) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.5.1 | `npm install @sentry/electron@7.20.1 @sentry/node@latest @sentry/react@latest` (patch) | `npm list @sentry/electron` -> 7.20.1 | 2.3.3 |
| 2.5.2 | `npm run test:ci` + `npm run build` | 526 testes, build verde | 2.5.1 |

### 2.6 sharp 0.35.x (libheif/librsvg) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.6.1 | `npm audit fix` (sharp patch) | `npm list sharp` -> patched | 2.3.3 |
| 2.6.2 | `npm run build` | Build verde | 2.6.1 |

### 2.7 undici (7 CVEs: DoS, TLS bypass) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.7.1 | `npm audit fix` (undici patch) | `npm list undici` -> patched | 2.3.3 |

### 2.8 source-map-js / magicast / @vitest/mocker (vitest chain) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.8.1 | **Dev only** — `npm audit fix --force` -> @vitest/coverage-v8@2.0.5 | `npm run test:ci` passa | 2.3.3 |

### 2.9 zod / eslint-plugin-react-hooks — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.9.1 | **Dev only** — `npm audit fix --force` | `npm run lint` passa | 2.8.1 |

### 2.10 @opentelemetry/instrumentation-* (db.username leak) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.10.1 | Corrigido junto com @sentry/electron@7.20.1 (2.5.1) | `npm audit` -> 0 opentelemetry HIGH | 2.5.1 |

### 2.11 follow-redirects / joi (via wait-on) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.11.1 | **Dev only** — `npm audit fix --force` -> wait-on@9.0.5 | `npm run dev` roda | 2.4.1 |

### 2.12 minimatch / brace-expansion / glob (DoS) — HIGH/MODERATE
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.12.1 | `npm audit fix` (brace-expansion, js-yaml, ip-address, @electron/universal via electron-builder) | `npm audit` -> 0 HIGH nesses | 2.3.3 |

### 2.13 extract-zip (via electron) — HIGH
| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 2.13.1 | Corrigido com Electron 43 (roadmap) | — | 2.1.3 |

---

## FASE 3 — MODERATE (22) — Batch unico

| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 3.1 | `npm audit fix` (aplica: @opentelemetry/core, @vitest/mocker patch, glob patch, ip-address, minimatch patch, @electron/universal via builder) | `npm audit` -> 0 MODERATE restantes (exceto roadmap) | 2.12.1 |
| 3.2 | `npm run ci` completo | 526 testes, lint 0, typecheck 0, build verde | 3.1 |

---

## FASE 4 — Validacao Final e Merge

| # | Acao | Verificar | Depende |
|---|------|-----------|---------|
| 4.1 | `npm audit --json > audit-final.json` + diff vs baseline | 0 CRITICAL, 0 HIGH (exceto roadmap Electron/builder) | 3.2 |
| 4.2 | `npm run ci` + `npm run build:win` (em Windows VM) | Installer gera, roda, imprime | 3.2 |
| 4.3 | Commit: `fix(security): remediate critical/high vulns (excl. Electron/builder roadmap)` | `git log --oneline -1` | 4.1 |
| 4.4 | PR -> review -> merge para `main` | CI verde | 4.3 |

---

## RESUMO DE COMANDOS POR FASE

```bash
# FASE 0
git checkout -b fix/vulns-critical-high
npm audit --json > audit-baseline.json
npm run ci

# FASE 1.1 (CRITICAL - shell-quote)
npm audit fix --force  # concurrenty
npm run test:ci

# FASE 2.3, 2.5, 2.6, 2.7, 2.10, 2.12 (HIGH - patches sem breaking)
npm audit fix          # vite, sharp, undici, @opentelemetry, brace-expansion, js-yaml, ip-address
npm install @sentry/electron@7.20.1 @sentry/node@latest @sentry/react@latest
npm run test:ci && npm run build

# FASE 2.4, 2.8, 2.9, 2.11 (HIGH - dev only, --force)
npm audit fix --force  # wait-on, vitest, eslint, concurrently
npm run test:ci && npm run lint

# FASE 3 (MODERATE)
npm audit fix
npm run ci

# FASE 4
npm audit --json > audit-final.json
# diff baseline vs final
git commit -am "fix(security): remediate critical/high vulns"
```

---

## ROADMAP ITENS (nao bloqueiam merge)

| Item | Esforco estimado | Blocker principal |
|------|------------------|-------------------|
| Electron 32->43 | 2-3 sprints | better-sqlite3 ABI, auto-updater, printing, contextBridge |
| electron-builder 25->26 | 1-2 sprints | NSIS installer, code signing, asset paths |
| @vitest/coverage-v8 2.x | 1 sprint | Config V8 coverage, breaking API |

---

## ARQUIVOS A CRIAR/ATUALIZAR

- `audit-baseline.json` (FASE 0)
- `audit-final.json` (FASE 4)
- `BUILD_SECURITY.md` — mitigacao tar (FASE 1.2.2)
- `ELECTRON_43_MIGRATION.md` — spike results (FASE 2.1.3)
- `package.json` / `package-lock.json` — atualizados

---

## CRITERIOS DE ACEITACAO PARA MERGE

- [ ] 0 CRITICAL vulnerabilities
- [ ] 0 HIGH vulnerabilities (exceto Electron 32 / electron-builder 25 — documentados)
- [ ] `npm run ci` verde (lint + typecheck + 526 testes)
- [ ] `npm run build` verde
- [ ] `npm run build:win` verde (Windows VM)
- [ ] Diff `audit-baseline.json` -> `audit-final.json` mostra reducao esperada