# Cloudflare Worker — Supabase Proxy

Proxy HTTP que fica entre o app e o Supabase. Serve para dispositivos /
redes que não conseguem alcançar `*.supabase.co` diretamente (QUIC/TLS
handshakes travando, regras WAF classificando o endpoint, filtro de
roteador, etc).

## Deploy manual (primeira vez)

1. Crie uma conta gratuita em <https://cloudflare.com>
2. Dashboard → **Workers & Pages** → **Create Application** → **Create
   Worker**
3. Dê o nome `organizai-api` (ou outro) e clique **Deploy** para gerar
   o Worker base
4. Na página do Worker → botão **Edit Code** no canto superior direito
5. Apague o código de exemplo e cole o conteúdo de
   [`worker.js`](./worker.js)
6. Confira se a constante `SUPABASE_URL` aponta pro seu projeto
7. Clique **Save and Deploy**
8. Copie a URL pública exibida no topo — algo como
   `https://organizai-api.SEU_USUARIO.workers.dev`

## Apontar o app pro Worker

1. GitHub → repositório → **Settings** → **Secrets and variables** →
   **Actions**
2. Edite o secret `VITE_SUPABASE_URL` → cole a URL do Worker
3. Triggera um re-deploy (push qualquer commit no `main`)

Feito. O app passa a falar com o Worker, que repassa pro Supabase sem
que o client saiba.

## Limites (plano grátis)

- 100.000 requests/dia
- 10 ms CPU por request (proxy simples fica bem abaixo disso)
- Sem cartão de crédito exigido

## Voltar pro Supabase direto

Se um dia o bloqueio sumir, basta restaurar `VITE_SUPABASE_URL` pro URL
original `https://<projeto>.supabase.co` e re-deployar. Worker pode
continuar rodando no Cloudflare sem custo.
