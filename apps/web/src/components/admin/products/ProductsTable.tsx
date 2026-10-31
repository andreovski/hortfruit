import type { AdminProduct, Badge } from '@hortifruit/schemas';

import { BELOW_LG_QUERY, useMediaQuery } from '@/features/admin/use-media-query';

import { ProductCard, ProductRow } from './ProductRow';

export function ProductsTable({
  products,
  priceText,
  invalidIds,
  onPriceChange,
  onPriceCommit,
  onPatch,
  onEdit,
}: {
  products: AdminProduct[];
  priceText: (product: AdminProduct) => string;
  invalidIds: Set<string>;
  onPriceChange: (id: string, text: string) => void;
  onPriceCommit: (id: string) => void;
  onPatch: (id: string, patch: { available?: boolean; badge?: Badge }) => void;
  onEdit: (product: AdminProduct) => void;
}) {
  const compact = useMediaQuery(BELOW_LG_QUERY);
  if (compact) {
    return (
      <ul className='m-0 list-none p-0'>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            priceText={priceText(p)}
            invalid={invalidIds.has(p.id)}
            onPriceChange={(text) => onPriceChange(p.id, text)}
            onPriceCommit={() => onPriceCommit(p.id)}
            onPatch={(patch) => onPatch(p.id, patch)}
            onEdit={() => onEdit(p)}
          />
        ))}
      </ul>
    );
  }
  return (
    <table className='w-full min-w-[1120px] border-collapse text-left'>
      <thead>
        <tr className='text-xs tracking-[0.05em] text-ink-2'>
          <th scope='col' className='w-16 py-3 pl-5'>
            <span className='sr-only'>Imagem</span>
          </th>
          <th scope='col' className='px-3 py-3 font-bold'>PRODUTO</th>
          <th scope='col' className='px-3 py-3 font-bold'>VENDA</th>
          <th scope='col' className='px-3 py-3 font-bold'>MÍNIMO</th>
          <th scope='col' className='w-[170px] px-3 py-3 font-bold'>PREÇO DA SEMANA</th>
          <th scope='col' className='px-3 py-3 font-bold'>VARIAÇÃO</th>
          <th scope='col' className='px-3 py-3 font-bold'>DISPONIBILIDADE</th>
          <th scope='col' className='w-[150px] px-3 py-3 font-bold'>SELO</th>
          <th scope='col' className='w-14 py-3 pr-5'>
            <span className='sr-only'>Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            priceText={priceText(p)}
            invalid={invalidIds.has(p.id)}
            onPriceChange={(text) => onPriceChange(p.id, text)}
            onPriceCommit={() => onPriceCommit(p.id)}
            onPatch={(patch) => onPatch(p.id, patch)}
            onEdit={() => onEdit(p)}
          />
        ))}
      </tbody>
    </table>
  );
}
