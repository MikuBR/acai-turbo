# PLANO TÉCNICO: Melhoria da aba Clientes + fluxo de comandas (delivery)

> Documento temporário e técnico para implementação posterior por IA. Manter preciso e não
> omitir instruções. Baseado em investigação real do repositório acai-turbo.

## 1. Objetivo
Tornar a seleção de clientes mais ágil no setor de comandas (delivery) e persistir
automaticamente clientes novos cadastrados manualmente, evitando re-digitação.

## 2. Contexto atual (investigado)

### 2.1 Arquivos relevantes
- `src/components/organisms/NewTableModal.tsx` — modal de criação de comanda.
  - Props: `isOpen, onClose, tableType, setTableType, newTableName, setNewTableName, delivForm, setDelivForm, handleAddTable`.
  - `delivForm: { name, phone, address, fee }`.
  - Lookup automático por telefone via `clients:get-by-phone` (debounce 350ms) — já existe.
- `src/components/organisms/SettingsModal.tsx` — aba "users"/"clients" com CRUD de clientes.
  - Usa `ClientForm`, handlers `handleClientSubmit`, `loadClients`, `loadClientOrders`.
- `src/components/forms/ClientForm.tsx` — form de cliente.
- `database/db.cjs` — funções `getClients, addClient, updateClient, deleteClient, getClientByPhone, getClientOrders, addClientOrder`.
- `main.cjs` — IPC: `clients:get, clients:get-by-phone, clients:add, clients:update, clients:delete, clients:get-orders, clients:add-order`.
- `database/validate.cjs` — validação dos canais (já registrados).

### 2.2 Fluxo atual de delivery
1. Operador abre `NewTableModal`, escolhe DELIVERY.
2. Digita nome/telefone/endereço/taxa.
3. Lookup por telefone preenche nome/endereço se cliente existir e campos vazios.
4. `handleAddTable` cria a comanda (definido em `PdvScreen`/`AppLayout`).
5. NÃO persiste cliente novo em `clients`.

## 3. Mudanças desejadas

### 3.1 Botão "Selecionar cliente cadastrado"
No modo DELIVERY do `NewTableModal`, adicionar botão acima dos inputs:
`[Selecionar cliente cadastrado]`.

Ao clicar, abre modal secundário (overlay z-[800]) com:
- Input de busca (filtra por nome ou telefone, client-side).
- Lista scrollável de clientes (`clients:get`), cada item clicável.
- Ao clicar em um cliente: `setDelivForm({ name, phone, address, fee: prev.fee })` e fecha modal.
- Botão "Fechar" / clique fora fecha.

Carregar lista ao abrir modal (useEffect dependente de `showClientPicker`).

### 3.2 Digitação manual (já existe) — manter
Sem alterações nos inputs existentes.

### 3.3 Persistência automática ao salvar comanda
No handler de abertura de comanda (onde `handleAddTable` é definido), após criar a
mesa/pedido de delivery, se os dados digitados não corresponderem a cliente existente:
- Chamar `clients:get-by-phone`.
- Se não existir e `name` não vazio, chamar `clients:add` com
  `{ name, phone, address, email: null, notes: null }`.
- Tratar erros silenciosamente (não bloquear abertura da comanda).
- Fire-and-forget (não await bloqueante).

## 4. Arquivos a modificar / criar

| Arquivo | Ação |
|---|---|
| `src/components/organisms/NewTableModal.tsx` | Adicionar estado `showClientPicker`, botão, renderizar `ClientPickerModal`. |
| `src/components/organisms/ClientPickerModal.tsx` (NOVO) | Componente de seleção de cliente. |
| `src/features/pdv/PdvScreen.tsx` (ou onde `handleAddTable` vive) | Adicionar persistência automática de cliente novo. |
| `src/tests/NewTableModal.test.jsx` (NOVO) | Testes de abertura, filtro, seleção, preenchimento. |
| `src/tests/clients-autosave.test.jsx` (NOVO) | Teste de persistência automática. |

## 5. Contratos / Props

### ClientPickerModal
```tsx
interface ClientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: { id; name; phone; address; email; notes }) => void;
}
```
- Carrega `clients:get` ao abrir (useEffect em isOpen).
- Busca client-side por nome/telefone (case-insensitive, filtro em memória).
- Item clicável → `onSelect(client)` + `onClose()`.

### NewTableModal
- Novo estado: `const [showClientPicker, setShowClientPicker] = useState(false);`
- Botão: `<button onClick={() => setShowClientPicker(true)}>Selecionar cliente cadastrado</button>`
- Renderizar `<ClientPickerModal isOpen={showClientPicker} onClose={() => setShowClientPicker(false)} onSelect={(c) => { setDelivForm(prev => ({...prev, name: c.name, phone: c.phone || prev.phone, address: c.address || prev.address})); setShowClientPicker(false); }} />`

### Persistência automática (delivery branch do handleAddTable)
```ts
const persistClientIfNeeded = async (form) => {
  const ipc = getIPC(); if (!ipc) return;
  try {
    if (!form?.name?.trim()) return;
    const res = await ipc.invoke('clients:get-by-phone', form.phone);
    if (res?.data) return; // já existe
    await ipc.invoke('clients:add', {
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
      email: null,
      notes: null,
    });
  } catch { /* não bloquear abertura da comanda */ }
};
```
Chamar como fire-and-forget (`.then().catch()`) para não bloquear `handleAddTable`.

## 6. Edge cases
- Telefone vazio → não persistir (evitar duplicatas sem chave).
- Nome vazio → não persistir.
- Cliente já existe (mesmo telefone) → não duplicar (dedup por `getClientByPhone`).
- Lookup automático existente (debounce) continua funcionando e tem prioridade (não
  sobrescrever campos já preenchidos pelo operador).

## 7. Testes (critérios de pronto)
- `NewTableModal`: abrir modal de seleção, filtrar, clicar cliente → campos preenchidos.
- Persistência: mock `clients:get-by-phone` retornando null → `clients:add` chamado com dados.
- Persistência: mock retornando cliente existente → `clients:add` NÃO chamado.
- Suíte completa verde, lint + typecheck limpos.

## 8. Riscos
- `handleAddTable` está em `PdvScreen`/`AppLayout` (não no modal) — localizar exatamente
  antes de editar (grep `handleAddTable`).
- Não bloquear abertura da comanda se persistência falhar.
- Manter compatibilidade com testes existentes (verificar se há testes de NewTableModal).

## 9. Ordem de implementação sugerida
1. Criar `ClientPickerModal.tsx`.
2. Integrar no `NewTableModal.tsx`.
3. Adicionar persistência em `handleAddTable`.
4. Criar testes.
5. Typecheck + lint + testes.
6. Commit + push + bump + release.

## 10. Notas para a IA implementadora
- Usar Tailwind classes existentes no tema (evitar `bg-danger`/`bg-success` indefinidos —
  usar `bg-red-600`/`bg-green-600`).
- Seguir convenções: componentes em `src/components/organisms/`, re-export em `index.js`.
- IPC apenas via `contextBridge` (já allowlisted).
- Todo bug fix vem com teste de regressão.
EOF