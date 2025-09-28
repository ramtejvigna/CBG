import { PrismaClient, Difficulty, ChallengeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed process...');

    // Create programming languages
    console.log('Creating programming languages...');
    const languageData = [
        { name: 'JavaScript', percentage: 85.2 },
        { name: 'Python', percentage: 78.9 },
        { name: 'Java', percentage: 76.3 },
        { name: 'C++', percentage: 71.5 },
        { name: 'SQL', percentage: 69.8 }
    ];

    const languages = [];
    for (const lang of languageData) {
        const existingLang = await prisma.language.findFirst({
            where: { name: lang.name }
        });

        if (existingLang) {
            languages.push(existingLang);
        } else {
            const newLang = await prisma.language.create({
                data: lang
            });
            languages.push(newLang);
        }
    }

    // Create challenge categories
    console.log('Creating challenge categories...');
    const categories = await Promise.all([
        prisma.challengeCategory.upsert({
            where: { name: 'Algorithms' },
            update: {},
            create: {
                name: 'Algorithms',
                description: 'Algorithmic problem solving and optimization challenges'
            }
        }),
        prisma.challengeCategory.upsert({
            where: { name: 'Data Structures' },
            update: {},
            create: {
                name: 'Data Structures',
                description: 'Challenges involving arrays, trees, graphs, and other data structures'
            }
        }),
        prisma.challengeCategory.upsert({
            where: { name: 'Databases' },
            update: {},
            create: {
                name: 'Databases',
                description: 'SQL queries, database design, and optimization challenges'
            }
        })
    ]);

    // Create a demo user for challenge creation
    console.log('Creating demo user...');
    const demoUser = await prisma.user.upsert({
        where: { email: 'admin@cbg.com' },
        update: {},
        create: {
            email: 'admin@cbg.com',
            username: 'cbg_admin',
            name: 'CBG Admin',
            role: 'ADMIN',
            password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVyVzDhV.xwO0tW', // hashed 'password123'
            userProfile: {
                create: {
                    solved: 0,
                    preferredLanguage: 'JavaScript',
                    level: 1,
                    points: 0,
                    streakDays: 0
                }
            }
        }
    });

    // Create Algorithm Challenges
    console.log('Creating algorithm challenges...');
    const algorithmChallenges = [
        {
            title: 'Two Sum',
            description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
- Input: nums = [2,7,11,15], target = 9
- Output: [0,1]
- Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
- Input: nums = [3,2,4], target = 6
- Output: [1,2]

**Example 3:**
- Input: nums = [3,3], target = 6
- Output: [0,1]`,
            difficulty: Difficulty.EASY,
            points: 100,
            challengeType: ChallengeType.ALGORITHM,
            categoryId: categories[0].id,
            timeLimit: 60,
            memoryLimit: 256,
            testCases: [
                {
                    input: '[2,7,11,15]\n9',
                    output: '[0,1]',
                    explanation: 'nums[0] + nums[1] = 2 + 7 = 9'
                },
                {
                    input: '[3,2,4]\n6',
                    output: '[1,2]',
                    explanation: 'nums[1] + nums[2] = 2 + 4 = 6'
                },
                {
                    input: '[3,3]\n6',
                    output: '[0,1]',
                    explanation: 'nums[0] + nums[1] = 3 + 3 = 6'
                }
            ]
        },
        {
            title: 'Binary Search',
            description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

**Example 1:**
- Input: nums = [-1,0,3,5,9,12], target = 9
- Output: 4
- Explanation: 9 exists in nums and its index is 4

**Example 2:**
- Input: nums = [-1,0,3,5,9,12], target = 2
- Output: -1
- Explanation: 2 does not exist in nums so return -1`,
            difficulty: Difficulty.EASY,
            points: 150,
            challengeType: ChallengeType.ALGORITHM,
            categoryId: categories[0].id,
            timeLimit: 45,
            memoryLimit: 256,
            testCases: [
                {
                    input: '[-1,0,3,5,9,12]\n9',
                    output: '4',
                    explanation: '9 exists in nums and its index is 4'
                },
                {
                    input: '[-1,0,3,5,9,12]\n2',
                    output: '-1',
                    explanation: '2 does not exist in nums'
                },
                {
                    input: '[5]\n5',
                    output: '0',
                    explanation: '5 exists at index 0'
                }
            ]
        },
        {
            title: 'Merge Intervals',
            description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

**Example 1:**
- Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
- Output: [[1,6],[8,10],[15,18]]
- Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].

**Example 2:**
- Input: intervals = [[1,4],[4,5]]
- Output: [[1,5]]
- Explanation: Intervals [1,4] and [4,5] are considered overlapping.`,
            difficulty: Difficulty.MEDIUM,
            points: 250,
            challengeType: ChallengeType.ALGORITHM,
            categoryId: categories[0].id,
            timeLimit: 90,
            memoryLimit: 512,
            testCases: [
                {
                    input: '[[1,3],[2,6],[8,10],[15,18]]',
                    output: '[[1,6],[8,10],[15,18]]',
                    explanation: 'Overlapping intervals [1,3] and [2,6] are merged'
                },
                {
                    input: '[[1,4],[4,5]]',
                    output: '[[1,5]]',
                    explanation: 'Adjacent intervals are merged'
                },
                {
                    input: '[[1,4],[2,3]]',
                    output: '[[1,4]]',
                    explanation: 'One interval contains another'
                }
            ]
        }
    ];

    // Create Data Structure Challenges
    console.log('Creating data structure challenges...');
    const dataStructureChallenges = [
        {
            title: 'Valid Parentheses',
            description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
- Input: s = "()"
- Output: true

**Example 2:**
- Input: s = "()[]{}"
- Output: true

**Example 3:**
- Input: s = "(]"
- Output: false`,
            difficulty: Difficulty.EASY,
            points: 120,
            challengeType: ChallengeType.DATA_STRUCTURE,
            categoryId: categories[1].id,
            timeLimit: 30,
            memoryLimit: 256,
            testCases: [
                {
                    input: '"()"',
                    output: 'true',
                    explanation: 'Valid parentheses pair'
                },
                {
                    input: '"()[]{}"',
                    output: 'true',
                    explanation: 'All brackets are properly matched'
                },
                {
                    input: '"(]"',
                    output: 'false',
                    explanation: 'Mismatched bracket types'
                },
                {
                    input: '"([)]"',
                    output: 'false',
                    explanation: 'Brackets not closed in correct order'
                }
            ]
        },
        {
            title: 'Binary Tree Maximum Depth',
            description: `Given the root of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

**Example 1:**
- Input: root = [3,9,20,null,null,15,7]
- Output: 3

**Example 2:**
- Input: root = [1,null,2]
- Output: 2`,
            difficulty: Difficulty.EASY,
            points: 180,
            challengeType: ChallengeType.DATA_STRUCTURE,
            categoryId: categories[1].id,
            timeLimit: 45,
            memoryLimit: 256,
            testCases: [
                {
                    input: '[3,9,20,null,null,15,7]',
                    output: '3',
                    explanation: 'Maximum depth is 3 levels'
                },
                {
                    input: '[1,null,2]',
                    output: '2',
                    explanation: 'Maximum depth is 2 levels'
                },
                {
                    input: '[]',
                    output: '0',
                    explanation: 'Empty tree has depth 0'
                }
            ]
        },
        {
            title: 'LRU Cache',
            description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
- int get(int key) Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.

**Example:**
Input: ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
Output: [null, null, null, 1, null, -1, null, -1, 3, 4]`,
            difficulty: Difficulty.MEDIUM,
            points: 300,
            challengeType: ChallengeType.DATA_STRUCTURE,
            categoryId: categories[1].id,
            timeLimit: 120,
            memoryLimit: 512,
            testCases: [
                {
                    input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
                    output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
                    explanation: 'LRU cache operations with capacity 2'
                }
            ]
        }
    ];

    // Create Database Challenges
    console.log('Creating database challenges...');
    const databaseChallenges = [
        {
            title: 'Find All Customers',
            description: `Given a table Customers with the following structure:

| Column Name | Type    |
|-------------|---------|
| id          | int     |
| name        | varchar |
| email       | varchar |
| city        | varchar |

Write a SQL query to find all customers from a specific city.

**Example:**
Table: Customers
| id | name  | email           | city      |
|----|-------|-----------------|-----------|
| 1  | Alice | alice@email.com | New York  |
| 2  | Bob   | bob@email.com   | London    |
| 3  | Carol | carol@email.com | New York  |

Query should return all customers from 'New York'.`,
            difficulty: Difficulty.EASY,
            points: 100,
            challengeType: null, // Database challenges might not use ChallengeType enum
            categoryId: categories[2].id,
            timeLimit: 30,
            memoryLimit: 128,
            testCases: [
                {
                    input: "SELECT * FROM Customers WHERE city = 'New York'",
                    output: '| id | name  | email           | city      |\n| 1  | Alice | alice@email.com | New York  |\n| 3  | Carol | carol@email.com | New York  |',
                    explanation: 'Returns all customers from New York'
                }
            ]
        },
        {
            title: 'Employee Salary Analysis',
            description: `Given a table Employees with the following structure:

| Column Name | Type    |
|-------------|---------|
| id          | int     |
| name        | varchar |
| department  | varchar |
| salary      | int     |

Write a SQL query to find the average salary by department and only show departments with an average salary greater than 50000.

**Example:**
Table: Employees
| id | name  | department | salary |
|----|-------|------------|--------|
| 1  | Alice | IT         | 60000  |
| 2  | Bob   | IT         | 55000  |
| 3  | Carol | HR         | 45000  |
| 4  | David | HR         | 48000  |

The query should group by department and filter results.`,
            difficulty: Difficulty.MEDIUM,
            points: 200,
            challengeType: null,
            categoryId: categories[2].id,
            timeLimit: 60,
            memoryLimit: 256,
            testCases: [
                {
                    input: 'SELECT department, AVG(salary) as avg_salary FROM Employees GROUP BY department HAVING AVG(salary) > 50000',
                    output: '| department | avg_salary |\n| IT         | 57500      |',
                    explanation: 'Only IT department has average salary > 50000'
                }
            ]
        },
        {
            title: 'Complex Join Query',
            description: `Given three tables:

**Orders:**
| Column Name | Type    |
|-------------|---------|
| id          | int     |
| customer_id | int     |
| product_id  | int     |
| quantity    | int     |
| order_date  | date    |

**Customers:**
| Column Name | Type    |
|-------------|---------|
| id          | int     |
| name        | varchar |
| email       | varchar |

**Products:**
| Column Name | Type    |
|-------------|---------|
| id          | int     |
| name        | varchar |
| price       | decimal |

Write a SQL query to find the total revenue per customer, including customer name and email, for orders placed in the last 30 days. Order results by revenue in descending order.`,
            difficulty: Difficulty.HARD,
            points: 350,
            challengeType: null,
            categoryId: categories[2].id,
            timeLimit: 90,
            memoryLimit: 512,
            testCases: [
                {
                    input: `SELECT c.name, c.email, SUM(o.quantity * p.price) as total_revenue 
FROM Orders o 
JOIN Customers c ON o.customer_id = c.id 
JOIN Products p ON o.product_id = p.id 
WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
GROUP BY c.id, c.name, c.email 
ORDER BY total_revenue DESC`,
                    output: '| name  | email           | total_revenue |\n| Alice | alice@email.com | 1250.00       |\n| Bob   | bob@email.com   | 850.00        |',
                    explanation: 'Revenue calculation with multi-table joins and date filtering'
                }
            ]
        }
    ];

    // Create all challenges
    const allChallenges = [...algorithmChallenges, ...dataStructureChallenges, ...databaseChallenges];

    for (const challengeData of allChallenges) {
        console.log(`Creating challenge: ${challengeData.title}`);

        const existingChallenge = await prisma.challenge.findFirst({
            where: { title: challengeData.title }
        });

        if (!existingChallenge) {
            await prisma.challenge.create({
                data: {
                    title: challengeData.title,
                    description: challengeData.description,
                    difficulty: challengeData.difficulty,
                    points: challengeData.points,
                    challengeType: challengeData.challengeType,
                    categoryId: challengeData.categoryId,
                    timeLimit: challengeData.timeLimit,
                    memoryLimit: challengeData.memoryLimit,
                    creatorId: demoUser.id,
                    languages: {
                        connect: languages.slice(0, 3).map(lang => ({ id: lang.id })) // Connect first 3 languages
                    },
                    testCases: {
                        create: challengeData.testCases.map((testCase, index) => ({
                            input: testCase.input,
                            output: testCase.output,
                            explanation: testCase.explanation,
                            isHidden: index > 2 // Make test cases after the first 3 hidden
                        }))
                    }
                }
            });
        }
    }

    console.log('✅ Seed process completed successfully!');
    console.log(`Created ${categories.length} categories`);
    console.log(`Created ${languages.length} languages`);
    console.log(`Created ${allChallenges.length} challenges`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seed process:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });