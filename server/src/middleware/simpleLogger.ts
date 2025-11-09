import type { Request, Response, NextFunction } from 'express';

// Simplified API logger for production
export const simpleApiLogger = (req: Request, res: Response, next: NextFunction) => {
    // Skip logging in production for performance
    if (process.env.NODE_ENV === 'production') {
        return next();
    }
    
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Only log slow requests (>1s) and errors
        if (responseTime > 1000 || res.statusCode >= 400) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`);
        }
    });
    
    next();
};

export default simpleApiLogger;