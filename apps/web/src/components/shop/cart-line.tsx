import { formatBRL, quantityLabel, unitShort } from '@hortifruit/core';
import { Minus, Plus, Trash2 } from 'lucide-react';

import type { CartLine } from '@/features/shop/cart-lines';

import { ProductImage } from './product-card';

const smallButton =
  'flex size-11 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-surface text-ink';

/** Linha do resumo do pedido: −/+ (abaixo do mínimo sai) e remover. */
export function CartLineRow({
  line,
  onDecrement,
  onIncrement,
  onRemove,
}: {
  line: CartLine;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
}) {
  const { product, quantity } = line;
  const atMin = quantity <= product.minQuantity;
  return (
    <li className='flex flex-col gap-2 border-b border-line-soft py-3 last:border-b-0'>
      <div className='flex items-center gap-3'>
        <ProductImage
          product={product}
          className='size-10 flex-none rounded-[10px]'
          imageClassName='size-8'
        />
        <div className='flex min-w-0 flex-1 flex-col'>
          <span className='font-semibold'>{product.name}</span>
          <span className='text-[13px] text-ink-2'>
            {formatBRL(product.priceCents)}/{unitShort(product.unit)} · mín.{' '}
            {quantityLabel(product.minQuantity, product.unit)}
          </span>
        </div>
        <span className='font-semibold whitespace-nowrap'>{formatBRL(line.subtotalCents)}</span>
      </div>
      <div className='flex items-center gap-2 pl-[52px]'>
        <button
          type='button'
          onClick={onDecrement}
          aria-label={atMin ? `Tirar ${product.name} do pedido` : `Diminuir ${product.name}`}
          className={smallButton}
        >
          <Minus className='size-4' aria-hidden />
        </button>
        <span aria-live='polite' className='min-w-16 text-center font-display font-bold text-brand'>
          {quantityLabel(quantity, product.unit)}
        </span>
        <button
          type='button'
          onClick={onIncrement}
          aria-label={`Aumentar ${product.name}`}
          className={smallButton}
        >
          <Plus className='size-4' aria-hidden />
        </button>
        <span className='flex-1' />
        <button
          type='button'
          onClick={onRemove}
          aria-label={`Remover ${product.name}`}
          className='flex size-11 cursor-pointer items-center justify-center rounded-xl text-disabled-ink hover:bg-muted'
        >
          <Trash2 className='size-[18px]' aria-hidden />
        </button>
      </div>
    </li>
  );
}
