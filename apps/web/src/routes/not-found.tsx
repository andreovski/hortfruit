import { Link } from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center'>
      <h1 className='font-display text-2xl font-semibold text-brand'>Página não encontrada</h1>
      <Link to='/' className='font-semibold'>
        Ver os produtos da semana
      </Link>
    </main>
  );
}
