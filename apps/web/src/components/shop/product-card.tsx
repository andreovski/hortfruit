import { formatBRL, quantityLabel, unitShort } from '@hortifruit/core';
import type { CatalogProduct } from '@hortifruit/schemas';
import { Link } from '@tanstack/react-router';
import { Minus, Plus } from 'lucide-react';

import { ProductImage } from '@/components/product-image';
import { BADGE_LABEL } from '@/features/shop/format';
import { cn } from '@/lib/utils';

export { ProductImage };

export function Pill({ children, muted }: { children: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold',
        muted ? 'text-disabled-ink' : 'text-amber-ink'
      )}
    >
      {children}
    </span>
  );
}

export function CardStepper({
  product,
  quantity,
  onDecrement,
  onIncrement,
}: {
  product: CatalogProduct;
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const atMin = quantity <= product.minQuantity;
  return (
    <div className='flex items-center justify-between rounded-xl bg-brand'>
      <button
        type='button'
        onClick={onDecrement}
        aria-label={atMin ? `Tirar ${product.name} do pedido` : `Diminuir ${product.name}`}
        className='flex size-11 cursor-pointer items-center justify-center text-white'
      >
        <Minus className='size-5' aria-hidden />
      </button>
      <span
        aria-live='polite'
        className='font-display text-[15px] font-bold whitespace-nowrap text-white'
      >
        {quantityLabel(quantity, product.unit)}
      </span>
      <button
        type='button'
        onClick={onIncrement}
        aria-label={`Aumentar ${product.name}`}
        className='flex size-11 cursor-pointer items-center justify-center text-white'
      >
        <Plus className='size-5' aria-hidden />
      </button>
    </div>
  );
}

interface ProductCardProps {
  product: CatalogProduct;
  quantity: number;
  /** false com pedidos fechados: preço só de referência, sem botões. */
  canOrder: boolean;
  onAdd: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
}

export function ProductCard({
  product,
  quantity,
  canOrder,
  onAdd,
  onDecrement,
  onIncrement,
}: ProductCardProps) {
  const inCart = canOrder && quantity > 0 && product.available;
  return (
    <article
      className={cn(
        'flex flex-col gap-2.5 rounded-[20px] border-[1.5px] bg-surface p-1.5 pb-2',
        inCart ? 'border-brand' : 'border-line',
        !product.available && 'opacity-70',
        !canOrder && 'pb-3'
      )}
    >
      <Link
        to='/produto/$productId'
        params={{ productId: product.id }}
        className='flex flex-col gap-2 text-inherit no-underline'
        aria-label={`${product.name}, ${formatBRL(product.priceCents)} por ${unitShort(product.unit)}`}
      >
        <span className='relative block'>
          <ProductImage
            product={product}
            className='h-[136px] rounded-[15px]'
            imageClassName='size-[108px]'
          />
          <span className='absolute top-2 left-2'>
            {!product.available ? (
              <Pill muted>Em falta</Pill>
            ) : product.badge ? (
              <Pill>{BADGE_LABEL[product.badge]}</Pill>
            ) : null}
          </span>
        </span>
        <span className='flex flex-col gap-px px-1.5'>
          <span className='font-display text-base leading-tight font-semibold text-ink'>
            {product.name}
          </span>
          <span className='text-xs text-ink-2'>
            mín. {quantityLabel(product.minQuantity, product.unit)}
          </span>
          <span className='mt-1 flex items-baseline gap-1'>
            <span
              className={cn(
                'font-display text-lg font-bold',
                canOrder ? 'text-brand' : 'text-ink-3'
              )}
            >
              {formatBRL(product.priceCents)}
            </span>
            <span className='text-xs text-ink-2'>/{unitShort(product.unit)}</span>
          </span>
        </span>
      </Link>
      {!canOrder ? null : !product.available ? (
        <div className='flex min-h-11 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-disabled-ink'>
          Indisponível
        </div>
      ) : inCart ? (
        <CardStepper
          product={product}
          quantity={quantity}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
        />
      ) : (
        <button
          type='button'
          onClick={onAdd}
          aria-label={`Adicionar ${quantityLabel(product.minQuantity, product.unit)} de ${product.name}`}
          className='flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-100 text-sm font-bold text-brand hover:bg-brand-border'
        >
          <Plus className='size-[18px]' aria-hidden />
          Adicionar
        </button>
      )}
    </article>
  );
}
