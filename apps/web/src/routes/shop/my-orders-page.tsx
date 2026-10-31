import { formatBRL, formatDeliveryDate } from '@hortifruit/core';
import type { OrderSummary } from '@hortifruit/schemas';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ReceiptText } from 'lucide-react';
import { useState } from 'react';

import { EmptyState, ErrorState, PageSkeleton } from '@/components/shop/feedback';
import { BackHeader, ShopPage } from '@/components/shop/layout';
import { StatusBadge } from '@/components/shop/order-status';
import { ProductImage } from '@/components/shop/product-card';
import { buttonClass } from '@/components/shop/ui';
import { itemsLabel, orderNumber } from '@/features/shop/format';
import { groupOrders } from '@/features/shop/group-orders';
import { lookupQuery } from '@/features/shop/queries';
import { getOrderTokens } from '@/features/shop/storage';

export function MyOrdersPage() {
  const [tokens] = useState(getOrderTokens);
  const lookup = useQuery(lookupQuery(tokens));

  return (
    <ShopPage className='pb-10'>
      <BackHeader title='Meus pedidos' subtitle='Pedidos feitos neste aparelho' />
      {tokens.length === 0 ? (
        <Empty />
      ) : lookup.isPending ? (
        <PageSkeleton />
      ) : lookup.isError ? (
        <div className='p-4'>
          <ErrorState
            message='Não deu para carregar os pedidos.'
            onRetry={() => lookup.refetch()}
          />
        </div>
      ) : lookup.data.orders.length === 0 ? (
        <Empty />
      ) : (
        <OrdersList orders={lookup.data.orders} />
      )}
    </ShopPage>
  );
}

function Empty() {
  return (
    <EmptyState icon={<ReceiptText className='size-7' />} title='Nenhum pedido por aqui'>
      <p className='m-0 max-w-xs text-ink-2'>
        Os pedidos feitos neste aparelho aparecem aqui. Fez o pedido em outro celular? Abra o link
        do pedido que ele passa a aparecer também.
      </p>
      <Link to='/' className={buttonClass('primary', 'md', 'px-6')}>
        Ver os produtos da semana
      </Link>
    </EmptyState>
  );
}

function OrdersList({ orders }: { orders: OrderSummary[] }) {
  const delivered = orders.filter((o) => o.status === 'ENTREGUE');
  const valid = orders.filter((o) => o.status !== 'CANCELADO');
  const average = valid.length
    ? Math.round(valid.reduce((s, o) => s + o.totalCents, 0) / valid.length)
    : 0;

  return (
    <main className='flex flex-col gap-5 p-4'>
      <div className='grid grid-cols-2 gap-2.5'>
        <div className='flex flex-col gap-0.5 rounded-2xl bg-brand p-3.5 text-white'>
          <span className='text-xs text-brand-200'>Pedidos entregues</span>
          <span className='font-display text-[26px] font-bold'>{delivered.length}</span>
          <span className='text-xs text-brand-200'>neste aparelho</span>
        </div>
        <div className='flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-3.5'>
          <span className='text-xs text-ink-2'>Média por pedido</span>
          <span className='font-display text-[26px] font-bold text-brand'>
            {formatBRL(average)}
          </span>
          <span className='text-xs text-ink-2'>valores estimados</span>
        </div>
      </div>

      {groupOrders(orders).map((group) => (
        <section key={group.title} className='flex flex-col gap-2.5'>
          <h2 className='m-0 text-[13px] font-bold tracking-wider text-ink-2'>{group.title}</h2>
          {group.orders.map((order) => (
            <OrderCard key={order.token} order={order} />
          ))}
        </section>
      ))}
    </main>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      to='/pedido/$token'
      params={{ token: order.token }}
      className='flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-3.5 text-ink no-underline hover:border-brand-800 hover:text-ink'
    >
      <span className='flex items-start justify-between gap-2.5'>
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='font-display text-base font-semibold'>
            Entrega {formatDeliveryDate(order.deliveryDate)}
          </span>
          <span className='truncate text-[13px] text-ink-2'>
            {orderNumber(order.number)} · {itemsLabel(order.itemCount)} · {order.customerName}
          </span>
        </span>
        <StatusBadge status={order.status} />
      </span>
      <span className='flex items-center gap-1.5'>
        {order.items.slice(0, 5).map((item) => (
          <ProductImage
            key={item.productId}
            product={item}
            className='size-9 rounded-[10px]'
            imageClassName='size-7'
          />
        ))}
        <span className='flex-1' />
        <span className='font-display text-lg font-bold text-brand'>
          {formatBRL(order.totalCents)}
        </span>
        <ChevronRight className='size-5 text-ink-2' aria-hidden />
      </span>
      {order.canChange ? (
        <span className='text-[13px] text-ink-2'>Dá para editar ou cancelar até o fechamento.</span>
      ) : null}
    </Link>
  );
}
