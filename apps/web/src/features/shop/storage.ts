// localStorage do aparelho: pode faltar (aba anônima, bloqueio) e nunca pode derrubar a tela.

export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem armazenamento: o app segue funcionando só na memória.
  }
}

/* --------------------------- Pedidos deste aparelho -------------------------- */

export const ORDER_TOKENS_KEY = 'hortifruit:orders:v1';
const MAX_TOKENS = 50;

/** Links secretos dos pedidos feitos neste aparelho, o mais novo primeiro. */
export function getOrderTokens(): string[] {
  const list = readJSON<unknown>(ORDER_TOKENS_KEY);
  return Array.isArray(list) ? list.filter((t): t is string => typeof t === 'string') : [];
}

export function saveOrderToken(token: string) {
  const next = [token, ...getOrderTokens().filter((t) => t !== token)].slice(0, MAX_TOKENS);
  writeJSON(ORDER_TOKENS_KEY, next);
}

/* ---------------------------- Telefone lembrado ----------------------------- */

export const PHONE_KEY = 'hortifruit:phone:v1';

/** O aparelho lembra o telefone para o próximo pedido (só dígitos). Nada disso vai para o cabeçalho. */
export function getRememberedPhone(): string {
  const phone = readJSON<unknown>(PHONE_KEY);
  return typeof phone === 'string' ? phone : '';
}

export function rememberPhone(digits: string) {
  writeJSON(PHONE_KEY, digits || null);
}
