import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

/** Painel lateral (Dialog do Radix) para detalhe e formulários. */
export function Drawer({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-40 bg-ink/40' />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className='fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-surface shadow-2xl outline-none sm:rounded-l-card'
        >
          <div className='flex items-start justify-between gap-3 border-b border-line-soft px-5 pt-5 pb-4 sm:px-6'>
            <div className='flex min-w-0 flex-col gap-0.5'>
              {eyebrow ? <span className='text-[13px] text-ink-2'>{eyebrow}</span> : null}
              <Dialog.Title className='m-0 font-display text-2xl font-semibold text-brand'>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className='m-0 text-[13px] text-ink-2'>{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label='Fechar'
              className='flex size-11 flex-none cursor-pointer items-center justify-center rounded-xl text-ink-2 hover:bg-cream hover:text-ink'
            >
              <X aria-hidden className='size-5' />
            </Dialog.Close>
          </div>
          <div className='flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6'>{children}</div>
          {footer ? <div className='border-t border-line-soft px-5 py-4 sm:px-6'>{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
