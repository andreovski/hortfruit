// Leitura das variáveis de ambiente num lugar só: quem precisa de uma importa daqui, e a falta de
// uma obrigatória derruba a subida em vez de falhar no meio de uma requisição.

const isProduction = () => process.env.NODE_ENV === 'production';

export function getPort(): number {
  return Number(process.env.PORT) || 3333;
}

export function getHost(): string {
  return process.env.HOST || '0.0.0.0';
}

/** Origens do CORS. Sem FRONTEND_URL vale o dev do Vite. */
export function getAllowedOrigins(): string[] {
  return (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Endereço público do app (o web). O UploadThing chama `${APP_URL}/api/uploadthing`. */
export function getAppUrl(): string {
  return (process.env.APP_URL || getAllowedOrigins()[0]).replace(/\/$/, '');
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction()) throw new Error('JWT_SECRET is required in production.');
  return 'hortifruit-dev-secret';
}

export interface OwnerConfig {
  name: string;
  email: string | null;
  phone: string | null;
  password: string;
}

/** Primeiro ADM (o seed cria se ainda não houver nenhum). */
export function getOwner(): OwnerConfig | null {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase() || null;
  const phone = process.env.OWNER_PHONE?.trim() || null;
  const password = process.env.OWNER_PASSWORD;
  if ((!email && !phone) || !password) return null;
  return {
    name: process.env.OWNER_NAME?.trim() || (email ? email.split('@')[0] : 'ADM'),
    email,
    phone,
    password,
  };
}

/** WhatsApp da Morro Verde (só dígitos, com DDD), ou null: sem ele os botões somem. */
export function getWhatsappNumber(): string | null {
  const digits = (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
  return digits || null;
}

export function getUploadthingToken(): string | null {
  return process.env.UPLOADTHING_TOKEN?.trim() || null;
}

/** Limite de tentativas nas rotas públicas (identificação e envio do pedido). */
export function rateLimitEnabled(): boolean {
  return process.env.NODE_ENV !== 'test' && process.env.DISABLE_RATE_LIMIT !== 'true';
}

export function isSecureCookie(): boolean {
  return isProduction();
}
