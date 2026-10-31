import type { OpenWeekBody } from '@hortifruit/schemas';

import { DialogClose, FormDialog } from '../FormDialog';
import { Button } from '../ui';
import { WeekDatesForm } from '../WeekDatesForm';

/** Sem semana aberta, publicar abre a semana nova junto (é assim que os pedidos reabrem). */
export function OpenWeekDialog({
  open,
  onOpenChange,
  suggestion,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: { deliveryDate: string; closesAt: string };
  loading: boolean;
  onSubmit: (openWeek: OpenWeekBody) => void;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Abrir semana de entrega'
      description='Não há semana aberta. Ao publicar, os clientes voltam a fazer pedidos até o fechamento.'
    >
      <WeekDatesForm id='abrir-semana' initial={suggestion} onSubmit={onSubmit}>
        <div className='grid grid-cols-2 gap-2'>
          <DialogClose asChild>
            <Button variant='secondary'>Voltar</Button>
          </DialogClose>
          <Button type='submit' loading={loading}>
            Abrir e publicar
          </Button>
        </div>
      </WeekDatesForm>
    </FormDialog>
  );
}
