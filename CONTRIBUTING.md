# Contribuindo para o OrganizAI

## Como contribuir

1. Fork o repositorio
2. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/minha-feature
   ```
3. Faca suas alteracoes
4. Garanta que o build passa:
   ```bash
   npm run build
   npm run lint
   ```
5. Commit usando mensagens semanticas
6. Abra um Pull Request

## Padrao de branches

| Prefixo | Uso |
|---------|-----|
| `feat/` | Nova funcionalidade |
| `fix/` | Correcao de bug |
| `docs/` | Documentacao |
| `refactor/` | Refatoracao sem mudanca de comportamento |
| `chore/` | Tarefas de manutencao |

## Padrao de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona filtro por genero no modulo de filmes
fix: corrige crash ao deletar transacao sem categoria
docs: atualiza README com instrucoes de deploy
chore: atualiza dependencias do projeto
```

## Regras

- TypeScript strict mode — sem `any` explicito
- Todas as variaveis de ambiente em `.env.local`, nunca no codigo
- Testes devem passar antes de abrir PR
- Mantenha o build limpo (`npm run build` sem erros)
