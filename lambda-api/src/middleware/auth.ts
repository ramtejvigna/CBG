import { type Request, type Response, type NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { cache } from '../lib/cache.js';

// User type for request
export interface User {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    image: string | null;
}

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check cache first for session
        const cacheKey = `session_${token}`;
        let session: any = cache.get(cacheKey);

        if (!session) {
            // Get session from database
            session = await prisma.session.findUnique({
                where: { sessionToken: token },
                include: {
                    user: true
                }
            });

            // Cache the session if valid
            if (session && Date.now() <= new Date(session.expires).getTime()) {
                cache.setShort(cacheKey, session);
            }
        }

        if (!session || Date.now() > new Date(session.expires).getTime()) {
            cache.del(cacheKey);
            return res.status(401).json({ message: 'Session expired' });
        }

        req.user = session.user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return next();
        }

        const cacheKey = `session_${token}`;
        let session: any = cache.get(cacheKey);

        if (!session) {
            session = await prisma.session.findUnique({
                where: { sessionToken: token },
                include: { user: true }
            });

            if (session && Date.now() <= new Date(session.expires).getTime()) {
                cache.setShort(cacheKey, session);
            }
        }

        if (session && Date.now() <= new Date(session.expires).getTime()) {
            req.user = session.user;
        }
        
        next();
    } catch (error) {
        next();
    }
};

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const cacheKey = `session_${token}`;
        let session: any = cache.get(cacheKey);

        if (!session) {
            session = await prisma.session.findUnique({
                where: { sessionToken: token },
                include: { user: true }
            });

            if (session && Date.now() <= new Date(session.expires).getTime()) {
                cache.setShort(cacheKey, session);
            }
        }

        if (!session || Date.now() > new Date(session.expires).getTime()) {
            cache.del(cacheKey);
            return res.status(401).json({ message: 'Session expired' });
        }

        if (session.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user = session.user;
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
