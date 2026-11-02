import { defineRailway, github, preserve, project, service } from 'railway/iac';

// Configuração dos serviços do Railway (projeto hortifruit, ambiente production), no molde do
// Jottape. Muda o Railway só quando alguém roda `railway config apply`; o código vai pelo push na
// main. Roteiro completo em docs/deploy/railway.md.
//
// Segredos nunca têm valor aqui: ficam `preserve()` e são definidos com
// `railway variable set --stdin`.
//
// O partial deixa o Postgres fora deste arquivo: ele é criado pelo painel (Postgres 18), e o
// `apply` só mexe no que está declarado aqui.
export const partial = 'apps';

const ROOT_FILES = ['/package.json', '/pnpm-lock.yaml', '/pnpm-workspace.yaml', '/turbo.json'];

// Domínio próprio do app. O IaC do Railway não registra domínio próprio: ele é criado pela CLI
// (`railway domain hortifruit.grupocleyton.com.br --port 4173 --service hortifruit-web`) ou pelo
// painel, e o DNS de grupocleyton.com.br aponta para o alvo que o Railway mostra. O domínio gerado
// `*.up.railway.app` continua no ar e aceito pelo CORS.
const APP_DOMAIN = 'hortifruit.grupocleyton.com.br';
const WEB_PORT = 4173;

export default defineRailway(() => {
  const repo = github('andreovski/hortfruit', { checkSuites: false });

  const api = service('hortifruit-api', {
    source: repo,
    build: {
      buildCommand: 'pnpm --filter=api... run build',
      builder: 'RAILPACK',
      watchPatterns: ['/apps/api/**', '/packages/**', ...ROOT_FILES],
    },
    // Migration com erro para o deploy aqui, e a API anterior continua no ar. O seed só cria o
    // primeiro ADM, os ajustes e os produtos iniciais quando ainda não existem.
    preDeploy:
      'pnpm --filter api exec prisma migrate deploy && node apps/api/dist/scripts/seed-owner.js',
    start: 'node apps/api/dist/server.js',
    healthcheck: '/health',
    networking: { privateNetworkEndpoint: 'hortifruit-api' },
    env: {
      NODE_ENV: 'production',
      PORT: '8080',
      // A rede privada do Railway pode ser só IPv6: escuta em todas as famílias.
      HOST: '::',
      TRUST_PROXY: 'true',
      DATABASE_URL: '${{Postgres.DATABASE_URL}}',
      // O UploadThing chama `${APP_URL}/api/uploadthing`: vai pelo domínio próprio.
      APP_URL: `https://${APP_DOMAIN}`,
      FRONTEND_URL: `https://${APP_DOMAIN},https://\${{hortifruit-web.RAILWAY_PUBLIC_DOMAIN}}`,
      JWT_SECRET: preserve(),
      OWNER_NAME: preserve(),
      OWNER_EMAIL: preserve(),
      OWNER_PHONE: preserve(),
      OWNER_PASSWORD: preserve(),
      WHATSAPP_NUMBER: preserve(),
      UPLOADTHING_TOKEN: preserve(),
    },
  });

  const web = service('hortifruit-web', {
    source: repo,
    build: {
      buildCommand: 'pnpm --filter=web... run build',
      builder: 'RAILPACK',
      watchPatterns: ['/apps/web/**', '/packages/**', ...ROOT_FILES],
    },
    start: 'node apps/web/server.mjs',
    // O Railway recusa ponto no caminho do healthcheck: `/` devolve o index.html.
    healthcheck: '/',
    env: {
      PORT: String(WEB_PORT),
      // `/api/*` vai para a API pela rede privada (um domínio só, cookie do ADM de primeira parte).
      API_URL: 'http://${{hortifruit-api.RAILWAY_PRIVATE_DOMAIN}}:${{hortifruit-api.PORT}}',
    },
  });

  return project('hortifruit', { resources: [api, web] });
});
