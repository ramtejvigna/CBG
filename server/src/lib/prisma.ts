import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
    errorFormat: 'pretty',
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

export default prisma;