import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

/** Janela central pequena para um formulário curto (abrir semana, trocar senha...). */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-ink/40' />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className='fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-card bg-surface p-6 shadow-2xl'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='flex flex-col gap-1'>
              <Dialog.Title className='m-0 font-display text-xl font-semibold text-brand'>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className='m-0 text-sm text-ink-2'>{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label='Fechar'
              className='flex size-11 flex-none cursor-pointer items-center justify-center rounded-xl text-ink-2 hover:bg-cream'
            >
              <X aria-hidden className='size-5' />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const DialogClose = Dialog.Close;
