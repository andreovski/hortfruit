import { type AnyRoute, createRoute } from '@tanstack/react-router';

// Placeholder: o painel ADM é montado aqui (dono: frente "painel ADM").
export function adminRoutes(root: AnyRoute) {
  return [
    createRoute({
      getParentRoute: () => root,
      path: '/admin',
      component: () => <p className='p-6'>Painel</p>,
    }),
  ];
}
