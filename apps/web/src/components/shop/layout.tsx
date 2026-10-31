import { whatsappLink } from '@hortifruit/core';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, MessageCircle, ReceiptText } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { roundIconButton } from './ui';

/** Coluna do app: mobile-first, centralizada no desktop. */
export function ShopPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto min-h-dvh w-full max-w-[480px] bg-cream', className)}>
      {children}
    </div>
  );
}

export function Logo() {
  return (
    <span className='relative block size-11 flex-none overflow-hidden rounded-full'>
      <img
        src='/brand/logo.png'
        alt='Morro Verde Hortifruti'
        className='absolute -top-1.5 -left-1.5 size-14 max-w-none'
      />
    </span>
  );
}

export function WhatsAppIconLink({ whatsapp }: { whatsapp: string | null | undefined }) {
  if (!whatsapp) return null;
  return (
    <a
      href={whatsappLink(whatsapp, 'Olá! Tenho uma dúvida sobre os pedidos da Morro Verde.')}
      target='_blank'
      rel='noopener noreferrer'
      aria-label='Falar no WhatsApp'
      className={roundIconButton}
    >
      <MessageCircle className='size-5' aria-hidden />
    </a>
  );
}

/** Cabeçalho do catálogo (escopo 8: sem identificação do cliente, só logo, pedidos e WhatsApp). */
export function ShopHeader({ whatsapp }: { whatsapp: string | null | undefined }) {
  return (
    <header className='sticky top-0 z-20 flex items-center gap-3 bg-cream px-4 pt-3.5 pb-3'>
      <Link to='/' aria-label='Morro Verde Hortifruti, início' className='rounded-full'>
        <Logo />
      </Link>
      <div className='flex min-w-0 flex-1 flex-col'>
        <span className='font-display text-[17px] leading-tight font-semibold text-brand'>
          Morro Verde
        </span>
        <span className='text-xs text-ink-2'>Hortifruti em quantidade</span>
      </div>
      <Link to='/meus-pedidos' aria-label='Meus pedidos' className={roundIconButton}>
        <ReceiptText className='size-5' aria-hidden />
      </Link>
      <WhatsAppIconLink whatsapp={whatsapp} />
    </header>
  );
}

/** Cabeçalho das telas internas: voltar + título. */
export function BackHeader({
  title,
  subtitle,
  backLabel = 'Voltar para os produtos',
  right,
}: {
  title: string;
  subtitle?: ReactNode;
  backLabel?: string;
  right?: ReactNode;
}) {
  return (
    <header className='sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-cream px-4 pt-3.5 pb-3'>
      <Link to='/' aria-label={backLabel} className={roundIconButton}>
        <ArrowLeft className='size-5 text-ink' aria-hidden />
      </Link>
      <div className='flex min-w-0 flex-1 flex-col'>
        <h1 className='m-0 font-display text-[22px] leading-tight font-semibold text-brand'>
          {title}
        </h1>
        {subtitle ? <span className='truncate text-[13px] text-ink-2'>{subtitle}</span> : null}
      </div>
      {right}
    </header>
  );
}

/** Barra fixa no rodapé, presa à coluna do app. */
export function BottomBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className='fixed inset-x-0 bottom-0 z-30'>
      <div
        className={cn(
          'mx-auto flex w-full max-w-[480px] flex-col gap-2 border-t border-line bg-cream px-4 pt-2.5 pb-[max(16px,env(safe-area-inset-bottom))]',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
