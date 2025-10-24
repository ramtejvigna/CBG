import type { Request, Response, NextFunction } from 'express';

interface LogEntry {
    timestamp: string;
    method: string;
    url: string;
    statusCode: number;
    responseTime: string;
    ip: string;
}

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Store the original json method to capture the status code
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override json method to capture when response is sent
    res.json = function(body) {
        logRequest();
        return originalJson.call(this, body);
    };
    
    // Override send method to capture when response is sent
    res.send = function(body) {
        logRequest();
        return originalSend.call(this, body);
    };
    
    // Also capture on finish event as backup
    res.on('finish', () => {
        logRequest();
    });
    
    let logged = false;
    
    function logRequest() {
        if (logged) return; // Prevent multiple logs for the same request
        logged = true;
        
        const endTime = Date.now();
        const responseTime = `${endTime - startTime}ms`;
        
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            responseTime,
            ip: req.ip || req.connection.remoteAddress || 'unknown'
        };
        
        // Color coding based on status code
        const getStatusColor = (statusCode: number): string => {
            if (statusCode >= 200 && statusCode < 300) return '\x1b[32m'; // Green
            if (statusCode >= 300 && statusCode < 400) return '\x1b[33m'; // Yellow
            if (statusCode >= 400 && statusCode < 500) return '\x1b[31m'; // Red
            if (statusCode >= 500) return '\x1b[35m'; // Magenta
            return '\x1b[0m'; // Reset
        };
        
        const resetColor = '\x1b[0m';
        const methodColor = '\x1b[36m'; // Cyan
        const urlColor = '\x1b[34m'; // Blue
        const timeColor = '\x1b[90m'; // Gray
        
        console.log(
            `${timeColor}[${logEntry.timestamp}]${resetColor} ` +
            `${methodColor}${logEntry.method}${resetColor} ` +
            `${urlColor}${logEntry.url}${resetColor} ` +
            `${getStatusColor(logEntry.statusCode)}${logEntry.statusCode}${resetColor} ` +
            `${timeColor}${logEntry.responseTime}${resetColor}`
        );
        
        // Log errors with more details
        if (logEntry.statusCode >= 400) {
            console.log(`${timeColor}  └─ IP: ${logEntry.ip}`);
        }
    }
    
    next();
};

// Optional: Export a function to get API statistics
export const getApiStats = () => {
    // This could be enhanced to store stats in memory or database
    return {
        message: 'API logging is active',
        timestamp: new Date().toISOString()
    };
};