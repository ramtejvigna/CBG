import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma instances in Lambda warm starts
declare global {
  var prisma: PrismaClient | undefined;
}

// Lambda-optimized Prisma client configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
