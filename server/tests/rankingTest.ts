import { PrismaClient } from '@prisma/client';
import { RankingSystem } from '../src/lib/rankingSystem.js';

const prisma = new PrismaClient();

async function testRankingSystem() {
    console.log('🧪 Testing Ranking System...\n');

    try {
        // 1. Test initial rank calculation
        console.log('1. Testing initial rank calculation...');
        await RankingSystem.updateAllUserRanks();
        console.log('✅ Initial rank calculation completed\n');

        // 2. Test leaderboard retrieval
        console.log('2. Testing leaderboard retrieval...');
        const leaderboard = await RankingSystem.getLeaderboard(5);
        console.log(`✅ Retrieved top ${leaderboard.length} users:`);
        leaderboard.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.user.username} - Rank: ${user.rank}, Points: ${user.points}`);
        });
        console.log('');

        // 3. Test individual user rank info
        if (leaderboard.length > 0) {
            const topUser = leaderboard[0];
            console.log('3. Testing individual user rank info...');
            const rankInfo = await RankingSystem.getUserRankInfo(topUser.user.id);
            if (rankInfo) {
                console.log(`✅ User ${rankInfo.user.username}:`);
                console.log(`   Rank: ${rankInfo.rank}`);
                console.log(`   Points: ${rankInfo.points}`);
                console.log(`   Percentile: ${rankInfo.percentile}%`);
                console.log(`   Total users: ${rankInfo.totalUsers}`);
            }
            console.log('');
        }

        // 4. Test rank consistency check
        console.log('4. Testing rank consistency...');
        const needsUpdate = await RankingSystem.isFullRankUpdateNeeded();
        console.log(`✅ Rank consistency check: ${needsUpdate ? 'Update needed' : 'Ranks are consistent'}\n`);

        // 5. Verify database state
        console.log('5. Verifying database state...');
        const totalUsers = await prisma.userProfile.count({
            where: { user: { role: 'USER' } }
        });
        const rankedUsers = await prisma.userProfile.count({
            where: { 
                user: { role: 'USER' },
                rank: { not: null }
            }
        });
        console.log(`✅ Total users: ${totalUsers}, Ranked users: ${rankedUsers}`);

        // Check for rank gaps or duplicates
        const ranks = await prisma.userProfile.findMany({
            where: { 
                user: { role: 'USER' },
                rank: { not: null }
            },
            select: { rank: true },
            orderBy: { rank: 'asc' }
        });

        let hasGaps = false;
        let hasDuplicates = false;
        const rankNumbers = ranks.map(r => r.rank!);
        
        for (let i = 0; i < rankNumbers.length; i++) {
            if (i > 0 && rankNumbers[i] !== rankNumbers[i-1] + 1) {
                if (rankNumbers[i] === rankNumbers[i-1]) {
                    hasDuplicates = true;
                } else {
                    hasGaps = true;
                }
            }
        }

        if (!hasGaps && !hasDuplicates && rankNumbers.length > 0 && rankNumbers[0] === 1) {
            console.log('✅ Ranks are sequential and correct (1, 2, 3, ...)');
        } else {
            console.log(`❌ Rank issues detected - Gaps: ${hasGaps}, Duplicates: ${hasDuplicates}`);
        }

        console.log('\n🎉 Ranking system test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testRankingSystem();