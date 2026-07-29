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

## CI / Releases

Em pushes para `main` (sem tag), o CI gera automaticamente uma **pré-release** com versão incrementada a partir da última tag oficial:

```
v1.0.1        ← tag oficial (release normal, Latest)
v1.0.2-ci.29  ← CI build (pré-release)
v1.0.3-ci.30  ← próximo CI build
```

Cada release de CI inclui um checkbox para marcar se foi **testada no Windows**.

```bash
npm run build:win    # Gera instalador em release/
```

## Roadmap

| Prioridade | Funcionalidade |
|------------|----------------|
| 🔜 | [#7 — iFood no delivery](https://github.com/MikuBR/acai-turbo/issues/7) — integração com iFood para receber pedidos automaticamente |
| 🔜 | [#8 — Relatório financeiro em PDF](https://github.com/MikuBR/acai-turbo/issues/8) — exportar relatório diário financeiro em formato PDF |

## Licença

Privado — uso interno.
