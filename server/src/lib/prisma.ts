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
            url: process.env.DATABASE_URL + "?connection_limit=10&pool_timeout=5&schema_cache_size=10000&statement_timeout=3000&connect_timeout=5&sslmode=require"
        }
    }
});

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e: any) => {
        if (e.duration > 500) { // Log queries taking more than 500ms
            console.log(`🐌 SLOW QUERY (${e.duration}ms): ${e.query.substring(0, 200)}...`);
        }
        if (e.duration > 200) {
            console.log(`⚡ Query took ${e.duration}ms`);
        }
    });
}

// Connection management
let isConnected = false;

// Connect to database
export const connectDB = async () => {
    if (!isConnected) {
        try {
            console.log('Connecting to database...');
            const startTime = Date.now();
            
            await prisma.$connect();
            
            // Warm up the connection with a simple query
            await prisma.$queryRaw`SELECT 1`;
            
            const connectionTime = Date.now() - startTime;
            isConnected = true;
            console.log(`Database connected successfully in ${connectionTime}ms`);
            
            // Pre-warm frequently used queries
            setTimeout(async () => {
                try {
                    await prisma.user.count();
                    console.log('Database connection warmed up');
                } catch (error) {
                    console.error('Database warmup failed:', error);
                }
            }, 1000);
            
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