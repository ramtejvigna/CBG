// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
    // General API limits
    GENERAL: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
        message: 'Too many requests from this user/IP, please try again later.'
    },
    
    // Authentication endpoints
    LOGIN: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // login attempts per window
        message: 'Too many login attempts, please try again later.'
    },
    
    // Password reset endpoints
    PASSWORD_RESET: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // password reset attempts per window
        message: 'Too many password reset attempts, please try again later.'
    },
    
    // Code execution endpoints
    CODE_EXECUTION: {
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 30, // code executions per window
        message: 'Too many code execution requests, please try again later.'
    },
    
    // Admin endpoints
    ADMIN: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // admin requests per window
        message: 'Too many admin requests, please try again later.'
    },
    
    // File upload endpoints
    FILE_UPLOAD: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // file uploads per window
        message: 'Too many file upload requests, please try again later.'
    },
    
    // Search endpoints
    SEARCH: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 60, // search requests per window
        message: 'Too many search requests, please try again later.'
    },
    
    // Strict rate limiting for sensitive operations
    STRICT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // requests per window
        message: 'Too many requests to sensitive endpoints, please try again later.'
    },
    
    // Burst protection (per second limits)
    BURST: {
        windowMs: 1000, // 1 second
        max: 10, // requests per second
        message: 'Request rate too high, please slow down.'
    },
    
    // Speed limiting (progressive slowdown)
    SPEED: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 50, // start delaying after this many requests
        delayMs: 100, // delay increment per request (in ms)
        maxDelayMs: 5000, // maximum delay (5 seconds)
    },
    
    // Progressive limits based on user roles
    PROGRESSIVE: {
        ANONYMOUS_MULTIPLIER: 0.5, // Anonymous users get 50% of base limit
        REGULAR_MULTIPLIER: 1.0, // Regular users get 100% of base limit
        PREMIUM_MULTIPLIER: 2.0, // Premium users get 200% of base limit
        ADMIN_MULTIPLIER: 3.0, // Admin users get 300% of base limit
    }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
    // More relaxed limits in development
    RATE_LIMIT_CONFIG.GENERAL.max = 200;
    RATE_LIMIT_CONFIG.LOGIN.max = 10;
    RATE_LIMIT_CONFIG.CODE_EXECUTION.max = 60;
} else if (process.env.NODE_ENV === 'production') {
    // Stricter limits in production
    RATE_LIMIT_CONFIG.GENERAL.max = 80;
    RATE_LIMIT_CONFIG.LOGIN.max = 3;
    RATE_LIMIT_CONFIG.CODE_EXECUTION.max = 20;
}

// Trusted IP addresses (bypass rate limiting)
export const TRUSTED_IPS = [
    '127.0.0.1',
    '::1',
    'localhost',
    // Add your server IPs here
    ...(process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [])
];

// Rate limit bypass conditions
export const BYPASS_CONDITIONS = {
    // Skip rate limiting in test environment
    skipInTest: process.env.NODE_ENV === 'test',
    
    // Skip for trusted user agents (monitoring, health checks, etc.)
    trustedUserAgents: [
        /health-check/i,
        /monitoring/i,
        /uptime/i
    ],
    
    // Skip for specific routes
    skipRoutes: [
        '/health',
        '/api/health',
        '/metrics'
    ]
};