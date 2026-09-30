"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { CalendarDays, Flame, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapDay {
    date: string; // YYYY-MM-DD (UTC)
    count: number;
    accepted: number;
}

interface HeatmapData {
    days: HeatmapDay[];
    totalSubmissions: number;
    activeDays: number;
    currentStreak: number;
    maxStreak: number;
}

const MIN_CELL = 11;
const MAX_CELL = 18;
const LABEL_WIDTH = 34;
const WEEK_COLUMNS = 53;
const GAP = 3;
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const LEVEL_CLASSES = [
    "bg-muted",
    "bg-orange-500/25",
    "bg-orange-500/50",
    "bg-orange-500/75",
    "bg-orange-500",
];

const parseDay = (date: string) => new Date(`${date}T00:00:00Z`);

const formatDay = (date: string) =>
    parseDay(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const levelFor = (count: number, max: number) => {
    if (count === 0 || max === 0) return 0;
    return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
};

export default function StreakHeatmap({ username }: { username: string }) {
    const [data, setData] = useState<HeatmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
    const [cell, setCell] = useState(MIN_CELL);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${username}/heatmap`);
                if (!response.ok) throw new Error("Failed to load heatmap");
                const json: HeatmapData = await response.json();
                if (!cancelled) setData(json);
            } catch (err) {
                console.error("Failed to fetch heatmap:", err);
                if (!cancelled) setFailed(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [username]);

    // Weeks run Sunday → Saturday; pad the first week so rows line up with weekdays.
    const { weeks, monthLabels, max } = useMemo(() => {
        const days = data?.days ?? [];
        if (days.length === 0) return { weeks: [] as (HeatmapDay | null)[][], monthLabels: [] as { index: number; label: string }[], max: 0 };

        const leading = parseDay(days[0].date).getUTCDay();
        const cells: (HeatmapDay | null)[] = [...Array(leading).fill(null), ...days];
        const weeks: (HeatmapDay | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

        const monthLabels: { index: number; label: string }[] = [];
        let lastMonth = -1;
        weeks.forEach((week, index) => {
            const first = week.find(Boolean);
            if (!first) return;
            const month = parseDay(first.date).getUTCMonth();
            if (month !== lastMonth) {
                // Skip a label that would collide with the previous one
                if (!monthLabels.length || index - monthLabels[monthLabels.length - 1].index >= 3) {
                    monthLabels.push({
                        index,
                        label: parseDay(first.date).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
                    });
                }
                lastMonth = month;
            }
        });

        return { weeks, monthLabels, max: Math.max(...days.map((d) => d.count)) };
    }, [data]);

    // Grow cells to fill the card on wide screens; scroll horizontally below the minimum size
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const measure = () => {
            const fit = Math.floor((el.clientWidth - LABEL_WIDTH) / WEEK_COLUMNS) - GAP;
            setCell(Math.max(MIN_CELL, Math.min(MAX_CELL, fit)));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [failed]);

    // Show the most recent weeks first on narrow screens
    useEffect(() => {
        const el = scrollerRef.current;
        if (el) el.scrollLeft = el.scrollWidth;
    }, [weeks.length, cell]);

    const showTooltip = (event: MouseEvent<HTMLElement>, day: HeatmapDay) => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const box = wrapper.getBoundingClientRect();
        const noun = day.count === 1 ? "submission" : "submissions";
        const text =
            day.count === 0
                ? `No submissions on ${formatDay(day.date)}`
                : `${day.count} ${noun} (${day.accepted} accepted) on ${formatDay(day.date)}`;
        setTooltip({ x: rect.left - box.left + rect.width / 2, y: rect.top - box.top, text });
    };

    const today = data?.days[data.days.length - 1];
    const streakAtRisk = !!data && data.currentStreak > 0 && today?.count === 0;

    const stats = [
        { label: "Submissions this year", value: data?.totalSubmissions ?? 0, icon: Zap },
        { label: "Active days", value: data?.activeDays ?? 0, icon: CalendarDays },
        { label: "Current streak", value: `${data?.currentStreak ?? 0}d`, icon: Flame, highlight: true },
        { label: "Longest streak", value: `${data?.maxStreak ?? 0}d`, icon: Trophy },
    ];

    return (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                        <Flame className="h-5 w-5 text-orange-500" /> Streak map
                    </h2>
                    <p className="text-sm text-muted-foreground">Your coding activity over the past year</p>
                </div>
                {streakAtRisk && (
                    <p className="text-sm font-medium text-orange-500">
                        Solve a problem today to keep your {data!.currentStreak}-day streak alive 🔥
                    </p>
                )}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map(({ label, value, icon: Icon, highlight }) => (
                    <div
                        key={label}
                        className={cn(
                            "rounded-xl border px-4 py-3",
                            highlight ? "border-orange-500/40 bg-orange-500/10" : "border-border bg-muted/40"
                        )}
                    >
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon className={cn("h-3.5 w-3.5", highlight && "text-orange-500")} />
                            {label}
                        </div>
                        <div className={cn("mt-1 font-display text-2xl font-bold tabular-nums", highlight && "text-orange-500")}>
                            {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : value}
                        </div>
                    </div>
                ))}
            </div>

            {failed ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Couldn&apos;t load activity right now.</p>
            ) : (
                <div ref={wrapperRef} className="relative" onMouseLeave={() => setTooltip(null)}>
                    <div ref={scrollerRef} className="overflow-x-auto pb-2">
                        <div className="inline-flex gap-2">
                            {/* Weekday labels */}
                            <div className="flex shrink-0 flex-col pt-5" style={{ gap: GAP, width: LABEL_WIDTH - 8 }}>
                                {WEEKDAY_LABELS.map((label, i) => (
                                    <span key={i} className="pr-1 text-[10px] leading-none text-muted-foreground" style={{ height: cell, lineHeight: `${cell}px` }}>
                                        {label}
                                    </span>
                                ))}
                            </div>

                            <div>
                                {/* Month labels */}
                                <div className="relative mb-1.5 h-3.5">
                                    {monthLabels.map(({ index, label }) => (
                                        <span
                                            key={`${label}-${index}`}
                                            className="absolute text-[10px] leading-none text-muted-foreground"
                                            style={{ left: index * (cell + GAP) }}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                {/* Cells */}
                                <div className="flex" style={{ gap: GAP }}>
                                    {loading
                                        ? Array.from({ length: 53 }).map((_, w) => (
                                              <div key={w} className="flex flex-col" style={{ gap: GAP }}>
                                                  {Array.from({ length: 7 }).map((_, d) => (
                                                      <span key={d} className="animate-pulse rounded-[3px] bg-muted" style={{ width: cell, height: cell }} />
                                                  ))}
                                              </div>
                                          ))
                                        : weeks.map((week, w) => (
                                              <div key={w} className="flex flex-col" style={{ gap: GAP }}>
                                                  {week.map((day, d) =>
                                                      day ? (
                                                          <span
                                                              key={day.date}
                                                              role="img"
                                                              aria-label={`${day.count} submissions on ${formatDay(day.date)}`}
                                                              onMouseEnter={(e) => showTooltip(e, day)}
                                                              className={cn(
                                                                  "rounded-[3px] ring-orange-300 transition-transform hover:scale-125 hover:ring-1",
                                                                  LEVEL_CLASSES[levelFor(day.count, max)],
                                                                  day === today && "ring-1 ring-foreground/40"
                                                              )}
                                                              style={{ width: cell, height: cell }}
                                                          />
                                                      ) : (
                                                          <span key={`pad-${d}`} style={{ width: cell, height: cell }} />
                                                      )
                                                  )}
                                              </div>
                                          ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {tooltip && (
                        <div
                            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-xl"
                            style={{ left: tooltip.x, top: tooltip.y - 6 }}
                        >
                            {tooltip.text}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                        Less
                        {LEVEL_CLASSES.map((cls) => (
                            <span key={cls} className={cn("rounded-[3px]", cls)} style={{ width: MIN_CELL, height: MIN_CELL }} />
                        ))}
                        More
                    </div>
                </div>
            )}
        </section>
    );
}
