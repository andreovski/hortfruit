import { HTTPError } from 'ky';

/**
 * `api` falso para os testes do painel: cada rota é "MÉTODO caminho" (como no código, sem /api).
 * Um handler devolve o corpo JSON ou lança `httpError(...)`. Chamadas sem handler viram 404.
 */
type Options = { json?: unknown; searchParams?: Record<string, unknown> };
type Handler = (options: Options, path: string) => unknown;

const handlers = new Map<string, Handler>();
export const calls: { method: string; path: string; options: Options }[] = [];

export function mockRoute(method: string, path: string, handler: Handler | object) {
  handlers.set(`${method} ${path}`, typeof handler === 'function' ? (handler as Handler) : () => handler);
}

export function resetApi() {
  handlers.clear();
  calls.length = 0;
}

export function callsTo(method: string, path: string) {
  return calls.filter((c) => c.method === method && c.path === path);
}

export function httpError(status: number, body: object = {}) {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
  return new HTTPError(response, new Request(`http://localhost/api`), {} as never);
}

function request(method: string) {
  return (path: string, options: Options = {}) => {
    calls.push({ method, path, options });
    const promise = Promise.resolve().then(() => {
      const handler = handlers.get(`${method} ${path}`);
      if (!handler) throw httpError(404, { message: `Sem mock para ${method} ${path}` });
      return handler(options, path);
    });
    return Object.assign(promise, { json: () => promise });
  };
}

export const fakeApi = {
  get: request('GET'),
  post: request('POST'),
  patch: request('PATCH'),
  put: request('PUT'),
  delete: request('DELETE'),
};
