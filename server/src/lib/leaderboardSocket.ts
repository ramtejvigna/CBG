import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import prisma from './prisma.js';

const LIMIT = 10;
let wss: WebSocketServer | null = null;
let timer: NodeJS.Timeout | null = null;

// Ranks are derived from the sort order so the board never depends on stale/null stored ranks.
export async function fetchLeaderboard(limit = LIMIT, offset = 0) {
    const rows = await prisma.userProfile.findMany({
        where: { user: { role: 'USER' } },
        select: {
            points: true,
            solved: true,
            streakDays: true,
            level: true,
            user: { select: { id: true, username: true, name: true, image: true } }
        },
        orderBy: [{ points: 'desc' }, { solved: 'desc' }, { createdAt: 'asc' }],
        take: Math.min(limit, 100),
        skip: Math.max(offset, 0)
    });

    return rows.map((row, i) => ({
        rank: offset + i + 1,
        id: row.user.id,
        username: row.user.username,
        name: row.user.name ?? undefined,
        image: row.user.image ?? undefined,
        points: row.points,
        solved: row.solved,
        level: row.level,
        streakDays: row.streakDays
    }));
}

async function send(client: WebSocket) {
    try {
        const leaderboard = await fetchLeaderboard();
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'leaderboard', leaderboard }));
        }
    } catch (error) {
        console.error('Leaderboard socket send failed:', error);
    }
}

// Debounced so bursts of rank updates produce a single push.
export function broadcastLeaderboard() {
    if (!wss || timer) return;
    timer = setTimeout(async () => {
        timer = null;
        if (!wss || wss.clients.size === 0) return;
        try {
            const message = JSON.stringify({ type: 'leaderboard', leaderboard: await fetchLeaderboard() });
            wss.clients.forEach((c) => c.readyState === WebSocket.OPEN && c.send(message));
        } catch (error) {
            console.error('Leaderboard broadcast failed:', error);
        }
    }, 500);
}

export function initLeaderboardSocket(server: Server) {
    wss = new WebSocketServer({ server, path: '/ws/leaderboard' });
    wss.on('error', (e) => console.error('Leaderboard socket error:', e));
    wss.on('connection', (client) => {
        send(client);
        client.on('error', () => {});
    });
}

export function closeLeaderboardSocket() {
    if (timer) clearTimeout(timer);
    wss?.close();
}
