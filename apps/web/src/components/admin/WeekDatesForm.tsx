import { defaultClosesAt, formatDeadline, formatDeliveryDate } from '@hortifruit/core';
import type { OpenWeekBody } from '@hortifruit/schemas';
import { type FormEvent, type ReactNode, useState } from 'react';

import { fromBrasiliaInputs, toBrasiliaInputs } from '@/features/admin/datetime';

import { Field, inputClass } from './ui';

/**
 * Data da entrega e fechamento dos pedidos, no horário de Brasília. Mudar a entrega leva o
 * fechamento para a véspera às 12h, enquanto o ADM não mexer nele.
 */
export function WeekDatesForm({
  id,
  initial,
  onSubmit,
  children,
}: {
  id: string;
  initial: { deliveryDate: string; closesAt: string };
  onSubmit: (body: OpenWeekBody) => void;
  children?: ReactNode;
}) {
  const [deliveryDate, setDeliveryDate] = useState(initial.deliveryDate);
  const [closes, setCloses] = useState(() => toBrasiliaInputs(initial.closesAt));
  const [closesTouched, setClosesTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeDelivery(value: string) {
    setDeliveryDate(value);
    setError(null);
    if (!closesTouched && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setCloses(toBrasiliaInputs(defaultClosesAt(value)));
    }
  }

  function changeCloses(part: 'date' | 'time', value: string) {
    setClosesTouched(true);
    setError(null);
    setCloses((c) => ({ ...c, [part]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const closesAt = fromBrasiliaInputs(closes.date, closes.time);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) return setError('Informe a data da entrega.');
    if (!closesAt) return setError('Informe a data e a hora do fechamento.');
    if (closes.date > deliveryDate) return setError('Os pedidos precisam fechar antes da entrega.');
    onSubmit({ deliveryDate, closesAt });
  }

  const closesAt = fromBrasiliaInputs(closes.date, closes.time);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) && closesAt;

  return (
    <form id={id} noValidate onSubmit={submit} className='flex flex-col gap-4'>
      <Field id={`${id}-entrega`} label='Data da entrega' required>
        <input
          id={`${id}-entrega`}
          type='date'
          value={deliveryDate}
          onChange={(e) => changeDelivery(e.target.value)}
          className={inputClass}
        />
      </Field>
      <fieldset className='m-0 flex flex-col gap-1.5 border-0 p-0'>
        <legend className='mb-1.5 p-0 text-[13px] font-semibold text-ink'>
          Pedidos fecham em <span className='font-normal text-ink-2'>(horário de Brasília)</span>
        </legend>
        <div className='grid grid-cols-[1fr_120px] gap-2'>
          <label className='sr-only' htmlFor={`${id}-fecha-data`}>
            Data do fechamento
          </label>
          <input
            id={`${id}-fecha-data`}
            type='date'
            value={closes.date}
            onChange={(e) => changeCloses('date', e.target.value)}
            className={inputClass}
          />
          <label className='sr-only' htmlFor={`${id}-fecha-hora`}>
            Hora do fechamento
          </label>
          <input
            id={`${id}-fecha-hora`}
            type='time'
            value={closes.time}
            onChange={(e) => changeCloses('time', e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>
      {valid ? (
        <p className='m-0 rounded-xl bg-cream px-3.5 py-3 text-sm text-ink-3'>
          Entrega <strong>{formatDeliveryDate(deliveryDate)}</strong> · pedidos até{' '}
          <strong>{formatDeadline(closesAt)}</strong>
        </p>
      ) : null}
      {error ? (
        <p role='alert' className='m-0 text-sm text-danger-strong'>
          {error}
        </p>
      ) : null}
      {children}
    </form>
  );
}
