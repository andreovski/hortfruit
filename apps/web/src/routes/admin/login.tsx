import { loginBodySchema } from '@hortifruit/schemas';
import { Navigate, useNavigate, useSearch } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Logo } from '@/components/admin/Logo';
import { Button, Field, inputClass } from '@/components/admin/ui';
import { safeRedirect, useLogin, useMe } from '@/features/admin/auth';
import { errorMessage } from '@/lib/api';

export function LoginPage() {
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };
  const navigate = useNavigate();
  const me = useMe();
  const login = useLogin();
  const [form, setForm] = useState({ login: '', password: '' });
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  if (me.data) return <Navigate to={safeRedirect(redirect)} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setApiError(null);
    const parsed = loginBodySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ login: fieldErrors.login?.[0], password: fieldErrors.password?.[0] });
      return;
    }
    setErrors({});
    login.mutate(parsed.data, {
      onSuccess: () => void navigate({ to: safeRedirect(redirect), replace: true }),
      onError: async (error) => setApiError(await errorMessage(error)),
    });
  }

  return (
    <main className='flex min-h-dvh items-center justify-center bg-cream px-4 py-10'>
      <div className='flex w-full max-w-[420px] flex-col gap-6'>
        <div className='flex items-center gap-3 rounded-card bg-brand px-5 py-4 text-white'>
          <Logo />
          <div className='flex flex-col'>
            <span className='font-display text-base leading-[1.15] font-bold tracking-[0.04em]'>MORRO VERDE</span>
            <span className='text-xs text-brand-200'>Painel administrativo</span>
          </div>
        </div>
        <form
          noValidate
          onSubmit={onSubmit}
          className='flex flex-col gap-4 rounded-card border border-line bg-surface p-6'
          aria-labelledby='login-titulo'
        >
          <h1 id='login-titulo' className='m-0 font-display text-[26px] font-semibold text-brand'>
            Entrar no painel
          </h1>
          {apiError ? (
            <div role='alert' className='flex items-start gap-2 rounded-xl bg-danger-100 px-3.5 py-3 text-sm text-danger-ink'>
              <TriangleAlert aria-hidden className='mt-0.5 size-4 flex-none' />
              {apiError}
            </div>
          ) : null}
          <Field id='login' label='E-mail ou telefone' error={errors.login}>
            <input
              id='login'
              name='login'
              autoComplete='username'
              autoFocus
              value={form.login}
              aria-invalid={!!errors.login}
              aria-describedby={errors.login ? 'login-error' : undefined}
              onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field id='password' label='Senha' error={errors.password}>
            <input
              id='password'
              name='password'
              type='password'
              autoComplete='current-password'
              value={form.password}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Button type='submit' size='lg' loading={login.isPending}>
            Entrar
          </Button>
        </form>
        <p className='m-0 text-center text-[13px] text-ink-2'>
          Esqueceu a senha? Peça a outro administrador para trocar em Ajustes.
        </p>
      </div>
    </main>
  );
}
