# Deploy no Railway

O Hortifruit roda em dois serviços e um banco, no projeto `hortifruit` do Railway:

| Serviço          | O que é                                                                                         | Start                          |
| ---------------- | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| `hortifruit-api` | API Fastify + Prisma                                                                            | `node apps/api/dist/server.js` |
| `hortifruit-web` | SPA (Vite) servida por `apps/web/server.mjs`, que repassa `/api/*` para a API pela rede privada | `node apps/web/server.mjs`     |
| `Postgres`       | Postgres 18, criado pelo painel                                                                 | —                              |

A configuração dos dois serviços está em `.railway/railway.ts` (Railway IaC) e só muda com
`railway config plan` → `railway config apply`. O código vai para produção a cada push na `main`;
a CI (`.github/workflows/ci.yml`) roda lint, typecheck, testes, build e os e2e da API, e o portão é
não fazer merge com ela vermelha.

O navegador só fala com o domínio do `hortifruit-web`: o catálogo fica em `https://<domínio>/` (o
link fixo que vai para os restaurantes) e o painel em `https://<domínio>/admin`. O cookie do ADM é
de primeira parte.

## 1. Primeira vez

1. Crie o projeto `hortifruit` no Railway e, nele, um **Postgres 18** pelo painel (nome `Postgres`).
2. Na raiz do repositório: `pnpm install`, `pnpm exec railway login`, `pnpm exec railway link`
   (escolha o projeto).
3. `pnpm exec railway config plan` e, se o plano criar os dois serviços, `pnpm exec railway config apply`.
4. Gere um domínio público para o `hortifruit-web` (Settings › Networking › Generate Domain). A API
   não precisa de domínio público. O domínio próprio (`hortifruit.grupocleyton.com.br`) já está no
   `.railway/railway.ts`; o DNS dele está na seção 4.
5. Defina as variáveis (seção 2) e faça o primeiro deploy. O `preDeploy` da API roda as migrations
   e o seed: cria o primeiro ADM (`OWNER_*`), o pedido mínimo padrão (R$ 200) e os 13 produtos
   iniciais como rascunho.
6. Entre em `/admin`, confira os produtos e preços e clique em **Publicar lista da semana**: é
   isso que abre a semana (entrega na sexta, pedidos até quinta 12h). Cadastre os restaurantes em
   Clientes antes de mandar o link: o app só aceita pedido de telefone cadastrado.

## 2. Variáveis

Segredo nunca vai no arquivo. Defina com `railway variable set --stdin`, por exemplo:

```bash
openssl rand -hex 32 | pnpm exec railway variable set JWT_SECRET --stdin --service hortifruit-api
```

| Variável                  | Serviço  | Para quê                                                                                                                             |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`            | api      | Referência `${{Postgres.DATABASE_URL}}` (já no arquivo).                                                                             |
| `APP_URL`, `FRONTEND_URL` | api      | Domínio próprio do web (já no arquivo). O UploadThing chama `${APP_URL}/api/uploadthing`; o CORS aceita também o `*.up.railway.app`. |
| `TRUST_PROXY`             | api      | `true`: a API está atrás do proxy do Railway e do `server.mjs`.                                                                      |
| `JWT_SECRET`              | api      | **Obrigatória**: assina a sessão do ADM. Sem ela a API não sobe em produção. Trocar derruba as sessões.                              |
| `OWNER_NAME`              | api      | Nome do primeiro ADM.                                                                                                                |
| `OWNER_EMAIL`             | api      | E-mail do primeiro ADM (login). Pelo menos um entre e-mail e telefone.                                                               |
| `OWNER_PHONE`             | api      | Telefone do primeiro ADM (login), com DDD.                                                                                           |
| `OWNER_PASSWORD`          | api      | Senha inicial, usada só quando o primeiro ADM é criado. Depois troque em Ajustes e pode apagar a variável.                           |
| `WHATSAPP_NUMBER`         | api      | WhatsApp da Morro Verde, só dígitos com DDD (ex.: `41999998888`). Sem ele os botões de WhatsApp somem.                               |
| `UPLOADTHING_TOKEN`       | api      | Token do [UploadThing](https://uploadthing.com) (Dashboard › API Keys). Liga o envio de foto dos produtos.                           |
| `HOST`                    | api      | `::` (já no arquivo): a rede privada do Railway pode ser só IPv6.                                                                    |
| `PORT`                    | api, web | `8080` e `4173` (já no arquivo).                                                                                                     |
| `API_URL`                 | web      | Endereço privado da API (já no arquivo, por referência).                                                                             |

## 3. Backup

O Postgres do Railway tem backups no painel (Backups). Para uma cópia própria:

```bash
pg_dump "$(pnpm exec railway variables --service Postgres --kv | grep DATABASE_PUBLIC_URL | cut -d= -f2-)" > backup.sql
```

## 4. Domínio próprio (`hortifruit.grupocleyton.com.br`)

O `.railway/railway.ts` declara o domínio no `hortifruit-web` (porta 4173) e aponta `APP_URL` e
`FRONTEND_URL` da API para ele. O endereço `hortifruit-web-production.up.railway.app` continua
funcionando. Não há nada no código que dependa do domínio: o link do pedido usa o endereço aberto
no navegador e o cookie do ADM não fixa domínio.

1. `pnpm exec railway config plan`: confira que o plano só adiciona o domínio próprio e troca
   `APP_URL`/`FRONTEND_URL` (o domínio `*.up.railway.app` não pode sair). Então
   `pnpm exec railway config apply`.
2. No Railway, em `hortifruit-web` › Settings › Networking, o domínio aparece com os registros que
   o Railway pede: um **CNAME** (`hortifruit` → alvo `xxxx.up.railway.app`) e um **TXT** de
   verificação (`_railway-verify.hortifruit`). Copie os valores exatos de lá.
3. Crie os dois registros no DNS de `grupocleyton.com.br`. No Registro.br: Domínios ›
   `grupocleyton.com.br` › DNS › Configurar zona DNS (modo avançado, se ainda não estiver) ›
   Nova entrada. O nome é só `hortifruit` (e `_railway-verify.hortifruit`); TTL padrão. Se o DNS do
   domínio estiver em outro provedor (Cloudflare, hospedagem), crie no painel dele; na Cloudflare,
   deixe o CNAME como **DNS only** (nuvem cinza) até o certificado sair.
4. Espere a propagação (minutos a algumas horas). O Railway marca o domínio como verificado e emite
   o certificado HTTPS sozinho.
5. Teste `https://hortifruit.grupocleyton.com.br/` e `/admin` (entrar de novo: a sessão é por
   domínio) e, com `UPLOADTHING_TOKEN` definido, envie uma foto de produto.
6. Mande o link novo para os clientes. Links de pedido antigos (`*.up.railway.app/pedido/...`)
   continuam funcionando, mas o "Meus pedidos" é por endereço: no domínio novo o aparelho começa
   vazio.
