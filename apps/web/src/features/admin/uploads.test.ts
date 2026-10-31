import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePendingUploads } from './uploads';

const A = 'https://app.ufs.sh/f/a.jpg';
const B = 'https://app.ufs.sh/f/b.jpg';
const ILL = '/products/tomate.svg';

describe('usePendingUploads', () => {
  it('apaga a foto enviada que foi trocada antes de salvar', () => {
    const discard = vi.fn();
    const { result } = renderHook(() => usePendingUploads(discard));
    result.current.replaced(ILL, A, true);
    result.current.replaced(A, B, true);
    expect(discard).toHaveBeenCalledExactlyOnceWith(A);
    result.current.replaced(B, ILL);
    expect(discard).toHaveBeenLastCalledWith(B);
  });

  it('não mexe na foto que já estava salva no produto', () => {
    const discard = vi.fn();
    const { result, unmount } = renderHook(() => usePendingUploads(discard));
    result.current.replaced(A, ILL);
    unmount();
    expect(discard).not.toHaveBeenCalled();
  });

  it('fechar sem salvar apaga o que foi enviado; depois de salvar, não', () => {
    const discard = vi.fn();
    const first = renderHook(() => usePendingUploads(discard));
    first.result.current.replaced(ILL, A, true);
    first.unmount();
    expect(discard).toHaveBeenCalledExactlyOnceWith(A);

    discard.mockClear();
    const second = renderHook(() => usePendingUploads(discard));
    second.result.current.replaced(ILL, B, true);
    second.result.current.saved();
    second.unmount();
    expect(discard).not.toHaveBeenCalled();
  });
});
