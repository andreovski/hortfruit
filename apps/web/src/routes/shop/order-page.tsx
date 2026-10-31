import {
  formatBRL,
  formatDeadline,
  formatDeliveryDate,
  quantityLabel,
  whatsappLink,
} from '@hortifruit/core';
import type { PublicOrder } from '@hortifruit/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Check,
  CircleAlert,
  Copy,
  MapPin,
  MessageCircle,
  Pencil,
  ReceiptText,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState, ErrorState, PageSkeleton } from '@/components/shop/feedback';
import { BackHeader, ShopPage, WhatsAppIconLink } from '@/components/shop/layout';
import { StatusBadge, StatusProgress } from '@/components/shop/order-status';
import { ProductImage } from '@/components/shop/product-card';
import { buttonClass, cardClass } from '@/components/shop/ui';
import { editCartStore } from '@/features/shop/cart-store';
import { addressLine, itemsLabel, orderLink, orderNumber } from '@/features/shop/format';
import { useWeekOpen } from '@/features/shop/hooks';
import { repeatIntoCart, startEditing } from '@/features/shop/order-actions';
import { isNotFound, orderQuery, shopApi, shopKeys, useCatalog } from '@/features/shop/queries';
import { saveOrderToken } from '@/features/shop/storage';

export function OrderPage({ token, isNew }: { token: string; isNew: boolean }) {
  const order = useQuery(orderQuery(token));
  const catalog = useCatalog();
  const whatsapp = catalog.data?.whatsapp ?? null;

  if (order.isPending) {
    return (
      <ShopPage>
        <PageSkeleton />
      </ShopPage>
    );
  }
  if (order.isError) {
    return (
      <ShopPage>
        <BackHeader title='Pedido' />
        {isNotFound(order.error) ? (
          <EmptyState icon={<ReceiptText className='size-7' />} title='Pedido não encontrado'>
            <p className='m-0 text-ink-2'>
              Confira se o link está completo, do jeito que você recebeu.
            </p>
            <Link to='/meus-pedidos' className={buttonClass('soft', 'md', 'px-6')}>
              Ver meus pedidos
            </Link>
          </EmptyState>
        ) : (
          <div className='p-4'>
            <ErrorState message='Não deu para carregar o pedido.' onRetry={() => order.refetch()} />
          </div>
        )}
      </ShopPage>
    );
  }
  return <OrderView order={order.data} isNew={isNew} whatsapp={whatsapp} />;
}

function OrderView({
  order,
  isNew,
  whatsapp,
}: {
  order: PublicOrder;
  isNew: boolean;
  whatsapp: string | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalog = useCatalog();
  const catalogOpen = useWeekOpen(catalog.data?.week);
  const [confirming, setConfirming] = useState(false);
  const deadline = formatDeadline(order.week.closesAt);
  const link = orderLink(order.token);

  // Quem abre o link num aparelho novo passa a ver o pedido em "Meus pedidos" também.
  useEffect(() => saveOrderToken(order.token), [order.token]);

  const cancel = useMutation({
    mutationFn: () => shopApi.cancelOrder(order.token),
    onSuccess: () => {
      setConfirming(false);
      if (editCartStore.get().editing?.token === order.token) editCartStore.clear();
      toast.success('Pedido cancelado.');
      queryClient.invalidateQueries({ queryKey: shopKeys.order(order.token) });
      queryClient.invalidateQueries({ queryKey: ['shop', 'lookup'] });
    },
  });

  const edit = () => {
    startEditing(order);
    navigate({ to: '/finalizar' });
  };

  const repeat = () => {
    if (!catalog.data) return;
    const result = repeatIntoCart(order, catalog.data.products);
    if (result.skipped.length) {
      toast.warning(`Ficou de fora (em falta nesta semana): ${result.skipped.join(', ')}.`);
    }
    navigate({ to: '/finalizar' });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado.');
    } catch {
      toast.error('Não deu para copiar. Guarde o endereço desta página.');
    }
  };

  const finished = order.status === 'ENTREGUE' || order.status === 'CANCELADO';

  return (
    <ShopPage className='pb-10'>
      <BackHeader
        title={`Pedido ${orderNumber(order.number)}`}
        subtitle={`Entrega ${formatDeliveryDate(order.week.deliveryDate)}`}
        right={<WhatsAppIconLink whatsapp={whatsapp} />}
      />
      <main className='flex flex-col gap-4 p-4'>
        {isNew ? (
          <section className='flex flex-col items-center gap-3 pt-2 text-center'>
            <span
              aria-hidden
              className='flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand'
            >
              <Check className='size-8' />
            </span>
            <h2 className='m-0 font-display text-2xl font-semibold text-brand'>Pedido enviado!</h2>
            <span className='text-ink-2'>
              Pedido {orderNumber(order.number)} · {itemsLabel(order.items.length)} ·{' '}
              {formatBRL(order.totalCents)}
            </span>
            <p className='m-0 text-sm text-ink-3'>
              Guarde este link para acompanhar, editar ou cancelar até {deadline}.
            </p>
            <div className='flex w-full flex-col gap-2'>
              <button type='button' onClick={copyLink} className={buttonClass('primary')}>
                <Copy className='size-5' aria-hidden />
                Copiar link
              </button>
              {whatsapp ? (
                <a
                  href={whatsappLink(
                    whatsapp,
                    `Olá! Enviei o pedido ${orderNumber(order.number)} pelo app da Morro Verde: ${link}`
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={buttonClass('outline', 'lg', 'min-h-12 rounded-[14px]')}
                >
                  <MessageCircle className='size-5' aria-hidden />
                  Avisar também pelo WhatsApp
                </a>
              ) : null}
            </div>
          </section>
        ) : (
          <div className='flex items-center justify-between gap-3'>
            <span className='text-sm text-ink-2'>{order.customer.name}</span>
            <StatusBadge status={order.status} />
          </div>
        )}

        {order.status === 'CANCELADO' ? (
          <div className='flex items-start gap-2.5 rounded-[14px] bg-danger-100 px-3.5 py-3 text-danger-ink'>
            <CircleAlert className='mt-0.5 size-[18px] flex-none' aria-hidden />
            <span>
              <strong>Pedido cancelado</strong>
              {order.canceledBy === 'CUSTOMER'
                ? ' por você.'
                : order.canceledBy === 'ADMIN'
                  ? ' pela Morro Verde.'
                  : '.'}
            </span>
          </div>
        ) : (
          <StatusProgress order={order} />
        )}

        <section className={`${cardClass} flex flex-col gap-2.5 p-4`}>
          <div className='flex items-start gap-3'>
            <Truck className='mt-0.5 size-5 flex-none text-brand-600' aria-hidden />
            <span>
              Entrega <strong>{formatDeliveryDate(order.week.deliveryDate)}</strong>
            </span>
          </div>
          <div className='flex items-start gap-3'>
            <MapPin className='mt-0.5 size-5 flex-none text-brand-600' aria-hidden />
            <span className='flex flex-col'>
              <span className='font-semibold'>{order.customer.name}</span>
              <span className='text-sm text-ink-2'>
                {addressLine(order.customer.maskedAddress, order.customer.neighborhood)}
              </span>
            </span>
          </div>
        </section>

        <section aria-labelledby='itens-titulo' className={`${cardClass} px-3.5 py-1`}>
          <h2 id='itens-titulo' className='sr-only'>
            Itens do pedido
          </h2>
          <ul className='m-0 list-none p-0'>
            {order.items.map((item) => (
              <li
                key={item.productId}
                className='flex items-center gap-3 border-b border-line-soft py-2.5'
              >
                <ProductImage
                  product={item}
                  className='size-10 flex-none rounded-[10px]'
                  imageClassName='size-8'
                />
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='font-semibold'>{item.name}</span>
                  <span className='text-[13px] text-ink-2'>
                    {quantityLabel(item.quantity, item.unit)} × {formatBRL(item.unitPriceCents)}
                  </span>
                </span>
                <span className='font-semibold whitespace-nowrap'>
                  {formatBRL(item.subtotalCents)}
                </span>
              </li>
            ))}
          </ul>
          <div className='flex items-baseline justify-between pt-3.5 pb-3'>
            <span className='font-semibold'>Total estimado</span>
            <span className='font-display text-[22px] font-bold text-brand'>
              {formatBRL(order.totalCents)}
            </span>
          </div>
        </section>

        {order.note ? (
          <section className={`${cardClass} flex flex-col gap-1 p-4`}>
            <span className='text-xs font-semibold text-ink-2'>Observação para a entrega</span>
            <p className='m-0 whitespace-pre-line'>{order.note}</p>
          </section>
        ) : null}

        {order.canChange ? (
          <section className='flex flex-col gap-2'>
            <p className='m-0 text-[13px] text-ink-2'>
              Você pode editar ou cancelar até {deadline}.
            </p>
            <button type='button' onClick={edit} className={buttonClass('soft', 'md')}>
              <Pencil className='size-[18px]' aria-hidden />
              Editar pedido
            </button>
            {confirming ? (
              <div role='alert' className='flex flex-col gap-2.5 rounded-xl bg-danger-100 p-3'>
                <span className='text-sm text-danger-ink'>
                  <strong>Cancelar este pedido?</strong> A Morro Verde vê o cancelamento no painel.
                </span>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    type='button'
                    onClick={() => setConfirming(false)}
                    className='min-h-11 cursor-pointer rounded-xl border border-line-strong bg-surface font-semibold text-ink'
                  >
                    Voltar
                  </button>
                  <button
                    type='button'
                    onClick={() => cancel.mutate()}
                    disabled={cancel.isPending}
                    className={buttonClass('danger', 'md')}
                  >
                    {cancel.isPending ? 'Cancelando…' : 'Sim, cancelar'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => setConfirming(true)}
                className={buttonClass('danger-outline', 'md')}
              >
                Cancelar pedido
              </button>
            )}
          </section>
        ) : !finished ? (
          <p className='m-0 rounded-[14px] bg-amber-100 px-3.5 py-3 text-sm text-amber-ink'>
            Os pedidos desta semana já fecharam ({deadline}), então este pedido não pode mais ser
            editado nem cancelado por aqui.
            {whatsapp ? ' Para mudar alguma coisa, fale com a Morro Verde pelo WhatsApp.' : ''}
          </p>
        ) : null}

        {finished && catalogOpen ? (
          <section className='flex flex-col gap-2'>
            <button type='button' onClick={repeat} className={buttonClass('soft', 'md')}>
              <RotateCcw className='size-[18px]' aria-hidden />
              Repetir pedido
            </button>
            <p className='m-0 text-center text-[13px] text-ink-2'>
              Repetir usa os preços e a disponibilidade desta semana.
            </p>
          </section>
        ) : null}

        {isNew ? null : (
          <Link to='/meus-pedidos' className={buttonClass('ghost', 'md')}>
            Ver todos os meus pedidos
          </Link>
        )}
      </main>
    </ShopPage>
  );
}
