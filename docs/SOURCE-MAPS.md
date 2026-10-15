# Source Maps — Guia de Configuração e CI/CD

## Visão Geral

Source maps permitem que o Sentry exiba stack traces apontando para os arquivos originais (TypeScript/React) em vez do código minificado de produção. Isso é essencial para debug eficiente em produção.

## Como Funciona

1. **Build (Vite)**: Gera os arquivos `.js` minificados + `.js.map` (source maps)
2. **Upload (@sentry/vite-plugin)**: Envia os source maps para o Sentry durante o build
3. **Sentry**: Usa os source maps para "desminificar" stack traces automaticamente
4. **Resultado**: Stack traces no dashboard do Sentry mostram código original legível

## Configuração Local

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` (ignorado pelo git) com:

```bash
# Sentry DSN (obrigatório para error tracking)
VITE_SENTRY_DSN=https://xxxxxx@oXXXXXXX.ingest.sentry.io/XXXXXXX

# Sentry Source Maps (obrigatório para upload)
SENTRY_AUTH_TOKEN=seu_token_aqui
SENTRY_ORG=acai-wave
SENTRY_PROJECT=acai-wave-pdv
VITE_APP_VERSION=1.3.7
```

### 2. Obter o Sentry Auth Token

1. Acesse https://sentry.io/settings/auth-tokens/
2. Crie um token com escopo `project:write`
3. Copie o token gerado

### 3. Build Local com Source Maps

```bash
# O build gera os source maps e envia ao Sentry automaticamente
npm run build

# Verificar se os source maps foram gerados
ls dist/assets/*.map

# Verificar se foram enviados ao Sentry (requer SENTRY_AUTH_TOKEN)
# O plugin exibe logs no console durante o build
```

### 4. Verificar Source Maps no Build

```bash
# Verificação rápida (não falha se não houver source maps)
npm run verify:sourcemaps

# Verificação estrita (falha se não houver source maps)
npm run verify:sourcemaps:strict

# Com diretório personalizado
node scripts/verify-sourcemaps.cjs --dist-dir dist --strict
```

## Configuração CI/CD (GitHub Actions)

### 1. Adicionar Secrets no GitHub

No repositório do GitHub, vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `SENTRY_AUTH_TOKEN` | Token de autenticação do Sentry | Sim |
| `SENTRY_ORG` | Organização no Sentry (padrão: `acai-wave`) | Não |
| `SENTRY_PROJECT` | Projeto no Sentry (padrão: `acai-wave-pdv`) | Não |

### 2. Workflows Atualizados

Os workflows `ci.yml` e `release.yml` já estão configurados para:

- Passar as variáveis de ambiente do Sentry durante o build
- Fazer upload automático dos source maps via `@sentry/vite-plugin`
- Verificar se o upload foi realizado

### 3. Verificar Upload no CI

Após um build no CI, verifique os logs do step "Build client (Vite)":

```
[sentry] INFO: Successfully uploaded source maps to Sentry
```

### 4. Verificação Automatizada no CI

O script `scripts/verify-sourcemaps.cjs` pode ser adicionado ao CI para validar automaticamente:

```yaml
- name: Verify source maps
  run: npm run verify:sourcemaps:strict
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

## Verificação no Sentry

### 1. Criar um Erro de Teste

```javascript
// Em qualquer componente React, temporariamente:
useEffect(() => {
  throw new Error('Teste de source map')
}, [])
```

### 2. Verificar no Dashboard do Sentry

1. Acesse o projeto no Sentry
2. Vá em **Issues**
3. Abra o erro de teste
4. Verifique se o stack trace mostra:
   - ✅ Arquivos originais (`.tsx`, `.ts`)
   - ✅ Números de linha corretos
   - ✅ Código fonte legível

Se o stack trace mostrar código minificado, os source maps não foram enviados corretamente.

## Troubleshooting

### Source maps não são enviados

**Causa**: `SENTRY_AUTH_TOKEN` não configurado

**Solução**:
```bash
# Verificar se a variável está definida
echo $SENTRY_AUTH_TOKEN

# Se vazio, configure no .env.local ou nos secrets do GitHub
```

### Stack trace ainda mostra código minificado

**Causa 1**: Source maps não foram enviados para o release correto

**Solução**: Verifique se `VITE_APP_VERSION` está configurado e corresponde ao release no Sentry

**Causa 2**: O erro foi capturado antes do upload dos source maps

**Solução**: Aguarde o próximo build e verifique novamente

**Causa 3**: O source map foi enviado mas o Sentry não conseguiu processar

**Solução**: Verifique os logs do build para erros do plugin

### Build falha com erro de autenticação do Sentry

**Causa**: Token inválido ou expirado

**Solução**:
1. Gere um novo token em https://sentry.io/settings/auth-tokens/
2. Atualize o secret `SENTRY_AUTH_TOKEN` no GitHub

### Source maps presentes no dist/ após build com token

**Causa**: O upload pode ter falhado silenciosamente

**Solução**:
1. Verifique os logs do build para erros do `@sentry/vite-plugin`
2. Execute `npm run verify:sourcemaps:strict` para diagnóstico detalhado
3. Verifique se o token tem escopo `project:write`

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Build (Vite)                          │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Código TS  │───▶│  Terser     │───▶│  JS Min     │     │
│  │  (src/)     │    │  (minify)   │    │  (dist/)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │           │
│         │                   ▼                   │           │
│         │           ┌─────────────┐             │           │
│         └──────────▶│ Source Map  │             │           │
│                     │ (.js.map)   │             │           │
│                     └─────────────┘             │           │
│                           │                     │           │
│                           ▼                     │           │
│                     ┌─────────────┐             │           │
│                     │ @sentry/    │             │           │
│                     │ vite-plugin │             │           │
│                     └─────────────┘             │           │
│                           │                     │           │
└───────────────────────────┼─────────────────────┼───────────┘
                            │                     │
                            ▼                     ▼
                    ┌─────────────┐       ┌─────────────┐
                    │   Sentry    │       │  Bundle     │
                    │   Server    │       │  (dist/)    │
                    │             │       │  (sem .map) │
                    │  Source Map │       └─────────────┘
                    │  + Release  │
                    └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  Dashboard  │
                    │  (stack     │
                    │   trace     │
                    │   legível)  │
                    └─────────────┘
```

## Módulo de Utilidade (TypeScript)

O módulo `src/services/sourcemaps.ts` fornece funções para validação programática de source maps:

```typescript
import { validateSourceMap, hasSourceMappingURL } from './services/sourcemaps';

// Validar um source map
const result = validateSourceMap(sourceMapContent, fileSize);
if (!result.valid) {
  console.error('Source map inválido:', result.issues);
}

// Verificar se um arquivo JS tem referência a source map
const hasMap = hasSourceMappingURL(jsContent);
```

## Testes

Os testes para o módulo de source maps estão em `src/tests/sourcemaps.test.ts`:

```bash
# Rodar testes de source maps
npm test -- --run src/tests/sourcemaps.test.ts
```

## Referências

- [Sentry Vite Plugin](https://docs.sentry.io/platforms/javascript/guides/vite/)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Sentry Auth Tokens](https://docs.sentry.io/product/accounts/auth-tokens/)
