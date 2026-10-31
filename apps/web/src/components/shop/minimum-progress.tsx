import { formatBRL } from '@hortifruit/core';

import { cn } from '@/lib/utils';

/** Barra de progresso até o pedido mínimo (âmbar abaixo, verde quando atinge). */
export function MinimumProgress({
  totalCents,
  minOrderCents,
  missingCents,
}: {
  totalCents: number;
  minOrderCents: number;
  missingCents: number;
}) {
  const pct = minOrderCents > 0 ? Math.min(100, (totalCents / minOrderCents) * 100) : 100;
  const below = missingCents > 0;
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex justify-between text-xs text-brand-600'>
        <span>
          {below ? `Faltam ${formatBRL(missingCents)} para o mínimo` : 'Pedido mínimo atingido'}
        </span>
        <span>mín. {formatBRL(minOrderCents)}</span>
      </div>
      <div aria-hidden className='h-1.5 overflow-hidden rounded-full bg-disabled'>
        <div
          className={cn('h-full rounded-full', below ? 'bg-amber' : 'bg-brand-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
