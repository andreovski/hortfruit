/**
 * Relógio da API. As regras de semana e pedido pegam o "agora" daqui, para os testes poderem
 * fixar a hora com `vi.spyOn(clock, 'now')`.
 */
export const clock = {
  now: (): Date => new Date(),
};
