import { generateUploadButton } from '@uploadthing/react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { ProductImage } from '@/components/product-image';
import { ILLUSTRATIONS } from '@/lib/illustrations';
import { cn } from '@/lib/utils';

// Rota /uploadthing da API (só ADM logado), atrás do /api do server.mjs e do proxy do Vite.
const UploadButton = generateUploadButton({ url: '/api/uploadthing' });

/** Ilustrações padrão ou foto enviada (quando o servidor tem UPLOADTHING_TOKEN). */
export function ImagePicker({
  value,
  color,
  uploadsEnabled,
  onPick,
}: {
  value: string;
  color: string;
  uploadsEnabled: boolean;
  /** `uploaded`: foto que acabou de ser enviada ao UploadThing. */
  onPick: (url: string, color?: string, uploaded?: boolean) => void;
}) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <ProductImage
          product={{ imageUrl: value, color }}
          className='size-16 flex-none rounded-2xl'
          imageClassName='size-12'
        />
        {uploadsEnabled ? (
          <UploadButton
            endpoint='productImage'
            onClientUploadComplete={(res) => {
              const file = res?.[0] as { serverData?: { url?: string } | null; ufsUrl?: string } | undefined;
              const url = file?.serverData?.url ?? file?.ufsUrl;
              if (url) {
                onPick(url, undefined, true);
                toast.success('Foto enviada.');
              }
            }}
            onUploadError={(error) => {
              toast.error(`Não foi possível enviar a foto: ${error.message}`);
            }}
            content={{ button: ({ ready, isUploading }) => (isUploading ? 'Enviando…' : ready ? 'Enviar foto' : 'Preparando…') }}
            // twMerge no lugar do merger padrão: as classes daqui vencem as do UploadThing (text-white, w-36...).
            config={{ cn }}
            appearance={{
              container: 'flex flex-col items-start gap-1',
              button:
                'inline-flex h-auto min-h-11 w-auto cursor-pointer items-center rounded-xl border border-line-strong bg-surface px-4 text-sm font-bold text-ink hover:bg-cream focus-within:outline-2 focus-within:outline-brand-400',
              allowedContent: 'text-xs text-ink-2',
            }}
          />
        ) : (
          <span className='text-[13px] text-ink-2'>Escolha uma ilustração.</span>
        )}
      </div>
      <div role='group' aria-label='Ilustrações' className='grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2'>
        {ILLUSTRATIONS.map((ill) => {
          const on = ill.url === value;
          return (
            <button
              key={ill.key}
              type='button'
              aria-pressed={on}
              aria-label={ill.label}
              title={ill.label}
              onClick={() => onPick(ill.url, ill.color)}
              className={cn(
                'relative flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-xl border-2',
                on ? 'border-brand' : 'border-transparent hover:border-line-strong'
              )}
              style={{ background: ill.color }}
            >
              <img src={ill.url} alt='' className='size-9 object-contain' />
              {on ? (
                <Check aria-hidden className='absolute top-1 right-1 size-3.5 rounded-full bg-brand p-0.5 text-white' />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
