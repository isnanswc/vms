import React from 'react';

interface AnimatedIconProps {
  className?: string;
}

/**
 * Animated Wallet Icon:
 * Animates the wallet flap opening and closing smoothly in perspective.
 */
export const AnimatedWalletIcon: React.FC<AnimatedIconProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        {/* Wallet Main Body */}
        <rect x="2" y="6" width="20" height="15" rx="3" className="fill-current/5" />
        
        {/* Money / Card peek inside (revealed when flap opens) */}
        <path
          d="M6 6V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2"
          stroke="var(--theme-accent, #facc15)"
          strokeWidth="1.8"
          className="opacity-90"
        />

        {/* Animated Flap with Clasp */}
        <g className="animate-wallet-flap origin-top">
          {/* Flap curve */}
          <path
            d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4l-2 1.5-2-1.5H4a2 2 0 0 1-2-2V9z"
            fill="currentColor"
            fillOpacity="0.12"
          />
          {/* Clasp button */}
          <circle cx="12" cy="11" r="1.2" fill="var(--theme-accent, #facc15)" stroke="none" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Animated Speedometer (Gauge) Icon:
 * Needle revs up and sweeps across the dial back and forth like a car revving.
 */
export const AnimatedSpeedometerIcon: React.FC<AnimatedIconProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        {/* Speedometer Gauge Arc */}
        <path d="M4 15.5A8.5 8.5 0 1 1 20 15.5" />
        
        {/* Tick marks */}
        <line x1="5.5" y1="13.5" x2="7" y2="12.5" strokeWidth="1.5" className="opacity-60" />
        <line x1="12" y1="5.5" x2="12" y2="7.5" strokeWidth="1.5" className="opacity-80 stroke-theme-accent" />
        <line x1="18.5" y1="13.5" x2="17" y2="12.5" strokeWidth="1.5" className="opacity-60" />

        {/* Center Hub Pivot */}
        <circle cx="12" cy="15.5" r="2" fill="currentColor" />

        {/* Sweeping Speedometer Needle */}
        <g className="animate-speedometer-needle origin-[12px_15.5px]">
          <line
            x1="12"
            y1="15.5"
            x2="12"
            y2="8"
            stroke="var(--theme-accent, #facc15)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="12" cy="8" r="0.8" fill="var(--theme-accent, #facc15)" stroke="none" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Animated Arrow Rise Icon:
 * Arrow moves upward with a rising trail stream symbolizing ascending metrics / efficiency.
 */
export const AnimatedArrowRiseIcon: React.FC<AnimatedIconProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        {/* Baseline chart floor */}
        <path d="M3 20h18" strokeWidth="1.5" className="opacity-30" />

        {/* Rising Chevrons Trail */}
        <g className="animate-arrow-trail opacity-50">
          <polyline points="7 16 12 11 17 16" strokeWidth="1.5" />
        </g>

        {/* Dynamic Ascending Arrow */}
        <g className="animate-arrow-rise origin-bottom">
          <polyline
            points="18 8 18 2 12 2"
            stroke="var(--theme-accent, #facc15)"
            strokeWidth="2.2"
          />
          <line
            x1="6"
            y1="14"
            x2="18"
            y2="2"
            stroke="var(--theme-accent, #facc15)"
            strokeWidth="2.2"
          />
        </g>
      </svg>
    </div>
  );
};

/**
 * Animated Wrench Icon:
 * Rotates around its head back and forth as if tightening/loosening a bolt.
 */
export const AnimatedWrenchIcon: React.FC<AnimatedIconProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full overflow-visible"
      >
        {/* Animated Wrench pivoted on head */}
        <g className="animate-wrench-turn origin-[15px_9px]">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          {/* Center bolt head */}
          <circle cx="15.5" cy="8.5" r="1.5" fill="var(--theme-accent, #facc15)" stroke="none" />
        </g>
      </svg>
    </div>
  );
};
