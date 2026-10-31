import { formatBRL } from '@hortifruit/core';
import type { AdminOrdersResponse } from '@hortifruit/schemas';

import { cn } from '@/lib/utils';

import { Skeleton } from '../ui';

export function Indicators({ data }: { data: AdminOrdersResponse['indicators'] | undefined }) {
  const items = [
    {
      label: 'Aguardando confirmação',
      value: data?.awaitingConfirmation,
      hint: 'pedidos novos',
      alert: true,
    },
    { label: 'Pedidos da semana', value: data?.weekOrders, hint: 'sem contar cancelados' },
    {
      label: 'Total estimado',
      value: data ? formatBRL(data.weekTotalCents) : undefined,
      hint: 'antes da pesagem',
    },
    {
      label: 'Clientes sem pedido',
      value: data?.activeCustomersWithoutOrder,
      hint: 'ativos que ainda não pediram',
    },
  ];
  return (
    <div className='grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4'>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex flex-col gap-1 rounded-[18px] border p-[18px]',
            item.alert ? 'border-amber-border bg-amber-100' : 'border-line bg-surface'
          )}
        >
          <span className={cn('text-[13px]', item.alert ? 'text-amber-ink' : 'text-ink-2')}>{item.label}</span>
          {item.value === undefined ? (
            <Skeleton className='my-1 h-8 w-20' />
          ) : (
            <span
              className={cn(
                'font-display text-[26px] leading-[1.1] font-bold sm:text-[32px]',
                item.alert ? 'text-amber-ink-2' : 'text-brand'
              )}
            >
              {item.value}
            </span>
          )}
          <span className={cn('text-[13px]', item.alert ? 'text-amber-ink' : 'text-ink-2')}>{item.hint}</span>
        </div>
      ))}
    </div>
  );
}
