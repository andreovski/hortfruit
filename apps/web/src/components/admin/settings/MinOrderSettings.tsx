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
      description='Valor mínimo do pedido, somando todos os itens. Abaixo dele o cliente ainda pode enviar, pagando a taxa.'
    >
      {isPending ? (
        <Skeleton className='h-11 w-64' />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <MinOrderForm
          key={`${data.minOrderCents}-${data.smallOrderFeeCents}`}
          current={data.minOrderCents}
          currentFee={data.smallOrderFeeCents}
        />
      )}
    </SettingsCard>
  );
}

/** "0", "0,00" → 0; senão o valor em centavos, ou null se inválido. */
function parseMoney(text: string): number | null {
  return /^\s*0+([.,]0*)?\s*$/.test(text) ? 0 : parseBRL(text);
}

function MoneyField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label} error={error ?? undefined} className='w-48'>
      <input
        id={id}
        inputMode='decimal'
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value.replace(/[^\d,.]/g, ''))}
        className={inputClass}
      />
    </Field>
  );
}

function MinOrderForm({ current, currentFee }: { current: number; currentFee: number }) {
  const update = useUpdateSettings();
  const [text, setText] = useState(centsToInput(current));
  const [feeText, setFeeText] = useState(centsToInput(currentFee));
  const [error, setError] = useState<string | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const cents = parseMoney(text);
    const fee = parseMoney(feeText);
    if (cents === null) setError('Informe um valor válido, como 200,00.');
    if (fee === null) setFeeError('Informe um valor válido, como 50,00.');
    if (cents === null || fee === null) return;
    update.mutate(
      { minOrderCents: cents, smallOrderFeeCents: fee },
      {
        onSuccess: () =>
          toast.success(`Pedido mínimo: ${formatBRL(cents)}. Taxa abaixo dele: ${formatBRL(fee)}.`),
      }
    );
  }

  return (
    <form noValidate onSubmit={submit} className='flex flex-wrap items-end gap-3'>
      <MoneyField
        id='min-order'
        label='Valor mínimo (R$)'
        value={text}
        error={error}
        onChange={(value) => {
          setText(value);
          setError(null);
        }}
      />
      <MoneyField
        id='small-order-fee'
        label='Taxa abaixo do mínimo (R$)'
        value={feeText}
        error={feeError}
        onChange={(value) => {
          setFeeText(value);
          setFeeError(null);
        }}
      />
      <Button type='submit' loading={update.isPending}>
        Salvar
      </Button>
    </form>
  );
}
