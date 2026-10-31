# PLANO TÉCNICO: Minimizar "Erro na Atualização" (notificação)

> Documento temporário/técnico para implementação posterior.

## 1. Objetivo
Reduzir a frequência e o impacto da notificação vermelha "Erro na Atualização"
mostrada pelo `UpdateManager`, tratando erros recuperáveis como não-erro e
fornecendo feedback acionável.

## 2. Causas-raiz observadas (investigação)
- `autoUpdater.checkForUpdates()` falha em rede instável/offline → notifica `update:error`
  com toast vermelho (já parcialmente mitigado com retry/backoff + offline handling).
- Falhas de download (sha512 mismatch, 404, abort) → `update:error` vermelho.
- `quitAndInstall` pode falhar silenciosamente → fallback relaunch.
- `bg-danger`/`bg-success` indefinidos (já corrigido para `bg-red-600`/`bg-green-600`).
- Erros não classificados (ex.: "Cannot find latest.yml") tratados como erro.

## 3. Melhorias propostas (ordenadas por impacto)
1. **Classificação de erros** em `update-manager.cjs`: categorizar em
   `network | not_found | integrity | permission | unknown`. Apenas `unknown`/`integrity`
   geram toast vermelho; os demais viram status `latest`/aviso neutro.
2. **Retry no download** (`downloadUpdate`): 3 tentativas com backoff; se falhar,
   notificar `update:error` com mensagem amigável ("Falha ao baixar. Tente novamente.").
3. **Validação de sha512 antes de notificar**: se mismatch, limpar cache e re-tentar
   uma vez; se persistir, notificar com ação "Tentar novamente".
4. **Feedback acionável na UI** (`UpdateManager.tsx`): botão "Tentar novamente" já existe;
   adicionar botão "Ver detalhes" que copia o erro para clipboard (para suporte).
5. **Log estruturado**: registrar categoria + mensagem em `structured.log` para
   diagnóstico (via `logger.cjs`).
6. **Dedup de notificações**: não mostrar toast vermelho se já mostrado nos últimos 60s
   (evita spam em falhas repetidas do intervalo de 1h).
7. **Status "offline" distinto**: já implementado via retry; garantir que a UI não mostre
   vermelho para offline.

## 4. Arquivos a modificar
- `main/update-manager.cjs` — classificação, retry no download, dedup, logging.
- `src/components/organisms/UpdateManager.tsx` — feedback acionável, dedup visual.

## 5. Critérios de pronto
- Erro de rede não mostra toast vermelho (status `latest`).
- Erro de integridade mostra vermelho com "Tentar novamente".
- Download com falha transitória tenta 3x antes de notificar.
- Testes manuais: simular offline → sem vermelho; simular 404 → vermelho com retry.
- Lint + typecheck limpos.

## 6. Riscos
- Retry pode mascarar falhas persistentes → limitar a 3 tentativas e notificar.
- Dedup de 60s pode atrasar notificação legítima → usar chave (categoria+mensagem).

## 7. Ordem de implementação
1. Classificação de erros + logging.
2. Retry no download.
3. Dedup de notificações.
4. Feedback acionável na UI.
5. Commit + push + bump + release.
EOF