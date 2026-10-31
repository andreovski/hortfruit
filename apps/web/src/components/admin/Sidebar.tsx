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
  to: '/admin' | '/admin/lista-de-compra' | '/admin/clientes' | '/admin/produtos' | '/admin/ajustes';
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Pedidos', icon: ClipboardList, badge: true },
  { to: '/admin/lista-de-compra', label: 'Lista de compra', icon: ShoppingBasket },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/produtos', label: 'Produtos e preços', icon: Tag },
  { to: '/admin/ajustes', label: 'Ajustes', icon: Settings },
];

const linkBase =
  'flex min-h-11 flex-none items-center gap-3 rounded-xl px-3 font-semibold text-brand-150 no-underline hover:bg-brand-800/60 hover:text-white';

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
          <span className='font-display text-base leading-[1.15] font-bold tracking-[0.04em]'>MORRO VERDE</span>
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

      <div className='-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0'>
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            className={linkBase}
            activeProps={{ className: cn(linkBase, 'bg-brand-800 text-white') }}
          >
            <item.icon aria-hidden className='size-5 flex-none' />
            <span className='flex-1 whitespace-nowrap'>{item.label}</span>
            {item.badge && newCount > 0 ? (
              <span
                aria-label={`${newCount} ${newCount === 1 ? 'pedido novo' : 'pedidos novos'}`}
                className='flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-400 px-[7px] text-xs font-bold text-brand'
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
        className={cn(linkBase, 'mt-auto hidden w-full cursor-pointer bg-transparent text-left lg:flex')}
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
            {week.isOpen
              ? `Pedidos fecham ${formatDeadline(week.closesAt)}`
              : 'Pedidos fechados'}
          </span>
        </>
      ) : (
        <span className='text-[13px] text-brand-150'>Nenhuma semana aberta</span>
      )}
      {week && !week.isOpen ? (
        <Link to='/admin/produtos' className='mt-1 text-[13px] font-semibold text-brand-200 hover:text-white'>
          Publicar a lista para abrir
        </Link>
      ) : null}
    </div>
  );
}
