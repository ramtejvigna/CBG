import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import type { Request, Response } from 'express';

// Extend Express Request type to include rate limit info
declare global {
    namespace Express {
        interface Request {
            rateLimit?: {
                limit: number;
                remaining: number;
                resetTime: Date;
            };
        }
    }
}

// Store for tracking requests (in production, use Redis)
const requestStore = new Map<string, { count: number; resetTime: number }>();

// Custom store implementation for rate limiter
const customStore = {
    incr: (key: string) => {
        const now = Date.now();
        const current = requestStore.get(key);
        
        if (!current || now > current.resetTime) {
            requestStore.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
            return { totalHits: 1, resetTime: new Date(now + 60000) };
        }
        
        current.count++;
        requestStore.set(key, current);
        return { totalHits: current.count, resetTime: new Date(current.resetTime) };
    },
    
    decrement: (key: string) => {
        const current = requestStore.get(key);
        if (current && current.count > 0) {
            current.count--;
            requestStore.set(key, current);
        }
    },
    
    resetKey: (key: string) => {
        requestStore.delete(key);
    },
    
    resetAll: () => {
        requestStore.clear();
    }
};

// Key generator that considers user ID if authenticated
const generateKey = (req: Request) => {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    return userId ? `user:${userId}` : ipKeyGenerator(ip);
};

// Enhanced key generator for sensitive endpoints
const generateSensitiveKey = (req: Request) => {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'unknown';
    return userId ? `sensitive:user:${userId}` : `sensitive:${ipKeyGenerator(ip)}:${userAgent.slice(0, 50)}`;
};

// Custom rate limit handler with detailed error messages
const rateLimitHandler = (req: Request, res: Response) => {
    const resetTime = req.rateLimit?.resetTime?.getTime() || Date.now() + 60000;
    const retryAfter = Math.round((resetTime - Date.now()) / 1000) || 60;
    
    res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(retryAfter),
        limit: req.rateLimit?.limit || 0,
        remaining: req.rateLimit?.remaining || 0,
        resetTime: req.rateLimit?.resetTime || new Date(Date.now() + 60000)
    });
};

// General API rate limiter - 100 requests per 15 minutes
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each user/IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this user/IP, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for sensitive endpoints (auth, admin) - 20 requests per 15 minutes
export const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each user/IP to 20 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests to sensitive endpoints, please try again later.',
        error: 'STRICT_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: generateSensitiveKey,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Login rate limiter - 5 attempts per 15 minutes
export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit login attempts
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.',
        error: 'LOGIN_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req: Request) => {
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const email = req.body?.email || 'unknown';
        return `login:${ipKeyGenerator(ip)}:${email}`;
    },
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset rate limiter - 3 attempts per hour
export const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit password reset attempts
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later.',
        error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req: Request) => {
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const email = req.body?.email || 'unknown';
        return `password-reset:${ipKeyGenerator(ip)}:${email}`;
    },
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Code execution rate limiter - 30 executions per 10 minutes
export const codeExecutionRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30, // Limit code executions
    message: {
        success: false,
        message: 'Too many code execution requests, please try again later.',
        error: 'CODE_EXECUTION_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin operations rate limiter - 50 requests per 15 minutes
export const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit admin operations
    message: {
        success: false,
        message: 'Too many admin requests, please try again later.',
        error: 'ADMIN_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req: Request) => {
        const userId = req.user?.id;
        if (userId) {
            return `admin:user:${userId}`;
        }
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        return `admin:${ipKeyGenerator(ip)}`;
    },
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// File upload rate limiter - 10 uploads per 15 minutes
export const fileUploadRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit file uploads
    message: {
        success: false,
        message: 'Too many file upload requests, please try again later.',
        error: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Search rate limiter - 60 searches per 15 minutes
export const searchRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit search requests
    message: {
        success: false,
        message: 'Too many search requests, please try again later.',
        error: 'SEARCH_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Speed limiter for high-frequency requests - slows down after 50 requests
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per windowMs without delay
    delayMs: (hits) => hits * 100, // Add 100ms delay per request after delayAfter
    maxDelayMs: 5000, // Maximum delay of 5 seconds
    keyGenerator: generateKey,
});

// Burst protection - handles sudden spikes in traffic
export const burstProtection = rateLimit({
    windowMs: 1000, // 1 second
    max: 10, // Maximum 10 requests per second
    message: {
        success: false,
        message: 'Request rate too high, please slow down.',
        error: 'BURST_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Progressive rate limiting based on user type
export const createProgressiveRateLimit = (baseLimit: number) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: (req: Request) => {
            if (!req.user) return Math.floor(baseLimit * 0.5); // Anonymous users get 50% of limit
            
            // Authenticated users get full limit
            const userRole = req.user.role;
            switch (userRole) {
                case 'ADMIN':
                    return baseLimit * 3; // Admins get 3x limit
                case 'PREMIUM':
                    return baseLimit * 2; // Premium users get 2x limit
                default:
                    return baseLimit; // Regular users get base limit
            }
        },
        message: {
            success: false,
            message: 'Rate limit exceeded for your user type.',
            error: 'PROGRESSIVE_RATE_LIMIT_EXCEEDED'
        },
        keyGenerator: generateKey,
        handler: rateLimitHandler,
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestStore.entries()) {
        if (now > value.resetTime) {
            requestStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Export rate limit info middleware for debugging
export const rateLimitInfo = (req: Request, res: Response, next: any) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Rate limit info for ${req.method} ${req.path}:`, {
            ip: req.ip,
            user: req.user?.id || 'anonymous',
            rateLimit: req.rateLimit
        });
    }
    next();
};

// Middleware to skip rate limiting for trusted IPs or during testing
export const skipRateLimit = (trustedIPs: string[] = []) => {
    return (req: Request, res: Response, next: any) => {
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        // Skip in test environment
        if (process.env.NODE_ENV === 'test') {
            return next('route');
        }
        
        // Skip for trusted IPs (normalize with ipKeyGenerator)
        if (clientIP && trustedIPs.includes(ipKeyGenerator(clientIP))) {
            return next('route');
        }
        
        next();
    };
};