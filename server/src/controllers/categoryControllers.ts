import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.challengeCategory.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: {
                        challenges: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Category ID is required' });
        }

        const category = await prisma.challengeCategory.findUnique({
            where: { id },
            include: {
                challenges: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                username: true,
                                image: true
                            }
                        },
                        _count: {
                            select: {
                                submissions: true,
                                likes: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        challenges: true
                    }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        if(!name || !description) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            })
        }

        await prisma.challengeCategory.create({
            data: {
                name,
                description
            }
        });

        res.status(200).json({
            success: true,
            message: 'Category created successfully'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error while creating category'
        })
    }
}