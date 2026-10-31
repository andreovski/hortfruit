import { formatPhone } from '@hortifruit/core';
import { ImageUp, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { useSettings } from '@/features/admin/settings';
import { cn } from '@/lib/utils';

import { Skeleton } from '../ui';
import { SettingsCard } from './SettingsCard';

export function IntegrationsSettings() {
  const { data } = useSettings();
  return (
    <SettingsCard
      id='ajustes-integracoes'
      title='WhatsApp e fotos'
      description='Configurados nas variáveis do servidor (Railway). Só leitura aqui.'
    >
      {!data ? (
        <Skeleton className='h-20' />
      ) : (
        <ul className='m-0 flex list-none flex-col gap-2 p-0'>
          <Row icon={<MessageCircle aria-hidden className='size-5' />} ok={!!data.whatsapp}>
            {data.whatsapp ? (
              <>
                WhatsApp configurado: <strong>{formatPhone(data.whatsapp)}</strong>
              </>
            ) : (
              <>
                WhatsApp não configurado — defina <code>WHATSAPP_NUMBER</code>. Sem ele, os botões de WhatsApp
                somem do app.
              </>
            )}
          </Row>
          <Row icon={<ImageUp aria-hidden className='size-5' />} ok={data.uploadsEnabled}>
            {data.uploadsEnabled ? (
              'Envio de fotos ativo (UploadThing).'
            ) : (
              <>
                Envio de fotos desligado — defina <code>UPLOADTHING_TOKEN</code>. Até lá, os produtos usam as
                ilustrações.
              </>
            )}
          </Row>
        </ul>
      )}
    </SettingsCard>
  );
}

function Row({ icon, ok, children }: { icon: ReactNode; ok: boolean; children: ReactNode }) {
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm',
        ok ? 'bg-brand-100 text-brand' : 'bg-amber-100 text-amber-ink-2'
      )}
    >
      <span className='mt-px flex-none'>{icon}</span>
      <span>{children}</span>
    </li>
  );
}
