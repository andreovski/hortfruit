import { cn } from '@/lib/utils';

type Variant = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger' | 'danger-outline' | 'disabled';
type Size = 'lg' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-800',
  soft: 'bg-brand-100 text-brand hover:bg-brand-border',
  outline: 'border-[1.5px] border-brand-800 bg-transparent text-brand-800 hover:bg-brand-100',
  ghost: 'bg-transparent text-brand-800 hover:bg-brand-100',
  danger: 'bg-danger text-white hover:bg-danger-ink',
  'danger-outline': 'border border-danger-border bg-surface text-danger hover:bg-danger-100',
  disabled: 'bg-disabled text-disabled-ink',
};

const SIZES: Record<Size, string> = {
  lg: 'min-h-14 rounded-2xl px-4 text-base',
  md: 'min-h-11 rounded-xl px-3 text-sm',
};

/** Classes dos botões do app (protótipo): verde cheio, verde suave, contorno, perigo. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'lg', extra?: string) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 font-bold no-underline transition-colors disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-ink',
    VARIANTS[variant],
    SIZES[size],
    extra
  );
}

/** Botão redondo de 44px do cabeçalho. */
export const roundIconButton =
  'flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-brand no-underline hover:bg-brand-100';

export const cardClass = 'rounded-[20px] border border-line bg-surface';
