"use client";

import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Heart, ArrowUpRight } from 'lucide-react';
import Logo from '@/components/Logo';

const columns = [
    {
        title: 'Practice',
        links: [
            { name: 'Problems', href: '/challenges' },
            { name: 'Contests', href: '/contests' },
            { name: 'Rankings', href: '/rankings' },
        ],
    },
    {
        title: 'Community',
        links: [
            { name: 'Activity feed', href: '/activity-feed' },
            { name: 'About', href: '/about' },
            { name: 'Settings', href: '/settings' },
        ],
    },
];

const socials = [
    { name: 'GitHub', href: 'https://github.com/ramtejvigna', icon: Github },
    { name: 'X', href: 'https://x.com/ramtejvigna46', icon: Twitter },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/vignaramtej/', icon: Linkedin },
];

const Footer = () => {
    return (
        <footer className="relative mt-auto overflow-hidden border-t border-border bg-background">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
                <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
                    <div className="space-y-5">
                        <Logo />
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                            The arena where students sharpen their problem-solving, battle in live contests and
                            build a track record worth showing off.
                        </p>
                        <div className="flex gap-2">
                            {socials.map(({ name, href, icon: Icon }) => (
                                <Link
                                    key={name}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={name}
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                                >
                                    <Icon className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {columns.map((column) => (
                        <div key={column.title}>
                            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">{column.title}</h3>
                            <ul className="space-y-2.5">
                                {column.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.name}
                                            <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
                    <span>© {new Date().getFullYear()} Code Battle Ground. All rights reserved.</span>
                    <span className="inline-flex items-center gap-1">
                        Built with <Heart className="h-3 w-3 fill-primary text-primary" /> by
                        <Link
                            href="https://www.linkedin.com/in/vignaramtej/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-primary"
                        >
                            Vigna Ramtej Telagarapu
                        </Link>
                    </span>
                </div>
            </div>

            {/* Oversized wordmark */}
            <div
                aria-hidden
                className="pointer-events-none select-none px-4 pb-2 text-center font-display text-[18vw] font-bold leading-none tracking-tighter text-foreground/[0.035] lg:text-[200px]"
            >
                CODE·BATTLE
            </div>
        </footer>
    );
};

export default Footer;
