import { type AnyRoute, createRoute } from '@tanstack/react-router';

// Placeholder: o app do restaurante é montado aqui (dono: frente "app do restaurante").
export function shopRoutes(root: AnyRoute) {
  return [
    createRoute({
      getParentRoute: () => root,
      path: '/',
      component: () => <p className='p-6'>Catálogo</p>,
    }),
  ];
}
