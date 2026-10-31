# Plano: Senha de Gerente por Usuário

## Objetivo
Vincular a "senha de gerente" a cada usuário, de forma obrigatória, eliminando a senha global única (risco de segurança). Cada usuário (admin/manager/operator) terá sua própria senha de gerente, usada nas ações protegidas (editar/excluir produtos, promoções, cancelar pedidos/estorno).

## Escopo

### 1. Banco de dados (migração)
- Nova migração `006-add-manager-password-to-users.cjs` (aditiva, nunca editar aplicada).
- Adicionar coluna `manager_password TEXT` na tabela `users`.
- Backfill: usuários existentes recebem senha temporária (ex.: hash de string aleatória) e flag `must_change_manager_password = 1` (nova coluna boolean) para forçar troca no próximo login.
- Manter `config.manager_password` por compatibilidade (deprecated) até migração completa; remover em versão futura.

### 2. Backend (main.cjs + db.cjs)
- `verify-password` (auth:verify-password): usar `bcrypt.compareSync(password, user.manager_password)` do usuário logado (`currentSession.user`). Se não tiver senha definida, retornar inválido (forçar definição).
- `update-password` (auth:update-password): atualizar `users.manager_password` do usuário logado (não mais `config.manager_password`).
- `reset-manager-password` (auth:reset-manager-password): admin reseta a senha de gerente de um usuário específico (parâmetro `userId`), gera senha temporária, seta flag `must_change_manager_password = 1`.
- Novo handler `users:set-manager-password` (ou reutilizar update) para definir/alterar.
- Rate limit e audit log por usuário.

### 3. Frontend (SettingsModal + UserForm)
- Formulário de usuário ganha campo "Senha de Gerente" (obrigatório ao criar/editar).
- Bloco "Alterar Senha" (própria) altera a senha de gerente do usuário logado.
- Recuperação de senhas (admin): resetar senha de gerente de um usuário específico (selecionar usuário).
- Indicador visual de "senha de gerente pendente" para usuários que ainda não definiram.
- Forçar definição no primeiro uso (modal/prompt) se `must_change_manager_password`.

### 4. Migração de dados existentes
- Script de backfill na migração: para cada usuário, gerar senha temporária e marcar flag.
- Exibir senha temporária via dialog nativo (como já feito em reset-manager-password).

### 5. Testes
- Unit: verify-password com senha por usuário, update, reset.
- Regressão: usuário sem senha de gerente não pode executar ações protegidas.
- E2E (Playwright): fluxo de criação de usuário + definição de senha de gerente.

### 6. Compatibilidade
- Manter `config.manager_password` lido como fallback (deprecated) por uma versão, depois remover.
- Audit log registra `MANAGER_PASSWORD_*` por `user_id`.

## Riscos
- Usuários existentes precisarão definir nova senha → comunicação/UX.
- Migração deve ser idempotente e reversível (backup antes).
- Rate limit por usuário (evitar brute force por usuário).

## Ordem de implementação
1. Migração DB (coluna + backfill).
2. Backend (verify/update/reset por usuário).
3. Frontend (form + UI).
4. Testes + E2E.
5. Remover fallback global em versão posterior.

## Decisões já tomadas
- Obrigatória para todos os usuários.
- Ações protegidas usam a senha do usuário logado.
- Documentar plano antes de implementar.

## Próximo passo
Aguardar aprovação do Caue para iniciar a implementação (migração → backend → frontend → testes).
EOF