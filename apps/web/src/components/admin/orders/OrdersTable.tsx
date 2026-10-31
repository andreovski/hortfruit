import { formatBRL, formatDateTime } from '@hortifruit/core';
import type { AdminOrderRow } from '@hortifruit/schemas';
import { ChevronRight, Pencil } from 'lucide-react';

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
          <th scope='col' className='px-5 py-3 font-bold'>
            PEDIDO
          </th>
          <th scope='col' className='w-[38%] px-3 py-3 font-bold'>
            CLIENTE
          </th>
          <th scope='col' className='px-3 py-3 font-bold'>
            ITENS
          </th>
          <th scope='col' className='px-3 py-3 font-bold'>
            TOTAL
          </th>
          <th scope='col' className='px-5 py-3 font-bold'>
            STATUS
          </th>
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
                <span className='text-xs whitespace-nowrap text-ink-2'>
                  {formatDateTime(o.createdAt)}
                </span>
              </button>
            </td>
            <td className='max-w-[360px] px-3 py-3.5'>
              <span className='block truncate font-semibold'>{o.customer.name}</span>
              <span className='block text-xs text-ink-2'>{o.customer.neighborhood ?? '—'}</span>
            </td>
            <td className='px-3 py-3.5 text-sm whitespace-nowrap'>{itemsLabel(o.itemCount)}</td>
            <td className='px-3 py-3.5 font-semibold whitespace-nowrap'>
              {formatBRL(o.totalCents)}
            </td>
            <td className='px-5 py-3.5'>
              <span className='flex flex-wrap items-center gap-1.5'>
                <StatusBadge status={o.status} />
                <EditedTag editedAt={o.editedAt} />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EditedTag({ editedAt }: { editedAt: string | null }) {
  if (!editedAt) return null;
  return (
    <span
      title={`Editado pelo restaurante ${formatDateTime(editedAt)}`}
      className='inline-flex items-center gap-1 rounded-full bg-info-100 px-2 py-0.5 text-[11px] font-bold text-info-ink'
    >
      <Pencil aria-hidden className='size-3' />
      editado
    </span>
  );
}

/** Versão em cartões para celular: cada pedido é um botão com cliente, total e status à vista. */
export function OrdersList({
  orders,
  selectedId,
  onSelect,
}: {
  orders: AdminOrderRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className='m-0 list-none p-0'>
      {orders.map((o) => (
        <li key={o.id} className='border-t border-line-soft first:border-t-0'>
          <button
            type='button'
            onClick={() => onSelect(o.id)}
            aria-label={`Abrir pedido #${o.number} de ${o.customer.name}`}
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 bg-transparent px-4 py-3.5 text-left text-ink hover:bg-cream/60',
              selectedId === o.id && 'bg-brand-100/60'
            )}
          >
            <span className='flex min-w-0 flex-1 flex-col gap-1'>
              <span className='flex items-baseline justify-between gap-3'>
                <span className='truncate font-semibold'>{o.customer.name}</span>
                <span className='flex-none font-display font-bold whitespace-nowrap'>
                  {formatBRL(o.totalCents)}
                </span>
              </span>
              <span className='text-xs text-ink-2'>
                #{o.number} · {formatDateTime(o.createdAt)}
                {o.customer.neighborhood ? ` · ${o.customer.neighborhood}` : ''}
              </span>
              <span className='mt-0.5 flex flex-wrap items-center gap-1.5'>
                <StatusBadge status={o.status} />
                <EditedTag editedAt={o.editedAt} />
                <span className='text-xs text-ink-2'>{itemsLabel(o.itemCount)}</span>
              </span>
            </span>
            <ChevronRight aria-hidden className='size-5 flex-none text-ink-2' />
          </button>
        </li>
      ))}
    </ul>
  );
}
