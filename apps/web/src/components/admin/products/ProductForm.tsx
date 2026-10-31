import { centsToInput, parseBRL, unitName, UNITS } from '@hortifruit/core';
import {
  type AdminProduct,
  type Category,
  type ProductBody,
  productBodySchema,
  type UnitCode,
} from '@hortifruit/schemas';
import { TriangleAlert } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { CATEGORIES, CATEGORY_LABEL } from '@/features/admin/labels';
import { useSaveProduct } from '@/features/admin/products';
import { usePendingUploads } from '@/features/admin/uploads';
import { errorMessage } from '@/lib/api';
import { CARD_COLORS, ILLUSTRATIONS } from '@/lib/illustrations';
import { cn } from '@/lib/utils';

import { Button, Field, inputClass, Switch } from '../ui';
import { ImagePicker } from './ImagePicker';

interface FormState {
  name: string;
  category: Category;
  unit: UnitCode;
  saleDescription: string;
  minQuantity: string;
  price: string;
  imageUrl: string;
  color: string;
  description: string;
  archived: boolean;
}
type Errors = Partial<Record<keyof FormState, string>>;

function initialState(product: AdminProduct | null): FormState {
  return {
    name: product?.name ?? '',
    category: product?.category ?? 'LEGUMES',
    unit: product?.unit ?? 'kg',
    saleDescription: product?.saleDescription ?? unitName('kg'),
    minQuantity: String(product?.minQuantity ?? 1),
    price: product ? centsToInput(product.draft.priceCents) : '',
    imageUrl: product?.imageUrl ?? ILLUSTRATIONS[0].url,
    color: product?.color ?? ILLUSTRATIONS[0].color,
    description: product?.description ?? '',
    archived: product?.archived ?? false,
  };
}

/** Cadastro do produto. O preço vai para o rascunho: o app só vê depois de publicar. */
export function ProductForm({
  product,
  uploadsEnabled,
  onDone,
}: {
  product: AdminProduct | null;
  uploadsEnabled: boolean;
  onDone: () => void;
}) {
  const save = useSaveProduct();
  const uploads = usePendingUploads();
  const [form, setForm] = useState(() => initialState(product));
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function changeUnit(unit: UnitCode) {
    // Forma de venda ainda no padrão da unidade anterior: acompanha a nova.
    setForm((f) => ({
      ...f,
      unit,
      saleDescription: !f.saleDescription || f.saleDescription === unitName(f.unit) ? unitName(unit) : f.saleDescription,
    }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setApiError(null);
    const priceCents = parseBRL(form.price);
    const body: ProductBody = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      saleDescription: form.saleDescription,
      minQuantity: Number(form.minQuantity),
      imageUrl: form.imageUrl,
      color: form.color,
      description: form.description,
      priceCents: priceCents ?? 0,
      archived: form.archived,
    };
    const parsed = productBodySchema.safeParse(body);
    const next: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = (issue.path[0] === 'priceCents' ? 'price' : issue.path[0]) as keyof FormState;
        next[key] ??= issue.message;
      }
    }
    if (priceCents === null) next.price = 'Informe um preço válido, como 6,90.';
    if (!Number.isInteger(Number(form.minQuantity)) || Number(form.minQuantity) < 1) {
      next.minQuantity = 'O mínimo precisa ser um número inteiro maior que zero.';
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    save.mutate(
      { id: product?.id, body },
      {
        onSuccess: () => {
          uploads.saved();
          toast.success(product ? 'Produto salvo.' : 'Produto cadastrado. Publique a lista para aparecer no app.');
          onDone();
        },
        onError: async (error) => {
          const message = await errorMessage(error);
          setApiError(message);
          toast.error(message);
        },
      }
    );
  }

  const describedBy = (key: keyof FormState) => (errors[key] ? `p-${key}-error` : undefined);

  return (
    <form noValidate onSubmit={onSubmit} className='flex flex-col gap-5'>
      {apiError ? (
        <div role='alert' className='flex items-start gap-2 rounded-xl bg-danger-100 px-3.5 py-3 text-sm text-danger-ink'>
          <TriangleAlert aria-hidden className='mt-0.5 size-4 flex-none' />
          {apiError}
        </div>
      ) : null}

      <div className='grid grid-cols-6 gap-3'>
        <Field id='p-name' label='Nome' required error={errors.name} className='col-span-6'>
          <input
            id='p-name'
            value={form.name}
            aria-invalid={!!errors.name}
            aria-describedby={describedBy('name')}
            onChange={(e) => set('name', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id='p-category' label='Categoria' required className='col-span-6 sm:col-span-3'>
          <select
            id='p-category'
            value={form.category}
            onChange={(e) => set('category', e.target.value as Category)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field id='p-unit' label='Unidade de venda' required className='col-span-6 sm:col-span-3'>
          <select
            id='p-unit'
            value={form.unit}
            onChange={(e) => changeUnit(e.target.value as UnitCode)}
            className={inputClass}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {unitName(u)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id='p-saleDescription'
          label='Forma de venda'
          required
          hint='Como aparece no app, por exemplo "Saco 20 kg".'
          error={errors.saleDescription}
          className='col-span-6'
        >
          <input
            id='p-saleDescription'
            value={form.saleDescription}
            placeholder='Saco 20 kg'
            aria-invalid={!!errors.saleDescription}
            aria-describedby={describedBy('saleDescription') ?? 'p-saleDescription-hint'}
            onChange={(e) => set('saleDescription', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id='p-minQuantity' label='Pedido mínimo' required error={errors.minQuantity} className='col-span-3'>
          <input
            id='p-minQuantity'
            type='number'
            min={1}
            step={1}
            inputMode='numeric'
            value={form.minQuantity}
            aria-invalid={!!errors.minQuantity}
            aria-describedby={describedBy('minQuantity')}
            onChange={(e) => set('minQuantity', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id='p-price' label='Preço (R$)' required error={errors.price} className='col-span-3'>
          <input
            id='p-price'
            inputMode='decimal'
            placeholder='0,00'
            value={form.price}
            aria-invalid={!!errors.price}
            aria-describedby={describedBy('price')}
            onChange={(e) => set('price', e.target.value.replace(/[^\d,.]/g, ''))}
            className={inputClass}
          />
        </Field>
        <Field id='p-description' label='Descrição' className='col-span-6'>
          <textarea
            id='p-description'
            rows={2}
            value={form.description}
            placeholder='Origem, variedade, tamanho'
            onChange={(e) => set('description', e.target.value)}
            className={cn(inputClass, 'resize-y py-2.5')}
          />
        </Field>
      </div>

      <fieldset className='m-0 flex flex-col gap-2 border-0 p-0'>
        <legend className='mb-2 p-0 text-[13px] font-semibold text-ink'>Imagem</legend>
        <ImagePicker
          value={form.imageUrl}
          color={form.color}
          uploadsEnabled={uploadsEnabled}
          onPick={(url, color, uploaded) => {
            uploads.replaced(form.imageUrl, url, uploaded);
            set('imageUrl', url);
            if (color) set('color', color);
          }}
        />
      </fieldset>

      <fieldset className='m-0 flex flex-col gap-2 border-0 p-0'>
        <legend className='mb-2 p-0 text-[13px] font-semibold text-ink'>Cor do card</legend>
        <div className='flex flex-wrap gap-2'>
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              type='button'
              aria-label={`Cor ${c}`}
              aria-pressed={form.color.toLowerCase() === c.toLowerCase()}
              onClick={() => set('color', c)}
              className={cn(
                'size-11 cursor-pointer rounded-full border-2',
                form.color.toLowerCase() === c.toLowerCase() ? 'border-brand' : 'border-line'
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </fieldset>

      {product ? (
        <div className='flex flex-col gap-1 rounded-xl bg-cream px-3.5 py-2'>
          <Switch
            checked={form.archived}
            onCheckedChange={(archived) => set('archived', archived)}
            label='Arquivar produto'
            onText='Arquivado'
            offText='No catálogo'
            offTone='muted'
          />
          <span className='text-xs text-ink-2'>Produto arquivado some do app e desta tabela.</span>
        </div>
      ) : null}

      <div className='flex flex-wrap gap-2'>
        <Button type='submit' size='lg' loading={save.isPending} className='flex-[1_1_160px]'>
          {product ? 'Salvar produto' : 'Cadastrar produto'}
        </Button>
        <Button variant='secondary' size='lg' onClick={onDone} className='flex-[0_1_140px]'>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
