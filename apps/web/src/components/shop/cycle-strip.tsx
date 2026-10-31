import {
  formatBRL,
  formatDeadline,
  formatDeliveryDate,
  timeLeftLabel,
  todayInBrasilia,
} from '@hortifruit/core';
import type { Week } from '@hortifruit/schemas';
import { CalendarDays, ChevronRight, Clock, Phone, Scale, Truck, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { type ReactNode, useState } from 'react';

import { useNow } from '@/features/shop/hooks';

/** Faixa "Aceitando pedidos": tocar abre "Como funciona". */
export function OpenStrip({ week, minOrderCents }: { week: Week; minOrderCents: number }) {
  const now = useNow();
  const [open, setOpen] = useState(false);
  const left = timeLeftLabel(week.closesAt, now);
  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-brand-border bg-brand-100 px-3 py-2.5 text-left text-ink'
      >
        <span
          aria-hidden
          className='size-2.5 flex-none rounded-full bg-brand-500 ring-4 ring-brand-border'
        />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='text-[13px] font-bold text-brand'>
            Aceitando pedidos até {formatDeadline(week.closesAt)}
          </span>
          <span className='text-xs text-brand-600'>
            {left ? `Faltam ${left} · ` : ''}entrega {formatDeliveryDate(week.deliveryDate)}
          </span>
        </span>
        <span className='flex flex-none items-center gap-0.5 text-xs font-semibold text-brand-800'>
          Regras
          <ChevronRight className='size-4' aria-hidden />
        </span>
      </button>
      <HowItWorksSheet
        open={open}
        onOpenChange={setOpen}
        week={week}
        minOrderCents={minOrderCents}
      />
    </>
  );
}

/** Faixa "Pedidos fechados": a reabertura é manual (o ADM publica a lista), sem data prometida. */
export function ClosedStrip({ week }: { week: Week | null }) {
  const upcoming = week && week.deliveryDate >= todayInBrasilia();
  return (
    <div
      role='status'
      className='flex items-center gap-3 rounded-[14px] border border-amber-border bg-amber-100 px-3 py-2.5'
    >
      <span
        aria-hidden
        className='size-2.5 flex-none rounded-full bg-amber ring-4 ring-amber-ring'
      />
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='text-[13px] font-bold text-amber-ink-2'>
          Pedidos fechados · a nova lista sai em breve
        </span>
        <span className='text-xs text-amber-ink'>
          {upcoming
            ? `Pedidos desta semana chegam ${formatDeliveryDate(week.deliveryDate)}`
            : 'Avisamos quando a lista da semana for publicada'}
        </span>
      </span>
    </div>
  );
}

function Rule({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className='flex items-center gap-3 border-b border-line-soft py-3 last:border-b-0'>
      <span
        aria-hidden
        className='flex size-8 flex-none items-center justify-center rounded-[10px] bg-brand-100 text-brand-800'
      >
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

export function HowItWorksSheet({
  open,
  onOpenChange,
  week,
  minOrderCents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: Week;
  minOrderCents: number;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-40 bg-ink/50' />
        <Dialog.Content className='fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[480px] flex-col gap-1.5 overflow-y-auto rounded-t-3xl bg-cream px-4 pt-2.5 pb-5 text-ink'>
          <div aria-hidden className='mx-auto mb-1.5 h-1 w-10 rounded-full bg-line-strong' />
          <div className='flex items-center justify-between'>
            <Dialog.Title className='m-0 font-display text-[22px] font-semibold text-brand'>
              Como funciona
            </Dialog.Title>
            <Dialog.Close
              aria-label='Fechar'
              className='flex size-11 cursor-pointer items-center justify-center rounded-full text-ink'
            >
              <X className='size-5' aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className='sr-only'>
            Regras para fazer o pedido da semana.
          </Dialog.Description>
          <ul className='m-0 list-none rounded-[18px] border border-line bg-surface px-3.5 py-1'>
            <Rule icon={<Clock className='size-[18px]' />}>
              Peça até <strong>{formatDeadline(week.closesAt)}</strong>. Os preços valem até lá.
            </Rule>
            <Rule icon={<Truck className='size-[18px]' />}>
              Entrega <strong>{formatDeliveryDate(week.deliveryDate)}</strong> (toda sexta-feira)
            </Rule>
            <Rule icon={<CalendarDays className='size-[18px]' />}>
              Pedido mínimo de <strong>{formatBRL(minOrderCents)}</strong>, e cada produto tem a sua
              quantidade mínima
            </Rule>
            <Rule icon={<Phone className='size-[18px]' />}>
              No fim, você se identifica <strong>só com o telefone</strong>
            </Rule>
            <Rule icon={<Scale className='size-[18px]' />}>
              O total é <strong>estimado</strong>: itens por kg seguem o peso real na entrega
            </Rule>
          </ul>
          <p className='m-0 mt-1.5 text-[13px] text-ink-2'>
            O pedido vai direto para a Morro Verde. Não há pagamento no app.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
