import { defineRailway, github, preserve, project, service } from 'railway/iac';

// Configuração dos serviços do Railway (projeto hortifruit, ambiente production), no molde do
// Jottape. Muda o Railway só quando alguém roda `railway config apply`; o código vai pelo push na
// main. Roteiro completo em docs/deploy/railway.md.
//
// Segredos nunca têm valor aqui: ficam `preserve()` e são definidos com
// `railway variable set --stdin`.
//
// O partial deixa o Postgres fora deste arquivo: ele é criado pelo painel (Postgres 17), e o
// `apply` só mexe no que está declarado aqui.
export const partial = 'apps';

const ROOT_FILES = ['/package.json', '/pnpm-lock.yaml', '/pnpm-workspace.yaml', '/turbo.json'];

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
      APP_URL: 'https://${{hortifruit-web.RAILWAY_PUBLIC_DOMAIN}}',
      FRONTEND_URL: 'https://${{hortifruit-web.RAILWAY_PUBLIC_DOMAIN}}',
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
      PORT: '4173',
      // `/api/*` vai para a API pela rede privada (um domínio só, cookie do ADM de primeira parte).
      API_URL: 'http://${{hortifruit-api.RAILWAY_PRIVATE_DOMAIN}}:${{hortifruit-api.PORT}}',
    },
  });

  return project('hortifruit', { resources: [api, web] });
});
