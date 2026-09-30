import { type Request, type Response, type NextFunction } from 'express';
import { getSessionByToken, type CachedSession } from '../lib/sessionCache.js';

/**
 * The identity attached by these middlewares. It is deliberately the subset of the
 * user record that authentication loads, rather than the full database row, so a
 * handler cannot silently depend on a field the session lookup never fetched.
 */
export type AuthenticatedUser = CachedSession['user'];

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser
        }
    }
}

const bearerToken = (req: Request): string | undefined =>
    req.headers.authorization?.split(' ')[1];

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = bearerToken(req);

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const session = await getSessionByToken(token);

        if (!session) {
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
        const token = bearerToken(req);
        if (token) {
            const session = await getSessionByToken(token);
            if (session) {
                req.user = session.user;
            }
        }
        next();
    } catch {
        // Authentication is optional here, so errors must not block the request
        next();
    }
};

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = bearerToken(req);

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const session = await getSessionByToken(token);

        if (!session) {
            return res.status(401).json({ message: 'Session expired' });
        }

        if (session.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        req.user = session.user;
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
