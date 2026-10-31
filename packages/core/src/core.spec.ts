import { describe, expect, it } from 'vitest';

import {
  canAdminTransition,
  canCustomerChange,
  checkOrder,
  formatBRL,
  formatDeadline,
  formatDeliveryDate,
  formatPhone,
  isValidPhone,
  isWeekOpen,
  maskAddress,
  maskPhoneInput,
  normalizePhone,
  parseBRL,
  quantityLabel,
  suggestNextWeek,
  timeLeftLabel,
} from './index';

describe('money', () => {
  it('formata e lê reais', () => {
    expect(formatBRL(690)).toBe('R$ 6,90');
    expect(formatBRL(123450)).toBe('R$ 1.234,50');
    expect(parseBRL('6,90')).toBe(690);
    expect(parseBRL('6.9')).toBe(690);
    expect(parseBRL('1.234,50')).toBe(123450);
    expect(parseBRL('R$ 52')).toBe(5200);
    expect(parseBRL('')).toBeNull();
    expect(parseBRL('0')).toBeNull();
    expect(parseBRL('abc')).toBeNull();
  });
});

describe('telefone', () => {
  it('normaliza, valida e formata', () => {
    expect(normalizePhone('+55 (41) 99876-5432')).toBe('41998765432');
    expect(normalizePhone('041998765432')).toBe('41998765432');
    expect(isValidPhone('(41) 99876-5432')).toBe(true);
    expect(isValidPhone('(41) 3333-4444')).toBe(true);
    expect(isValidPhone('9999')).toBe(false);
    expect(formatPhone('41998765432')).toBe('(41) 99876-5432');
    expect(formatPhone('4133334444')).toBe('(41) 3333-4444');
    expect(maskPhoneInput('4199876')).toBe('(41) 9987-6');
    expect(maskPhoneInput('41998765432')).toBe('(41) 99876-5432');
  });
});

describe('endereço parcial', () => {
  it('mostra a rua inteira e esconde número e complemento', () => {
    expect(maskAddress('Rua Itupava, 1234')).toBe('Rua Itupava');
    expect(maskAddress('Avenida Sete de Setembro, 4500, sala 2')).toBe('Avenida Sete de Setembro');
    expect(maskAddress('Rua Dom Pedro II 450 - fundos')).toBe('Rua Dom Pedro II');
    expect(maskAddress('Rua XV de Novembro nº 12')).toBe('Rua XV de Novembro');
    expect(maskAddress('Rua 7 de Setembro')).toBe('Rua 7 de Setembro');
    expect(maskAddress('Itupava')).toBe('Itupava');
  });
});

describe('ciclo semanal', () => {
  it('sugere a próxima sexta com fechamento na quinta às 12h de Brasília', () => {
    // Sábado, 31/10/2026, 14h em Brasília.
    expect(suggestNextWeek('2026-10-31T17:00:00Z')).toEqual({
      deliveryDate: '2026-11-06',
      closesAt: '2026-11-05T15:00:00.000Z',
    });
    // Quinta 05/11 às 11h59: ainda vale a sexta 06/11.
    expect(suggestNextWeek('2026-11-05T14:59:00Z').deliveryDate).toBe('2026-11-06');
    // Quinta 05/11 às 12h: já é a sexta seguinte.
    expect(suggestNextWeek('2026-11-05T15:00:00Z').deliveryDate).toBe('2026-11-13');
    // Sexta de entrega: a próxima.
    expect(suggestNextWeek('2026-11-06T13:00:00Z').deliveryDate).toBe('2026-11-13');
  });

  it('semana aberta até o fechamento, e fechada à mão', () => {
    const week = { closesAt: '2026-11-05T15:00:00Z' };
    expect(isWeekOpen(week, '2026-11-05T14:59:59Z')).toBe(true);
    expect(isWeekOpen(week, '2026-11-05T15:00:00Z')).toBe(false);
    expect(isWeekOpen({ ...week, closedAt: '2026-11-01T00:00:00Z' }, '2026-11-02T00:00:00Z')).toBe(
      false
    );
    expect(isWeekOpen(null)).toBe(false);
  });

  it('formata datas e tempo restante', () => {
    expect(formatDeliveryDate('2026-11-06')).toBe('sex, 06/11');
    expect(formatDeadline('2026-11-05T15:00:00Z')).toBe('qui, 05/11 às 12h');
    expect(timeLeftLabel('2026-11-05T15:00:00Z', '2026-11-02T11:00:00Z')).toBe('3 dias e 4 h');
    expect(timeLeftLabel('2026-11-05T15:00:00Z', '2026-11-05T09:40:00Z')).toBe('5 h e 20 min');
    expect(timeLeftLabel('2026-11-05T15:00:00Z', '2026-11-05T16:00:00Z')).toBeNull();
  });
});

describe('pedido', () => {
  const products = [
    { id: 'tomate', name: 'Tomate', priceCents: 690, minQuantity: 10, available: true },
    { id: 'alho', name: 'Alho', priceCents: 2800, minQuantity: 2, available: true },
    { id: 'morango', name: 'Morango', priceCents: 3200, minQuantity: 1, available: false },
  ];

  it('calcula o total e aceita quando tudo bate', () => {
    const r = checkOrder(
      [
        { productId: 'tomate', quantity: 20 },
        { productId: 'alho', quantity: 3 },
      ],
      products,
      20000
    );
    expect(r.totalCents).toBe(13800 + 8400);
    expect(r.ok).toBe(true);
  });

  it('aponta mínimo do produto, do pedido, falta e produto desconhecido', () => {
    const codes = (items: { productId: string; quantity: number }[]) =>
      checkOrder(items, products, 20000).problems.map((p) => p.code);
    expect(codes([])).toEqual(['EMPTY']);
    expect(codes([{ productId: 'tomate', quantity: 5 }])).toEqual([
      'BELOW_PRODUCT_MIN',
      'BELOW_ORDER_MIN',
    ]);
    expect(codes([{ productId: 'morango', quantity: 10 }])).toContain('UNAVAILABLE');
    expect(codes([{ productId: 'x', quantity: 10 }])).toContain('UNKNOWN_PRODUCT');
    expect(codes([{ productId: 'tomate', quantity: 1.5 }])).toContain('INVALID_QUANTITY');
  });

  it('cliente muda só com a semana aberta e pedido não entregue nem cancelado', () => {
    const week = { closesAt: '2026-11-05T15:00:00Z' };
    expect(canCustomerChange('NOVO', week, '2026-11-04T00:00:00Z')).toBe(true);
    expect(canCustomerChange('CONFIRMADO', week, '2026-11-04T00:00:00Z')).toBe(true);
    expect(canCustomerChange('CANCELADO', week, '2026-11-04T00:00:00Z')).toBe(false);
    expect(canCustomerChange('NOVO', week, '2026-11-06T00:00:00Z')).toBe(false);
  });
});

describe('status e unidades', () => {
  it('transições do ADM', () => {
    expect(canAdminTransition('NOVO', 'CONFIRMADO')).toBe(true);
    expect(canAdminTransition('NOVO', 'ENTREGUE')).toBe(false);
    expect(canAdminTransition('CONFIRMADO', 'ENTREGUE')).toBe(true);
    expect(canAdminTransition('CANCELADO', 'NOVO')).toBe(false);
  });

  it('rótulos de quantidade', () => {
    expect(quantityLabel(10, 'kg')).toBe('10 kg');
    expect(quantityLabel(1, 'saco')).toBe('1 saco');
    expect(quantityLabel(2, 'saco')).toBe('2 sacos');
  });
});
