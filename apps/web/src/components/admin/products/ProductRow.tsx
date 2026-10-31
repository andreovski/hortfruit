import { formatBRL, parseBRL, priceChangePercent, quantityLabel, unitShort } from '@hortifruit/core';
import type { AdminProduct, Badge } from '@hortifruit/schemas';
import { Pencil } from 'lucide-react';

import { BADGE_OPTIONS, CATEGORY_LABEL } from '@/features/admin/labels';
import { cn } from '@/lib/utils';

import { Switch } from '../ui';

/** Preço de comparação: o publicado quando o rascunho mudou; senão, o publicado anterior. */
export function basePrice(product: AdminProduct, draftCents: number | null): number | null {
  const published = product.published?.priceCents ?? null;
  if (published !== null && draftCents !== null && draftCents !== published) return published;
  return product.previousPriceCents;
}

export function variationLabel(base: number | null, current: number | null) {
  if (current === null) return { text: '—', tone: 'text-ink-2' };
  const pct = priceChangePercent(base, current);
  if (pct === null || Math.abs(pct) < 0.05) return { text: '—', tone: 'text-ink-2' };
  const text = `${pct > 0 ? '+' : ''}${pct.toFixed(1).replace('.', ',')}%`;
  return { text, tone: pct > 0 ? 'text-amber-up' : 'text-brand-800' };
}

export function ProductRow({
  product,
  priceText,
  invalid,
  onPriceChange,
  onPriceCommit,
  onPatch,
  onEdit,
}: {
  product: AdminProduct;
  priceText: string;
  invalid: boolean;
  onPriceChange: (text: string) => void;
  onPriceCommit: () => void;
  onPatch: (patch: { available?: boolean; badge?: Badge }) => void;
  onEdit: () => void;
}) {
  const { draft } = product;
  const current = parseBRL(priceText);
  const base = basePrice(product, current);
  const variation = variationLabel(base, current);
  const unit = unitShort(product.unit);
  const priceId = `preco-${product.id}`;

  return (
    <tr className={cn('border-t border-line-soft', product.changed && 'bg-amber-50/50')}>
      <td className='py-2.5 pr-2 pl-5'>
        <span
          aria-hidden
          className={cn('flex size-11 items-center justify-center rounded-xl', !draft.available && 'opacity-55')}
          style={{ background: product.color }}
        >
          <img src={product.imageUrl} alt='' className='size-[34px] object-contain' />
        </span>
      </td>
      <td className='px-3 py-2.5'>
        <span className='flex flex-wrap items-center gap-2'>
          <span className='font-semibold'>{product.name}</span>
          {product.changed ? (
            <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-ink'>Alterado</span>
          ) : null}
        </span>
        <span className='block text-xs text-ink-2'>{CATEGORY_LABEL[product.category]}</span>
      </td>
      <td className='px-3 py-2.5 text-sm'>{product.saleDescription}</td>
      <td className='px-3 py-2.5 text-sm whitespace-nowrap'>
        {quantityLabel(product.minQuantity, product.unit)}
      </td>
      <td className='px-3 py-2.5'>
        <label
          htmlFor={priceId}
          className={cn(
            'flex min-h-11 items-center gap-1.5 rounded-[10px] border px-2.5',
            invalid
              ? 'border-danger-strong bg-danger-100/40'
              : product.changed
                ? 'border-amber-400 bg-amber-50'
                : 'border-line-strong bg-surface',
            'focus-within:outline-2 focus-within:outline-brand-400'
          )}
        >
          <span className='text-[13px] text-ink-2'>R$</span>
          <input
            id={priceId}
            inputMode='decimal'
            aria-label={`Preço de ${product.name} por ${unit}`}
            aria-invalid={invalid}
            value={priceText}
            onChange={(e) => onPriceChange(e.target.value.replace(/[^\d,.]/g, ''))}
            onBlur={onPriceCommit}
            className='w-full min-w-0 border-0 bg-transparent text-[15px] font-semibold text-ink outline-none'
          />
          <span className='text-xs text-ink-2'>/{unit}</span>
        </label>
        <span className={cn('mt-0.5 block text-xs', invalid ? 'text-danger-strong' : 'text-ink-2')}>
          {invalid ? 'Preço inválido' : base !== null ? `antes ${formatBRL(base)}` : 'sem preço anterior'}
        </span>
      </td>
      <td className={cn('px-3 py-2.5 text-sm font-semibold', variation.tone)}>{variation.text}</td>
      <td className='px-3 py-2.5'>
        <Switch
          checked={draft.available}
          onCheckedChange={(available) => onPatch({ available })}
          label={`${product.name} disponível`}
          onText='Disponível'
          offText='Em falta'
        />
      </td>
      <td className='px-3 py-2.5'>
        <select
          aria-label={`Selo de ${product.name}`}
          value={draft.badge ?? ''}
          onChange={(e) => onPatch({ badge: (e.target.value || null) as Badge })}
          className='min-h-11 w-full rounded-[10px] border border-line-strong bg-surface px-2.5 text-sm text-ink'
        >
          {BADGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className='py-2.5 pr-5 pl-1'>
        <button
          type='button'
          onClick={onEdit}
          aria-label={`Editar cadastro de ${product.name}`}
          className='flex size-11 cursor-pointer items-center justify-center rounded-xl text-ink-2 hover:bg-cream hover:text-brand'
        >
          <Pencil aria-hidden className='size-[18px]' />
        </button>
      </td>
    </tr>
  );
}
