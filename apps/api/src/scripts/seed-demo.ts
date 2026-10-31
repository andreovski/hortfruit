import { suggestNextWeek } from '@hortifruit/core';

import { prisma } from '@/lib/prisma';
import { createOrder } from '@/services/orders';
import { publishProducts } from '@/services/products';
import { seedBase } from '@/services/seed';
import { openWeek } from '@/services/weeks';

// Só para desenvolvimento: o seed de produção mais 3 restaurantes, a lista publicada com a semana
// aberta e 2 pedidos. Idempotente (não duplica clientes nem pedidos).

const DEMO_CUSTOMERS = [
  {
    name: 'Cantina Bella Vista',
    contactName: 'Marcos',
    phone: '41998765432',
    address: 'Rua Itupava, 1234',
    neighborhood: 'Alto da XV',
    city: 'Curitiba',
  },
  {
    name: 'Restaurante Sabor da Terra',
    contactName: 'Juliana',
    phone: '41991234567',
    address: 'Avenida Sete de Setembro, 4500',
    neighborhood: 'Batel',
    city: 'Curitiba',
  },
  {
    name: 'Bistrô Araucária',
    contactName: 'Paulo',
    phone: '41987654321',
    address: 'Rua Mateus Leme, 890',
    neighborhood: 'São Francisco',
    city: 'Curitiba',
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('seed:demo é só para desenvolvimento.');
  await seedBase(prisma);

  for (const customer of DEMO_CUSTOMERS) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      create: customer,
      update: {},
    });
  }
  console.log(`[demo] ${DEMO_CUSTOMERS.length} restaurantes prontos.`);

  if (!(await openWeek())) {
    await publishProducts({ openWeek: suggestNextWeek() });
    console.log('[demo] lista publicada com a semana sugerida aberta.');
  }

  if ((await prisma.order.count()) === 0) {
    const products = await prisma.product.findMany({ where: { publishedAvailable: true } });
    const byName = (name: string) => products.find((p) => p.name === name)!;
    await createOrder({
      phone: DEMO_CUSTOMERS[0].phone,
      items: [
        { productId: byName('Tomate').id, quantity: 20 },
        { productId: byName('Cebola').id, quantity: 10 },
        { productId: byName('Manga').id, quantity: 10 },
      ],
      note: 'Entregar pela porta dos fundos.',
    });
    await createOrder({
      phone: DEMO_CUSTOMERS[1].phone,
      items: [
        { productId: byName('Batata Reino').id, quantity: 30 },
        { productId: byName('Limão').id, quantity: 2 },
      ],
    });
    console.log('[demo] 2 pedidos criados.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
