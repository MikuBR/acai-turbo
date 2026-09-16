# Guia Rápido de Versionamento — Açaí Wave

##-visão geral

Este projeto usa **Semantic Versioning 2.0.0** (MAJOR.MINOR.PATCH) para versionar releases oficiais.

### Sempre atualizar

1. **package.json** → versão do código
2. **CHANGELOG.md** → entrada da versão
3. **Tag git** → `vX.Y.Z` anotada

### Fluxo de release

```
1. Faz os commits do trabalho
2. node scripts/bump-version.cjs patch|minor|major [versão]
3. git push origin main
4. git push origin vX.Y.Z
5. GitHub Actions gera installer + publica release automaticamente
```

### Decisão rápida do tipo

- **Corrigir crash, cálculo errado, falha de integridade** → patch
- **Nova funcionalidade, novo módulo, nova integração** → minor
- **Remover/alterar algo que quebra usuários existentes** → major
- **Nenhuma das opções acima mas ainda assim mudança relevante** → minor

### Regra de ouro

Se você duvida, use **patch**. Release maiores (minor/major) devem ser decididos com mais cuidado porque implicam em comunicação mais ampla para os usuários.

### O que NÃO é release

- Commits de CI, workflow, configuração — mas se forem versionados, são parte do commit history da release
- Commits de debug, 임시 파일, 문서 작업 — não são versionados individualmente
- PRs que ainda não foram mergeados — versionamento ocorre somente na branch main

### Verificação antes de push

- `npm run ci` (ou pelo menos `npm run lint && npm run typecheck && npm run test`)
- Build Windows local se possível: `npm run package:win`
- CHANGELOG.md atualizado
- package.json sincronizado

### Auliário

Para ajudar na decisão do tipo de release, use:

```bash
node scripts/bump-version.cjs patch   # corrige bug
node scripts/bump-version.cjs minor   # adiciona funcionalidade
node scripts/bump-version.cjs major   # quebra compatibilidade
node scripts/bump-version.cjs status  # mostra versão atual e tags
```

O script é apenas auxiliar — ele não decide o tipo da release. A decisão é humana.
