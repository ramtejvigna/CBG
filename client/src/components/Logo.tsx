import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    /** Hide the wordmark and show only the mark */
    compact?: boolean;
    href?: string | null;
}

export const LogoMark = ({ className }: { className?: string }) => (
    <span
        className={cn(
            "relative grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_24px_-8px_rgb(var(--glow-ember)/0.8)]",
            className
        )}
    >
        <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]" aria-hidden>
            <path d="M8.5 7 4 12l4.5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 7 20 12l-4.5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.2 5.5 10.8 18.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
    </span>
);

const Logo = ({ className, compact = false, href = "/" }: LogoProps) => {
    const content = (
        <span className={cn("group inline-flex items-center gap-2.5 select-none", className)}>
            {/* <LogoMark className="transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105" /> */}
            {!compact && (
                <span className="font-display text-[17px] font-bold leading-none tracking-tight text-foreground">
                    CodeBattle<span className="text-gradient">Ground</span>
                </span>
            )}
        </span>
    );

    if (href === null) return content;

    return (
        <Link href={href} aria-label="Code Battle Ground home" className="inline-flex shrink-0">
            {content}
        </Link>
    );
};

export default Logo;
