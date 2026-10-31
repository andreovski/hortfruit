import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductImage } from './product-image';

describe('ProductImage', () => {
  it('ilustração fica centralizada sobre a cor do card', () => {
    const { container } = render(
      <ProductImage product={{ imageUrl: '/products/tomate.svg', color: '#FBE4DE' }} imageClassName='size-8' />
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.backgroundColor).not.toBe('');
    expect(box.querySelector('img')).toHaveClass('object-contain', 'size-8');
  });

  it('foto enviada cobre o card, sem fundo', () => {
    const { container } = render(
      <ProductImage product={{ imageUrl: 'https://app.ufs.sh/f/foto.jpg', color: '#FBE4DE' }} imageClassName='size-8' />
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.backgroundColor).toBe('');
    expect(box.querySelector('img')).toHaveClass('size-full', 'object-cover');
    expect(box.querySelector('img')).not.toHaveClass('size-8');
  });
});
