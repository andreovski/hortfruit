import {
  formatBRL,
  formatPercent,
  marginPercent,
  parseBRL,
  quantityLabel,
  unitShort,
} from '@hortifruit/core';
import type { AdminProduct, Badge } from '@hortifruit/schemas';
import { Pencil } from 'lucide-react';

import { ProductImage } from '@/components/product-image';
import { BADGE_OPTIONS, CATEGORY_LABEL } from '@/features/admin/labels';
import { cn } from '@/lib/utils';

import { Switch } from '../ui';

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
  const current = parseBRL(priceText);

  return (
    <tr className={cn('border-t border-line-soft', product.changed && 'bg-amber-50/50')}>
      <td className='py-2.5 pr-2 pl-5'>
        <ProductThumb product={product} />
      </td>
      <td className='px-3 py-2.5'>
        <ProductName product={product} />
        <span className='block text-xs text-ink-2'>{CATEGORY_LABEL[product.category]}</span>
      </td>
      <td className='px-3 py-2.5 text-sm'>{product.saleDescription}</td>
      <td className='px-3 py-2.5 text-sm whitespace-nowrap'>
        {quantityLabel(product.minQuantity, product.unit)}
      </td>
      <td className='px-3 py-2.5'>
        <PriceField
          product={product}
          priceText={priceText}
          invalid={invalid}
          onPriceChange={onPriceChange}
          onPriceCommit={onPriceCommit}
        />
      </td>
      <td className='px-3 py-2.5'>
        <CostInfo product={product} priceCents={current} />
      </td>
      <td className='px-3 py-2.5'>
        <AvailabilitySwitch product={product} onPatch={onPatch} />
      </td>
      <td className='px-3 py-2.5'>
        <BadgeSelect product={product} onPatch={onPatch} />
      </td>
      <td className='py-2.5 pr-5 pl-1'>
        <EditButton product={product} onEdit={onEdit} />
      </td>
    </tr>
  );
}

type RowProps = Parameters<typeof ProductRow>[0];

/** Versão em cartão para celular e tablet: o preço fica em destaque, o resto logo abaixo. */
export function ProductCard({
  product,
  priceText,
  invalid,
  onPriceChange,
  onPriceCommit,
  onPatch,
  onEdit,
}: RowProps) {
  const current = parseBRL(priceText);

  return (
    <li
      className={cn(
        'flex flex-col gap-3 border-t border-line-soft px-4 py-3.5 first:border-t-0',
        product.changed && 'bg-amber-50/50'
      )}
    >
      <div className='flex items-center gap-3'>
        <ProductThumb product={product} />
        <div className='flex min-w-0 flex-1 flex-col'>
          <ProductName product={product} />
          <span className='text-xs text-ink-2'>
            {product.saleDescription} · mín. {quantityLabel(product.minQuantity, product.unit)}
          </span>
          <CostInfo product={product} priceCents={current} inline />
        </div>
        <EditButton product={product} onEdit={onEdit} />
      </div>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4'>
        <div className='sm:w-[240px] sm:flex-none'>
          <PriceField
            product={product}
            priceText={priceText}
            invalid={invalid}
            onPriceChange={onPriceChange}
            onPriceCommit={onPriceCommit}
          />
        </div>
        <div className='flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2'>
          <AvailabilitySwitch product={product} onPatch={onPatch} />
          <div className='w-[170px]'>
            <BadgeSelect product={product} onPatch={onPatch} />
          </div>
        </div>
      </div>
    </li>
  );
}

/** Custo (só ADM) e a margem contra o preço que está no campo. */
function CostInfo({
  product,
  priceCents,
  inline = false,
}: {
  product: AdminProduct;
  priceCents: number | null;
  inline?: boolean;
}) {
  if (product.costCents === null) {
    return inline ? null : <span className='text-sm text-ink-2'>—</span>;
  }
  const margin = marginPercent(product.costCents, priceCents);
  const marginText = margin === null ? null : `margem ${formatPercent(margin)}`;
  const marginTone = margin !== null && margin < 0 ? 'text-danger-strong' : 'text-ink-2';
  if (inline) {
    return (
      <span className='text-xs text-ink-2'>
        custo {formatBRL(product.costCents)}
        {marginText ? <span className={marginTone}> · {marginText}</span> : null}
      </span>
    );
  }
  return (
    <>
      <span className='block text-sm whitespace-nowrap'>{formatBRL(product.costCents)}</span>
      {marginText ? <span className={cn('block text-xs', marginTone)}>{marginText}</span> : null}
    </>
  );
}

function ProductThumb({ product }: { product: AdminProduct }) {
  return (
    <ProductImage
      product={product}
      className={cn('size-11 flex-none rounded-xl', !product.draft.available && 'opacity-55')}
      imageClassName='size-[34px]'
    />
  );
}

function ProductName({ product }: { product: AdminProduct }) {
  return (
    <span className='flex flex-wrap items-center gap-2'>
      <span className='font-semibold'>{product.name}</span>
      {product.changed ? (
        <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-ink'>
          Alterado
        </span>
      ) : null}
    </span>
  );
}

function PriceField({
  product,
  priceText,
  invalid,
  onPriceChange,
  onPriceCommit,
}: {
  product: AdminProduct;
  priceText: string;
  invalid: boolean;
  onPriceChange: (text: string) => void;
  onPriceCommit: () => void;
}) {
  const unit = unitShort(product.unit);
  const priceId = `preco-${product.id}`;
  return (
    <>
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
          className='w-full min-w-0 border-0 bg-transparent text-base font-semibold text-ink outline-none lg:text-[15px]'
        />
        <span className='text-xs text-ink-2'>/{unit}</span>
      </label>
      {invalid ? <span className='mt-0.5 block text-xs text-danger-strong'>Preço inválido</span> : null}
    </>
  );
}

function AvailabilitySwitch({ product, onPatch }: Pick<RowProps, 'product' | 'onPatch'>) {
  return (
    <Switch
      checked={product.draft.available}
      onCheckedChange={(available) => onPatch({ available })}
      label={`${product.name} disponível`}
      onText='Disponível'
      offText='Em falta'
    />
  );
}

function BadgeSelect({ product, onPatch }: Pick<RowProps, 'product' | 'onPatch'>) {
  return (
    <select
      aria-label={`Selo de ${product.name}`}
      value={product.draft.badge ?? ''}
      onChange={(e) => onPatch({ badge: (e.target.value || null) as Badge })}
      className='min-h-11 w-full rounded-[10px] border border-line-strong bg-surface px-2.5 text-sm text-ink'
    >
      {BADGE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function EditButton({ product, onEdit }: Pick<RowProps, 'product' | 'onEdit'>) {
  return (
    <button
      type='button'
      onClick={onEdit}
      aria-label={`Editar cadastro de ${product.name}`}
      className='flex size-11 flex-none cursor-pointer items-center justify-center rounded-xl text-ink-2 hover:bg-cream hover:text-brand'
    >
      <Pencil aria-hidden className='size-[18px]' />
    </button>
  );
}
