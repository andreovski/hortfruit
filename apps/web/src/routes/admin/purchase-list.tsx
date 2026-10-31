import { formatBRL, formatDeliveryDate, quantityLabel } from '@hortifruit/core';
import { Download, Printer } from 'lucide-react';
import { useMemo } from 'react';

import { buttonLinkClass } from '@/components/admin/button-link';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from '@/components/admin/ui';
import { ordersLabel } from '@/features/admin/labels';
import { usePurchaseList } from '@/features/admin/orders';
import { useProducts } from '@/features/admin/products';

export function PurchaseListPage() {
  const query = usePurchaseList();
  // A lista de compra não traz imagem e cor: vêm do cadastro dos produtos.
  const products = useProducts();
  const looks = useMemo(
    () =>
      new Map(products.data?.products.map((p) => [p.id, { imageUrl: p.imageUrl, color: p.color }])),
    [products.data]
  );
  const week = query.data?.week;
  const csvHref = `/api/admin/purchase-list.csv${week ? `?weekId=${encodeURIComponent(week.id)}` : ''}`;

  return (
    <>
      <PageHeader
        title='Lista de compra'
        subtitle={
          week
            ? `Soma dos pedidos da entrega ${formatDeliveryDate(week.deliveryDate)} (sem os cancelados)`
            : 'Soma dos pedidos da semana por produto'
        }
      >
        <Button
          variant='secondary'
          onClick={() => window.print()}
          disabled={!query.data?.rows.length}
        >
          <Printer aria-hidden className='size-4' />
          Imprimir
        </Button>
        <a href={csvHref} download className={buttonLinkClass}>
          <Download aria-hidden className='size-4' />
          Exportar CSV
        </a>
      </PageHeader>

      <Card aria-labelledby='lista-titulo' className='overflow-hidden print:border-0'>
        <div className='flex flex-wrap items-end justify-between gap-2 border-b border-line-soft px-5 py-4'>
          <div className='flex flex-col gap-0.5'>
            <h2 id='lista-titulo' className='m-0 font-display text-xl font-semibold text-brand'>
              Lista de compra da semana
            </h2>
            <span className='text-[13px] text-ink-2'>
              {query.data ? `${query.data.rows.length} produtos` : ' '}
            </span>
          </div>
          {query.data ? (
            <span className='font-display text-2xl font-bold text-brand'>
              {formatBRL(query.data.totalCents)}
            </span>
          ) : null}
        </div>
        <div className='relative overflow-x-auto'>
          {query.isPending ? (
            <TableSkeleton />
          ) : query.isError ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : query.data.rows.length === 0 ? (
            <EmptyState>Nenhum pedido nesta semana ainda.</EmptyState>
          ) : (
            <table className='w-full min-w-[620px] border-collapse text-left'>
              <thead>
                <tr className='text-xs tracking-[0.05em] text-ink-2'>
                  <th scope='col' className='w-16 px-5 py-3'>
                    <span className='sr-only'>Imagem</span>
                  </th>
                  <th scope='col' className='px-3 py-3 font-bold'>
                    PRODUTO
                  </th>
                  <th scope='col' className='px-3 py-3 font-bold'>
                    QUANTIDADE TOTAL
                  </th>
                  <th scope='col' className='px-3 py-3 font-bold'>
                    PEDIDOS
                  </th>
                  <th scope='col' className='px-5 py-3 text-right font-bold'>
                    VALOR ESTIMADO
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.rows.map((row) => {
                  const look = looks.get(row.productId);
                  return (
                    <tr key={row.productId} className='border-t border-line-soft'>
                      <td className='px-5 py-2.5'>
                        <span
                          aria-hidden
                          className='flex size-10 items-center justify-center rounded-[10px] bg-muted'
                          style={look ? { background: look.color } : undefined}
                        >
                          {look ? (
                            <img src={look.imageUrl} alt='' className='size-8 object-contain' />
                          ) : null}
                        </span>
                      </td>
                      <td className='px-3 py-2.5'>
                        <span className='block font-semibold'>{row.name}</span>
                        <span className='block text-xs text-ink-2'>{row.saleDescription}</span>
                      </td>
                      <td className='px-3 py-2.5 font-display text-[17px] font-bold text-brand'>
                        {quantityLabel(row.quantity, row.unit)}
                      </td>
                      <td className='px-3 py-2.5 text-ink-3'>{ordersLabel(row.orderCount)}</td>
                      <td className='px-5 py-2.5 text-right font-semibold'>
                        {formatBRL(row.totalCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      <p className='m-0 text-[13px] text-ink-2'>
        Valores estimados pelos preços da semana, antes da pesagem.
      </p>
    </>
  );
}
