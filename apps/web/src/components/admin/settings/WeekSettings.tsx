import { formatDateTime, formatDeadline, formatDeliveryDate } from '@hortifruit/core';
import { Link } from '@tanstack/react-router';
import { CalendarClock, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCloseWeek, useCurrentWeek, useUpdateWeek } from '@/features/admin/week';

import { buttonLinkClass } from '../button-link';
import { ConfirmDialog } from '../ConfirmDialog';
import { DialogClose, FormDialog } from '../FormDialog';
import { Button, ErrorState, Pill, Skeleton } from '../ui';
import { WeekDatesForm } from '../WeekDatesForm';
import { SettingsCard } from './SettingsCard';

export function WeekSettings() {
  const { data, isPending, isError, refetch } = useCurrentWeek();
  const close = useCloseWeek();
  const update = useUpdateWeek();
  const [confirmClose, setConfirmClose] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const week = data?.week;

  return (
    <SettingsCard
      id='ajustes-semana'
      title='Semana atual'
      description='A semana abre ao publicar a lista e fecha sozinha no horário do fechamento.'
      action={week ? <Pill tone={week.isOpen ? 'green' : 'amber'}>{week.isOpen ? 'Recebendo pedidos' : 'Pedidos fechados'}</Pill> : null}
    >
      {isPending ? (
        <Skeleton className='h-16' />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !week ? (
        <p className='m-0 text-ink-3'>Nenhuma semana aberta ainda.</p>
      ) : (
        <dl className='m-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3'>
          <div className='rounded-xl bg-cream px-3.5 py-3'>
            <dt className='text-[13px] text-ink-2'>Entrega</dt>
            <dd className='m-0 font-semibold'>{formatDeliveryDate(week.deliveryDate)}</dd>
          </div>
          <div className='rounded-xl bg-cream px-3.5 py-3'>
            <dt className='text-[13px] text-ink-2'>{week.isOpen ? 'Pedidos fecham' : 'Pedidos fecharam'}</dt>
            <dd className='m-0 font-semibold'>
              {week.closedAt ? `${formatDateTime(week.closedAt)} (à mão)` : formatDeadline(week.closesAt)}
            </dd>
          </div>
        </dl>
      )}

      <div className='flex flex-wrap gap-2'>
        {week?.isOpen ? (
          <>
            <Button variant='secondary' onClick={() => setEditOpen(true)}>
              <CalendarClock aria-hidden className='size-4' />
              Mudar datas
            </Button>
            <Button variant='danger-outline' onClick={() => setConfirmClose(true)}>
              <Lock aria-hidden className='size-4' />
              Fechar pedidos agora
            </Button>
          </>
        ) : data ? (
          <Link to='/admin/produtos' className={buttonLinkClass}>
            Publicar a lista para abrir a semana
          </Link>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title='Fechar os pedidos agora?'
        description='Os clientes não conseguem mais pedir, editar nem cancelar nesta semana. Para reabrir, publique a lista com uma semana nova.'
        confirmLabel='Fechar pedidos'
        tone='danger'
        loading={close.isPending}
        onConfirm={() =>
          close.mutate(undefined, {
            onSuccess: () => {
              setConfirmClose(false);
              toast.success('Pedidos fechados.');
            },
          })
        }
      />
      {week?.isOpen ? (
        <FormDialog open={editOpen} onOpenChange={setEditOpen} title='Mudar datas da semana'>
          <WeekDatesForm
            id='editar-semana'
            initial={{ deliveryDate: week.deliveryDate, closesAt: week.closesAt }}
            onSubmit={(body) =>
              update.mutate(body, {
                onSuccess: () => {
                  setEditOpen(false);
                  toast.success('Datas da semana salvas.');
                },
              })
            }
          >
            <div className='grid grid-cols-2 gap-2'>
              <DialogClose asChild>
                <Button variant='secondary'>Voltar</Button>
              </DialogClose>
              <Button type='submit' loading={update.isPending}>
                Salvar datas
              </Button>
            </div>
          </WeekDatesForm>
        </FormDialog>
      ) : null}
    </SettingsCard>
  );
}
