import { type Request, type Response } from 'express';
import prisma from "../lib/prisma.js";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const registerAdmin = async (req: Request, res: Response) => {
    const { email, password, name, username, department, responsibilities } = req.body;
    
    try {
        // Check if user with this email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Check if username is taken
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });
        
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user with ADMIN role and their AdminLead profile in a transaction
        const newAdmin = await prisma.$transaction(async (prisma) => {
            // Create the user with ADMIN role
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    username,
                    role: 'ADMIN',
                    userProfile: {
                        create: {
                            bio: 'Admin',
                            preferredLanguage: 'JavaScript', // Default language
                            level: 1,
                            points: 0,
                            streakDays: 0,
                            solved: 0
                        }
                    }
                }
            });
            
            // Create admin lead profile
            const adminLead = await prisma.adminLead.create({
                data: {
                    userId: user.id,
                    department: department || "",
                    responsibilities: responsibilities || [],
                    accessLevel: 1 // Default access level
                }
            });
            
            return user;
        });
        
        // Return success without sending back password
        const { password: _, ...adminData } = newAdmin;
        return res.status(201).json({ 
            message: 'Admin registered successfully',
            admin: adminData
        });
    } catch (error) {
        console.error('Error registering admin:', error);
        return res.status(500).json({ message: 'Failed to register admin' });
    }
}

export const adminLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    try {
        // Find user by email
        const admin = await prisma.user.findUnique({
            where: { 
                email,
                role: 'ADMIN'
            }
        });
        
        if (!admin || !admin.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate session token
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
        
        // Create new session
        await prisma.session.create({
            data: {
                sessionToken: token,
                userId: admin.id,
                expires: expiresAt
            }
        });
        
        // Update last active
        await prisma.user.update({
            where: { id: admin.id },
            data: { lastActive: new Date() }
        });
        
        // Get admin lead info
        const adminLead = await prisma.adminLead.findUnique({
            where: { userId: admin.id }
        });
        
        // Return user data and token
        const { password: _, ...adminData } = admin;
        
        return res.status(200).json({
            message: 'Login successful',
            admin: adminData,
            adminLead,
            token,
            expiresAt
        });
    } catch (error) {
        console.error('Error logging in admin:', error);
        return res.status(500).json({ message: 'Failed to login' });
    }
}

// Get admin profile
export const getAdminProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const adminLead = await prisma.adminLead.findUnique({
            where: { userId: req.user.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        username: true,
                        image: true,
                        role: true,
                        createdAt: true,
                        lastActive: true
                    }
                }
            }
        });
        
        if (!adminLead) {
            return res.status(404).json({ message: 'Admin profile not found' });
        }
        
        return res.status(200).json(adminLead);
    } catch (error) {
        console.error('Error getting admin profile:', error);
        return res.status(500).json({ message: 'Failed to get admin profile' });
    }
}