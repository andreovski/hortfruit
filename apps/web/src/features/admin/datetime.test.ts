import { describe, expect, it } from 'vitest';

import { fromBrasiliaInputs, toBrasiliaInputs } from './datetime';

describe('horário de Brasília nos campos', () => {
  it('converte o instante para data e hora locais', () => {
    expect(toBrasiliaInputs('2026-11-05T15:00:00.000Z')).toEqual({ date: '2026-11-05', time: '12:00' });
  });

  it('monta o ISO com -03:00', () => {
    expect(fromBrasiliaInputs('2026-11-05', '12:00')).toBe('2026-11-05T12:00:00-03:00');
    expect(new Date(fromBrasiliaInputs('2026-11-05', '12:00')!).toISOString()).toBe(
      '2026-11-05T15:00:00.000Z'
    );
    expect(fromBrasiliaInputs('', '12:00')).toBeNull();
  });
});
