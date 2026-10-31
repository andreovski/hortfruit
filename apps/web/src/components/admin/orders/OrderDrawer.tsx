import {
  canAdminTransition,
  formatBRL,
  formatDateTime,
  formatDeliveryDate,
  formatPhone,
  quantityLabel,
  unitShort,
  whatsappLink,
} from '@hortifruit/core';
import type { AdminOrderDetail, OrderStatusCode } from '@hortifruit/schemas';
import { Check, MapPin, MessageCircle, Pencil, StickyNote, Truck, Undo2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useOrder, useSetOrderStatus } from '@/features/admin/orders';

import { ConfirmDialog } from '../ConfirmDialog';
import { Drawer } from '../Drawer';
import { StatusBadge } from '../StatusBadge';
import { Banner, Button, ErrorState, Skeleton } from '../ui';

const DONE_TOAST: Record<OrderStatusCode, string> = {
  NOVO: 'voltou para novo',
  CONFIRMADO: 'confirmado',
  ENTREGUE: 'marcado como entregue',
  CANCELADO: 'cancelado',
};

export function OrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { data: order, isPending, isError, refetch } = useOrder(orderId);
  return (
    <Drawer
      open={!!orderId}
      onOpenChange={(open) => !open && onClose()}
      eyebrow={order ? `Enviado pelo app · ${formatDateTime(order.createdAt)}` : undefined}
      title={order ? `Pedido #${order.number}` : 'Pedido'}
    >
      {isPending ? (
        <div role='status' aria-label='Carregando o pedido' className='flex flex-col gap-3'>
          <Skeleton className='h-28' />
          <Skeleton className='h-10' />
          <Skeleton className='h-10' />
          <Skeleton className='h-10' />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <OrderDetail order={order} />
      )}
    </Drawer>
  );
}

function OrderDetail({ order }: { order: AdminOrderDetail }) {
  const { customer } = order;
  const address = [customer.address, customer.neighborhood, customer.city].filter(Boolean).join(' · ');
  return (
    <>
      <div className='flex flex-wrap items-center gap-2'>
        <StatusBadge status={order.status} className='px-3 py-1.5' />
        <span className='text-[13px] text-ink-2'>Entrega {formatDeliveryDate(order.week.deliveryDate)}</span>
      </div>

      {order.editedAt ? (
        <Banner tone='info' icon={<Pencil aria-hidden className='size-4 flex-none' />}>
          Alterado pelo restaurante em {formatDateTime(order.editedAt)}
        </Banner>
      ) : null}

      <div className='flex flex-col gap-2 rounded-[14px] bg-cream p-3.5'>
        <span className='font-display text-lg font-semibold text-ink'>{customer.name}</span>
        {customer.contactName ? (
          <span className='flex items-center gap-2 text-sm text-ink-3'>
            <User aria-hidden className='size-4 flex-none' />
            {customer.contactName}
          </span>
        ) : null}
        <a
          href={whatsappLink(customer.phone)}
          target='_blank'
          rel='noopener noreferrer'
          className='flex min-h-11 items-center gap-2 text-sm font-semibold'
        >
          <MessageCircle aria-hidden className='size-4 flex-none' />
          {formatPhone(customer.phone)}
          <span className='sr-only'>(abrir no WhatsApp)</span>
        </a>
        <span className='flex items-start gap-2 text-sm text-ink-3'>
          <MapPin aria-hidden className='mt-0.5 size-4 flex-none' />
          {address}
        </span>
        {customer.notes ? (
          <span className='flex items-start gap-2 text-sm text-ink-3'>
            <StickyNote aria-hidden className='mt-0.5 size-4 flex-none' />
            <span>
              <strong>Obs. do cliente:</strong> {customer.notes}
            </span>
          </span>
        ) : null}
      </div>

      {order.note ? (
        <Banner tone='amber' icon={<StickyNote aria-hidden className='size-4 flex-none' />}>
          <strong>Observação:</strong> {order.note}
        </Banner>
      ) : null}

      <div className='flex flex-col'>
        <h3 className='m-0 mb-1 text-xs font-bold tracking-[0.06em] text-ink-2'>ITENS</h3>
        <ul className='m-0 list-none p-0'>
          {order.items.map((item) => (
            <li key={item.productId} className='flex items-center gap-3 border-b border-line-soft py-2.5'>
              <span
                aria-hidden
                className='flex size-9 flex-none items-center justify-center rounded-[10px]'
                style={{ background: item.color }}
              >
                <img src={item.imageUrl} alt='' className='size-7 object-contain' />
              </span>
              <span className='flex min-w-0 flex-1 flex-col'>
                <span className='font-semibold'>{item.name}</span>
                <span className='text-xs text-ink-2'>
                  {quantityLabel(item.quantity, item.unit)} × {formatBRL(item.unitPriceCents)}/{unitShort(item.unit)}
                </span>
              </span>
              <span className='font-semibold whitespace-nowrap'>{formatBRL(item.subtotalCents)}</span>
            </li>
          ))}
        </ul>
        <div className='flex items-baseline justify-between pt-3'>
          <span className='font-semibold'>Total estimado</span>
          <span className='font-display text-[22px] font-bold text-brand'>{formatBRL(order.totalCents)}</span>
        </div>
      </div>

      <Timeline order={order} />
      <OrderActions order={order} />
    </>
  );
}

function Timeline({ order }: { order: AdminOrderDetail }) {
  const rows: [string, string | null][] = [
    ['Enviado', order.createdAt],
    ['Editado', order.editedAt],
    ['Confirmado', order.confirmedAt],
    ['Entregue', order.deliveredAt],
    [
      order.canceledBy === 'CUSTOMER' ? 'Cancelado pelo restaurante' : 'Cancelado',
      order.canceledAt,
    ],
  ];
  return (
    <dl className='m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]'>
      {rows
        .filter(([, at]) => at)
        .map(([label, at]) => (
          <div key={label} className='contents'>
            <dt className='text-ink-2'>{label}</dt>
            <dd className='m-0 text-ink-3'>{formatDateTime(at!)}</dd>
          </div>
        ))}
    </dl>
  );
}

function OrderActions({ order }: { order: AdminOrderDetail }) {
  const setStatus = useSetOrderStatus();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const can = (to: OrderStatusCode) => canAdminTransition(order.status, to);

  function change(status: OrderStatusCode) {
    setStatus.mutate(
      { id: order.id, status },
      {
        onSuccess: () => {
          setConfirmCancel(false);
          toast.success(`Pedido #${order.number} ${DONE_TOAST[status]}.`);
        },
      }
    );
  }
  const busy = setStatus.isPending;
  const pending = setStatus.variables?.status;

  return (
    <div className='flex flex-col gap-2'>
      {can('CONFIRMADO') && order.status === 'NOVO' ? (
        <Button size='lg' loading={busy && pending === 'CONFIRMADO'} disabled={busy} onClick={() => change('CONFIRMADO')}>
          <Check aria-hidden className='size-5' />
          Confirmar pedido
        </Button>
      ) : null}
      {can('ENTREGUE') ? (
        <Button size='lg' loading={busy && pending === 'ENTREGUE'} disabled={busy} onClick={() => change('ENTREGUE')}>
          <Truck aria-hidden className='size-5' />
          Marcar como entregue
        </Button>
      ) : null}
      {can('NOVO') ? (
        <Button variant='secondary' loading={busy && pending === 'NOVO'} disabled={busy} onClick={() => change('NOVO')}>
          <Undo2 aria-hidden className='size-4' />
          Voltar para novo
        </Button>
      ) : null}
      {can('CONFIRMADO') && order.status === 'ENTREGUE' ? (
        <Button
          variant='secondary'
          loading={busy && pending === 'CONFIRMADO'}
          disabled={busy}
          onClick={() => change('CONFIRMADO')}
        >
          <Undo2 aria-hidden className='size-4' />
          Voltar para confirmado
        </Button>
      ) : null}
      {can('CANCELADO') ? (
        <Button variant='danger-outline' size='lg' disabled={busy} onClick={() => setConfirmCancel(true)}>
          Cancelar pedido
        </Button>
      ) : null}
      {order.status === 'ENTREGUE' ? (
        <p className='m-0 rounded-xl bg-cream px-3.5 py-3 text-sm text-ink-3'>Pedido entregue. Nenhuma ação pendente.</p>
      ) : null}
      {order.status === 'CANCELADO' ? (
        <p className='m-0 rounded-xl bg-cream px-3.5 py-3 text-sm text-ink-3'>
          {order.canceledBy === 'CUSTOMER'
            ? 'Cancelado pelo restaurante no app, antes do fechamento.'
            : 'Pedido cancelado pela Morro Verde. O restaurante vê este status em Meus pedidos.'}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancelar o pedido #${order.number}?`}
        description='O restaurante verá o status "Cancelado" em Meus pedidos.'
        confirmLabel='Sim, cancelar'
        tone='danger'
        loading={busy && pending === 'CANCELADO'}
        onConfirm={() => change('CANCELADO')}
      />
    </div>
  );
}
