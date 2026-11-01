import {
  formatBRL,
  formatDeadline,
  formatDeliveryDate,
  isValidPhone,
  maskPhoneInput,
  normalizePhone,
} from '@hortifruit/core';
import type { CatalogResponse, IdentifyResponse, UpdateOrderBody } from '@hortifruit/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { CircleAlert, Send, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CartLineRow } from '@/components/shop/cart-line';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shop/feedback';
import { BackHeader, BottomBar, ShopPage } from '@/components/shop/layout';
import { MinimumProgress } from '@/components/shop/minimum-progress';
import { ConfirmCustomer, PhoneField, PhoneNotFound } from '@/components/shop/phone-step';
import { buttonClass, cardClass } from '@/components/shop/ui';
import { summarizeCart } from '@/features/shop/cart-lines';
import { cartStore, editCartStore, useActiveCart } from '@/features/shop/cart-store';
import { orderNumber } from '@/features/shop/format';
import { useReconcileCart, useWeekOpen } from '@/features/shop/hooks';
import { shopApi, shopKeys, useCatalog } from '@/features/shop/queries';
import { getRememberedPhone, rememberPhone, saveOrderToken } from '@/features/shop/storage';
import { errorMessage } from '@/lib/api';

type Customer = Extract<IdentifyResponse, { found: true }>['customer'];
type Phase = { kind: 'phone' } | { kind: 'confirm'; customer: Customer } | { kind: 'notFound' };

export function CheckoutPage() {
  const catalog = useCatalog();
  if (catalog.isPending) {
    return (
      <ShopPage>
        <PageSkeleton />
      </ShopPage>
    );
  }
  if (catalog.isError) {
    return (
      <ShopPage className='p-4'>
        <ErrorState message='Não deu para carregar o pedido.' onRetry={() => catalog.refetch()} />
      </ShopPage>
    );
  }
  return <Checkout data={catalog.data} />;
}

function Checkout({ data }: { data: CatalogResponse }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const open = useWeekOpen(data.week);
  const cart = useActiveCart();
  useReconcileCart(cart.store, data.products);
  const summary = summarizeCart(
    cart.state.items,
    data.products,
    data.minOrderCents,
    data.smallOrderFeeCents
  );
  const editing = cart.editing;

  const [phone, setPhone] = useState(() => maskPhoneInput(getRememberedPhone()));
  const [locked, setLocked] = useState(() => isValidPhone(getRememberedPhone()));
  const [phase, setPhase] = useState<Phase>({ kind: 'phone' });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const identify = useMutation({
    mutationFn: shopApi.identify,
    meta: { silent: true },
    onSuccess: (res) => {
      setPhase(res.found ? { kind: 'confirm', customer: res.customer } : { kind: 'notFound' });
    },
    onError: async (error) => setPhoneError(await errorMessage(error)),
  });

  const send = useMutation({
    mutationFn: (vars: { token: string | null; body: UpdateOrderBody }) =>
      vars.token
        ? shopApi.updateOrder(vars.token, vars.body)
        : shopApi.createOrder({ ...vars.body, phone: normalizePhone(phone) }),
    meta: { silent: true },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'lookup'] });
      if (vars.token) {
        editCartStore.clear();
        queryClient.invalidateQueries({ queryKey: shopKeys.order(res.token) });
        toast.success('Pedido atualizado.');
        navigate({ to: '/pedido/$token', params: { token: res.token } });
        return;
      }
      cartStore.clear();
      saveOrderToken(res.token);
      rememberPhone(normalizePhone(phone));
      navigate({ to: '/pedido/$token', params: { token: res.token }, search: { novo: 1 } });
    },
    onError: async (error) => {
      // Regra quebrada no servidor (preço, mínimo, semana fechou): mostra o motivo e mantém o carrinho.
      setSendError(await errorMessage(error));
      queryClient.invalidateQueries({ queryKey: shopKeys.catalog });
    },
  });

  const changePhone = (masked: string) => {
    setPhone(masked);
    setPhoneError(null);
    setPhase({ kind: 'phone' });
  };
  const resetPhone = () => {
    setLocked(false);
    changePhone('');
  };

  const submit = () => {
    setSendError(null);
    const body = {
      items: summary.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      note: cart.state.note.trim() || null,
    };
    if (editing) {
      send.mutate({ token: editing.token, body });
    } else if (phase.kind === 'confirm') {
      send.mutate({ token: null, body });
    } else if (!isValidPhone(phone)) {
      setPhoneError('Digite o telefone com DDD.');
    } else {
      identify.mutate(phone);
    }
  };

  const week = data.week;
  const title = editing ? `Editar pedido ${orderNumber(editing.number)}` : 'Seu pedido';
  const subtitle = week
    ? `Entrega ${formatDeliveryDate(week.deliveryDate)} · envie até ${formatDeadline(week.closesAt)}`
    : undefined;

  if (summary.lines.length === 0) {
    return (
      <ShopPage>
        <BackHeader title={title} />
        <EmptyState icon={<ShoppingBag className='size-7' />} title='Seu pedido está vazio'>
          <p className='m-0 text-ink-2'>
            {editing
              ? 'O pedido precisa de pelo menos um item. Para desistir dele, use "Cancelar pedido".'
              : 'Escolha os produtos da semana para montar o pedido.'}
          </p>
          <Link to='/' className={buttonClass('primary', 'md', 'px-6')}>
            Ver os produtos
          </Link>
          {editing ? (
            <button
              type='button'
              onClick={() => {
                editCartStore.clear();
                navigate({ to: '/pedido/$token', params: { token: editing.token } });
              }}
              className={buttonClass('ghost', 'md')}
            >
              Descartar alterações
            </button>
          ) : null}
        </EmptyState>
      </ShopPage>
    );
  }

  const blocked = !open
    ? 'Pedidos fechados'
    : !summary.canSend
        ? 'Confira os itens do pedido'
        : null;
  const busy = identify.isPending || send.isPending;
  const action = editing
    ? 'Salvar alterações'
    : phase.kind === 'confirm'
      ? 'Enviar pedido'
      : 'Continuar';

  return (
    <ShopPage className='pb-40'>
      <BackHeader title={title} subtitle={subtitle} />
      <main className='flex flex-col gap-3 p-4'>
        <section aria-label='Itens do pedido' className={`${cardClass} px-3.5 py-1`}>
          <ul className='m-0 list-none p-0'>
            {summary.lines.map((line) => (
              <CartLineRow
                key={line.product.id}
                line={line}
                onDecrement={() => cart.store.decrement(line.product)}
                onIncrement={() => cart.store.increment(line.product)}
                onRemove={() => cart.store.remove(line.product.id)}
              />
            ))}
          </ul>
          {summary.feeCents > 0 ? (
            <>
              <div className='flex items-baseline justify-between border-t border-line-soft pt-3 text-sm text-ink-2'>
                <span>Itens</span>
                <span>{formatBRL(summary.itemsCents)}</span>
              </div>
              <div className='flex items-baseline justify-between pt-1 text-sm text-ink-2'>
                <span>Taxa de pedido abaixo do mínimo</span>
                <span>{formatBRL(summary.feeCents)}</span>
              </div>
            </>
          ) : null}
          <div
            className={`flex items-baseline justify-between pb-3 ${summary.feeCents > 0 ? 'pt-2' : 'border-t border-line-soft pt-3.5'}`}
          >
            <span className='font-semibold'>Total estimado</span>
            <span aria-live='polite' className='font-display text-[22px] font-bold text-brand'>
              {formatBRL(summary.totalCents)}
            </span>
          </div>
        </section>

        {summary.missingCents > 0 ? (
          <div className='flex items-start gap-2.5 rounded-[14px] bg-amber-100 px-3.5 py-3 text-sm text-amber-ink'>
            <CircleAlert className='mt-0.5 size-[18px] flex-none' aria-hidden />
            <span>
              Faltam <strong>{formatBRL(summary.missingCents)}</strong> para o pedido mínimo de{' '}
              {formatBRL(data.minOrderCents)}.
              {summary.feeCents > 0 ? (
                <>
                  {' '}
                  Você pode enviar assim, com a taxa de <strong>{formatBRL(summary.feeCents)}</strong>
                  , ou completar o pedido.
                </>
              ) : null}
            </span>
          </div>
        ) : null}

        <Link to='/' className={buttonClass('ghost', 'md', 'min-h-12')}>
          Continuar escolhendo
        </Link>

        <div className='flex flex-col gap-1.5'>
          <label htmlFor='obs-pedido' className='text-sm font-semibold'>
            Observação <span className='font-normal text-ink-2'>(opcional)</span>
          </label>
          <textarea
            id='obs-pedido'
            rows={2}
            maxLength={500}
            value={cart.state.note}
            onChange={(e) => cart.store.setNote(e.target.value)}
            placeholder='Ex.: Tomates maduros'
            className='w-full resize-none rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink'
          />
        </div>

        {editing ? null : phase.kind === 'confirm' ? (
          <ConfirmCustomer customer={phase.customer} phone={phone} onNotMe={resetPhone} />
        ) : phase.kind === 'notFound' ? (
          <PhoneNotFound phone={phone} whatsapp={data.whatsapp} onRetry={resetPhone} />
        ) : (
          <PhoneField
            value={phone}
            onChange={changePhone}
            locked={locked}
            onUnlock={resetPhone}
            error={phoneError}
          />
        )}

        {sendError ? (
          <div
            role='alert'
            className='flex items-start gap-2.5 rounded-[14px] bg-danger-100 px-3.5 py-3 text-sm text-danger-ink'
          >
            <CircleAlert className='mt-0.5 size-[18px] flex-none' aria-hidden />
            <span>{sendError}</span>
          </div>
        ) : null}

        <p className='m-0 text-[13px] text-ink-2'>
          O pedido vai direto para a Morro Verde e aparece em Meus pedidos. Itens por kg são
          cobrados pelo peso real na entrega.
        </p>

        {editing ? (
          <button
            type='button'
            onClick={() => {
              editCartStore.clear();
              navigate({ to: '/pedido/$token', params: { token: editing.token } });
            }}
            className={buttonClass('ghost', 'md')}
          >
            Descartar alterações
          </button>
        ) : null}
      </main>

      {phase.kind === 'notFound' && !editing ? null : (
        <BottomBar>
          <MinimumProgress
            totalCents={summary.itemsCents}
            minOrderCents={data.minOrderCents}
            missingCents={summary.missingCents}
            feeCents={summary.feeCents}
          />
          {blocked ? (
            <button type='button' disabled className={buttonClass('disabled')}>
              {blocked}
            </button>
          ) : (
            <button
              type='button'
              onClick={submit}
              disabled={busy}
              className={buttonClass('primary')}
            >
              {phase.kind === 'confirm' || editing ? <Send className='size-5' aria-hidden /> : null}
              {identify.isPending ? 'Buscando cadastro…' : send.isPending ? 'Enviando…' : action}
            </button>
          )}
        </BottomBar>
      )}
    </ShopPage>
  );
}
