import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({
                challenges: [],
                contests: [],
                users: []
            });
        }

        // Forward the search request to the backend API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Search failed',
                challenges: [],
                contests: [],
                users: []
            },
            { status: 500 }
        );
    }
}