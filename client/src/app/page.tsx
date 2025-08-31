"use client"

import React, { useState, useEffect } from "react"
import {
  Code,
  Flame,
  Swords,
  Trophy,
  Users,
  Clock,
  Zap,
  Terminal,
  ArrowRight,
  BookOpen,
  Github,
  Award,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import Link from "next/link"

const Home = () => {
  const [currentChallenge, setCurrentChallenge] = useState(0)
  const [codeTyped, setCodeTyped] = useState("")
  const [cursor, setCursor] = useState(true)
  const { theme } = useTheme()
  const { user } = useAuth()

  const exampleCode = `function findWinner(scores) {\n  return scores\n    .sort((a, b) => b.points - a.points)\n    .map(player => player.name)[0];\n}`

  // --- Static challenges ---
  const challenges = [
    {
      title: "Binary Search Tree Traversal",
      difficulty: "Medium",
      participants: 124,
      createdAt: new Date().toISOString(),
    },
    {
      title: "Dynamic Programming: Knapsack",
      difficulty: "Hard",
      participants: 88,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      title: "String Anagram Checker",
      difficulty: "Easy",
      participants: 201,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      title: "Graph Cycle Detection",
      difficulty: "Medium",
      participants: 95,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ]

  const activeChallenges = challenges.map((challenge) => {
    const createdDate: Date = new Date(challenge.createdAt)
    const now: Date = new Date()
    const daysDiff: number = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const timeLeft: string =
      daysDiff < 1
        ? `${23 - now.getHours()}h ${59 - now.getMinutes()}m`
        : `${Math.max(7 - daysDiff, 1)}d ${23 - now.getHours()}h`

    return { ...challenge, timeLeft }
  })

  // --- Static leaderboard ---
  const leaderboard = [
    { rank: 1, user: { username: "Alice" }, points: 2000, badge: "🏆" },
    { rank: 2, user: { username: "Bob" }, points: 1800, badge: "🥈" },
    { rank: 3, user: { username: "Charlie" }, points: 1600, badge: "🥉" },
    { rank: 4, user: { username: "David" }, points: 1400, badge: "⭐" },
    { rank: 5, user: { username: "Eva" }, points: 1200, badge: "⭐" },
    { rank: 6, user: { username: "Frank" }, points: 1000, badge: "⭐" },
  ]

  useEffect(() => {
    let i = 0
    const typeEffect = setInterval(() => {
      if (i < exampleCode.length) {
        setCodeTyped(exampleCode.substring(0, i + 1))
        i++
      } else {
        clearInterval(typeEffect)
      }
    }, 50)

    const cursorEffect = setInterval(() => {
      setCursor((prev) => !prev)
    }, 500)

    const challengeRotation = setInterval(() => {
      setCurrentChallenge((prev) => (prev + 1) % activeChallenges.length)
    }, 5000)

    return () => {
      clearInterval(typeEffect)
      clearInterval(cursorEffect)
      clearInterval(challengeRotation)
    }
  }, [activeChallenges.length, exampleCode])

  return (
    <div className={`${theme === "dark" && "bg-gray-900 text-gray-200"} min-h-screen `}>
      <div className="pt-12 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center mb-4">
              <Flame className="text-orange-500 mr-2 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-600 text-transparent bg-clip-text">
                ONGOING TOURNAMENT
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Prove Your{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 text-transparent bg-clip-text">
                Coding Skills
              </span>{" "}
              in Real Battles
            </h1>

            <p className="text-gray-400 mb-6">
              Compete against the best coders, solve challenging problems, and climb the leaderboard
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={user ? "/challenge" : "/signup"}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-semibold flex items-center gap-2 transition-transform hover:translate-y-[-2px] shadow-lg shadow-orange-900/30"
              >
                Join Battle <Swords className="w-4 h-4" />
              </Link>
              <Link // Link to the practice page (if available, otherwise /challenge)
                href="/challenge"
                className={`px-6 py-3 ${theme === "dark" && "bg-gray-800"} border border-gray-700 rounded-lg font-semibold flex items-center gap-2 transition-all hover:bg-gray-750 hover:border-orange-500`}
              >
                Practice Now <Terminal className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mock Coding Environment Section */}
          <div className="relative w-full max-w-md mx-auto md:max-w-none">
            {/* Background Blobs/Shapes */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>

            <div className={`relative ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"} rounded-xl p-4 shadow-xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-500/20`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-150"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-300"></div>
                </div>
                <span className="text-xs font-mono text-gray-500">main.js</span>
              </div>
              <div className={`font-mono text-sm p-4 rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
                <pre className="text-green-500">{`// Find the winner with highest points`}</pre>
                <pre className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  <span className="text-blue-400">function</span> <span className="text-yellow-400">findWinner</span>(<span className="text-red-400">scores</span>) {"{"}
                  <br />
                  {"  "}
                  <span className="text-blue-400">return</span> <span className="text-red-400">scores</span>
                  <br />
                  {"    ."}
                  <span className="text-yellow-400">sort</span>((<span className="text-green-400">a</span>, <span className="text-green-400">b</span>) {"=>"} <span className="text-green-400">b</span>.<span className="text-white">points</span> - <span className="text-green-400">a</span>.<span className="text-white">points</span>)
                  <br />
                  {"    ."}
                  <span className="text-yellow-400">map</span>(<span className="text-blue-400">player</span> {"=>"} <span className="text-blue-400">player</span>.<span className="text-white">name</span>)
                  <br />
                  {"    ["}<span className="text-purple-400">0</span>{"];"}
                  <br />
                  {"}"}
                  <br />
                </pre>
                <pre className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  <span className="text-purple-400">console</span>.<span className="text-yellow-400">log</span>(
                  <span className="text-yellow-400">findWinner</span>([{'{'} name: <span className="text-green-400">'Alice'</span>, points: <span className="text-purple-400">1500</span> {'}'}, {'{'} name: <span className="text-green-400">'Bob'</span>, points: <span className="text-purple-400">2000</span> {'}'}, {'{'} name: <span className="text-green-400">'Charlie'</span>, points: <span className="text-purple-400">1800</span> {'}'}]));
                  <br />
                  <span className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    {codeTyped.substring(exampleCode.length)}
                    <span className={`${cursor ? "opacity-100" : "opacity-0"} transition-opacity duration-100`}>|</span>
                  </span>
                </pre>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 top-10 -right-10 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
      
      {/* Active Challenges Section */}
      <div className={`py-16 ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50/50"}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center">
              <Zap className="text-yellow-500 mr-2" />
              Active Challenges
            </h2>
            <Link href="/challenge">
              <button className="text-orange-500 flex items-center hover:text-orange-400 transition-colors">
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeChallenges.map((challenge, index) => (
              <div
                key={index}
                className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-400"} border  rounded-lg p-4 transition-all duration-300 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-900/20 ${index === currentChallenge ? "border-orange-500 shadow-lg shadow-orange-900/20 scale-105" : ""
                  }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${challenge.difficulty === "Hard"
                      ? "bg-red-500/20 text-red-400"
                      : challenge.difficulty === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-purple-500/20 text-purple-400"}`}
                  >
                    {challenge.difficulty}
                  </span>
                  <Code className="text-gray-500" />
                </div>

                <h3 className="font-bold text-lg mb-3">{challenge.title}</h3>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {challenge.participants}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {challenge.timeLeft}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center">
            <Trophy className="text-yellow-500 mr-2" />
            Global Leaderboard
          </h2>
          <button className="text-orange-500 flex items-center hover:text-orange-400 transition-colors">
            Complete Rankings <ArrowRight className="ml-1 w-4 h-4" />
          </button>
        </div>

        <div
          className={`${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-400/50"} rounded-xl overflow-hidden`}
        >
          <table className="w-full">
            <thead>
              <tr
                className={`${theme === "dark" ? "bg-gray-800/70 border border-gray-700" : "bg-white border border-gray-400/50"} text-left`}
              >
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Warrior</th>
                <th className="py-4 px-6">Points</th>
                <th className="py-4 px-6 text-right">Badge</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr
                  key={index}
                  className={`border-t border-gray-700 hover:bg-gray-750 transition-colors`}
                >
                  <td className="py-4 px-6 font-mono">{player.rank}</td>
                  <td className="py-4 px-6 font-semibold">{player.user.username}</td>
                  <td className="py-4 px-6 text-orange-400 font-mono">{player.points.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right">{player.badge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Home
