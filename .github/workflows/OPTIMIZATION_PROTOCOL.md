# CI/CD Protocol

Documento operacional dos workflows reais em `.github/workflows/`.
Última revisão: reflete o fluxo dual-ABI (Node + Electron) do better-sqlite3.

## Pipeline Architecture

```text
ci.yml — roda em push/PR de main e develop (ignora mudanças só de docs)
  ├── lint-and-typecheck   (ubuntu, 10min)  eslint + tsc
  ├── test-node            (ubuntu, 15min)  bindings Node + vitest --coverage + codecov
  ├── test-electron        (ubuntu, 15min)  binding Electron + check ABI 128
  ├── build                (ubuntu, 15min)  vite build (needs: lint, test-node, test-electron)
  ├── abi-guard            (ubuntu, 10min)  version drift + presença dos scripts dual-ABI
  ├── security-audit       (ubuntu, 15min)  npm audit (critical) + security tests
  ├── dependency-review    (PR only)        dependency-review-action
  └── summary              (always)         agrega resultados; falha se algum job falhou

release.yml — build do installer Windows (NSIS)
  ├── gatilho: workflow_run (dispara quando o CI TERMINA) + workflow_dispatch
  ├── if no job: pula inteiro se o CI não passou (gate por construção)
  ├── detecta tag v* para o SHA aprovado → release versionada; senão windows-installer-<branch>
  ├── npm ci --ignore-scripts → MSBuild → rebuild:native (binding Electron)
  ├── vite build + verify:sourcemaps
  └── electron-builder --win → publica release

release-on-success.yml — release de texto contínua
  └── workflow_run (CI success em main) → atualiza a release rolling edge-main
```

## Dual-ABI Native Bindings

O projeto usa **prebuilds pré-compilados** para os dois runtimes:

| Runtime | ABI | Arquivo | Quem usa |
|---|---|---|---|
| Node.js 22 | 127 | `better_sqlite3.node-node.node` | Vitest (testes) |
| Electron 32.3.3 | 128 | `better_sqlite3.node-electron.node` | app empacotado |

- `scripts/install-sqlite-bindings.cjs` baixa ambos (detecta a versão real do Node),
  com flags `--node-only` / `--electron-only`.
- O binário padrão `better_sqlite3.node` é **sempre sincronizado com o build Node**
  (determinístico para `require('better-sqlite3')` direto nos testes).
- `database/db-binding.cjs` resolve o binding correto em runtime via
  `process.versions.electron`.
- Scripts: `rebuild:node` (node-only), `rebuild:native` (electron-only),
  `rebuild:all` (ambos), `check:node`, `check:native`.

## Trigger Rules

| Evento | Workflows |
|---|---|
| Push `main`/`develop` (código) | ci.yml |
| Push `main`/`develop` (só docs) | ❌ ignorado (paths-ignore) |
| PR `main`/`develop` (código) | ci.yml + dependency-review |
| Push tag `v*` | ❌ ci.yml não roda em tags; a tag é detectada por SHA no release.yml |
| CI **termina** em `main`/`develop` | release.yml (installer) + release-on-success.yml (edge-main) |
| Manual | release.yml (workflow_dispatch) |

> **Ordem de push para release versionada**: como o `ci.yml` não roda em tags,
> o `release.yml` decide o destino comparando o SHA aprovado pelo CI com as
> tags `v*` do repo. Empurre `main` **e** a tag antes de o CI terminar
> (ex.: `git push origin main v1.3.7`). Se a tag subir depois, o commit cai na
> release contínua `windows-installer-main` e a versionada fica de fora.

## Safe-guards

1. **`timeout-minutes`** em todos os jobs (5–15min; build Windows 30min).
2. **`concurrency`** cancela runs antigos do mesmo ref.
3. **`permissions: contents: read`** no topo do ci.yml (menor privilégio);
   `contents: write` só onde cria release.
4. **`paths-ignore`** ignora mudanças só de documentação.
5. **`npm ci`** em vez de `npm install` (respeita o lockfile).
6. **Gate de CI** no release.yml: o job inteiro é pulado (`if` no job) quando o
   CI não passou — e como o gatilho é `workflow_run`, o CI já concluiu antes de
   o job existir (sem corrida).
7. **`if: always()`** no summary, que falha se qualquer job falhou.
8. **ABI guard** detecta drift entre `package.json` e `ELECTRON_VERSION`.

## Troubleshooting

**Testes falham com NODE_MODULE_VERSION**: rode `npm run rebuild:node` — o binário
padrão precisa ser o build Node.

**`check:native` falha no CI Linux**: esperado — o teste de runtime Electron é
pulado fora do Windows (`--skip-electron-test` / `CI=true`).

**Cache miss inesperado**: `hashFiles('package-lock.json')` mudou — algum
install/update alterou o lockfile.

**Release não criada**: verifique `permissions: contents: write` e se a tag
começa com `v` (ou se é push de branch → `windows-installer-<branch>`).

**Installer não publicado mesmo com CI verde**: o `release.yml` dispara por
`workflow_run` quando o CI **termina** — não no push. Se o CI terminou em
`failure`/`cancelled`, o job é pulado de propósito. Confira a conclusão do CI
para o SHA em questão (`gh run list --workflow=ci.yml`).

**Tag `v*` não virou release versionada**: a tag precisa estar no remote antes
de o CI terminar. Empurre `main` e a tag juntos; se a tag subiu depois, o
commit foi publicado como `windows-installer-main`.
