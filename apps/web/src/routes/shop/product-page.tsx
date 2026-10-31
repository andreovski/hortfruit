import {
  formatBRL,
  formatDeadline,
  formatDeliveryDate,
  quantityLabel,
  unitShort,
} from '@hortifruit/core';
import type { CatalogProduct, CatalogResponse } from '@hortifruit/schemas';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Clock, Minus, Package, Plus, Scale, Trash2, Truck } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';

import { ProductImage } from '@/components/product-image';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shop/feedback';
import { BottomBar, ShopPage } from '@/components/shop/layout';
import { Pill } from '@/components/shop/product-card';
import { buttonClass, roundIconButton } from '@/components/shop/ui';
import { useActiveCart } from '@/features/shop/cart-store';
import { BADGE_LABEL, CATEGORY_LABEL } from '@/features/shop/format';
import { useWeekOpen } from '@/features/shop/hooks';
import { useCatalog } from '@/features/shop/queries';
import { cn } from '@/lib/utils';

export function ProductPage() {
  const { productId } = useParams({ strict: false }) as { productId: string };
  const catalog = useCatalog();
  if (catalog.isPending) {
    return (
      <ShopPage>
        <PageSkeleton />
      </ShopPage>
    );
  }
  if (catalog.isError) {
    return (
      <ShopPage className='p-4'>
        <ErrorState message='Não deu para carregar o produto.' onRetry={() => catalog.refetch()} />
      </ShopPage>
    );
  }
  const product = catalog.data.products.find((p) => p.id === productId);
  if (!product) {
    return (
      <ShopPage>
        <EmptyState icon={<Package className='size-7' />} title='Produto não encontrado'>
          <p className='m-0 text-ink-2'>Ele não está na lista desta semana.</p>
          <Link to='/' className={buttonClass('primary', 'md', 'px-6')}>
            Ver os produtos da semana
          </Link>
        </EmptyState>
      </ShopPage>
    );
  }
  return <ProductDetail key={product.id} product={product} data={catalog.data} />;
}

function ProductDetail({ product, data }: { product: CatalogProduct; data: CatalogResponse }) {
  const navigate = useNavigate();
  const open = useWeekOpen(data.week);
  const cart = useActiveCart();
  const inCart = cart.state.items[product.id] ?? 0;
  const [quantity, setQuantity] = useState(() => Math.max(inCart, product.minQuantity));
  const canOrder = open && product.available;
  const subtotal = formatBRL(product.priceCents * quantity);
  const min = product.minQuantity;

  const confirm = () => {
    cart.store.setQuantity(product, quantity);
    toast.success(inCart ? 'Pedido atualizado.' : `${product.name} no pedido.`);
    navigate({ to: '/' });
  };
  const remove = () => {
    cart.store.remove(product.id);
    toast(`${product.name} saiu do pedido.`);
    navigate({ to: '/' });
  };

  return (
    <ShopPage className='pb-32'>
      <div className='relative h-[300px]'>
        <ProductImage
          product={product}
          alt={product.name}
          className='size-full rounded-b-[28px]'
          imageClassName='mt-4 size-[216px]'
        />
        <Link
          to='/'
          aria-label='Voltar para a lista'
          className={cn(roundIconButton, 'absolute top-3.5 left-4 border-0')}
        >
          <ArrowLeft className='size-5 text-ink' aria-hidden />
        </Link>
        {product.badge && product.available ? (
          <span className='absolute top-6 right-4'>
            <Pill>{BADGE_LABEL[product.badge]}</Pill>
          </span>
        ) : null}
      </div>

      <main className='flex flex-col gap-5 px-4 py-5'>
        <div className='flex flex-col gap-1'>
          <span className='text-[13px] font-semibold tracking-wide text-brand-600'>
            {CATEGORY_LABEL[product.category]}
          </span>
          <h1 className='m-0 font-display text-[30px] leading-tight font-semibold text-brand'>
            {product.name}
          </h1>
          <div className='mt-1.5 flex items-baseline gap-1.5'>
            <span className='font-display text-[28px] font-bold text-brand'>
              {formatBRL(product.priceCents)}
            </span>
            <span className='text-ink-2'>/{unitShort(product.unit)}</span>
          </div>
        </div>

        {!product.available ? (
          <div className='flex flex-col gap-0.5 rounded-[14px] bg-muted p-3.5 text-ink-3'>
            <span className='font-bold'>Em falta esta semana</span>
            <span className='text-sm'>Ele volta assim que tiver na lista.</span>
          </div>
        ) : !open ? (
          <div className='flex flex-col gap-0.5 rounded-[14px] bg-amber-100 p-3.5 text-amber-ink'>
            <span className='font-bold'>Pedidos fechados</span>
            <span className='text-sm'>Preço de referência. A nova lista sai em breve.</span>
          </div>
        ) : (
          <section
            aria-labelledby='qtd-titulo'
            className='flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-4'
          >
            <div className='flex items-baseline justify-between'>
              <h2 id='qtd-titulo' className='m-0 font-display text-lg font-semibold text-brand'>
                Quantidade
              </h2>
              <span className='text-[13px] text-ink-2'>
                mínimo {quantityLabel(min, product.unit)}
              </span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <button
                type='button'
                onClick={() => setQuantity((q) => Math.max(min, q - 1))}
                disabled={quantity <= min}
                aria-label='Diminuir quantidade'
                className='flex size-[52px] cursor-pointer items-center justify-center rounded-2xl border-[1.5px] border-line-strong bg-surface text-ink disabled:cursor-not-allowed disabled:text-disabled'
              >
                <Minus className='size-[22px]' aria-hidden />
              </button>
              <span aria-live='polite' className='font-display text-[30px] font-bold text-brand'>
                {quantityLabel(quantity, product.unit)}
              </span>
              <button
                type='button'
                onClick={() => setQuantity((q) => q + 1)}
                aria-label='Aumentar quantidade'
                className='flex size-[52px] cursor-pointer items-center justify-center rounded-2xl bg-brand text-white'
              >
                <Plus className='size-[22px]' aria-hidden />
              </button>
            </div>
            <div role='group' aria-label='Quantidades rápidas' className='grid grid-cols-3 gap-2'>
              {[1, 2, 3].map((times) => {
                const value = min * times;
                const active = value === quantity;
                return (
                  <button
                    key={times}
                    type='button'
                    aria-pressed={active}
                    onClick={() => setQuantity(value)}
                    className={cn(
                      'min-h-11 cursor-pointer rounded-xl border text-sm font-semibold',
                      active
                        ? 'border-brand bg-brand-100 text-brand'
                        : 'border-line-strong bg-surface text-ink'
                    )}
                  >
                    {quantityLabel(value, product.unit)}
                  </button>
                );
              })}
            </div>
            <div className='flex items-baseline justify-between border-t border-line-soft pt-3'>
              <span className='text-ink-2'>Subtotal estimado</span>
              <span className='font-display text-xl font-bold text-brand'>{subtotal}</span>
            </div>
          </section>
        )}

        <div className='grid grid-cols-2 gap-2.5'>
          <InfoTile icon={<Package className='size-5' />} label='Vendido por'>
            {product.saleDescription}
          </InfoTile>
          <InfoTile icon={<Scale className='size-5' />} label='Mínimo do item'>
            {quantityLabel(min, product.unit)}
          </InfoTile>
          {data.week ? (
            <>
              <InfoTile icon={<Clock className='size-5' />} label='Pedidos até'>
                {formatDeadline(data.week.closesAt)}
              </InfoTile>
              <InfoTile icon={<Truck className='size-5' />} label='Entrega'>
                {formatDeliveryDate(data.week.deliveryDate)}
              </InfoTile>
            </>
          ) : null}
        </div>

        {product.description || product.unit === 'kg' ? (
          <section aria-labelledby='sobre-titulo' className='flex flex-col gap-1.5'>
            <h2 id='sobre-titulo' className='m-0 font-display text-lg font-semibold text-brand'>
              Sobre o produto
            </h2>
            {product.description ? <p className='m-0 text-ink-2'>{product.description}</p> : null}
            {product.unit === 'kg' ? (
              <p className='m-0 text-ink-2'>
                Vendido por kg: o valor final segue o peso real na entrega.
              </p>
            ) : null}
          </section>
        ) : null}
      </main>

      {open ? (
        <BottomBar className='flex-row gap-2.5 pt-3'>
          {inCart > 0 && product.available ? (
            <button
              type='button'
              onClick={remove}
              aria-label='Remover do pedido'
              className='flex size-14 flex-none cursor-pointer items-center justify-center rounded-2xl border-[1.5px] border-line-strong bg-surface text-disabled-ink'
            >
              <Trash2 className='size-[22px]' aria-hidden />
            </button>
          ) : null}
          {canOrder ? (
            <button
              type='button'
              onClick={confirm}
              className={buttonClass('primary', 'lg', 'flex-1 justify-between px-[18px]')}
            >
              <span>{inCart ? 'Atualizar pedido' : 'Adicionar ao pedido'}</span>
              <span className='font-display'>{subtotal}</span>
            </button>
          ) : (
            <button type='button' disabled className={buttonClass('disabled', 'lg', 'flex-1')}>
              Indisponível esta semana
            </button>
          )}
        </BottomBar>
      ) : null}
    </ShopPage>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-3'>
      <span aria-hidden className='text-brand-600'>
        {icon}
      </span>
      <span className='text-xs text-ink-2'>{label}</span>
      <span className='font-semibold'>{children}</span>
    </div>
  );
}
