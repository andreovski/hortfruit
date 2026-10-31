# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório.

## O que é

Morro Verde Hortifruti: venda semanal de hortifruti em quantidade para restaurantes. Duas partes no
mesmo SPA:

- **App do restaurante** (público, mobile-first, sem login): catálogo da semana, montagem do pedido
  e identificação **só pelo telefone** no fechamento. Rotas na raiz (`/`, `/produto/$id`,
  `/finalizar`, `/pedido/$token`, `/meus-pedidos`).
- **Painel ADM** (`/admin`, desktop-first, com senha): pedidos, lista de compra, clientes, produtos
  e preços, ajustes.

Escopo de produto em `docs/escopo.md`. Textos da interface em português do Brasil. A interface fala
em **cliente**, nunca em "restaurante": a venda não é só para restaurantes.

Monorepo pnpm + Turborepo, no molde do Jottape:

- `apps/api`: Fastify 4 + Prisma 5 (Postgres). Rotas em `src/http/routes/` (sem prefixo `/api`),
  regras em `src/services/`.
- `apps/web`: SPA Vite + React 19, TanStack Router (rotas em código, `src/router.tsx`) e Query,
  Tailwind 4. Em produção, `server.mjs` serve `dist/` e repassa `/api/*` para a API sem o prefixo.
- `packages/schemas`: Zod e tipos de corpo e resposta, usados pelos dois lados (o contrato da API).
- `packages/core`: regras puras (dinheiro, telefone, endereço parcial, ciclo semanal, validação do
  pedido, status). Regra nova de cálculo entra aqui, com teste.

`packages/*` exportam de `dist/`: rode `pnpm --filter=api... run build` numa checkout limpa antes
de rodar a API. O web importa os pacotes pelo fonte (alias no Vite).

## Comandos

```bash
pnpm dev | build | lint | typecheck | test     # da raiz, via Turborepo
pnpm --filter api test:e2e                     # e2e contra o banco hortifruit_test (recriado)
pnpm --filter api seed                         # primeiro ADM, ajustes e os 13 produtos iniciais
```

## Regras que não aparecem no código à primeira vista

- **Dinheiro em centavos inteiros**; quantidades inteiras na unidade de venda (`kg`, `saco`, `un`,
  `caixa`...). Total do pedido é **estimado** (a pesagem fica fora da v1).
- **Fuso**: Brasília fixo (UTC−3, sem horário de verão), em `packages/core/src/cycle.ts`.
- **Semana** (`Week`): o ADM abre ao publicar a lista ("Publicar lista da semana" com
  `openWeek`). Ela fecha sozinha em `closesAt` (quinta 12h) ou à mão (`closedAt`). Sem semana
  aberta o app mostra "Pedidos fechados" com os preços como referência. Não reabre sozinha.
- **Produto**: `draft*` é o que o ADM edita; `published*` é o que o app mostra, copiado ao publicar
  (`previousPriceCents` guarda o publicado anterior, para a variação). Produto nunca publicado não
  aparece no app. Preço inválido bloqueia a publicação.
- **Pedido**: mínimo por produto E pelo total (`Setting.minOrderCents`, padrão R$ 200). O pedido
  guarda nome e preço do momento (`OrderItem`). Um restaurante pode ter vários pedidos na semana.
- **Identificação sem login**: o telefone (só dígitos, `normalizePhone`) acha o `Customer`. Não
  encontrado ou inativo → `{ found: false }`, igual nos dois casos, e o app mostra "fale com a
  Morro Verde" com o WhatsApp. Achado → só nome e endereço parcial (`maskAddress`). Nada de
  endereço inteiro, CNPJ ou e-mail nas rotas públicas.
- **Link secreto do pedido** (`Order.token`, 32+ caracteres aleatórios): `/pedido/$token` mostra,
  edita e cancela até o fechamento da semana (`canCustomerChange`). O aparelho guarda os tokens em
  localStorage para "Meus pedidos". O token nunca aparece nas respostas do ADM.
  Editar um pedido confirmado volta ele para `NOVO` e marca `editedAt`.
- **ADM**: login por e-mail OU telefone + senha (cookie httpOnly `hortifruit_session`, JWT). O
  primeiro vem do seed (`OWNER_*`), os outros são cadastrados em Ajustes. Não dá para desativar a
  si mesmo nem o último ADM ativo.
- **Avisos**: só no painel (contador de pedidos novos com atualização a cada 30 s).
- **Fotos**: UploadThing (`UPLOADTHING_TOKEN`), rota `/uploadthing` na API, só para ADM logado.
  Sem o token, o painel esconde o envio e o ADM escolhe uma das ilustrações de
  `apps/web/public/products`. Foto trocada no produto (ou enviada e descartada antes de salvar,
  `POST /admin/uploads/discard`) é apagada do UploadThing se nenhum produto a usa
  (`services/uploads.ts`, best-effort).
- **WhatsApp** da Morro Verde: variável `WHATSAPP_NUMBER` (só dígitos, com DDD), devolvida no
  catálogo. Sem ela, os botões de WhatsApp somem.

## Visual

Design system do protótipo: verde Morro Verde, creme, Outfit (títulos, preços, números) e DM Sans
(texto). Tokens em `apps/web/src/styles/index.css` (`bg-brand`, `text-ink-2`, `border-line`,
`font-display`...): use os tokens, nunca hex solto. Alvos de toque ≥ 44px, botões de verdade,
`aria-label` em botão só com ícone.

## Deploy

Railway, com `.railway/railway.ts` e push na `main` como deploy. Roteiro e variáveis em
`docs/deploy/railway.md`. A CI (`.github/workflows/ci.yml`) é o portão: não faça merge com ela
vermelha.
