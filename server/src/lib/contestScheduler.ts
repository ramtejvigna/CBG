import { PrismaClient, ContestStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class ContestScheduler {
    private static intervalId: NodeJS.Timeout | null = null;
    private static isRunning = false;

    /**
     * Start the contest status update scheduler
     * @param intervalMinutes How often to check for status updates (default: 5 minutes)
     */
    static start(intervalMinutes: number = 5): void {
        if (this.intervalId) {
            console.log('Contest scheduler is already running');
            return;
        }

        console.log(`Starting contest scheduler with ${intervalMinutes} minute intervals`);

        // Run initial status update
        this.performStatusUpdate();

        // Set up periodic updates
        this.intervalId = setInterval(
            () => this.performStatusUpdate(),
            intervalMinutes * 60 * 1000
        );
    }

    /**
     * Stop the contest status update scheduler
     */
    static stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Contest scheduler stopped');
        }
    }

    /**
     * Perform a contest status update
     */
    private static async performStatusUpdate(): Promise<void> {
        if (this.isRunning) {
            console.log('Contest status update already in progress, skipping...');
            return;
        }

        this.isRunning = true;

        try {
            console.log('Checking for contest status updates...');
            const now = new Date();
            
            let updatedCount = 0;

            // Update contests that should start (from REGISTRATION_OPEN to ONGOING)
            const contestsToStart = await prisma.contest.updateMany({
                where: {
                    status: ContestStatus.REGISTRATION_OPEN,
                    startsAt: {
                        lte: now
                    },
                    endsAt: {
                        gt: now
                    }
                },
                data: {
                    status: ContestStatus.ONGOING
                }
            });
            updatedCount += contestsToStart.count;

            // Update contests that should end (from ONGOING to FINISHED)
            const contestsToEnd = await prisma.contest.updateMany({
                where: {
                    status: ContestStatus.ONGOING,
                    endsAt: {
                        lte: now
                    }
                },
                data: {
                    status: ContestStatus.FINISHED
                }
            });
            updatedCount += contestsToEnd.count;

            // Update contests where registration should open (from UPCOMING to REGISTRATION_OPEN)
            // Assuming registration opens when startsAt is within 24 hours and registrationEnd hasn't passed
            const contestsToOpenRegistration = await prisma.contest.updateMany({
                where: {
                    status: ContestStatus.UPCOMING,
                    registrationEnd: {
                        gt: now
                    },
                    startsAt: {
                        gt: now
                    }
                },
                data: {
                    status: ContestStatus.REGISTRATION_OPEN
                }
            });
            updatedCount += contestsToOpenRegistration.count;

            if (updatedCount > 0) {
                console.log(`Updated status for ${updatedCount} contests`);
                
                // Log details of updated contests
                if (contestsToStart.count > 0) {
                    console.log(`${contestsToStart.count} contests started (REGISTRATION_OPEN → ONGOING)`);
                }
                if (contestsToEnd.count > 0) {
                    console.log(`${contestsToEnd.count} contests ended (ONGOING → FINISHED)`);
                }
                if (contestsToOpenRegistration.count > 0) {
                    console.log(`${contestsToOpenRegistration.count} contests opened registration (UPCOMING → REGISTRATION_OPEN)`);
                }
            } else {
                console.log('No contest status updates needed');
            }

        } catch (error) {
            console.error('Error during contest status update:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Force a contest status update regardless of whether it's needed
     */
    static async forceUpdate(): Promise<void> {
        console.log('Forcing contest status update...');
        await this.performStatusUpdate();
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

/**
 * Initialize the contest scheduling system
 */
export async function initializeContestScheduler(): Promise<void> {
    try {
        console.log('Initializing contest scheduler...');
        
        // Start the contest status scheduler (check every 5 minutes)
        ContestScheduler.start(5);
        
        console.log('Contest scheduler initialized successfully');
    } catch (error) {
        console.error('Failed to initialize contest scheduler:', error);
        throw error;
    }
}

/**
 * Shutdown the contest scheduling system
 */
export function shutdownContestScheduler(): void {
    console.log('Shutting down contest scheduler...');
    ContestScheduler.stop();
    console.log('Contest scheduler shut down');
}