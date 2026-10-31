import { formatPhone, maskPhoneInput } from '@hortifruit/core';
import { type AdminBody, adminBodySchema, type AdminUser } from '@hortifruit/schemas';
import { KeyRound, UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { useMe } from '@/features/admin/auth';
import { useAdmins, useCreateAdmin, useUpdateAdmin } from '@/features/admin/settings';
import { errorMessage } from '@/lib/api';

import { DialogClose, FormDialog } from '../FormDialog';
import { Button, ErrorState, Field, inputClass, Pill, Skeleton } from '../ui';
import { SettingsCard } from './SettingsCard';

export function AdminsSettings() {
  const { data, isPending, isError, refetch } = useAdmins();
  const me = useMe().data?.admin;
  const update = useUpdateAdmin();
  const [adding, setAdding] = useState(false);
  const [passwordFor, setPasswordFor] = useState<AdminUser | null>(null);
  const activeCount = data?.admins.filter((a) => a.active).length ?? 0;

  function toggle(admin: AdminUser) {
    update.mutate(
      { id: admin.id, body: { active: !admin.active } },
      {
        onSuccess: () =>
          toast.success(admin.active ? `${admin.name} desativado.` : `${admin.name} ativado.`),
      }
    );
  }

  return (
    <SettingsCard
      id='ajustes-adms'
      title='Administradores'
      description='Entram no painel com e-mail ou telefone e senha.'
      action={
        <Button variant='secondary' onClick={() => setAdding(true)}>
          <UserPlus aria-hidden className='size-4' />
          Adicionar
        </Button>
      }
    >
      {isPending ? (
        <Skeleton className='h-24' />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <ul className='m-0 flex list-none flex-col p-0'>
          {data.admins.map((admin) => {
            const self = admin.id === me?.id;
            const lastActive = admin.active && activeCount <= 1;
            return (
              <li
                key={admin.id}
                className='flex flex-wrap items-center gap-3 border-t border-line-soft py-3 first:border-t-0'
              >
                <div className='flex min-w-48 flex-1 flex-col'>
                  <span className='font-semibold'>
                    {admin.name}
                    {self ? <span className='font-normal text-ink-2'> (você)</span> : null}
                  </span>
                  <span className='text-[13px] [overflow-wrap:anywhere] text-ink-2'>
                    {[admin.email, admin.phone ? formatPhone(admin.phone) : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <Pill tone={admin.active ? 'green' : 'gray'}>
                  {admin.active ? 'Ativo' : 'Inativo'}
                </Pill>
                <Button
                  variant='ghost'
                  onClick={() => setPasswordFor(admin)}
                  aria-label={`Trocar senha de ${admin.name}`}
                >
                  <KeyRound aria-hidden className='size-4' />
                  Senha
                </Button>
                <Button
                  variant='secondary'
                  disabled={self || lastActive || update.isPending}
                  title={
                    self
                      ? 'Você não pode desativar a si mesmo.'
                      : lastActive
                        ? 'É o último administrador ativo.'
                        : undefined
                  }
                  onClick={() => toggle(admin)}
                >
                  {admin.active ? 'Desativar' : 'Ativar'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <FormDialog open={adding} onOpenChange={setAdding} title='Novo administrador'>
        {adding ? <AddAdminForm onDone={() => setAdding(false)} /> : null}
      </FormDialog>
      <FormDialog
        open={!!passwordFor}
        onOpenChange={(open) => !open && setPasswordFor(null)}
        title='Trocar senha'
        description={passwordFor?.name}
      >
        {passwordFor ? (
          <PasswordForm admin={passwordFor} onDone={() => setPasswordFor(null)} />
        ) : null}
      </FormDialog>
    </SettingsCard>
  );
}

function AddAdminForm({ onDone }: { onDone: () => void }) {
  const create = useCreateAdmin();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setApiError(null);
    const body: AdminBody = form;
    const parsed = adminBodySchema.safeParse(body);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof typeof form;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    create.mutate(body, {
      onSuccess: () => {
        toast.success('Administrador adicionado.');
        onDone();
      },
      onError: async (error) => setApiError(await errorMessage(error)),
    });
  }

  const input = (
    key: keyof typeof form,
    label: string,
    extra: Partial<React.ComponentProps<'input'>> = {}
  ) => (
    <Field
      id={`adm-${key}`}
      label={label}
      error={errors[key]}
      required={key === 'name' || key === 'password'}
    >
      <input
        id={`adm-${key}`}
        value={form[key]}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `adm-${key}-error` : undefined}
        onChange={(e) =>
          set(key, key === 'phone' ? maskPhoneInput(e.target.value) : e.target.value)
        }
        className={inputClass}
        {...extra}
      />
    </Field>
  );

  return (
    <form noValidate onSubmit={submit} className='flex flex-col gap-3'>
      {apiError ? (
        <p
          role='alert'
          className='m-0 rounded-xl bg-danger-100 px-3.5 py-3 text-sm text-danger-ink'
        >
          {apiError}
        </p>
      ) : null}
      {input('name', 'Nome', { autoComplete: 'off' })}
      {input('email', 'E-mail', { type: 'email', autoComplete: 'off' })}
      {input('phone', 'Telefone', { type: 'tel', inputMode: 'tel', autoComplete: 'off' })}
      <p className='m-0 text-xs text-ink-2'>
        Informe e-mail ou telefone (ou os dois): é com ele que a pessoa entra.
      </p>
      {input('password', 'Senha', { type: 'password', autoComplete: 'new-password' })}
      <div className='grid grid-cols-2 gap-2 pt-1'>
        <DialogClose asChild>
          <Button variant='secondary'>Voltar</Button>
        </DialogClose>
        <Button type='submit' loading={create.isPending}>
          Adicionar
        </Button>
      </div>
    </form>
  );
}

function PasswordForm({ admin, onDone }: { admin: AdminUser; onDone: () => void }) {
  const update = useUpdateAdmin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    update.mutate(
      { id: admin.id, body: { password } },
      {
        onSuccess: () => {
          toast.success('Senha trocada.');
          onDone();
        },
      }
    );
  }

  return (
    <form noValidate onSubmit={submit} className='flex flex-col gap-3'>
      <Field id='nova-senha' label='Nova senha' required error={error ?? undefined}>
        <input
          id='nova-senha'
          type='password'
          autoComplete='new-password'
          value={password}
          aria-invalid={!!error}
          aria-describedby={error ? 'nova-senha-error' : undefined}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          className={inputClass}
        />
      </Field>
      <div className='grid grid-cols-2 gap-2'>
        <DialogClose asChild>
          <Button variant='secondary'>Voltar</Button>
        </DialogClose>
        <Button type='submit' loading={update.isPending}>
          Trocar senha
        </Button>
      </div>
    </form>
  );
}
