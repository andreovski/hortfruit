import { ADMIN_STATUS_LABEL } from '@hortifruit/core';
import type { OrderStatusCode } from '@hortifruit/schemas';

import { Pill } from './ui';

const TONE = { NOVO: 'amber', CONFIRMADO: 'green', ENTREGUE: 'blue', CANCELADO: 'red' } as const;

export function StatusBadge({ status, className }: { status: OrderStatusCode; className?: string }) {
  return (
    <Pill tone={TONE[status]} className={className}>
      {ADMIN_STATUS_LABEL[status]}
    </Pill>
  );
}
