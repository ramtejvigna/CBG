import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { sendPasswordResetEmail, isEmailServiceAvailable } from '../lib/emailService.js';

// Helper function to check for existing valid session
const getValidSession = async (userId: string) => {
    const existingSession = await prisma.session.findFirst({
        where: {
            userId,
            expires: {
                gt: new Date() // Session expires after current date
            }
        },
        orderBy: {
            expires: 'desc' // Get the session with the latest expiry
        }
    });
    return existingSession;
};


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

        // Remove large image data from signup response to reduce payload size
        const { image, ...userWithoutImage } = userWithoutPassword;

        // Check for existing valid session
        let sessionToken: string;
        const existingSession = await getValidSession(user.id);
        
        if (existingSession) {
            sessionToken = existingSession.sessionToken;
        } else {
            // Create new session
            sessionToken = randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

            await prisma.session.create({
                data: {
                    sessionToken,
                    userId: user.id,
                    expires: expiresAt,
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Please complete your profile setup',
            user: {
                ...userWithoutImage,
                // Only include a flag to indicate if user has an image
                hasImage: !!user.image
            },
            sessionToken,
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

        // Remove large image data from login response to reduce payload size
        const { image, ...userWithoutImage } = userWithoutPassword;

        // Check for existing valid session
        let sessionToken: string;
        const existingSession = await getValidSession(user.id);
        
        if (existingSession) {
            sessionToken = existingSession.sessionToken;
        } else {
            // Create new session
            sessionToken = randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

            await prisma.session.create({
                data: {
                    sessionToken,
                    userId: user.id,
                    expires: expiresAt,
                }
            });
        }

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                ...userWithoutImage,
                // Only include a flag to indicate if user has an image
                hasImage: !!user.image
            },
            sessionToken,
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

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for Google authentication'
            });
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { userProfile: true, accounts: true }
        });

        if (!user) {
            // Generate a temporary username that indicates onboarding is needed
            const baseUsername = name ? name.toLowerCase().replace(/\s+/g, '') : 'user';
            const randomSuffix = randomBytes(4).toString('hex');
            const tempUsername = `temp_${baseUsername}_${randomSuffix}`;

            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    image,
                    needsOnboarding: true,
                    username: tempUsername, // Temporary username
                    emailVerified: new Date(),
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
                include: { userProfile: true, accounts: true }
            });

            // Create account record separately to avoid conflicts with NextAuth adapter
            await prisma.account.create({
                data: {
                    userId: user.id,
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: googleId,
                }
            });
        } else {
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
        }

        // Check for existing valid session
        let sessionToken: string;
        const existingSession = await getValidSession(user.id);
        
        if (existingSession) {
            sessionToken = existingSession.sessionToken;
        } else {
            // Create new session for Google auth
            sessionToken = randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

            await prisma.session.create({
                data: {
                    sessionToken,
                    userId: user.id,
                    expires: expiresAt,
                }
            });
        }

        // Remove sensitive data from response
        const { password, ...userWithoutPassword } = user;
        // Remove large image data from response to reduce payload size
        const { image: userImage, ...userWithoutImage } = userWithoutPassword;

        res.status(user ? 200 : 201).json({
            success: true,
            user: {
                ...userWithoutImage,
                hasImage: !!user.image
            },
            sessionToken,
            needsOnboarding: user.needsOnboarding,
            message: user.needsOnboarding ? 'Please complete your profile setup' : 'Authentication successful'
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: 'Failed to process Google authentication'
        });
    }
};

export const completeOnboarding = async (req: Request, res: Response) => {
    try {
        const { userId, username, preferredLanguage } = req.body;

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

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                needsOnboarding: false,
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
        const sessionToken = req.headers.authorization?.split(' ')[1];
        
        if (sessionToken) {
            // Delete the session from database
            await prisma.session.deleteMany({
                where: { sessionToken }
            });
        }

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

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal whether user exists or not for security
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent"
            });
        }

        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);
        
        // Token expires in 1 hour
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        // Store the hashed token in database
        await prisma.passwordResetToken.create({
            data: {
                email,
                token: hashedToken,
                expires: expiryDate
            }
        });

        // Send password reset email
        try {
            if (isEmailServiceAvailable()) {
                const emailSent = await sendPasswordResetEmail(email, resetToken);
                if (emailSent) {
                    console.log('Password reset email sent successfully to:', email);
                }
            } else {
                console.warn('Email service not available - password reset email not sent to:', email);
            }
        } catch (error) {
            console.error('Failed to send password reset email to:', email, error);
            // Don't fail the request even if email fails to send - user should still be able to reset via other means
        }

        return res.status(200).json({
            success: true,
            message: "If an account with that email exists, a password reset link has been sent"
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: "Error while processing forgot password request"
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, token, password, confirmPassword } = req.body;

        // Validate required fields
        if (!email || !token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, token, password, and confirm password are required"
            });
        }

        // Validate password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        // Find the reset token
        const resetTokens = await prisma.passwordResetToken.findMany({
            where: {
                email,
                used: false,
                expires: {
                    gt: new Date()
                }
            }
        });

        if (resetTokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // Verify the token
        let validToken = null;
        for (const dbToken of resetTokens) {
            const isValid = await bcrypt.compare(token, dbToken.token);
            if (isValid) {
                validToken = dbToken;
                break;
            }
        }

        if (!validToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user password and mark token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            }),
            prisma.passwordResetToken.update({
                where: { id: validToken.id },
                data: { used: true }
            })
        ]);

        // Invalidate all sessions for this user
        await prisma.session.deleteMany({
            where: { userId: user.id }
        });

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please log in with your new password."
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: "Error while resetting password"
        });
    }
};

export const validateResetToken = async (req: Request, res: Response) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({
                success: false,
                message: "Email and token are required"
            });
        }

        // Find valid reset tokens
        const resetTokens = await prisma.passwordResetToken.findMany({
            where: {
                email,
                used: false,
                expires: {
                    gt: new Date()
                }
            }
        });

        if (resetTokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // Verify the token
        let isValidToken = false;
        for (const dbToken of resetTokens) {
            const isValid = await bcrypt.compare(token, dbToken.token);
            if (isValid) {
                isValidToken = true;
                break;
            }
        }

        if (!isValidToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Token is valid"
        });

    } catch (error) {
        console.error('Validate reset token error:', error);
        return res.status(500).json({
            success: false,
            message: "Error while validating reset token"
        });
    }
};

// Get session token for a user (used by NextAuth)
export const getSessionToken = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get the most recent valid session for the user
        const session = await prisma.session.findFirst({
            where: {
                userId: userId,
                expires: {
                    gt: new Date() // Only return non-expired sessions
                }
            },
            orderBy: {
                expires: 'desc' // Get the most recent session (by expiry date)
            }
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No valid session found'
            });
        }

        res.status(200).json({
            success: true,
            sessionToken: session.sessionToken
        });

    } catch (error) {
        console.error('Get session token error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};