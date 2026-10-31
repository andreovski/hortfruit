import { AlertDialog } from 'radix-ui';
import type { ReactNode } from 'react';

import { Button } from './ui';

/** Confirmação antes de uma ação que não se desfaz sozinha (cancelar, fechar semana, publicar). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Voltar',
  tone = 'primary',
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className='fixed inset-0 z-50 bg-ink/40' />
        <AlertDialog.Content className='fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-card bg-surface p-6 shadow-2xl'>
          <AlertDialog.Title className='m-0 font-display text-xl font-semibold text-brand'>{title}</AlertDialog.Title>
          <AlertDialog.Description className='m-0 text-ink-3'>{description}</AlertDialog.Description>
          <div className='grid grid-cols-2 gap-2'>
            <AlertDialog.Cancel asChild>
              <Button variant='secondary'>{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
