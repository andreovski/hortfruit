/** Erro esperado de regra de negócio: vira a resposta com o status, a mensagem e o código dados. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
  }
}
