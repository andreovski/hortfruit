import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { buttonClass } from './ui';

export function ErrorState({
  message = 'Não deu para carregar agora.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role='alert'
      className='flex flex-col items-center gap-3 rounded-[20px] border border-line bg-surface p-6 text-center'
    >
      <CircleAlert className='size-8 text-amber' aria-hidden />
      <p className='m-0 font-semibold text-ink'>{message}</p>
      <p className='m-0 text-sm text-ink-2'>Confira a conexão e tente de novo.</p>
      {onRetry ? (
        <button type='button' onClick={onRetry} className={buttonClass('soft', 'md', 'px-6')}>
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className='flex flex-col items-center gap-3 px-4 py-10 text-center'>
      <span
        aria-hidden
        className='flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand'
      >
        {icon}
      </span>
      <h2 className='m-0 font-display text-xl font-semibold text-brand'>{title}</h2>
      {children}
    </div>
  );
}

function Bone({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function CatalogSkeleton() {
  return (
    <div aria-busy='true' aria-label='Carregando produtos' className='flex flex-col gap-4 px-4'>
      <Bone className='h-14 rounded-[14px]' />
      <Bone className='h-8 w-2/3' />
      <div className='grid grid-cols-2 gap-3'>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className='flex flex-col gap-2 rounded-[20px] bg-surface p-1.5 pb-3'>
            <Bone className='h-[136px] rounded-[15px]' />
            <Bone className='mx-1.5 h-4 w-3/4' />
            <Bone className='mx-1.5 h-5 w-1/2' />
            <Bone className='h-11 rounded-xl' />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy='true' aria-label='Carregando' className='flex flex-col gap-4 p-4'>
      <Bone className='h-40 rounded-[20px]' />
      <Bone className='h-24 rounded-[20px]' />
      <Bone className='h-48 rounded-[20px]' />
    </div>
  );
}
