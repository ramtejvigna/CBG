# Search Functionality Implementation

## Overview
The search functionality allows users to search across challenges, contests, and warriors (users) from the navigation bar.

## Features
- **Real-time search**: Results appear as you type with a 300ms debounce
- **Multi-entity search**: Searches challenges, contests, and users simultaneously
- **Keyboard shortcuts**: 
  - `Ctrl+K` (or `Cmd+K` on Mac) to focus the search bar
  - `Escape` to close search results
- **Responsive design**: Works in both light and dark themes
- **Click outside to close**: Search results close when clicking elsewhere

## Search Capabilities

### Challenges
- Searches by title, description, and category name
- Shows difficulty level and category
- Links to challenge detail page

### Contests
- Searches by title, description, and tags
- Shows contest status and start date
- Links to contest detail page

### Users (Warriors)
- Searches by username and display name
- Shows user avatar (if available) and username
- Links to user profile page

## API Endpoints

### Server-side
- `GET /api/search?q={query}` - Returns search results

### Client-side
- `GET /api/search?q={query}` - Next.js API route that forwards to backend

## Implementation Details

### Backend (`server/src/controllers/searchControllers.ts`)
- Uses Prisma ORM for database queries
- Case-insensitive search with `mode: 'insensitive'`
- Limits results to 5 per category for performance
- Returns structured JSON with challenges, contests, and users arrays

### Frontend (`client/src/components/NavBar/`)
- `index.tsx`: Main navigation bar with search input
- `SearchResults.tsx`: Renders search results dropdown
- Uses React hooks for state management and debouncing
- Implements keyboard navigation and accessibility features

## Environment Configuration
Make sure `NEXT_PUBLIC_API_URL` is set in your `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Usage
1. Click on the search bar or press `Ctrl+K`
2. Start typing to see real-time results
3. Click on any result to navigate to that page
4. Press `Escape` or click outside to close

## Performance Considerations
- Search is debounced by 300ms to avoid excessive API calls
- Results are limited to 5 items per category
- Images are lazy-loaded for user avatars
- Database queries use appropriate indexes for performance