import { Loader2, Search, TriangleAlert } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-800 disabled:bg-disabled disabled:text-disabled-ink',
  secondary:
    'border border-line-strong bg-surface text-ink hover:bg-cream disabled:text-disabled-ink disabled:opacity-70',
  danger: 'bg-danger text-white hover:bg-danger-ink disabled:opacity-60',
  'danger-outline':
    'border-[1.5px] border-danger-border bg-surface text-danger hover:bg-danger-100 disabled:opacity-60',
  ghost: 'text-brand-800 hover:bg-brand-100 disabled:opacity-60',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 font-bold transition-colors disabled:cursor-not-allowed',
        size === 'lg' ? 'min-h-[52px] rounded-[14px] text-[15px]' : 'min-h-11 text-sm',
        BUTTON_VARIANTS[variant],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className='size-4 animate-spin' /> : null}
      {children}
    </button>
  );
}

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-card border border-line bg-surface', className)}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-4'>
      <div className='flex min-w-0 flex-col gap-1'>
        <h1 className='m-0 font-display text-[28px] leading-[1.1] font-semibold text-brand sm:text-[32px]'>
          {title}
        </h1>
        {subtitle ? <p className='m-0 text-ink-2'>{subtitle}</p> : null}
      </div>
      {children ? <div className='no-print flex w-full flex-wrap items-center gap-3 sm:w-auto'>{children}</div> : null}
    </div>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Chips de filtro do protótipo (aria-pressed). */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role='group' aria-label={label} className='flex flex-wrap gap-2'>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type='button'
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-2 rounded-full border pr-2 pl-3.5 text-sm font-semibold',
              on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface text-ink hover:bg-cream',
              o.count === undefined && 'pr-3.5'
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span
                className={cn(
                  'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs',
                  on ? 'bg-brand-800 text-white' : 'bg-line-soft text-ink-3'
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Abas segmentadas (Semana atual / Todas). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role='group' aria-label={label} className='inline-flex gap-1 rounded-[14px] bg-muted p-1'>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type='button'
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-10 cursor-pointer rounded-[10px] px-4 text-sm font-semibold',
              on ? 'bg-surface text-brand shadow-sm' : 'text-ink-3 hover:text-brand'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({
  label,
  className,
  ...props
}: ComponentProps<'input'> & { label: string }) {
  return (
    <label
      className={cn(
        'flex min-h-11 w-full items-center gap-2 sm:w-auto sm:flex-[0_1_320px] rounded-xl border border-line-strong bg-surface px-3.5 text-ink-2 focus-within:border-brand-600',
        className
      )}
    >
      <Search aria-hidden className='size-[18px] flex-none' />
      <input
        type='search'
        aria-label={label}
        className='min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none'
        {...props}
      />
    </label>
  );
}

/** Pílula colorida com bolinha (status do pedido, ativo/inativo). */
export function Pill({
  tone,
  children,
  className,
}: {
  tone: 'amber' | 'green' | 'blue' | 'red' | 'gray';
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    amber: ['bg-amber-100 text-amber-ink', 'bg-amber'],
    green: ['bg-brand-100 text-brand-800', 'bg-brand-500'],
    blue: ['bg-info-100 text-info-ink', 'bg-info'],
    red: ['bg-danger-100 text-danger', 'bg-danger-strong'],
    gray: ['bg-muted text-disabled-ink', 'bg-switch-off'],
  } as const;
  const [box, dot] = tones[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
        box,
        className
      )}
    >
      <span aria-hidden className={cn('size-[7px] rounded-full', dot)} />
      {children}
    </span>
  );
}

/** Interruptor acessível (role=switch), como o do protótipo. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  onText,
  offText,
  offTone = 'danger',
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  onText?: string;
  offText?: string;
  offTone?: 'danger' | 'muted';
  disabled?: boolean;
}) {
  const text = checked ? onText : offText;
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className='flex min-h-11 cursor-pointer items-center gap-2 bg-transparent p-0 text-ink disabled:cursor-not-allowed disabled:opacity-60'
    >
      <span
        aria-hidden
        className={cn(
          'relative h-6 w-10 flex-none rounded-full transition-colors',
          checked ? 'bg-brand-500' : 'bg-switch-off'
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] size-[18px] rounded-full bg-white transition-[left]',
            checked ? 'left-[19px]' : 'left-[3px]'
          )}
        />
      </span>
      {text ? (
        <span className={cn('text-[13px] font-semibold', checked ? 'text-brand-800' : offTone === 'danger' ? 'text-danger' : 'text-ink-2')}>
          {text}
        </span>
      ) : null}
    </button>
  );
}

export const inputClass =
  'min-h-11 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-[15px] text-ink outline-none focus:border-brand-600 aria-[invalid=true]:border-danger-strong';

export function Field({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className='text-[13px] font-semibold text-ink'>
        {label}
        {required ? (
          <span aria-hidden className='text-danger-strong'>
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <span id={`${id}-hint`} className='text-xs text-ink-2'>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className='text-xs text-danger-strong'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-line-soft', className)} />;
}

/** Linhas cinzas enquanto a tabela carrega. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role='status' aria-label='Carregando' className='flex flex-col'>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className='flex items-center gap-4 border-t border-line-soft px-5 py-4'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 flex-1' />
          <Skeleton className='h-4 w-24' />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className='m-0 border-t border-line-soft px-5 py-8 text-center text-ink-2'>{children}</p>;
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role='alert' className='flex flex-col items-center gap-3 px-5 py-8 text-center'>
      <TriangleAlert aria-hidden className='size-6 text-danger' />
      <p className='m-0 text-ink-3'>{message ?? 'Não foi possível carregar. Tente de novo.'}</p>
      {onRetry ? (
        <Button variant='secondary' onClick={onRetry}>
          Tentar de novo
        </Button>
      ) : null}
    </div>
  );
}

/** Aviso em faixa (sucesso, erro, alerta). */
export function Banner({
  tone,
  icon,
  children,
  role,
}: {
  tone: 'success' | 'danger' | 'amber' | 'info';
  icon?: ReactNode;
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  const tones = {
    success: 'border border-brand-border bg-brand-100 text-brand',
    danger: 'bg-danger-100 text-danger-ink',
    amber: 'bg-amber-100 text-amber-ink-2',
    info: 'bg-info-100 text-info-ink',
  };
  return (
    <div role={role} className={cn('flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-sm', tones[tone])}>
      {icon}
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  );
}
