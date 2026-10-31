import { prisma } from '@/lib/prisma';
import { seedBase } from '@/services/seed';

// Roda no preDeploy do Railway, depois das migrations.
seedBase(prisma)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
