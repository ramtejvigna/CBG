import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { cache, CACHE_KEYS } from '../lib/cache.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Generate session token
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true }
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires
      }
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      token: sessionToken,
      expiresAt: expires.toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username, name } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, and username are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        name: name || username,
        password: hashedPassword,
        role: 'USER',
        profile: {
          create: {
            bio: 'No bio provided',
            solved: 0,
            preferredLanguage: 'javascript',
            level: 1,
            points: 0,
            streakDays: 0
          }
        }
      },
      include: { profile: true }
    });

    // Create session
    const sessionToken = generateSessionToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires
      }
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token: sessionToken,
      expiresAt: expires.toISOString()
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await prisma.session.deleteMany({
        where: { sessionToken: token }
      });
      cache.del(`session_${token}`);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complete onboarding
app.post('/api/auth/complete-onboarding', authenticate, async (req, res) => {
  try {
    const { preferredLanguage, bio, name } = req.body;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user!.id },
        data: { 
          name: name || req.user!.name,
          isVerified: true 
        }
      }),
      prisma.userProfile.upsert({
        where: { userId: req.user!.id },
        update: {
          preferredLanguage: preferredLanguage || 'javascript',
          bio: bio || 'No bio provided'
        },
        create: {
          userId: req.user!.id,
          preferredLanguage: preferredLanguage || 'javascript',
          bio: bio || 'No bio provided',
          solved: 0,
          level: 1,
          points: 0,
          streakDays: 0
        }
      })
    ]);

    res.json({ success: true, message: 'Onboarding completed' });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: resetExpires
      }
    });

    // TODO: Send email with reset link
    // For now, just log the token in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Reset token for ${email}: ${resetToken}`);
    }

    res.json({ success: true, message: 'If an account exists, a reset link will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Validate reset token
app.post('/api/auth/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    res.json({ valid: !!user });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
});

// Get session token by user ID (for internal use)
app.get('/api/auth/session-token/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const session = await prisma.session.findFirst({
      where: {
        userId,
        expires: { gt: new Date() }
      },
      orderBy: { expires: 'desc' }
    });

    if (!session) {
      return res.status(404).json({ message: 'No valid session found' });
    }

    res.json({ token: session.sessionToken });
  } catch (error) {
    console.error('Get session token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Auth Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
