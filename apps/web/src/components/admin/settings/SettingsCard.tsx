import type { ReactNode } from 'react';

import { Card } from '../ui';

export function SettingsCard({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card aria-labelledby={id} className='flex flex-col gap-4 p-5 sm:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <h2 id={id} className='m-0 font-display text-xl font-semibold text-brand'>
            {title}
          </h2>
          {description ? <p className='m-0 text-sm text-ink-2'>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
