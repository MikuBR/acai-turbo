# Açaí Wave

PDV desktop para loja de açaí — pedidos, catálogo, estoque, financeiro, relatórios e impressão de comandas.

## Stack

- **Frontend**: React 19 + Vite 8 + Tailwind CSS 4 + Zustand
- **Desktop**: Electron 28 (contextIsolation + IPC seguro)
- **Database**: SQLite via better-sqlite3 (WAL mode)
- **Impressão**: node-thermal-printer (TCP/IP + Windows)
- **Build**: electron-builder (NSIS para Windows)

## Pré-requisitos

- Node.js 20+
- npm 10+

### Windows (para desenvolvimento)

- **Visual Studio Build Tools** (ou VS 2022) — necessário para compilar `better-sqlite3`
- **Python 3.x** — necessário para node-gyp
- **Git Bash** (ou WSL) — necessário para husky hooks

## Desenvolvimento

```bash
npm install        # instala dependências + rebuild native addons
npm run dev        # inicia Vite + Electron simultaneamente
```

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Vite + Electron em paralelo |
| `npm run build` | Build do frontend (Vite) |
| `npm run build:win` | Build + empacotamento Windows (NSIS) |
| `npm run test` | Vitest (unit + integração) |
| `npm run lint` | ESLint (src/ + database/) |

## Estrutura

```
src/
├── components/       # Atomic Design (atoms → molecules → organisms)
│   ├── atoms/        # Button, Badge, Input, Select, ProductCard
│   ├── molecules/    # ModalHeader, ModalFooter, SettingsTabs
│   ├── organisms/    # Sidebar, CartPanel, CatalogPanel, modais
│   └── forms/        # UserForm, ProductForm, ClientForm, etc.
├── store/            # Zustand store (global state)
├── styles/           # Tema CSS com variáveis
├── shared/           # Constantes e utilitários compartilhados
└── tests/            # Testes com Vitest + Testing Library

database/             # SQLite + schema + validadores IPC
├── db.cjs            # Database initialization + queries
└── validate.cjs      # Validação de entrada IPC (allowlist)

main.cjs              # Electron main process (IPC handlers)
preload.js            # Preload script (contextBridge + channel allowlist)
```

## IPC Security

Comunicação entre renderer e main via `contextBridge` com **allowlist explícita** de canais. Nenhum `ipcRenderer` bruto é exposto ao frontend. Validação de entrada em `validate.cjs`.

## Windows Build

O CI faz build automaticamente em pushes para `main` usando `windows-2022`. O instalador NSIS é gerado e disponibilizado como artifact.

```bash
npm run build:win    # Gera instalador em release/
```

## Licença

Privado — uso interno.
