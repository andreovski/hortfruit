import { Navigate, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useLogout, useMe } from '@/features/admin/auth';
import { useNewOrdersCount } from '@/features/admin/orders';

import { Sidebar } from './Sidebar';
import { ErrorState } from './ui';

/** Casca do painel: confere a sessão e monta o menu lateral. */
export function AdminLayout() {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) {
    return (
      <div role='status' aria-label='Carregando o painel' className='flex min-h-dvh items-center justify-center'>
        <Loader2 aria-hidden className='size-8 animate-spin text-brand-600' />
      </div>
    );
  }
  if (me.data === null) {
    // Durante a navegação para o login este layout ainda renderiza com a URL nova: não repete.
    if (location.pathname.startsWith('/admin/entrar')) return null;
    return <Navigate to='/admin/entrar' search={{ redirect: location.href }} replace />;
  }
  if (me.isError) {
    return (
      <main className='flex min-h-dvh items-center justify-center'>
        <ErrorState message='Não foi possível falar com o servidor.' onRetry={() => void me.refetch()} />
      </main>
    );
  }
  return <AdminShell />;
}

function AdminShell() {
  const navigate = useNavigate();
  const logout = useLogout();
  const loadedCount = useNewOrdersCount().data?.count;
  useNewOrderToast(loadedCount);
  const newCount = loadedCount ?? 0;

  return (
    <div className='flex min-h-dvh flex-col bg-cream text-ink lg:flex-row'>
      <Sidebar
        newCount={newCount}
        loggingOut={logout.isPending}
        onLogout={() =>
          logout.mutate(undefined, {
            onSettled: () => void navigate({ to: '/admin/entrar', search: { redirect: undefined } }),
          })
        }
      />
      <main className='min-w-0 flex-1 px-4 py-6 sm:px-6 lg:p-8'>
        <div className='mx-auto flex max-w-[1240px] flex-col gap-6'>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** Avisa quando o contador de pedidos novos cresce (a lista se atualiza a cada 30 s). */
function useNewOrderToast(count: number | undefined) {
  const previous = useRef<number | null>(null);
  useEffect(() => {
    if (count === undefined) return;
    const before = previous.current;
    previous.current = count;
    if (before !== null && count > before) {
      const diff = count - before;
      toast.info(diff === 1 ? 'Chegou um pedido novo.' : `Chegaram ${diff} pedidos novos.`);
    }
  }, [count]);
}
