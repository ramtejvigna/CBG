import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

// User type for request
export interface User {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
}

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// Simple in-memory cache for sessions (resets on restart)
const sessionCache = new Map<string, { session: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        // Check cache first
        const cached = sessionCache.get(token);
        if (cached && cached.expires > Date.now()) {
            req.user = cached.session.user;
            return next();
        }

        // Get session from database
        const session = await prisma.session.findUnique({
            where: { sessionToken: token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

        if (!session || Date.now() > new Date(session.expires).getTime()) {
            sessionCache.delete(token);
            return res.status(401).json({ 
                success: false, 
                message: 'Session expired or invalid' 
            });
        }

        // Cache the session
        sessionCache.set(token, {
            session,
            expires: Date.now() + CACHE_TTL
        });

        req.user = session.user as User;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

// Clean up expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of sessionCache.entries()) {
        if (value.expires < now) {
            sessionCache.delete(key);
        }
    }
}, 60 * 1000); // Every minute
