import { centsToInput, formatBRL, parseBRL } from '@hortifruit/core';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { useSettings, useUpdateSettings } from '@/features/admin/settings';

import { Button, ErrorState, Field, inputClass, Skeleton } from '../ui';
import { SettingsCard } from './SettingsCard';

export function MinOrderSettings() {
  const { data, isPending, isError, refetch } = useSettings();
  return (
    <SettingsCard
      id='ajustes-minimo'
      title='Pedido mínimo'
      description='Valor mínimo do pedido para a entrega, somando todos os itens.'
    >
      {isPending ? (
        <Skeleton className='h-11 w-64' />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <MinOrderForm key={data.minOrderCents} current={data.minOrderCents} />
      )}
    </SettingsCard>
  );
}

function MinOrderForm({ current }: { current: number }) {
  const update = useUpdateSettings();
  const [text, setText] = useState(centsToInput(current));
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const cents = /^\s*0+([.,]0*)?\s*$/.test(text) ? 0 : parseBRL(text);
    if (cents === null) {
      setError('Informe um valor válido, como 200,00.');
      return;
    }
    update.mutate(
      { minOrderCents: cents },
      { onSuccess: () => toast.success(`Pedido mínimo: ${formatBRL(cents)}.`) }
    );
  }

  return (
    <form noValidate onSubmit={submit} className='flex flex-wrap items-end gap-3'>
      <Field id='min-order' label='Valor mínimo (R$)' error={error ?? undefined} className='w-48'>
        <input
          id='min-order'
          inputMode='decimal'
          value={text}
          aria-invalid={!!error}
          aria-describedby={error ? 'min-order-error' : undefined}
          onChange={(e) => {
            setText(e.target.value.replace(/[^\d,.]/g, ''));
            setError(null);
          }}
          className={inputClass}
        />
      </Field>
      <Button type='submit' loading={update.isPending}>
        Salvar
      </Button>
    </form>
  );
}
