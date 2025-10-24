import type { Request, Response, NextFunction } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';

// Rate limit monitoring and analytics
class RateLimitMonitor {
    private violations: Map<string, number> = new Map();
    private lastCleanup: number = Date.now();
    private readonly cleanupInterval = 60 * 60 * 1000; // 1 hour

    // Log rate limit violations
    logViolation(req: Request, limitType: string) {
        const key = this.getClientKey(req);
        const violations = this.violations.get(key) || 0;
        this.violations.set(key, violations + 1);

        // Log to external monitoring service if configured
        if (process.env.MONITORING_WEBHOOK) {
            this.sendToMonitoring({
                event: 'rate_limit_violation',
                limitType,
                client: key,
                path: req.path,
                method: req.method,
                violations: violations + 1,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get client identifier (user ID or IP)
    private getClientKey(req: Request): string {
        if (req.user?.id) {
            return `user:${req.user.id}`;
        }
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        return `ip:${ipKeyGenerator(ip)}`;
    }

    // Send data to external monitoring
    private async sendToMonitoring(data: any) {
        try {
            if (process.env.MONITORING_WEBHOOK) {
                await fetch(process.env.MONITORING_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
        } catch (error) {
            console.error('Failed to send monitoring data:', error);
        }
    }

    // Get violation statistics
    getStats() {
        this.cleanup();
        return {
            totalViolations: Array.from(this.violations.values()).reduce((sum, count) => sum + count, 0),
            uniqueViolators: this.violations.size,
            topViolators: Array.from(this.violations.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([client, violations]) => ({ client, violations }))
        };
    }

    // Clean up old data
    private cleanup() {
        const now = Date.now();
        if (now - this.lastCleanup > this.cleanupInterval) {
            this.violations.clear();
            this.lastCleanup = now;
        }
    }

    // Reset all statistics
    reset() {
        this.violations.clear();
        this.lastCleanup = Date.now();
    }
}

export const rateLimitMonitor = new RateLimitMonitor();

// Middleware to add rate limit headers
export const addRateLimitHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Add custom headers for debugging
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    res.set('X-Client-IP', ipKeyGenerator(ip));
    res.set('X-Rate-Limit-Client', req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(ip)}`);
    
    next();
};

// Middleware to log successful requests (for rate limit analysis)
export const logRequest = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Log high-frequency endpoints
        if (req.path.includes('/api/')) {
            const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
            console.log(`API Request: ${req.method} ${req.path}`, {
                status: res.statusCode,
                duration: `${duration}ms`,
                client: req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(ip)}`,
                userAgent: req.get('User-Agent')?.substring(0, 100)
            });
        }
    });
    
    next();
};

// Health check endpoint for rate limiting system
export const rateLimitHealthCheck = (req: Request, res: Response) => {
    const stats = rateLimitMonitor.getStats();
    
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: stats,
        config: {
            environment: process.env.NODE_ENV,
            rateLimitingEnabled: true,
            monitoringEnabled: !!process.env.MONITORING_WEBHOOK
        }
    });
};

// Middleware to handle rate limit exceeded scenarios
export const handleRateLimitExceeded = (limitType: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // This runs when rate limit is exceeded
        rateLimitMonitor.logViolation(req, limitType);
        
        // Add violation info to response
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        res.locals.rateLimitViolation = {
            type: limitType,
            client: req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(ip)}`,
            timestamp: new Date().toISOString()
        };
        
        next();
    };
};

// Middleware to check for suspicious activity patterns
export const detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const clientKey = req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(ip)}`;
    const violations = rateLimitMonitor['violations'].get(clientKey) || 0;
    
    // Flag clients with high violation counts
    if (violations > 10) {
        console.warn(`Suspicious activity detected for client: ${clientKey}`, {
            violations,
            path: req.path,
            method: req.method,
            userAgent: req.get('User-Agent')
        });
    }
    
    next();
};

export default rateLimitMonitor;