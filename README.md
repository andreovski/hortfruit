# Morro Verde Hortifruti

Catálogo semanal de hortifruti para restaurantes e o painel da Morro Verde.

- **App do restaurante** (`/`, público, feito para o celular): vê o que tem na semana, o preço e o
  mínimo, monta o pedido e, no fim, se identifica só pelo telefone. O pedido cai direto no painel,
  e o restaurante acompanha, edita ou cancela pelo link do pedido até quinta, 12h.
- **Painel ADM** (`/admin`, com senha): pedidos da semana, lista de compra (imprimir e CSV),
  clientes, produtos e preços com a publicação da lista da semana, e ajustes.

Escopo em [`docs/escopo.md`](docs/escopo.md); telas do protótipo em `docs/prototipo/`.

## Estrutura

| Pasta              | O que é                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `apps/api`         | API Fastify + Prisma (Postgres)                                                          |
| `apps/web`         | SPA Vite + React 19, TanStack Router e Query, Tailwind 4; `server.mjs` serve em produção |
| `packages/schemas` | Schemas Zod e tipos que a API e o web dividem                                            |
| `packages/core`    | Regras puras: dinheiro, telefone, ciclo semanal, validação do pedido                     |

## Rodando local

```bash
pnpm install
docker compose up -d                       # Postgres 18 na porta 5432
cp apps/api/.env.example apps/api/.env     # e preencha OWNER_* e WHATSAPP_NUMBER
pnpm --filter=api... run build             # os pacotes exportam de dist/
pnpm --filter api exec prisma migrate deploy
pnpm --filter api seed                     # primeiro ADM, ajustes e os produtos iniciais
pnpm --filter api seed:demo                # opcional: restaurantes e pedidos de exemplo
pnpm dev                                   # API em :3333, web em :5173
```

Catálogo em http://localhost:5173 e painel em http://localhost:5173/admin.

Comandos da raiz: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Os e2e da API rodam
com `pnpm --filter api test:e2e` contra o banco `hortifruit_test`.

## Deploy

Railway, com a configuração em `.railway/railway.ts`. Roteiro e variáveis em
[`docs/deploy/railway.md`](docs/deploy/railway.md).
