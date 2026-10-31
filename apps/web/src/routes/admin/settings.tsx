import { AdminsSettings } from '@/components/admin/settings/AdminsSettings';
import { IntegrationsSettings } from '@/components/admin/settings/IntegrationsSettings';
import { MinOrderSettings } from '@/components/admin/settings/MinOrderSettings';
import { WeekSettings } from '@/components/admin/settings/WeekSettings';
import { PageHeader } from '@/components/admin/ui';

export function SettingsPage() {
  return (
    <>
      <PageHeader title='Ajustes' subtitle='Semana de entrega, pedido mínimo e quem acessa o painel.' />
      <div className='grid gap-5 xl:grid-cols-2'>
        <WeekSettings />
        <MinOrderSettings />
        <AdminsSettings />
        <IntegrationsSettings />
      </div>
    </>
  );
}
