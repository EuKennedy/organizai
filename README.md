# OrganizAI

> **Projeto de uso pessoal.** Este app nasceu de uma necessidade real minha e da minha namorada — organizar filmes, series, dates, financas e produtos de beleza em um lugar so, sem depender de planilhas espalhadas. Publicamos o codigo aberto porque acreditamos em compartilhar, mas **a instancia que voce ve no GitHub Pages e so nossa**: com nossos dados, nossa lista, nossos mimos.

Filmes, series, dates, mimos e financas — organizador pessoal para casais.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)

## Modulos

- **Filmes** — Busca via TMDB com diretor e elenco, carrosseis por status, avaliacao pessoal, filtros dinamicos por genero
- **Series** — Mesmo padrao de filmes + rastreamento de temporada/episodio
- **Dates** — Planejamento de encontros com endereco, clima, data/hora e link do Maps
- **Mimos** — Lista de produtos (maquiagem, skincare, acessorios, piercings) com status "tenho / desejo / acabou" e link de compra
- **Despesas** — Controle financeiro mensal com grafico por categoria e lancamentos
- **Metas** — Metas financeiras com depositos, progresso visual e celebracao ao completar

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript (strict) + Vite 8 |
| UI | Tailwind CSS v4 + shadcn/ui (new-york) |
| Animacoes | Framer Motion |
| Graficos | Recharts |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| API Externa | TMDB (filmes e series) |
| Deploy | GitHub Pages via GitHub Actions |

## Quer usar para voce?

Este repositorio **nao inclui nenhum dado, credencial ou banco nosso** — todo o conteudo privado vive em servicos externos com RLS (Row Level Security) ativado, acessado apenas pelas nossas contas pessoais.

Se voce quiser rodar sua propria instancia do OrganizAI (pra voce, sua pessoa, sua familia), voce precisa **criar suas proprias credenciais**. O passo a passo esta logo abaixo.

### Pre-requisitos

- Node.js 22+
- Uma conta gratuita no [Supabase](https://supabase.com) (crie a sua)
- Uma API Key gratuita do [TMDB](https://www.themoviedb.org/settings/api) (crie a sua)

### Instalacao local

```bash
# 1. Faca um fork deste repositorio e clone o seu fork
git clone https://github.com/SEU_USUARIO/organizai.git
cd organizai

# 2. Instale as dependencias
npm install

# 3. Configure suas variaveis de ambiente
cp .env.example .env.local
# Edite .env.local colocando SUAS credenciais (nao as minhas)

# 4. Configure o banco de dados no SEU Supabase
# No dashboard do seu projeto, abra SQL Editor e rode supabase/schema.sql

# 5. Desative sign-ups publicos no seu Supabase (Auth > Providers)
# e crie as contas manualmente (Auth > Users > Add user)

# 6. Rode o projeto localmente
npm run dev
```

### Variaveis de ambiente

Todas devem estar em `.env.local` (gitignored) ou GitHub Secrets (CI/CD). Veja `.env.example`.

| Variavel | Descricao |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do SEU projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key do SEU projeto Supabase |
| `VITE_TMDB_API_KEY` | SUA API key do TMDB (v3) |

### Deploy proprio (GitHub Pages)

1. Fork este repositorio
2. Settings > Pages > Source: GitHub Actions
3. Settings > Secrets and variables > Actions — adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TMDB_API_KEY`
4. Ajuste `base` em `vite.config.ts` e `basename` em `src/main.tsx` pro nome do seu repositorio
5. Push pra `main` — deploy automatico

## Contribuindo

Sinta-se a vontade pra abrir issues ou PRs com melhorias, bugfixes ou novas ideias. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

**Importante:** nenhum PR deve conter credenciais, dados pessoais ou instancias privadas. Todo desenvolvimento deve ser feito contra o seu proprio Supabase de teste.

## Scripts

```bash
npm run dev      # Dev server com HMR
npm run build    # Build de producao
npm run preview  # Preview do build local
npm run lint     # ESLint
```

## Seguranca

- Row Level Security (RLS) ativo em todas as tabelas — cada usuario so acessa os proprios dados
- Nenhum secret no repositorio (todas as credenciais ficam em `.env.local` ou GitHub Secrets)
- Sign-ups publicos desativados na nossa instancia (so adicionamos contas manualmente)

## Licenca

[MIT](LICENSE) — use, modifique e compartilhe livremente.
