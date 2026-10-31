import { formatDateTime, formatDeadline } from '@hortifruit/core';
import type { AdminProduct, OpenWeekBody } from '@hortifruit/schemas';
import { useIsMutating } from '@tanstack/react-query';
import { ChevronDown, CircleCheck, Pencil, Plus, Send, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Drawer } from '@/components/admin/Drawer';
import { OpenWeekDialog } from '@/components/admin/products/OpenWeekDialog';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { ProductsTable } from '@/components/admin/products/ProductsTable';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilterChips,
  PageHeader,
  TableSkeleton,
} from '@/components/admin/ui';
import { ProductImage } from '@/components/product-image';
import { usePriceDrafts } from '@/features/admin/price-drafts';
import { DRAFT_MUTATION_KEY, usePatchDraft, useProducts, usePublish } from '@/features/admin/products';
import { useSettings } from '@/features/admin/settings';
import { useCurrentWeek } from '@/features/admin/week';

type Filter = 'all' | 'LEGUMES' | 'FRUTAS' | 'missing' | 'changed';
type Editing = { product: AdminProduct | null } | null;

const FILTERS: { value: Filter; label: string; test: (p: AdminProduct) => boolean }[] = [
  { value: 'all', label: 'Todos', test: () => true },
  { value: 'LEGUMES', label: 'Legumes', test: (p) => p.category === 'LEGUMES' },
  { value: 'FRUTAS', label: 'Frutas', test: (p) => p.category === 'FRUTAS' },
  { value: 'missing', label: 'Em falta', test: (p) => !p.draft.available },
  { value: 'changed', label: 'Alterados', test: (p) => p.changed },
];

export function ProductsPage() {
  const query = useProducts();
  const weekQuery = useCurrentWeek();
  const settings = useSettings();
  const patch = usePatchDraft();
  const publish = usePublish();
  const savingDrafts = useIsMutating({ mutationKey: DRAFT_MUTATION_KEY }) > 0;

  const all = query.data?.products ?? [];
  const active = all.filter((p) => !p.archived);
  const archived = all.filter((p) => p.archived);
  const prices = usePriceDrafts(all);

  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openWeekOpen, setOpenWeekOpen] = useState(false);
  const [publishedNow, setPublishedNow] = useState(false);

  const week = weekQuery.data?.week ?? null;
  const weekOpen = !!week?.isOpen;
  const changedCount = query.data?.changedCount ?? 0;
  const invalidCount = prices.invalidIds.size;
  // Sem semana aberta dá para publicar sem mudanças: é o que reabre os pedidos.
  const blocked = !query.data || !weekQuery.data || invalidCount > 0 || (weekOpen && changedCount === 0);
  const filterDef = FILTERS.find((f) => f.value === filter)!;
  const visible = active.filter(filterDef.test);

  function edited() {
    setPublishedNow(false);
  }

  function startPublish() {
    prices.flushAll();
    if (weekOpen) setConfirmOpen(true);
    else setOpenWeekOpen(true);
  }

  function doPublish(openWeek?: OpenWeekBody) {
    publish.mutate(openWeek ? { openWeek } : {}, {
      onSuccess: () => {
        setConfirmOpen(false);
        setOpenWeekOpen(false);
        setPublishedNow(true);
        if (filter === 'changed') setFilter('all');
      },
    });
  }

  const subtitle = query.data?.publishedAt
    ? `Lista publicada ${formatDateTime(query.data.publishedAt)}${week?.isOpen ? ` · válida até ${formatDeadline(week.closesAt)}` : ' · semana fechada'}`
    : query.data
      ? 'Lista ainda não publicada'
      : ' ';

  return (
    <>
      <PageHeader title='Produtos e preços' subtitle={subtitle}>
        {changedCount > 0 ? (
          <span className='inline-flex items-center gap-2 text-sm font-semibold text-amber-ink'>
            <span aria-hidden className='size-2 rounded-full bg-amber' />
            {changedCount === 1 ? '1 alteração não publicada' : `${changedCount} alterações não publicadas`}
          </span>
        ) : null}
        <Button variant='secondary' onClick={() => setEditing({ product: null })}>
          <Plus aria-hidden className='size-[18px]' />
          Novo produto
        </Button>
        <Button size='lg' disabled={blocked} onClick={startPublish}>
          <Send aria-hidden className='size-[18px]' />
          Publicar lista da semana
        </Button>
      </PageHeader>

      {publishedNow ? (
        <Banner role='status' tone='success' icon={<CircleCheck aria-hidden className='size-5 flex-none' />}>
          <strong>Lista publicada.</strong> Os clientes já veem os novos preços e a disponibilidade.
        </Banner>
      ) : null}
      {invalidCount > 0 ? (
        <Banner role='alert' tone='danger' icon={<TriangleAlert aria-hidden className='size-5 flex-none' />}>
          Corrija os preços em vermelho antes de publicar.
        </Banner>
      ) : null}
      {weekQuery.data && !weekOpen ? (
        <Banner tone='amber' icon={<TriangleAlert aria-hidden className='size-5 flex-none' />}>
          Pedidos fechados. Publique a lista para abrir a semana de entrega seguinte.
        </Banner>
      ) : null}

      <FilterChips
        label='Filtrar produtos'
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((f) => ({
          value: f.value,
          label: f.label,
          count: query.data ? active.filter(f.test).length : undefined,
        }))}
      />

      <Card aria-label='Lista de produtos' className='overflow-hidden'>
        <div className='overflow-x-auto'>
          {query.isPending ? (
            <TableSkeleton rows={8} />
          ) : query.isError ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : (
            <>
              <ProductsTable
                products={visible}
                priceText={prices.textFor}
                invalidIds={prices.invalidIds}
                onPriceChange={(id, text) => {
                  edited();
                  prices.change(id, text);
                }}
                onPriceCommit={prices.commit}
                onPatch={(id, p) => {
                  edited();
                  patch.mutate({ id, patch: p });
                }}
                onEdit={(product) => setEditing({ product })}
              />
              {visible.length === 0 ? (
                <EmptyState>
                  {active.length === 0 ? 'Nenhum produto cadastrado.' : 'Nenhum produto com esse filtro.'}
                </EmptyState>
              ) : null}
            </>
          )}
        </div>
      </Card>

      <p className='m-0 text-[13px] text-ink-2'>
        As alterações só aparecem para os clientes depois de publicar. Produtos em falta continuam visíveis no
        app, sem opção de pedido.
      </p>

      {archived.length > 0 ? <ArchivedList products={archived} onEdit={(product) => setEditing({ product })} /> : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title='Publicar lista da semana?'
        description='Os clientes passam a ver os novos preços, a disponibilidade e os selos agora.'
        confirmLabel={savingDrafts ? 'Salvando…' : 'Publicar'}
        loading={publish.isPending || savingDrafts}
        onConfirm={() => doPublish()}
      />
      {weekQuery.data ? (
        <OpenWeekDialog
          open={openWeekOpen}
          onOpenChange={setOpenWeekOpen}
          suggestion={weekQuery.data.suggestion}
          loading={publish.isPending || savingDrafts}
          onSubmit={(openWeek) => doPublish(openWeek)}
        />
      ) : null}

      <Drawer
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.product ? 'Editar produto' : 'Novo produto'}
        description={editing?.product ? editing.product.name : 'Aparece no app depois de publicar a lista.'}
      >
        {editing ? (
          <ProductForm
            key={editing.product?.id ?? 'new'}
            product={editing.product}
            uploadsEnabled={!!settings.data?.uploadsEnabled}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Drawer>
    </>
  );
}

function ArchivedList({ products, onEdit }: { products: AdminProduct[]; onEdit: (p: AdminProduct) => void }) {
  return (
    <details className='group rounded-card border border-line bg-surface'>
      <summary className='flex min-h-11 cursor-pointer list-none items-center gap-2 px-5 py-3 font-semibold text-ink-3'>
        <ChevronDown aria-hidden className='size-4 transition-transform group-open:rotate-180' />
        Arquivados ({products.length})
        <span className='text-[13px] font-normal text-ink-2'>· não aparecem no app</span>
      </summary>
      <ul className='m-0 list-none p-0'>
        {products.map((p) => (
          <li key={p.id} className='flex items-center gap-3 border-t border-line-soft px-5 py-2'>
            <ProductImage product={p} className='size-10 flex-none rounded-[10px] opacity-60' imageClassName='size-8' />
            <span className='flex-1 font-semibold text-ink-3'>{p.name}</span>
            <Button variant='ghost' onClick={() => onEdit(p)} aria-label={`Editar ${p.name}`}>
              <Pencil aria-hidden className='size-4' />
              Editar
            </Button>
          </li>
        ))}
      </ul>
    </details>
  );
}
