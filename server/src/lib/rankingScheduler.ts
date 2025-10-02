import { RankingSystem } from './rankingSystem.js';

export class RankingScheduler {
    private static intervalId: NodeJS.Timeout | null = null;
    private static isRunning = false;

    /**
     * Start the ranking update scheduler
     * @param intervalMinutes How often to check for rank updates (default: 15 minutes)
     */
    static start(intervalMinutes: number = 15): void {
        if (this.intervalId) {
            console.log('Ranking scheduler is already running');
            return;
        }

        console.log(`Starting ranking scheduler with ${intervalMinutes} minute intervals`);

        // Run initial rank update
        this.performScheduledUpdate();

        // Set up periodic updates
        this.intervalId = setInterval(
            () => this.performScheduledUpdate(),
            intervalMinutes * 60 * 1000
        );
    }

    /**
     * Stop the ranking update scheduler
     */
    static stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Ranking scheduler stopped');
        }
    }

    /**
     * Perform a scheduled rank update
     * Only updates if needed to avoid unnecessary computation
     */
    private static async performScheduledUpdate(): Promise<void> {
        if (this.isRunning) {
            console.log('Ranking update already in progress, skipping...');
            return;
        }

        this.isRunning = true;

        try {
            console.log('Checking if rank update is needed...');
            
            const updateNeeded = await RankingSystem.isFullRankUpdateNeeded();
            
            if (updateNeeded) {
                console.log('Starting scheduled rank update...');
                const startTime = Date.now();
                
                await RankingSystem.updateAllUserRanks();
                
                const endTime = Date.now();
                console.log(`Scheduled rank update completed in ${endTime - startTime}ms`);
            } else {
                console.log('Ranks are up to date, no update needed');
            }
        } catch (error) {
            console.error('Error during scheduled rank update:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Force a full rank update regardless of whether it's needed
     */
    static async forceUpdate(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Ranking update already in progress');
        }

        this.isRunning = true;

        try {
            console.log('Forcing full rank update...');
            const startTime = Date.now();
            
            await RankingSystem.updateAllUserRanks();
            
            const endTime = Date.now();
            console.log(`Forced rank update completed in ${endTime - startTime}ms`);
        } catch (error) {
            console.error('Error during forced rank update:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Get the current status of the scheduler
     */
    static getStatus(): { 
        isSchedulerRunning: boolean; 
        isUpdateInProgress: boolean; 
    } {
        return {
            isSchedulerRunning: this.intervalId !== null,
            isUpdateInProgress: this.isRunning
        };
    }
}

// Initialize ranking system on server start
export const initializeRankingSystem = async (): Promise<void> => {
    try {
        console.log('Initializing ranking system...');
        
        // Check if initial rank update is needed
        const updateNeeded = await RankingSystem.isFullRankUpdateNeeded();
        
        if (updateNeeded) {
            console.log('Performing initial rank calculation...');
            await RankingSystem.updateAllUserRanks();
            console.log('Initial rank calculation completed');
        } else {
            console.log('Ranks are already initialized');
        }

        // Start the scheduler (check every 15 minutes)
        RankingScheduler.start(15);
        
        console.log('Ranking system initialized successfully');
    } catch (error) {
        console.error('Error initializing ranking system:', error);
        // Don't throw error to prevent server startup failure
    }
};

// Graceful shutdown
export const shutdownRankingSystem = (): void => {
    console.log('Shutting down ranking system...');
    RankingScheduler.stop();
};