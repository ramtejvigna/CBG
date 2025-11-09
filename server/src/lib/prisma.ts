import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [
        { level: 'query', emit: 'event' },
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' }
    ] : ['error'], // Enable query logging in development
    errorFormat: 'minimal',
    datasources: {
        db: {
            url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=10&schema_cache_size=5000&statement_timeout=5000&connect_timeout=10"
        }
    }
});

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e: any) => {
        if (e.duration > 1000) { // Log queries taking more than 1 second
            console.log(`🐌 SLOW QUERY (${e.duration}ms): ${e.query}`);
        }
    });
}

// Connection management
let isConnected = false;

// Connect to database
export const connectDB = async () => {
    if (!isConnected) {
        try {
            await prisma.$connect();
            isConnected = true;
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }
};

// Disconnect from database
export const disconnectDB = async () => {
    if (isConnected) {
        await prisma.$disconnect();
        isConnected = false;
    }
};

// Health check
export const checkDBConnection = async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};

// Handle graceful shutdown
process.on('beforeExit', disconnectDB);
process.on('SIGINT', disconnectDB);
process.on('SIGTERM', disconnectDB);

export default prisma;