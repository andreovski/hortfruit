import { describe, expect, it } from 'vitest';

import { RateLimiter } from './rate-limit';

describe('RateLimiter', () => {
  it('deixa passar até o limite e bloqueia depois, por chave', () => {
    let now = 0;
    const limiter = new RateLimiter(3, 10_000, () => now);
    expect([1, 2, 3].map(() => limiter.hit('a'))).toEqual([true, true, true]);
    expect(limiter.hit('a')).toBe(false);
    expect(limiter.hit('b')).toBe(true);
    now = 9_999;
    expect(limiter.hit('a')).toBe(false);
  });

  it('libera de novo quando a janela vence', () => {
    let now = 0;
    const limiter = new RateLimiter(1, 1_000, () => now);
    expect(limiter.hit('ip')).toBe(true);
    expect(limiter.hit('ip')).toBe(false);
    now = 1_000;
    expect(limiter.hit('ip')).toBe(true);
    expect(limiter.hit('ip')).toBe(false);
  });

  it('reset limpa tudo', () => {
    const limiter = new RateLimiter(1, 1_000, () => 0);
    limiter.hit('x');
    limiter.reset();
    expect(limiter.hit('x')).toBe(true);
  });
});
