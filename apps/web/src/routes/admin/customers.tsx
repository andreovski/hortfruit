import { formatPhone } from '@hortifruit/core';
import type { Customer } from '@hortifruit/schemas';
import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { CustomerForm } from '@/components/admin/customers/CustomerForm';
import { Drawer } from '@/components/admin/Drawer';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilterChips,
  PageHeader,
  Pill,
  SearchField,
  TableSkeleton,
} from '@/components/admin/ui';
import { type CustomerStatusFilter, useCustomers } from '@/features/admin/customers';
import { shortDate } from '@/features/admin/labels';
import { useDebouncedValue } from '@/features/admin/use-debounced-value';
import { BELOW_LG_QUERY, useMediaQuery } from '@/features/admin/use-media-query';
import { cn } from '@/lib/utils';

type Editing = { mode: 'new' } | { mode: 'edit'; customer: Customer } | null;

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatusFilter>('all');
  const [editing, setEditing] = useState<Editing>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const List = useMediaQuery(BELOW_LG_QUERY) ? CustomersList : CustomersTable;
  const query = useCustomers({ search: debouncedSearch, status });
  const customers = query.data?.customers ?? [];
  const activeCount = customers.filter((c) => c.active).length;

  const summary = !query.data
    ? ' '
    : status === 'all'
      ? `${customers.length} cadastrados · ${activeCount} ativos`
      : `${customers.length} ${status === 'active' ? 'ativos' : 'inativos'}`;

  return (
    <>
      <PageHeader title='Clientes' subtitle={summary}>
        <SearchField
          label='Buscar cliente'
          placeholder='Buscar nome, bairro ou telefone'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => setEditing({ mode: 'new' })}>
          <Plus aria-hidden className='size-[18px]' />
          Novo cliente
        </Button>
      </PageHeader>

      <FilterChips<CustomerStatusFilter>
        label='Filtrar por situação'
        value={status}
        onChange={setStatus}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Ativos' },
          { value: 'inactive', label: 'Inativos' },
        ]}
      />

      <Card aria-label='Lista de clientes' className='overflow-hidden'>
        <div className='relative overflow-x-auto'>
          {query.isPending ? (
            <TableSkeleton />
          ) : query.isError ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : customers.length === 0 ? (
            <EmptyState>
              {debouncedSearch || status !== 'all'
                ? 'Nenhum cliente encontrado.'
                : 'Nenhum cliente cadastrado. Cadastre o primeiro restaurante em "Novo cliente".'}
            </EmptyState>
          ) : (
            <List
              customers={customers}
              selectedId={editing?.mode === 'edit' ? editing.customer.id : null}
              onSelect={(customer) => setEditing({ mode: 'edit', customer })}
            />
          )}
        </div>
      </Card>

      <Drawer
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.mode === 'edit' ? 'Editar cliente' : 'Novo cliente'}
        description='Sem senha nem link de acesso: o restaurante se identifica pelo telefone no fim do pedido.'
      >
        {editing ? (
          <CustomerForm
            key={editing.mode === 'edit' ? editing.customer.id : 'new'}
            customer={editing.mode === 'edit' ? editing.customer : null}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Drawer>
    </>
  );
}

function CustomersTable({
  customers,
  selectedId,
  onSelect,
}: {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (customer: Customer) => void;
}) {
  return (
    <table className='w-full min-w-[820px] border-collapse text-left'>
      <thead>
        <tr className='text-xs tracking-[0.05em] text-ink-2'>
          <th scope='col' className='px-5 py-3 font-bold'>
            RESTAURANTE
          </th>
          <th scope='col' className='px-3 py-3 font-bold'>
            TELEFONE
          </th>
          <th scope='col' className='px-3 py-3 font-bold'>
            ENDEREÇO
          </th>
          <th scope='col' className='px-3 py-3 font-bold'>
            PEDIDOS
          </th>
          <th scope='col' className='px-3 py-3 font-bold'>
            ÚLTIMO
          </th>
          <th scope='col' className='px-5 py-3 font-bold'>
            STATUS
          </th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr
            key={c.id}
            onClick={() => onSelect(c)}
            className={cn(
              'cursor-pointer border-t border-line-soft hover:bg-cream/60',
              selectedId === c.id && 'bg-brand-100/60'
            )}
          >
            <td className='max-w-[260px] px-5 py-3.5'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(c);
                }}
                aria-label={`Editar ${c.name}`}
                className='block max-w-full cursor-pointer truncate bg-transparent p-0 text-left font-semibold text-ink'
              >
                {c.name}
              </button>
              <span className='block text-xs text-ink-2'>{c.contactName ?? '—'}</span>
            </td>
            <td className='px-3 py-3.5 text-sm whitespace-nowrap'>{formatPhone(c.phone)}</td>
            <td className='max-w-[280px] px-3 py-3.5'>
              <span className='block truncate text-sm'>{c.address}</span>
              <span className='block text-xs text-ink-2'>
                {[c.neighborhood, c.city].filter(Boolean).join(' · ') || '—'}
              </span>
            </td>
            <td className='px-3 py-3.5 text-sm'>{c.orderCount}</td>
            <td className='px-3 py-3.5 text-sm whitespace-nowrap text-ink-3'>
              {c.lastOrderAt ? shortDate(c.lastOrderAt) : '—'}
            </td>
            <td className='px-5 py-3.5'>
              <Pill tone={c.active ? 'green' : 'gray'}>{c.active ? 'Ativo' : 'Inativo'}</Pill>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Versão em cartões para celular. */
function CustomersList({
  customers,
  selectedId,
  onSelect,
}: {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (customer: Customer) => void;
}) {
  return (
    <ul className='m-0 list-none p-0'>
      {customers.map((c) => (
        <li key={c.id} className='border-t border-line-soft first:border-t-0'>
          <button
            type='button'
            onClick={() => onSelect(c)}
            aria-label={`Editar ${c.name}`}
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 bg-transparent px-4 py-3.5 text-left text-ink hover:bg-cream/60',
              selectedId === c.id && 'bg-brand-100/60'
            )}
          >
            <span className='flex min-w-0 flex-1 flex-col gap-1'>
              <span className='flex items-center justify-between gap-3'>
                <span className='truncate font-semibold'>{c.name}</span>
                <Pill tone={c.active ? 'green' : 'gray'} className='flex-none'>
                  {c.active ? 'Ativo' : 'Inativo'}
                </Pill>
              </span>
              <span className='text-sm'>
                {formatPhone(c.phone)}
                {c.contactName ? <span className='text-ink-2'> · {c.contactName}</span> : null}
              </span>
              <span className='truncate text-xs text-ink-2'>
                {[c.neighborhood, c.city].filter(Boolean).join(' · ') || c.address}
              </span>
              <span className='text-xs text-ink-2'>
                {c.orderCount} {c.orderCount === 1 ? 'pedido' : 'pedidos'}
                {c.lastOrderAt ? ` · último ${shortDate(c.lastOrderAt)}` : ''}
              </span>
            </span>
            <ChevronRight aria-hidden className='size-5 flex-none text-ink-2' />
          </button>
        </li>
      ))}
    </ul>
  );
}
