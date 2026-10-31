import { todayInBrasilia } from '@hortifruit/core';
import type { OrderSummary } from '@hortifruit/schemas';

import { monthTitle } from './format';

interface Group {
  title: string;
  orders: OrderSummary[];
}

/** Próximas entregas primeiro; o resto por mês da entrega (como no protótipo). */
export function groupOrders(orders: OrderSummary[], today = todayInBrasilia()): Group[] {
  const groups: Group[] = [];
  const upcoming = orders.filter((o) => o.deliveryDate >= today && o.status !== 'CANCELADO');
  if (upcoming.length) groups.push({ title: 'PRÓXIMA ENTREGA', orders: upcoming });
  for (const order of orders) {
    if (upcoming.includes(order)) continue;
    const title = monthTitle(order.deliveryDate);
    const group = groups.find((g) => g.title === title);
    if (group) group.orders.push(order);
    else groups.push({ title, orders: [order] });
  }
  return groups;
}
