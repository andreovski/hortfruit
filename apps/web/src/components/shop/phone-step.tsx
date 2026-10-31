import { formatPhone, maskPhoneInput, whatsappLink } from '@hortifruit/core';
import { MapPin, MessageCircle, Phone, Store } from 'lucide-react';

import { addressLine } from '@/features/shop/format';

import { buttonClass, cardClass } from './ui';

/** Campo do telefone com máscara; com telefone lembrado, mostra o número e "Usar outro telefone". */
export function PhoneField({
  value,
  onChange,
  locked,
  onUnlock,
  error,
}: {
  value: string;
  onChange: (masked: string) => void;
  locked: boolean;
  onUnlock: () => void;
  error?: string | null;
}) {
  return (
    <section aria-labelledby='fone-titulo' className={`${cardClass} flex flex-col gap-3 p-4`}>
      <div className='flex flex-col gap-0.5'>
        <h2 id='fone-titulo' className='m-0 font-display text-lg font-semibold text-brand'>
          Telefone
        </h2>
        <p className='m-0 text-[13px] text-ink-2'>
          É com ele que achamos o seu cadastro. Não precisa de senha.
        </p>
      </div>
      {locked ? (
        <div className='flex items-center gap-3'>
          <Phone className='size-5 flex-none text-brand-600' aria-hidden />
          <span className='flex-1 font-display text-lg font-semibold'>{formatPhone(value)}</span>
          <button
            type='button'
            onClick={onUnlock}
            className='min-h-11 cursor-pointer rounded-xl px-2 text-sm font-bold text-brand-800 underline'
          >
            Usar outro telefone
          </button>
        </div>
      ) : (
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='telefone' className='text-sm font-semibold'>
            Telefone com DDD
          </label>
          <input
            id='telefone'
            type='tel'
            inputMode='tel'
            autoComplete='tel-national'
            placeholder='(41) 99999-9999'
            value={value}
            onChange={(e) => onChange(maskPhoneInput(e.target.value))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'telefone-erro' : undefined}
            className='min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-[17px] text-ink'
          />
          {error ? (
            <span id='telefone-erro' className='text-sm text-danger'>
              {error}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function ConfirmCustomer({
  customer,
  phone,
  onNotMe,
}: {
  customer: { name: string; maskedAddress: string; neighborhood: string | null };
  phone: string;
  onNotMe: () => void;
}) {
  return (
    <section
      aria-labelledby='dados-titulo'
      className='flex flex-col gap-3 rounded-[20px] border-[1.5px] border-brand bg-surface p-4'
    >
      <h2 id='dados-titulo' className='m-0 font-display text-lg font-semibold text-brand'>
        Confira seus dados
      </h2>
      <div className='flex items-start gap-3'>
        <Store className='mt-0.5 size-5 flex-none text-brand-600' aria-hidden />
        <div className='flex flex-col'>
          <span className='font-semibold'>{customer.name}</span>
          <span className='text-[13px] text-ink-2'>{formatPhone(phone)}</span>
        </div>
      </div>
      <div className='flex items-start gap-3'>
        <MapPin className='mt-0.5 size-5 flex-none text-brand-600' aria-hidden />
        <span>{addressLine(customer.maskedAddress, customer.neighborhood)}</span>
      </div>
      <button type='button' onClick={onNotMe} className={buttonClass('ghost', 'md', 'self-start')}>
        Não sou eu
      </button>
    </section>
  );
}

export function PhoneNotFound({
  phone,
  whatsapp,
  onRetry,
}: {
  phone: string;
  whatsapp: string | null;
  onRetry: () => void;
}) {
  return (
    <section
      role='alert'
      className='flex flex-col gap-3 rounded-[20px] border border-amber-border bg-amber-100 p-4 text-amber-ink'
    >
      <p className='m-0'>
        <strong>Não encontramos este telefone.</strong> Fale com a Morro Verde para fazer seu
        cadastro.
      </p>
      <p className='m-0 text-sm'>Seu pedido continua salvo aqui no aparelho.</p>
      {whatsapp ? (
        <a
          href={whatsappLink(
            whatsapp,
            `Olá! Quero fazer o meu cadastro para pedir pela Morro Verde. Meu telefone é ${formatPhone(phone)}.`
          )}
          target='_blank'
          rel='noopener noreferrer'
          className={buttonClass('primary', 'md', 'min-h-12')}
        >
          <MessageCircle className='size-5' aria-hidden />
          Falar no WhatsApp
        </a>
      ) : null}
      <button type='button' onClick={onRetry} className={buttonClass('ghost', 'md')}>
        Tentar outro telefone
      </button>
    </section>
  );
}
