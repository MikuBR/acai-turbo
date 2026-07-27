# CI Optimization Protocol

## Pipeline Architecture

```
push/PR → paths-ignore filtro
  ├── lint (ubuntu, 10min timeout)
  ├── audit (ubuntu, 5min timeout, continue-on-error)
  │     ↓
  ├── test (matrix: ubuntu + windows, 15min timeout, --ignore-scripts)
  │     ↓
  └── build-windows (30min timeout, full npm ci)
        ├── validate installer
        ├── upload artifact
        └── [tag v*] → publish GitHub Release
```

## Cache Strategy

| Key | Jobs | Scope |
|---|---|---|
| `deps-linux-${{ hashFiles('package-lock.json') }}` | lint, audit | npm ci full (postinstall) |
| `deps-${{ runner.os }}-test-${{ hashFiles('package-lock.json') }}` | test (ubuntu + windows) | npm ci --ignore-scripts |
| `deps-win-full-${{ hashFiles('package-lock.json') }}` | build-windows | npm ci full (native addons) |

Rules:
- Cache key includes OS + lockfile hash (deterministic)
- `restore-keys` fallbackreduz cache miss parcial
- `npm ci` só roda em cache miss
- `--ignore-scripts` em test jobs (não precisam de Electron)

## Safe-guards

1. **Timeout por job**: lint=10min, audit=5min, test=15min, build=30min
2. **`if: success()`**: test só roda se lint+audit passaram
3. **`fail-fast: true`**: se um OS falhar, cancela o outro
4. **Artifact validation**: build-windows verifica se .exe foi gerado (tamanho, existência)
5. **`continue-on-error`**: audit não bloqueia o pipeline (npm audit pode ter falso positivo)
6. **paths-ignore**: CI ignora commits que só mexem em .md, .gitattributes, .gitignore
7. **`ACTIONS_STEP_DEBUG: false`**: impede vazamento de secrets em debug logs

## Security

1. **Permissions mínimas**: `contents: read` para lint/audit/test; `contents: write` só para build-windows (precisa criar Release)
2. **`GITHUB_TOKEN`** escopo reduzido por job
3. **`npm audit --audit-level=high`**: verifica dependências (não bloqueia, mas alerta)
4. **Sem secrets em variáveis**: GH_TOKEN não aparece em logs
5. **`paths-ignore` reduz superfície**: commits de documentação não disparam CI

## Trigger Rules

| Evento | Jobs executados |
|---|---|
| Push: `main`/`develop` (código) | lint → audit → test → build-windows |
| Push: tag `v*` | lint → audit → test → build-windows + Release |
| PR: `main` (código) | lint → audit → test |
| Push: `main`/`develop` (só .md/.git*) | ❌ Ignorado |
| PR: `main` (só .md/.git*) | ❌ Ignorado |

## Performance Targets

| Job | Antes | Depois | Meta |
|---|---|---|---|
| lint | ~70s | ~20s (cache hit) | <30s |
| audit | — | ~15s | <20s |
| test (ubuntu) | ~195s | ~30s (cache + --ignore-scripts) | <40s |
| test (windows) | ~51s | ~20s (cache) | <30s |
| build-windows | ~90s | ~90s | <120s |
| **Total (tag)** | **~4m** | **~2m** | **<2m30s** |

## Troubleshooting

**Cache miss inesperado**: `hashFiles('package-lock.json')` mudou — npm install/update modificou o lockfile.

**Windows test lento**: verificar se cache hit funcionou. `deps-win-test-` key precisa existir de run anterior.

**build-windows falha**: MSVC tools ausente ou Python setuptools não instalado. `setup-msbuild@v2` + `pip install setuptools` são obrigatórios.

**Release não criada**: verificar se tag começa com `v`, se `permissions: contents: write` está ativo, e se `GITHUB_TOKEN` tem acesso ao repositório.
