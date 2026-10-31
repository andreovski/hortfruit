import { CUSTOMER_STATUS_LABEL, formatDeliveryDate } from '@hortifruit/core';
import type { OrderStatusCode, PublicOrder } from '@hortifruit/schemas';
import { Check } from 'lucide-react';

import { formatShortDateTime } from '@/features/shop/format';
import { cn } from '@/lib/utils';

const BADGE: Record<OrderStatusCode, { box: string; dot: string }> = {
  NOVO: { box: 'bg-amber-100 text-amber-ink', dot: 'bg-amber' },
  CONFIRMADO: { box: 'bg-brand-100 text-brand-800', dot: 'bg-brand-500' },
  ENTREGUE: { box: 'bg-brand-100 text-brand-800', dot: 'bg-brand-500' },
  CANCELADO: { box: 'bg-danger-100 text-danger', dot: 'bg-danger-strong' },
};

export function StatusBadge({ status }: { status: OrderStatusCode }) {
  const style = BADGE[status];
  return (
    <span
      className={cn(
        'inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        style.box
      )}
    >
      <span aria-hidden className={cn('size-[7px] rounded-full', style.dot)} />
      {CUSTOMER_STATUS_LABEL[status]}
    </span>
  );
}

const STEPS = ['NOVO', 'CONFIRMADO', 'ENTREGUE'] as const;

/** Andamento Recebido → Confirmado → Entregue. */
export function StatusProgress({ order }: { order: PublicOrder }) {
  const reached = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const hints = [
    formatShortDateTime(order.createdAt),
    order.confirmedAt ? formatShortDateTime(order.confirmedAt) : 'pela Morro Verde',
    order.deliveredAt
      ? formatShortDateTime(order.deliveredAt)
      : formatDeliveryDate(order.week.deliveryDate),
  ];
  return (
    <ol
      aria-label='Andamento do pedido'
      className='m-0 grid list-none grid-cols-3 gap-1.5 rounded-2xl border border-line bg-surface px-2.5 py-3.5'
    >
      {STEPS.map((step, i) => {
        const done = i <= reached;
        return (
          <li
            key={step}
            className='flex flex-col items-center gap-1.5 text-center'
            aria-current={i === reached ? 'step' : undefined}
          >
            {done ? (
              <span
                aria-hidden
                className='flex size-7 items-center justify-center rounded-full bg-brand text-white'
              >
                <Check className='size-4' />
              </span>
            ) : (
              <span
                aria-hidden
                className='size-7 rounded-full border-2 border-line-strong bg-surface'
              />
            )}
            <span
              className={cn(
                'text-[13px]',
                done ? 'font-bold text-brand' : 'font-semibold text-ink-3'
              )}
            >
              {CUSTOMER_STATUS_LABEL[step]}
              <span className='sr-only'>{done ? ' (feito)' : ' (a seguir)'}</span>
            </span>
            <span className='text-xs text-ink-2'>{hints[i]}</span>
          </li>
        );
      })}
    </ol>
  );
}
