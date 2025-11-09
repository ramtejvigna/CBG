import rateLimit from 'express-rate-limit';

// Simple rate limiters without custom key generators to avoid IPv6 issues
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased limit for better UX
    message: 'Too many requests. Please try again later.',
    standardHeaders: false, // Reduce header overhead
    legacyHeaders: false,
});

// Auth endpoints - 30 requests per 15 minutes
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many auth requests. Please try again later.',
    standardHeaders: false,
    legacyHeaders: false,
});

// Admin endpoints - 100 requests per 15 minutes
export const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many admin requests. Please try again later.',
    standardHeaders: false,
    legacyHeaders: false,
});

// Search endpoints - 50 requests per 5 minutes
export const searchRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: 'Too many search requests. Please try again later.',
    standardHeaders: false,
    legacyHeaders: false,
});

// Code execution - 20 requests per 5 minutes
export const codeExecutionRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: 'Too many code execution requests. Please try again later.',
    standardHeaders: false,
    legacyHeaders: false,
});

export default { 
    generalRateLimit, 
    authRateLimit, 
    adminRateLimit, 
    searchRateLimit, 
    codeExecutionRateLimit 
};