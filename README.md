# OrganizAI

Organizador pessoal para casais. Filmes, series, dates e financas — tudo em um lugar.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)

## Modulos

- **Filmes** — Busca via TMDB, status (quero assistir / assistindo / assistido), avaliacao pessoal
- **Series** — Igual a filmes + rastreamento de temporada/episodio
- **Ideias de Dates** — Criar, agendar e detalhar dates com endereco, clima e link do Maps
- **Financeiro** — Dashboard com graficos, lancamento de transacoes e metas com progresso visual

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

## Pre-requisitos

- Node.js 22+
- Conta no [Supabase](https://supabase.com) (plano gratuito)
- API Key do [TMDB](https://www.themoviedb.org/settings/api) (gratuita)

## Instalacao local

```bash
# 1. Clone o repositorio
git clone https://github.com/EuKennedy/organizai.git
cd organizai

# 2. Instale as dependencias
npm install

# 3. Configure as variaveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Configure o banco de dados
# Execute o conteudo de supabase/schema.sql no SQL Editor do Supabase

# 5. Rode o projeto
npm run dev
```

## Variaveis de ambiente

Veja `.env.example` para a lista completa. Todas devem estar em `.env.local` (local) ou GitHub Secrets (CI/CD).

| Variavel | Descricao |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anonima (anon key) do Supabase |
| `VITE_TMDB_API_KEY` | API key do TMDB (v3) |

## Deploy proprio

1. Fork este repositorio
2. Ative GitHub Pages (Settings > Pages > Source: GitHub Actions)
3. Adicione os secrets em Settings > Secrets and variables > Actions:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TMDB_API_KEY`
4. Push para `main` — o deploy e automatico

## Scripts

```bash
npm run dev      # Dev server com HMR
npm run build    # Build de producao
npm run preview  # Preview do build local
npm run lint     # ESLint
```

## Licenca

[MIT](LICENSE)
