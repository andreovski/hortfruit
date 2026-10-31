import { isIllustration } from '@/lib/illustrations';
import { cn } from '@/lib/utils';

/**
 * Imagem do produto. Ilustração: centralizada sobre a cor do card, no tamanho de `imageClassName`.
 * Foto enviada: cobre o card inteiro, sem fundo.
 */
export function ProductImage({
  product,
  className,
  imageClassName,
  alt = '',
}: {
  product: { imageUrl: string; color: string };
  className?: string;
  imageClassName?: string;
  alt?: string;
}) {
  const illustration = isIllustration(product.imageUrl);
  return (
    <span
      aria-hidden={alt ? undefined : true}
      className={cn('flex items-center justify-center overflow-hidden', className)}
      style={illustration ? { backgroundColor: product.color } : undefined}
    >
      <img
        src={product.imageUrl}
        alt={alt}
        className={illustration ? cn('object-contain', imageClassName) : 'size-full object-cover'}
      />
    </span>
  );
}
