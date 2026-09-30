import React from 'react'
import { LogoMark } from '@/components/Logo'

const Loader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md">
            <div className="flex flex-col items-center gap-5">
                <div className="relative grid place-items-center">
                    <span className="absolute h-20 w-20 animate-ping rounded-2xl bg-primary/20" />
                    <span className="absolute h-20 w-20 animate-spin rounded-full border-2 border-transparent border-r-[var(--ember-2)] border-t-[var(--ember-1)]" />
                    <LogoMark className="h-12 w-12 rounded-2xl" />
                </div>
                <p className="font-display text-sm font-semibold tracking-wide text-muted-foreground">
                    Loading the arena…
                </p>
            </div>
        </div>
    )
}

export default Loader
