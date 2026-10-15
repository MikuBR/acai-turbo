# Sentry — Error Tracking

## Visão Geral

O Sentry está integrado ao Açaí Wave para monitoramento de erros em produção. Ele captura erros do main process (Electron) e do renderer (React), permitindo debug rápido e eficiente.

## Configuração

### 1. Criar conta no Sentry

1. Acesse [sentry.io](https://sentry.io) e crie uma conta gratuita
2. Crie um novo projeto (selecione "Electron" como plataforma)
3. Copie o DSN (Data Source Name) do projeto

### 2. Configurar DSN

Adicione o DSN ao arquivo `.env.local` (não versionado):

```bash
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@oXXXXXXX.ingest.sentry.io/XXXXXXX
```

### 3. Build com Source Maps

O Vite está configurado para gerar source maps em produção. Para fazer upload dos source maps ao Sentry automaticamente, instale o plugin do Sentry:

```bash
npm install --save-dev @sentry/vite-plugin
```

E adicione ao `vite.config.js`:

```js
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'sua-org',
      project: 'acai-wave',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  // ...
});
```

## Funcionalidades

### Main Process (Electron)

- **Erros não tratados**: Capturados automaticamente
- **Breadcrumbs**: Operações críticas (login, logout, checkout, cash, iFood)
- **User tracking**: Usuário logado é associado aos erros
- **Tags**: Plataforma, tipo de erro, canal IPC

### Renderer (React)

- **ErrorBoundary**: Erros de componentes React são reportados
- **Breadcrumbs**: Navegação, ações do usuário
- **User feedback widget**: Botão flutuante para reportar problemas
- **Performance monitoring**: Web Vitals integrados

### Breadcrumbs Automáticos

Os seguintes eventos geram breadcrumbs automaticamente:

| Categoria | Eventos |
|-----------|---------|
| `auth` | Login, logout, falhas de autenticação |
| `checkout` | Início e conclusão de pedidos |
| `cash` | Abertura/fechamento de caixa, movimentações |
| `ifood` | Novos pedidos, cancelamentos, erros |
| `ipc` | Operações críticas via IPC |
| `error` | Erros capturados pelo ErrorBoundary |

## Alertas (Sentry Rules)

Configure alertas no painel do Sentry para:

1. **Erros críticos**: Notificar quando um novo erro aparece
2. **Alta taxa de erros**: Notificar quando a taxa de erros aumenta
3. **Erros de iFood**: Notificar quando a integração com iFood falha
4. **Erros de pagamento**: Notificar quando há falhas no checkout

## Desenvolvimento

O Sentry **não** envia dados em desenvolvimento. Para testar localmente:

```bash
# Simular produção localmente
NODE_ENV=production npm run build
```

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_SENTRY_DSN` | DSN do projeto Sentry | Sim (produção) |
| `SENTRY_AUTH_TOKEN` | Token para upload de source maps | Opcional |
| `VITE_APP_VERSION` | Versão do app (para release tracking) | Opcional |

## Troubleshooting

### Sentry não envia dados

1. Verifique se `VITE_SENTRY_DSN` está configurado
2. Verifique se `NODE_ENV=production`
3. Verifique o console do Electron para erros de inicialização

### Source maps não funcionam

1. Verifique se `@sentry/vite-plugin` está instalado
2. Verifique se `SENTRY_AUTH_TOKEN` está configurado
3. Verifique se o source map foi gerado no build

### Erros duplicados

1. Verifique se o ErrorBoundary não está reportando erros já capturados
2. Verifique se não há dupla inicialização do Sentry
