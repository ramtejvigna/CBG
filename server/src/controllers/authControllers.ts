import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';


export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, username, fullName, preferredLanguage } = req.body;

        // Validate required fields
        if (!email || !password || !username || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user with profile and temporarily generated username
        const baseUsername = fullName.toLowerCase().replace(/\s+/g, '');
        const tempUsername = `${baseUsername}`;

        const user = await prisma.user.create({
            data: {
                email,
                username: tempUsername, // Using temporary username
                name: fullName,
                password: hashedPassword,
                emailVerified: new Date(),
                userProfile: {
                    create: {
                        bio: "No bio provided",
                        solved: 0,
                        preferredLanguage: preferredLanguage?.toLowerCase() || "javascript",
                        level: 1,
                        points: 0,
                        streakDays: 0
                    }
                }
            },
            include: {
                userProfile: true,
                accounts: true
            }
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Please complete your profile setup',
            user: userWithoutPassword,
            token,
            needsOnboarding: true
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                userProfile: true,
                accounts: true,
            },
        });

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || "fallback-secret",
            { expiresIn: "7d" }
        );

        // Session expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.session.create({
            data: {
                sessionToken: token,
                userId: user.id,
                expires: expiresAt,
            },
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { email, name, image, googleId } = req.body;

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { userProfile: true }
        });

        if (!user) {
            // Generate a unique username based on the name
            const baseUsername = name.toLowerCase().replace(/\s+/g, '');
            const randomSuffix = randomBytes(4).toString('hex');
            const username = `${baseUsername}${randomSuffix}`;

            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    image,
                    username,
                    emailVerified: new Date(),
                    accounts: {
                        create: {
                            type: 'oauth',
                            provider: 'google',
                            providerAccountId: googleId,
                        }
                    },
                    userProfile: {
                        create: {
                            bio: "No bio provided",
                            solved: 0,
                            preferredLanguage: "javascript",
                            level: 1,
                            points: 0,
                            streakDays: 0
                        }
                    }
                },
                include: { userProfile: true }
            });

            // For new Google users, redirect to onboarding to complete profile
            res.status(201).json({
                success: true,
                user,
                needsOnboarding: true,
                message: 'Please complete your profile setup'
            });
        } else {
            // Update existing user
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    name,
                    image,
                    emailVerified: new Date(),
                }
            });

            // Ensure account connection exists
            const existingAccount = await prisma.account.findFirst({
                where: {
                    userId: user.id,
                    provider: 'google'
                }
            });

            if (!existingAccount) {
                await prisma.account.create({
                    data: {
                        userId: user.id,
                        type: 'oauth',
                        provider: 'google',
                        providerAccountId: googleId,
                    }
                });
            }

            res.status(200).json({
                success: true,
                user,
                needsOnboarding: false
            });
        }
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const completeOnboarding = async (req: Request, res: Response) => {
    try {
        const { userId, username, preferredLanguage } = req.body;

        // Enhanced validation
        if (!userId || !username) {
            return res.status(400).json({
                success: false,
                message: 'User ID and username are required'
            });
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username must be 3-30 characters long and can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if username is already taken
        const existingUser = await prisma.user.findFirst({
            where: {
                username,
                NOT: { id: userId }
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                userProfile: {
                    update: {
                        preferredLanguage: preferredLanguage?.toLowerCase() || 'javascript'
                    }
                }
            },
            include: {
                userProfile: true,
                accounts: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Profile completed successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Complete onboarding error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        // In a stateless JWT setup, logout is typically handled client-side
        // by removing the token from storage. Server-side, we could maintain
        // a blacklist of tokens, but that's beyond basic implementation.

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        // This endpoint will only be accessible if the user is authenticated
        // due to the authentication middleware, so req.user should be available
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Get the full user data with profile and badges
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                userProfile: {
                    include: {
                        badges: true,
                        languages: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove sensitive information
        const { password, ...userWithoutPassword } = user;

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Auth me error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};