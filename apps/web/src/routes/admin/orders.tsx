import { formatDeadline, formatDeliveryDate } from '@hortifruit/core';
import type { OrderStatusCode, Week } from '@hortifruit/schemas';
import { useMemo, useState } from 'react';

import { Indicators } from '@/components/admin/orders/Indicators';
import { OrderDrawer } from '@/components/admin/orders/OrderDrawer';
import { OrdersList, OrdersTable } from '@/components/admin/orders/OrdersTable';
import {
  Card,
  EmptyState,
  ErrorState,
  FilterChips,
  PageHeader,
  SearchField,
  Segmented,
  TableSkeleton,
} from '@/components/admin/ui';
import { useOrders } from '@/features/admin/orders';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import { COMPACT_QUERY, useMediaQuery } from '@/features/admin/use-media-query';

type StatusFilter = 'ALL' | OrderStatusCode;
type WeekFilter = 'current' | 'all';

const CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'NOVO', label: 'Novos' },
  { value: 'CONFIRMADO', label: 'Confirmados' },
  { value: 'ENTREGUE', label: 'Entregues' },
  { value: 'CANCELADO', label: 'Cancelados' },
];

export function weekSubtitle(week: Week | null | undefined) {
  if (week === undefined) return 'Carregando a semana…';
  if (!week) return 'Nenhuma semana aberta. Publique a lista em Produtos e preços para abrir.';
  const delivery = `Entrega ${formatDeliveryDate(week.deliveryDate)}`;
  return week.isOpen
    ? `${delivery} · recebendo pedidos até ${formatDeadline(week.closesAt)}`
    : `${delivery} · pedidos fechados`;
}

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [week, setWeek] = useState<WeekFilter>('current');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const compact = useMediaQuery(COMPACT_QUERY);
  const debouncedSearch = useDebouncedValue(search.trim());

  // A lista vem sem filtro de status: os chips contam e filtram aqui, numa busca só.
  const query = useOrders({ search: debouncedSearch, weekId: week === 'all' ? 'all' : undefined });
  const orders = useMemo(() => query.data?.orders ?? [], [query.data]);
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      ALL: orders.length,
      NOVO: 0,
      CONFIRMADO: 0,
      ENTREGUE: 0,
      CANCELADO: 0,
    };
    for (const o of orders) c[o.status] += 1;
    return c;
  }, [orders]);
  const visible = status === 'ALL' ? orders : orders.filter((o) => o.status === status);

  return (
    <>
      <PageHeader title='Pedidos' subtitle={weekSubtitle(query.data ? query.data.week : undefined)}>
        <SearchField
          label='Buscar por cliente ou número do pedido'
          placeholder='Buscar cliente ou nº do pedido'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </PageHeader>

      <Indicators data={query.data?.indicators} />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Segmented<WeekFilter>
          label='Semana'
          value={week}
          onChange={setWeek}
          options={[
            { value: 'current', label: 'Semana atual' },
            { value: 'all', label: 'Todas as semanas' },
          ]}
        />
        <FilterChips
          label='Filtrar por status'
          value={status}
          onChange={setStatus}
          options={CHIPS.map((c) => ({ ...c, count: query.data ? counts[c.value] : undefined }))}
        />
      </div>

      <Card aria-label='Lista de pedidos' className='overflow-hidden'>
        <div className='relative overflow-x-auto'>
          {query.isPending ? (
            <TableSkeleton />
          ) : query.isError ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : (
            <>
              {compact ? (
                <OrdersList orders={visible} selectedId={selectedId} onSelect={setSelectedId} />
              ) : (
                <OrdersTable orders={visible} selectedId={selectedId} onSelect={setSelectedId} />
              )}
              {visible.length === 0 ? (
                <EmptyState>
                  {orders.length === 0 && !debouncedSearch
                    ? 'Nenhum pedido ainda. Os pedidos chegam pelo app dos restaurantes.'
                    : 'Nenhum pedido encontrado com esse filtro.'}
                </EmptyState>
              ) : null}
            </>
          )}
        </div>
      </Card>

      <OrderDrawer orderId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
