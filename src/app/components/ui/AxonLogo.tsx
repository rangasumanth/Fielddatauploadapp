import React from 'react';

interface AxonLogoProps {
    className?: string;
    size?: number | string;
    color?: string;
    showText?: boolean;
}

export function AxonLogo({
    className = "",
    size = 40,
    color = "currentColor",
    showText = true
}: AxonLogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div
                className="flex-shrink-0 relative flex items-center justify-center rounded-lg overflow-hidden bg-white/5 p-1 border border-white/5 shadow-inner"
                style={{ width: size, height: size }}
            >
                <img
                    src="https://a.storyblok.com/f/133181/450x403/be5fb8b53e/delta-logo.png"
                    alt="Axon"
                    className="w-full h-full object-contain"
                />
            </div>

            {showText && (
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-black italic tracking-tighter text-white">
                        AXON
                    </span>
                    <span className="text-[8px] font-bold tracking-[0.4em] text-zinc-500 uppercase mt-0.5">
                        Evidence
                    </span>
                </div>
            )}
        </div>
    );
}

// Actual AXON wordmark SVG would be better, but this stylized version
// fits the "industrial/operating system" aesthetic of the current app.
