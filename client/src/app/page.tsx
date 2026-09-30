"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  Crown,
  Flame,
  Layers,
  Play,
  Radio,
  Sparkles,
  Swords,
  Terminal,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import { useAuthStore } from "@/lib/store/authStore"
import { useStatistics } from "@/hooks/useStatistics"
import { generateChallengeUrl } from "@/lib/challengeUtils"
import { UserAvatar } from "@/components/ui/UserAvatar"
import CountUp from "@/components/CountUp"
import { cn } from "@/lib/utils"

interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  createdAt: string;
  _count: {
    submissions: number;
  };
}

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  name?: string;
  image?: string;
  points: number;
  solved: number;
  level: number;
  streakDays: number;
}

/* ------------------------------------------------------------------ */
/*  Hero editor content                                                */
/* ------------------------------------------------------------------ */

type Token = [text: string, className?: string]

const K = "text-orange-400"   // keyword
const F = "text-white"    // function
const V = "text-gray-300"      // variable
const N = "text-orange-200"   // number
const C = "text-gray-500 italic" // comment

const codeLines: Token[][] = [
  [["# Two Sum — return indices of the pair", C]],
  [["def ", K], ["two_sum", F], ["(nums, target):"]],
  [["    seen ", V], ["= {}"]],
  [["    for ", K], ["i, n ", V], ["in ", K], ["enumerate", F], ["(nums):"]],
  [["        if ", K], ["target - n ", V], ["in ", K], ["seen:", V]],
  [["            return ", K], ["[seen[target - n], i]"]],
  [["        seen", V], ["[n] = i"]],
  [["    return ", K], ["[]"]],
  [[""]],
  [["print", F], ["(two_sum([", ""], ["2", N], [", ", ""], ["7", N], [", ", ""], ["11", N], ["], ", ""], ["9", N], ["))"]],
]

const totalChars = codeLines.reduce((sum, line) => sum + line.reduce((s, [t]) => s + t.length, 0) + 1, 0)

const TypedCode = ({ visible }: { visible: number }) => {
  let remaining = visible
  return (
    <>
      {codeLines.map((line, li) => {
        const lineLength = line.reduce((s, [t]) => s + t.length, 0)
        const lineVisible = remaining > 0
        const showCaret = remaining > 0 && remaining <= lineLength + 1
        const parts = line.map(([text, cls], ti) => {
          const shown = text.slice(0, Math.max(0, remaining))
          remaining -= text.length
          return shown ? <span key={ti} className={cls}>{shown}</span> : null
        })
        remaining -= 1 // newline
        return (
          <div key={li} className="flex min-h-[1.6em]">
            <span className="mr-4 w-5 shrink-0 select-none text-right text-gray-600">{li + 1}</span>
            <span className="whitespace-pre text-gray-200">
              {lineVisible && parts}
              {showCaret && <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-orange-400" />}
            </span>
          </div>
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const difficultyStyle = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "bg-foreground/5 text-foreground/80 ring-foreground/15"
    case "medium":
      return "bg-orange-500/10 text-orange-300 ring-orange-400/25"
    case "hard":
      return "bg-orange-500/20 text-orange-500 ring-orange-500/45"
    case "expert":
      return "bg-orange-500 text-white ring-orange-500"
    default:
      return "bg-muted text-muted-foreground ring-border"
  }
}

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

const SectionHeading = ({
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  icon: React.ComponentType<{ className?: string }>
  title: React.ReactNode
  subtitle?: string
  action?: React.ReactNode
}) => (
  <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="max-w-2xl">
      <span className="eyebrow mb-4">
        <Icon className="h-3.5 w-3.5" /> {eyebrow}
      </span>
      <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
    {action}
  </div>
)

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const Home = () => {
  const [typed, setTyped] = useState(0)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const { user } = useAuthStore()
  const { statistics } = useStatistics()

  const fetchChallenges = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/home`);
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      const data = await response.json();
      setChallenges(data);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

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

  // Typewriter for the hero editor
  useEffect(() => {
    const id = setInterval(() => {
      setTyped((prev) => {
        if (prev >= totalChars) {
          clearInterval(id)
          return prev
        }
        return prev + 1
      })
    }, 28)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard(); // initial fallback until the socket delivers data

    const wsUrl = `${(process.env.NEXT_PUBLIC_API_URL || '').replace(/^http/, 'ws')}/ws/leaderboard`;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'leaderboard') setLeaderboardData(msg.leaderboard || []);
        } catch {}
      };
      ws.onclose = () => {
        if (!closed) retry = setTimeout(connect, 3000);
      };
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  const doneTyping = typed >= totalChars
  const podium = leaderboardData.slice(0, 3)
  const restOfBoard = leaderboardData.slice(3, 10)

  const stats = [
    { label: "Coding battles", value: statistics?.codingBattles, icon: Swords },
    { label: "Active coders", value: statistics?.activeWarriors, icon: Users },
    { label: "Problems", value: statistics?.problemSet, icon: Code2 },
    { label: "Languages", value: statistics?.languages, icon: Terminal },
  ]

  return (
    <div className="relative overflow-x-clip">
      {/* ============================ HERO ============================ */}
      <section className="relative isolate">
        <div className="aurora -z-10" />
        <div className="bg-grid mask-fade-b absolute inset-0 -z-10" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-28">
          {/* Copy */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/contests"
              className="group mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-3 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Live
              </span>
              Contests are open, jump in
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <h1 className="text-[2.75rem] font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              Code. Compete.
              <br />
              <span className="text-gradient">Conquer.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              The coding arena built for students. Crack real interview-style problems, battle
              friends in live contests and watch your rank climb in real time.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={user ? "/challenges" : "/signup"} className="btn-brand !px-6 !py-3.5 !text-base">
                {user ? "Continue solving" : "Start for free"} <Swords className="h-4 w-4" />
              </Link>
              <Link href="/challenges" className="btn-ghost !px-6 !py-3.5 !text-base">
                <Play className="h-4 w-4 fill-current" /> Try a problem
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {(podium.length ? leaderboardData.slice(0, 5) : Array.from({ length: 5 })).map((p, i) => {
                  const player = p as LeaderboardUser | undefined
                  return (
                    <span
                      key={player?.id ?? i}
                      className="grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold uppercase text-white"
                    >
                      {player?.username?.charAt(0) ?? ""}
                    </span>
                  )
                })}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 font-semibold">
                  {statistics?.activeWarriors ? (
                    <><CountUp to={statistics.activeWarriors} separator="," />+ coders</>
                  ) : (
                    "A growing community of coders"
                  )}
                </div>
                <div className="text-muted-foreground">already battling on the leaderboard</div>
              </div>
            </div>
          </motion.div>

          {/* Editor mock */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-w-0 [perspective:1200px]"
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-orange-500/30 via-orange-600/10 to-orange-400/20 blur-3xl" />

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_40px_100px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/5">
              {/* Window chrome */}
              <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex gap-1 text-xs">
                  <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-gray-200">two_sum.py</span>
                  <span className="px-2.5 py-1 font-mono text-gray-500">tests</span>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                  EASY
                </span>
              </div>

              <div className="overflow-x-auto px-4 py-5 font-mono text-[12px] leading-[1.6] sm:text-sm">
                <TypedCode visible={typed} />
              </div>

              {/* Console */}
              <div className="border-t border-white/5 bg-black/30 px-4 py-3 font-mono text-xs">
                {doneTyping ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2"
                  >
                    <span className="inline-flex items-center gap-1.5 text-orange-400">
                      <CheckCircle2 className="h-4 w-4" /> 12/12 tests passed
                    </span>
                    <span className="text-gray-400">Runtime <span className="text-gray-200">48 ms</span></span>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-orange-500/15 px-2 py-0.5 font-semibold text-orange-300">
                      <Zap className="h-3 w-3" /> +120 XP
                    </span>
                  </motion.div>
                ) : (
                  <span className="inline-flex items-center gap-2 text-gray-500">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-orange-400" />
                    Waiting for you to hit run…
                  </span>
                )}
              </div>
            </div>

            {/* Floating chips */}
            <div className="surface absolute -left-4 bottom-24 hidden animate-float items-center gap-3 px-4 py-3 sm:flex md:-left-10">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/15 text-orange-500">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-bold">7-day streak</div>
                <div className="text-xs text-muted-foreground">Keep it burning</div>
              </div>
            </div>
            <div
              className="surface absolute -bottom-6 -right-2 hidden animate-float items-center gap-3 px-4 py-3 sm:flex md:-right-8"
              style={{ animationDelay: "-3s" }}
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/15 text-orange-500">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-bold">Rank #12 <span className="text-orange-500">↑4</span></div>
                <div className="text-xs text-muted-foreground">Global leaderboard</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================ STATS ============================ */}
      {statistics && (
      <section className="relative border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-border px-4 sm:px-6 md:grid-cols-4 md:divide-x lg:px-8">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="flex items-center gap-4 px-2 py-8 md:justify-center md:px-6"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="font-display text-3xl font-bold tabular-nums">
                  {typeof value === "number" ? <CountUp to={value} separator="," /> : "—"}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      )}

      {/* ============================ FEATURES ============================ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why students love it"
          icon={Sparkles}
          title={<>Everything you need to <span className="text-gradient">level up</span></>}
          subtitle="From your first easy problem to your first contest win, every solve earns you XP, streaks and a spot on the board."
        />

        <div className="grid gap-5 md:grid-cols-6">
          {/* Practice ladder */}
          <motion.div {...reveal} className="surface surface-hover p-7 md:col-span-4">
            <FeatureTitle icon={Layers} title="A practice ladder that actually scales" text="Four difficulty tiers across data structures, algorithms and more. Start easy, finish expert." />
            <div className="mt-8 grid grid-cols-4 items-end gap-3">
              {[
                { name: "Easy", h: "h-16", c: "from-gray-300/70 to-gray-400/15" },
                { name: "Medium", h: "h-24", c: "from-orange-300/80 to-orange-300/20" },
                { name: "Hard", h: "h-32", c: "from-orange-500/90 to-orange-500/30" },
                { name: "Expert", h: "h-40", c: "from-orange-600 to-orange-700/40" },
              ].map((tier) => (
                <div key={tier.name} className="flex flex-col items-center gap-2">
                  <div className={cn("w-full rounded-xl bg-gradient-to-t", tier.h, tier.c)} />
                  <span className="text-xs font-medium text-muted-foreground">{tier.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Live contests */}
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="surface surface-hover p-7 md:col-span-2">
            <FeatureTitle icon={Timer} title="Live contests" text="Timed battles against real people. Register, compete, flex the result." />
            <div className="mt-8 flex justify-center gap-2 font-display">
              {["02", "14", "37"].map((v, i) => (
                <React.Fragment key={i}>
                  <div className="grid h-16 w-14 place-items-center rounded-xl border border-border bg-muted/60 text-2xl font-bold tabular-nums">{v}</div>
                  {i < 2 && <span className="self-center text-xl font-bold text-muted-foreground">:</span>}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* Browser IDE */}
          <motion.div {...reveal} className="surface surface-hover p-7 md:col-span-2">
            <FeatureTitle icon={Terminal} title="IDE in your browser" text="No setup. Write, run and submit instantly in a sandboxed judge." />
            <div className="mt-7 flex flex-wrap gap-2">
              {["Python", "JavaScript", "Java", "C++"].map((lang) => (
                <span key={lang} className="rounded-lg border border-border bg-muted/60 px-3 py-1.5 font-mono text-xs font-medium">
                  {lang}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Streak heatmap */}
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="surface surface-hover p-7 md:col-span-4">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <FeatureTitle icon={Flame} title="Streaks, levels & a profile to brag about" text="Every day you solve keeps your streak alive. Your profile tracks it all, so share it with friends and recruiters." />
              <div className="grid shrink-0 grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
                {Array.from({ length: 98 }).map((_, i) => {
                  const v = (i * 37 + (i % 7) * 11) % 10
                  return (
                    <span
                      key={i}
                      className={cn(
                        "h-3 w-3 rounded-[3px]",
                        v > 7 ? "bg-orange-500" : v > 5 ? "bg-orange-500/60" : v > 3 ? "bg-orange-500/30" : "bg-muted"
                      )}
                    />
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="relative border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works" icon={Zap} title="From zero to leaderboard in three steps" />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { n: "01", title: "Pick a problem", text: "Filter by topic and difficulty, or join a live contest when you're feeling brave.", icon: Code2 },
              { n: "02", title: "Code & run", text: "Solve in the in-browser editor, run against sample tests, then submit to the judge.", icon: Terminal },
              { n: "03", title: "Climb the ranks", text: "Earn points for every accepted solution and watch the leaderboard update live.", icon: Trophy },
            ].map((step, i) => (
              <motion.div key={step.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="surface relative overflow-hidden p-7">
                <span className="absolute right-4 top-2 font-display text-7xl font-bold text-foreground/[0.04]">{step.n}</span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white shadow-lg">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ ACTIVE CHALLENGES ============================ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Fresh this week"
          icon={Zap}
          title="Active challenges"
          subtitle="New problems drop regularly. Solve them before the clock runs out."
          action={
            <Link href="/challenges" className="btn-ghost self-start md:self-auto">
              Browse all problems <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        {activeChallenges.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {activeChallenges.map((challenge, index) => (
              <motion.div key={challenge.id} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }}>
                <Link href={generateChallengeUrl(challenge.title)} className="surface surface-hover group flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset", difficultyStyle(challenge.difficulty))}>
                      {challenge.difficulty}
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-white">
                      <ArrowRight className="h-4 w-4 -rotate-45 transition-transform group-hover:rotate-0" />
                    </span>
                  </div>
                  <h3 className="mt-5 line-clamp-2 flex-1 text-lg font-semibold leading-snug">{challenge.title}</h3>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {challenge._count.submissions} submissions
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5" /> {challenge.timeLeft}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Code2} title="No active challenges" text="Check back soon, new problems are on the way." />
        )}
      </section>

      {/* ============================ LEADERBOARD ============================ */}
      <section className="relative border-t border-border">
        <div className="aurora -z-10 opacity-60" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Updated in real time"
            icon={Radio}
            title={<>The <span className="text-gradient">hall of fame</span></>}
            subtitle="The top coders on Code Battle Ground right now. Your name could be next."
            action={
              <Link href="/rankings" className="btn-ghost self-start md:self-auto">
                Full rankings <BarChart3 className="h-4 w-4" />
              </Link>
            }
          />

          {leaderboardData.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              {/* Podium */}
              <div className="grid grid-cols-3 items-end gap-3 sm:gap-5">
                {[podium[1], podium[0], podium[2]].map((player, i) => {
                  if (!player) return <div key={i} />
                  const place = player.rank
                  const tall = place === 1
                  return (
                    <motion.div key={player.id} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }}>
                      <Link href={`/profile/${player.username}`} className="group flex flex-col items-center text-center">
                        <div className="relative mb-3">
                          {tall && <Crown className="absolute -top-7 left-1/2 h-6 w-6 -translate-x-1/2 fill-amber-400 text-amber-400" />}
                          <UserAvatar
                            userId={player.id}
                            userName={player.name || player.username}
                            hasImage={!!player.image}
                            size={tall ? "xl" : "lg"}
                            showSkeleton={false}
                            className={cn("ring-4 ring-offset-2 ring-offset-background", place === 1 ? "ring-amber-400" : place === 2 ? "ring-gray-300" : "ring-orange-700")}
                          />
                        </div>
                        <div className="max-w-full truncate text-sm font-semibold group-hover:text-primary">{player.username}</div>
                        <div className="font-mono text-xs text-muted-foreground">{player.points.toLocaleString()} pts</div>
                        <div
                          className={cn(
                            "surface mt-4 flex w-full items-start justify-center rounded-b-none pt-4 font-display text-3xl font-bold",
                            place === 1 ? "h-40 text-amber-400" : place === 2 ? "h-28 text-gray-400" : "h-20 text-orange-600"
                          )}
                        >
                          {place}
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Rest of the board */}
              <div className="surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Coder</span>
                  <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" /> Live
                  </span>
                </div>
                {restOfBoard.length === 0 && (
                  <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                    <Trophy className="h-6 w-6 text-primary" />
                    <p className="text-sm font-semibold">Spots #{leaderboardData.length + 1}–#10 are up for grabs</p>
                    <Link href="/challenges" className="text-sm text-primary hover:underline">Solve a problem to claim one →</Link>
                  </div>
                )}
                {restOfBoard.map((player) => (
                  <Link
                    key={player.id}
                    href={`/profile/${player.username}`}
                    className="flex items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <span className="w-6 font-mono text-sm text-muted-foreground">{player.rank}</span>
                    <UserAvatar userId={player.id} userName={player.name || player.username} hasImage={!!player.image} size="sm" showSkeleton={false} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{player.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.solved} solved{player.streakDays > 0 && <> · 🔥 {player.streakDays}d</>}
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-primary">{player.points.toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={Users} title="No warriors yet" text="Be the first to claim the top spot." />
          )}
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="relative overflow-hidden rounded-3xl bg-brand px-6 py-16 text-center text-white sm:px-16">
          <div className="bg-grid absolute inset-0 opacity-20 [--grid-line:rgb(255_255_255/0.25)]" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-black/50 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-5xl">Your next solve is one click away.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Join free, pick a problem and start stacking XP today. No setup, no credit card, just code.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={user ? "/challenges" : "/signup"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-gray-900 shadow-xl transition-transform hover:-translate-y-0.5"
              >
                {user ? "Solve a problem" : "Create free account"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contests"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 font-semibold backdrop-blur transition-colors hover:bg-white/20"
              >
                <Trophy className="h-4 w-4" /> View contests
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

const FeatureTitle = ({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) => (
  <div>
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </span>
    <h3 className="mt-4 text-xl font-semibold">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
  </div>
)

const EmptyState = ({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) => (
  <div className="surface flex flex-col items-center px-6 py-16 text-center">
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
      <Icon className="h-7 w-7" />
    </span>
    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
  </div>
)

export default Home
