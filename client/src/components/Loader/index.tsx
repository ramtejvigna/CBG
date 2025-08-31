import React from 'react'

const Loader = () => {
    return (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
            {/* 3D Container */}
            <div className="transform perspective-1000 rotate-y-20 flex flex-col items-center justify-center space-y-4">
                {/* Animated Gradient Spinner */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-[#F14A00] border-r-[#C62300] animate-spin"></div>
                </div>

                {/* Text with Gradient and Styling */}
                <div className="text-center">
                    <h1 className="scale-150 uppercase font-[family-name:var(--font-kanit-sans)] flex flex-col select-none">
                        <span className="text-[9px] leading-[9px] self-start tracking-wider text-gray-400">Code</span>
                        <span className="bg-gradient-to-tr from-[#F14A00] to-[#C62300] text-2xl py-1 bg-clip-text text-transparent leading-[12px] font-extrabold tracking-wide scale-y-75 transform origin-top">
                            Battle
                        </span>
                        <span className="text-[9px] leading-[0] self-end tracking-wider text-gray-400">Ground</span>
                    </h1>
                </div>
            </div>
        </div>
    )
}

export default Loader
