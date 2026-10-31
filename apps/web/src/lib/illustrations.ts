import type { ProductIllustration } from '@hortifruit/schemas';

/** Ilustrações do protótipo, em public/products. O ADM escolhe uma ou envia foto (UploadThing). */
export const ILLUSTRATIONS: ProductIllustration[] = [
  { key: 'tomate', label: 'Tomate', url: '/products/tomate.svg', color: '#FBE4DE' },
  { key: 'cebola', label: 'Cebola', url: '/products/cebola.svg', color: '#F6E9D6' },
  { key: 'pimentao', label: 'Pimentão', url: '/products/pimentao.svg', color: '#E3F1E2' },
  { key: 'alho', label: 'Alho', url: '/products/alho.svg', color: '#EFEBDF' },
  { key: 'batata', label: 'Batata', url: '/products/batata.svg', color: '#F3E8D3' },
  { key: 'cenoura', label: 'Cenoura', url: '/products/cenoura.svg', color: '#FDE7D3' },
  { key: 'abacaxi', label: 'Abacaxi', url: '/products/abacaxi.svg', color: '#F8F0D2' },
  { key: 'manga', label: 'Manga', url: '/products/manga.svg', color: '#FDEBD2' },
  { key: 'laranja', label: 'Laranja', url: '/products/laranja.svg', color: '#FDE6CF' },
  { key: 'banana', label: 'Banana', url: '/products/banana.svg', color: '#F7EFCB' },
  { key: 'maracuja', label: 'Maracujá', url: '/products/maracuja.svg', color: '#F7EFCB' },
  { key: 'morango', label: 'Morango', url: '/products/morango.svg', color: '#FBE1E4' },
  { key: 'limao', label: 'Limão', url: '/products/limao.svg', color: '#E6F1DA' },
];

/** Cores de fundo sugeridas para o card de um produto novo. */
export const CARD_COLORS = [
  '#FBE4DE',
  '#F6E9D6',
  '#E3F1E2',
  '#EFEBDF',
  '#F3E8D3',
  '#FDE7D3',
  '#F8F0D2',
  '#FDEBD2',
  '#FDE6CF',
  '#F7EFCB',
  '#FBE1E4',
  '#E6F1DA',
];
