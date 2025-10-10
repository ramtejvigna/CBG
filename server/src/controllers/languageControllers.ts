import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getLanguages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if(id) {
            getLanguageById(req, res);
            return;
        }
        const languages = await prisma.language.findMany({
            select: {
                id: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json({ 
            success: true, 
            languages 
        });
    } catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const getLanguageById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Language ID is required' 
            });
        }

        const language = await prisma.language.findUnique({
            where: { id },
            select: {
                id: true,
                name: true
            }
        });

        if (!language) {
            return res.status(404).json({ 
                success: false, 
                message: 'Language not found' 
            });
        }

        res.json({ 
            success: true, 
            language 
        });
    } catch (error) {
        console.error('Error fetching language:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const addLanguage = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        await prisma.language.create({
            data: {
                name,
                percentage: 0
            }
        })

        return res.status(200).json({
            success: true,
            message: 'Successfully added language'
        })
    } catch (error) {
        return res.status(500).json({
            success: false, 
            message: error.message
        })
    }
}