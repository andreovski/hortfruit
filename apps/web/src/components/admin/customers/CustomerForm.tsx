import { isValidPhone, maskPhoneInput } from '@hortifruit/core';
import { type Customer, type CustomerBody, customerBodySchema } from '@hortifruit/schemas';
import { TriangleAlert } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { useSaveCustomer } from '@/features/admin/customers';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

import { Button, Field, inputClass } from '../ui';

type FormState = Record<
  'name' | 'contactName' | 'phone' | 'cnpj' | 'email' | 'address' | 'neighborhood' | 'city' | 'notes',
  string
> & { active: boolean };
type Errors = Partial<Record<keyof FormState, string>>;

function initialState(customer: Customer | null): FormState {
  return {
    name: customer?.name ?? '',
    contactName: customer?.contactName ?? '',
    phone: customer ? maskPhoneInput(customer.phone) : '',
    cnpj: customer?.cnpj ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    neighborhood: customer?.neighborhood ?? '',
    city: customer?.city ?? '',
    notes: customer?.notes ?? '',
    active: customer?.active ?? true,
  };
}

export const CUSTOMER_FORM_ID = 'cliente-form';

/** Cadastro e edição do restaurante. O telefone é a chave de identificação no app. */
export function CustomerForm({ customer, onDone }: { customer: Customer | null; onDone: () => void }) {
  const save = useSaveCustomer();
  const [form, setForm] = useState(() => initialState(customer));
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setApiError(null);
    const body: CustomerBody = { ...form };
    const parsed = customerBodySchema.safeParse(body);
    const next: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        next[key] ??= issue.message;
      }
    }
    if (!next.phone && !isValidPhone(form.phone)) next.phone = 'Telefone inválido. Use DDD + número.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    save.mutate(
      { id: customer?.id, body },
      {
        onSuccess: () => {
          toast.success(customer ? 'Alterações salvas.' : 'Cliente cadastrado.');
          onDone();
        },
        onError: async (error) => {
          const message = await errorMessage(error);
          setApiError(message);
          if (/telefone/i.test(message)) setErrors((e) => ({ ...e, phone: message }));
          toast.error(message);
        },
      }
    );
  }

  const text = (key: keyof Omit<FormState, 'active'>, label: string, opts: TextOpts = {}) => (
    <Field id={`c-${key}`} label={label} required={opts.required} error={errors[key]} hint={opts.hint} className={opts.className}>
      <input
        id={`c-${key}`}
        type={opts.type ?? 'text'}
        inputMode={opts.inputMode}
        autoComplete={opts.autoComplete ?? 'off'}
        placeholder={opts.placeholder}
        value={form[key]}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `c-${key}-error` : opts.hint ? `c-${key}-hint` : undefined}
        onChange={(e) => set(key, opts.mask ? opts.mask(e.target.value) : e.target.value)}
        className={inputClass}
      />
    </Field>
  );

  return (
    <form id={CUSTOMER_FORM_ID} noValidate onSubmit={onSubmit} className='flex flex-col gap-5'>
      <span className='text-[13px] text-ink-2'>
        Campos com <span aria-hidden className='text-danger-strong'>*</span>
        <span className='sr-only'>asterisco</span> são obrigatórios
      </span>
      {apiError ? (
        <div role='alert' className='flex items-start gap-2 rounded-xl bg-danger-100 px-3.5 py-3 text-sm text-danger-ink'>
          <TriangleAlert aria-hidden className='mt-0.5 size-4 flex-none' />
          {apiError}
        </div>
      ) : null}

      <fieldset className='m-0 grid grid-cols-6 gap-3 border-0 p-0'>
        <legend className='mb-3 p-0 text-xs font-bold tracking-[0.06em] text-ink-2'>RESTAURANTE</legend>
        {text('name', 'Nome do restaurante', { required: true, className: 'col-span-6' })}
        {text('contactName', 'Responsável', { className: 'col-span-6 sm:col-span-3' })}
        {text('phone', 'Telefone', {
          required: true,
          type: 'tel',
          inputMode: 'tel',
          placeholder: '(41) 99999-9999',
          mask: maskPhoneInput,
          hint: 'É como o restaurante se identifica no app.',
          className: 'col-span-6 sm:col-span-3',
        })}
        {text('cnpj', 'CNPJ', { inputMode: 'numeric', className: 'col-span-6 sm:col-span-3' })}
        {text('email', 'E-mail', { type: 'email', className: 'col-span-6 sm:col-span-3' })}
      </fieldset>

      <fieldset className='m-0 grid grid-cols-6 gap-3 border-0 p-0'>
        <legend className='mb-3 p-0 text-xs font-bold tracking-[0.06em] text-ink-2'>ENDEREÇO DE ENTREGA</legend>
        {text('address', 'Endereço de entrega', {
          required: true,
          placeholder: 'Rua e número',
          className: 'col-span-6',
        })}
        {text('neighborhood', 'Bairro', { className: 'col-span-6 sm:col-span-3' })}
        {text('city', 'Cidade', { className: 'col-span-6 sm:col-span-3' })}
        <Field id='c-notes' label='Observações' className='col-span-6'>
          <textarea
            id='c-notes'
            rows={3}
            value={form.notes}
            placeholder='Horário de recebimento, portão, ponto de referência'
            onChange={(e) => set('notes', e.target.value)}
            className={cn(inputClass, 'resize-y py-2.5')}
          />
        </Field>
      </fieldset>

      <label className='flex min-h-11 cursor-pointer items-center gap-2.5'>
        <input
          type='checkbox'
          checked={form.active}
          onChange={(e) => set('active', e.target.checked)}
          className='m-0 size-5 accent-brand'
        />
        <span>
          Cliente ativo <span className='text-ink-2'>(pode fazer pedidos)</span>
        </span>
      </label>

      <div className='flex flex-wrap gap-2'>
        <Button type='submit' size='lg' loading={save.isPending} className='flex-[1_1_160px]'>
          {customer ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
        <Button variant='secondary' size='lg' onClick={onDone} className='flex-[0_1_140px]'>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

interface TextOpts {
  required?: boolean;
  type?: string;
  inputMode?: 'tel' | 'numeric' | 'email' | 'text';
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  className?: string;
  mask?: (value: string) => string;
}
