# Color Tokens

Propósito: registrar tokens de cor do Açaí Wave, como usar e como estender.

## Tokens principais
- `--bg-primary`, `--bg-secondary`, `--bg-card`, `--bg-card-hover`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border`, `--border-light`
- `--accent-primary`, `--accent-secondary`
- `--highlight`, `--highlight-bg`
- `--danger`, `--success`, `--warning`, `--info`

## Dark mode
- Ative com a classe `.dark` em `<html>` ou `<body>`.
- Tokens em `.dark` sobrescrevem os de `:root`.

## Onde alterar
- `src/styles/theme.css` — centralizado.
- `tailwind.config.js` — mapeia tokens para utilitários.
- `src/index.css` — @theme associa nomes semânticos.

## Como estender
- Adicione token em `theme.css` e mapeie em `tailwind.config.js`.
- Valide contraste e acessibilidade antes de publicar alterações.