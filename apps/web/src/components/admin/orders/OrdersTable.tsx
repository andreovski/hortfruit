import { formatBRL, formatDateTime } from '@hortifruit/core';
import type { AdminOrderRow } from '@hortifruit/schemas';
import { Pencil } from 'lucide-react';

import { itemsLabel } from '@/features/admin/labels';
import { cn } from '@/lib/utils';

import { StatusBadge } from '../StatusBadge';

export function OrdersTable({
  orders,
  selectedId,
  onSelect,
}: {
  orders: AdminOrderRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <table className='w-full min-w-[720px] border-collapse text-left'>
      <thead>
        <tr className='text-xs font-bold tracking-[0.05em] text-ink-2'>
          <th scope='col' className='px-5 py-3 font-bold'>PEDIDO</th>
          <th scope='col' className='w-[38%] px-3 py-3 font-bold'>CLIENTE</th>
          <th scope='col' className='px-3 py-3 font-bold'>ITENS</th>
          <th scope='col' className='px-3 py-3 font-bold'>TOTAL</th>
          <th scope='col' className='px-5 py-3 font-bold'>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr
            key={o.id}
            onClick={() => onSelect(o.id)}
            className={cn(
              'cursor-pointer border-t border-line-soft hover:bg-cream/60',
              selectedId === o.id && 'bg-brand-100/60'
            )}
          >
            <td className='px-5 py-3.5'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(o.id);
                }}
                aria-label={`Abrir pedido #${o.number} de ${o.customer.name}`}
                className='flex cursor-pointer flex-col bg-transparent p-0 text-left text-ink'
              >
                <span className='font-bold'>#{o.number}</span>
                <span className='text-xs whitespace-nowrap text-ink-2'>{formatDateTime(o.createdAt)}</span>
              </button>
            </td>
            <td className='max-w-[360px] px-3 py-3.5'>
              <span className='block truncate font-semibold'>{o.customer.name}</span>
              <span className='block text-xs text-ink-2'>{o.customer.neighborhood ?? '—'}</span>
            </td>
            <td className='px-3 py-3.5 text-sm whitespace-nowrap'>{itemsLabel(o.itemCount)}</td>
            <td className='px-3 py-3.5 font-semibold whitespace-nowrap'>{formatBRL(o.totalCents)}</td>
            <td className='px-5 py-3.5'>
              <span className='flex flex-wrap items-center gap-1.5'>
                <StatusBadge status={o.status} />
                {o.editedAt ? (
                  <span
                    title={`Editado pelo cliente ${formatDateTime(o.editedAt)}`}
                    className='inline-flex items-center gap-1 rounded-full bg-info-100 px-2 py-0.5 text-[11px] font-bold text-info-ink'
                  >
                    <Pencil aria-hidden className='size-3' />
                    editado
                  </span>
                ) : null}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
