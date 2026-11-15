import { formatBRL, formatDeadline, whatsappLink } from '@hortifruit/core';
import type { CatalogProduct, CatalogResponse, Category } from '@hortifruit/schemas';
import { Link } from '@tanstack/react-router';
import { ChevronRight, MessageCircle, Package, PackageOpen, Pencil, Tag } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { ClosedStrip, OpenStrip } from '@/components/shop/cycle-strip';
import { CatalogSkeleton, EmptyState, ErrorState } from '@/components/shop/feedback';
import { BottomBar, ShopHeader, ShopPage } from '@/components/shop/layout';
import { MinimumProgress } from '@/components/shop/minimum-progress';
import { ProductCard } from '@/components/shop/product-card';
import { buttonClass } from '@/components/shop/ui';
import { summarizeCart } from '@/features/shop/cart-lines';
import { editCartStore, useActiveCart } from '@/features/shop/cart-store';
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  formatShortDate,
  itemsLabel,
  orderNumber,
} from '@/features/shop/format';
import { useReconcileCart, useWeekOpen } from '@/features/shop/hooks';
import { useCatalog } from '@/features/shop/queries';
import { cn } from '@/lib/utils';

/** Filtros extras: vêm antes das categorias, com outra cor. Não são categorias. */
type ExtraFilter = 'ATACADO' | 'PROMOCOES';
type Filter = 'ALL' | Category | ExtraFilter;

const EXTRA_FILTERS: { value: ExtraFilter; label: string; icon: ReactNode; match: (p: CatalogProduct) => boolean }[] = [
  {
    value: 'ATACADO',
    label: 'Atacado',
    icon: <Package className='size-4' aria-hidden />,
    match: (p) => p.wholesale,
  },
  {
    value: 'PROMOCOES',
    label: 'Promoções',
    icon: <Tag className='size-4' aria-hidden />,
    match: (p) => p.promotion,
  },
];

function matchesFilter(product: CatalogProduct, filter: Filter): boolean {
  if (filter === 'ALL') return true;
  const extra = EXTRA_FILTERS.find((f) => f.value === filter);
  return extra ? extra.match(product) : product.category === filter;
}

export function CatalogPage() {
  const catalog = useCatalog();
  const data = catalog.data;
  return (
    <ShopPage className='pb-44'>
      <ShopHeader whatsapp={data?.whatsapp} />
      {catalog.isPending ? (
        <CatalogSkeleton />
      ) : catalog.isError ? (
        <div className='p-4'>
          <ErrorState
            message='Não deu para carregar os produtos.'
            onRetry={() => catalog.refetch()}
          />
        </div>
      ) : (
        <CatalogContent data={data!} />
      )}
    </ShopPage>
  );
}

function CatalogContent({ data }: { data: CatalogResponse }) {
  const open = useWeekOpen(data.week);
  const cart = useActiveCart();
  useReconcileCart(cart.store, data.products);
  const [filter, setFilter] = useState<Filter>('ALL');

  const filters = useMemo(() => {
    const present = new Set(data.products.map((p) => p.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [data.products]);
  // Só mostra o filtro extra que tem produto.
  const extraFilters = useMemo(
    () => EXTRA_FILTERS.filter((f) => data.products.some(f.match)),
    [data.products]
  );
  const visible = data.products.filter((p) => matchesFilter(p, filter));
  const summary = summarizeCart(
    cart.state.items,
    data.products,
    data.minOrderCents,
    data.smallOrderFeeCents
  );

  return (
    <>
      <main className='flex flex-col gap-4 px-4 pt-1 pb-4'>
        {open && data.week ? (
          <OpenStrip
            week={data.week}
            minOrderCents={data.minOrderCents}
            smallOrderFeeCents={data.smallOrderFeeCents}
          />
        ) : (
          <ClosedStrip week={data.week} />
        )}

        {open && cart.editing ? <EditingBanner number={cart.editing.number} /> : null}

        <div className='flex flex-col gap-0.5'>
          <h1 className='m-0 font-display text-[26px] leading-tight font-semibold text-brand'>
            {open ? 'Produtos da semana' : 'Preços de referência'}
          </h1>
          <span className='text-[13px] text-ink-2'>
            {data.publishedAt
              ? `Preços atualizados em ${formatShortDate(data.publishedAt)} · `
              : ''}
            {open ? itemsLabel(data.products.length) : 'a nova lista pode mudar'}
          </span>
        </div>

        {data.products.length === 0 ? (
          <EmptyState icon={<PackageOpen className='size-7' />} title='Nenhum produto por enquanto'>
            <p className='m-0 text-ink-2'>A lista da semana ainda não foi publicada.</p>
          </EmptyState>
        ) : (
          <>
            {filters.length > 1 || extraFilters.length > 0 ? (
              <div role='group' aria-label='Filtrar produtos' className='flex flex-wrap gap-2'>
                {extraFilters.map((f) => (
                  <FilterChip
                    key={f.value}
                    extra
                    icon={f.icon}
                    active={filter === f.value}
                    onClick={() => setFilter(filter === f.value ? 'ALL' : f.value)}
                  >
                    {f.label}
                  </FilterChip>
                ))}
                <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
                  Todos
                </FilterChip>
                {filters.length > 1 &&
                  filters.map((c) => (
                  <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
                    {CATEGORY_LABEL[c]}
                  </FilterChip>
                ))}
              </div>
            ) : null}

            <div className='grid grid-cols-2 gap-3'>
              {visible.map((product: CatalogProduct) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cart.state.items[product.id] ?? 0}
                  canOrder={open}
                  onAdd={() => cart.store.add(product)}
                  onIncrement={() => cart.store.increment(product)}
                  onDecrement={() => cart.store.decrement(product)}
                />
              ))}
            </div>

            {open && data.week ? (
              <p className='m-0 mt-2 text-center text-[13px] text-ink-2'>
                Preços válidos até {formatDeadline(data.week.closesAt)}.
                <br />
                Itens por kg são cobrados pelo peso real.
              </p>
            ) : null}
          </>
        )}
      </main>

      {open && summary.itemCount > 0 ? (
        <BottomBar>
          <MinimumProgress
            totalCents={summary.itemsCents}
            minOrderCents={data.minOrderCents}
            missingCents={summary.missingCents}
            feeCents={data.smallOrderFeeCents}
          />
          <Link
            to='/finalizar'
            className='flex min-h-14 items-center justify-between rounded-2xl bg-brand px-4 text-white no-underline hover:bg-brand-800 hover:text-white'
          >
            <span className='flex flex-col items-start' aria-live='polite'>
              <span className='text-xs text-brand-200'>
                {itemsLabel(summary.itemCount)}
                {cart.editing ? ` · pedido ${orderNumber(cart.editing.number)}` : ''}
              </span>
              <span className='font-display text-lg font-bold'>
                {formatBRL(summary.itemsCents)}
              </span>
            </span>
            <span className='flex items-center gap-1.5 font-bold'>
              {cart.editing ? 'Revisar edição' : 'Ver pedido'}
              <ChevronRight className='size-5' aria-hidden />
            </span>
          </Link>
        </BottomBar>
      ) : !open && data.whatsapp ? (
        <BottomBar className='pt-3'>
          <a
            href={whatsappLink(data.whatsapp, 'Olá! Quando sai a lista da semana da Morro Verde?')}
            target='_blank'
            rel='noopener noreferrer'
            className={buttonClass('outline', 'lg', 'min-h-[52px] rounded-[14px]')}
          >
            <MessageCircle className='size-5' aria-hidden />
            Dúvidas? Fale no WhatsApp
          </a>
        </BottomBar>
      ) : null}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  extra = false,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  /** Filtro extra (Atacado, Promoções): tom âmbar para não parecer categoria. */
  extra?: boolean;
  icon?: ReactNode;
  children: string;
}) {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold',
        extra
          ? active
            ? 'border-amber-ink bg-amber-ink text-white'
            : 'border-amber-border bg-amber-100 text-amber-ink'
          : active
            ? 'border-brand bg-brand text-white'
            : 'border-line-strong bg-surface text-ink'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function EditingBanner({ number }: { number: number }) {
  return (
    <div className='flex items-center gap-3 rounded-[14px] border border-amber-border bg-amber-100 px-3 py-2'>
      <Pencil className='size-[18px] flex-none text-amber-ink' aria-hidden />
      <span className='min-w-0 flex-1 text-[13px] text-amber-ink-2'>
        <strong>Editando o pedido {orderNumber(number)}.</strong> As mudanças só valem quando você
        salvar.
      </span>
      <button
        type='button'
        onClick={() => editCartStore.clear()}
        className='min-h-11 flex-none cursor-pointer rounded-xl px-2 text-[13px] font-bold text-amber-ink underline'
      >
        Sair da edição
      </button>
    </div>
  );
}
