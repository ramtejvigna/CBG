import { type Request, type Response, type NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import type { User } from '../types/models.js';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: User
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        console.log(token)

        // Get session from database
        const session = await prisma.session.findUnique({
            where: { sessionToken: token },
            include: {
                user: true
            }
        });

        if (!session || Date.now() > new Date(session.expires).getTime()) {
            return res.status(401).json({ message: 'Session expired' });
        }

        // Attach user to request
        req.user = session.user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const session = await prisma.session.findUnique({
            where: { sessionToken: token },
            include: {
                user: true
            }
        });

        if (!session || Date.now() > new Date(session.expires).getTime()) {
            return res.status(401).json({ message: 'Session expired' });
        }

        if(session.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = session.user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}