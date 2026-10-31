/**
 * Limite simples em memória (uma instância da API): N chamadas por chave numa janela fixa.
 * Serve para as rotas públicas sem login (identificação pelo telefone e envio do pedido).
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  /** Conta uma chamada; devolve false se passou do limite. */
  hit(key: string): boolean {
    const now = this.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.sweep(now);
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  reset() {
    this.hits.clear();
  }

  /** Tira as janelas vencidas para o mapa não crescer sem fim. */
  private sweep(now: number) {
    if (this.hits.size < 1000) return;
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
  }
}

export const TOO_MANY_ATTEMPTS = 'Muitas tentativas. Tente de novo em alguns minutos.';
