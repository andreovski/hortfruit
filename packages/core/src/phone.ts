/**
 * Telefone guardado só com dígitos, DDD + número (10 ou 11 dígitos), sem o 55.
 * É a chave de identificação do restaurante no app.
 */
export function normalizePhone(input: string): string {
  let digits = String(input).replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  if ((digits.length === 11 || digits.length === 12) && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function isValidPhone(input: string): boolean {
  const digits = normalizePhone(input);
  return /^[1-9]{2}\d{8,9}$/.test(digits);
}

/** "41998765432" → "(41) 99876-5432"; "4133334444" → "(41) 3333-4444". */
export function formatPhone(input: string): string {
  const d = normalizePhone(input);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return input;
}

/** Máscara progressiva para o campo enquanto a pessoa digita. */
export function maskPhoneInput(input: string): string {
  const d = String(input).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Link do WhatsApp (wa.me) para um número brasileiro, com mensagem opcional. */
export function whatsappLink(phone: string, message?: string): string {
  const d = normalizePhone(phone);
  const base = `https://wa.me/55${d}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
