import { formatDeadline, formatDeliveryDate } from '@hortifruit/core';
import { Link } from '@tanstack/react-router';
import {
  ClipboardList,
  LogOut,
  type LucideIcon,
  Settings,
  ShoppingBasket,
  Tag,
  Users,
} from 'lucide-react';

import { useCurrentWeek } from '@/features/admin/week';
import { cn } from '@/lib/utils';

import { Logo } from './Logo';

interface NavItem {
  to:
    | '/admin'
    | '/admin/lista-de-compra'
    | '/admin/clientes'
    | '/admin/produtos'
    | '/admin/ajustes';
  label: string;
  /** Rótulo da barra de abas do celular, onde os cinco itens dividem a largura. */
  short: string;
  icon: LucideIcon;
  badge?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Pedidos', short: 'Pedidos', icon: ClipboardList, badge: true },
  { to: '/admin/lista-de-compra', label: 'Lista de compra', short: 'Compra', icon: ShoppingBasket },
  { to: '/admin/clientes', label: 'Clientes', short: 'Clientes', icon: Users },
  { to: '/admin/produtos', label: 'Produtos e preços', short: 'Produtos', icon: Tag },
  { to: '/admin/ajustes', label: 'Ajustes', short: 'Ajustes', icon: Settings },
];

const linkBase =
  'flex min-h-11 flex-none items-center gap-3 rounded-xl px-3 font-semibold text-brand-150 no-underline hover:bg-brand-800/60 hover:text-white';

// No celular os itens viram abas: ícone em cima, rótulo curto embaixo, os cinco na largura da tela.
const tabBase =
  'relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] leading-none font-semibold text-brand-150 no-underline hover:bg-brand-800/60 hover:text-white md:text-[13px] lg:min-h-11 lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-0 lg:text-base lg:leading-normal';

export function Sidebar({
  newCount,
  onLogout,
  loggingOut,
}: {
  newCount: number;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <nav
      aria-label='Menu do painel'
      className='no-print flex flex-col gap-4 bg-brand px-4 py-4 text-white lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:flex-none lg:gap-7 lg:overflow-y-auto lg:py-6'
    >
      <div className='flex items-center gap-3 px-2'>
        <Logo />
        <div className='flex min-w-0 flex-1 flex-col'>
          <span className='font-display text-base leading-[1.15] font-bold tracking-[0.04em]'>
            MORRO VERDE
          </span>
          <span className='text-xs text-brand-200'>Painel administrativo</span>
        </div>
        <button
          type='button'
          onClick={onLogout}
          disabled={loggingOut}
          aria-label='Sair'
          className='flex size-11 cursor-pointer items-center justify-center rounded-xl text-brand-150 hover:bg-brand-800 hover:text-white lg:hidden'
        >
          <LogOut aria-hidden className='size-5' />
        </button>
      </div>

      <div className='-mx-2 grid grid-cols-5 gap-0.5 sm:mx-0 lg:flex lg:flex-col lg:gap-1'>
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            className={tabBase}
            activeProps={{ className: cn(tabBase, 'bg-brand-800 text-white') }}
          >
            <item.icon aria-hidden className='size-5 flex-none' />
            <span aria-hidden className='max-w-full truncate lg:hidden'>
              {item.short}
            </span>
            <span className='sr-only lg:not-sr-only lg:flex-1 lg:whitespace-nowrap'>
              {item.label}
            </span>
            {item.badge && newCount > 0 ? (
              <span
                aria-label={`${newCount} ${newCount === 1 ? 'pedido novo' : 'pedidos novos'}`}
                className='absolute top-1 left-[calc(50%+4px)] flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-400 px-[5px] text-[11px] font-bold text-brand lg:static lg:h-6 lg:min-w-6 lg:px-[7px] lg:text-xs'
              >
                {newCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      <WeekCard />

      <button
        type='button'
        onClick={onLogout}
        disabled={loggingOut}
        className={cn(
          linkBase,
          'mt-auto hidden w-full cursor-pointer bg-transparent text-left lg:flex'
        )}
      >
        <LogOut aria-hidden className='size-5' />
        Sair
      </button>
    </nav>
  );
}

function WeekCard() {
  const { data, isPending } = useCurrentWeek();
  const week = data?.week;
  return (
    <div className='hidden flex-col gap-1 rounded-[14px] bg-brand-800 p-3.5 lg:flex'>
      <span className='text-xs text-brand-200'>Semana atual</span>
      {isPending ? (
        <span className='text-sm text-brand-150'>Carregando…</span>
      ) : week ? (
        <>
          <span className='font-semibold'>Entrega {formatDeliveryDate(week.deliveryDate)}</span>
          <span className='text-[13px] text-brand-150'>
            {week.isOpen ? `Pedidos fecham ${formatDeadline(week.closesAt)}` : 'Pedidos fechados'}
          </span>
        </>
      ) : (
        <span className='text-[13px] text-brand-150'>Nenhuma semana aberta</span>
      )}
      {week && !week.isOpen ? (
        <Link
          to='/admin/produtos'
          className='mt-1 text-[13px] font-semibold text-brand-200 hover:text-white'
        >
          Publicar a lista para abrir
        </Link>
      ) : null}
    </div>
  );
}
