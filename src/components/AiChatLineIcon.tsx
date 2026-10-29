import React from 'react';

interface AiChatLineIconProps {
  className?: string;
  isActive?: boolean;
}

/**
 * Modern AI Assistant Icon:
 * Google Gemini / Stellar 4-point star with orbital satellite twinkles and ambient cosmic breathing pulse.
 * Clean, premium, and visually soothing compared to harsh racing dashed lines.
 */
export const AiChatLineIcon: React.FC<AiChatLineIconProps> = ({
  className = 'w-6 h-6',
  isActive = false,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Soft Ambient Radial Aura Glow */}
        <circle
          cx="12"
          cy="12"
          r="9"
          className={isActive ? 'animate-ping opacity-25' : 'animate-pulse opacity-15'}
          fill="currentColor"
        />

        {/* Satellite Micro Star 1 (Top Right) */}
        <g className="animate-ai-satellite-1 origin-[18px_5px]">
          <path
            d="M18 2C18 3.65 19.35 5 21 5C19.35 5 18 6.35 18 8C18 6.35 16.65 5 15 5C16.65 5 18 3.65 18 2Z"
            fill="currentColor"
            className="opacity-80"
          />
        </g>

        {/* Satellite Micro Star 2 (Bottom Left) */}
        <g className="animate-ai-satellite-2 origin-[5px_19px]">
          <path
            d="M5 16C5 17.1 5.9 18 7 18C5.9 18 5 18.9 5 20C5 18.9 4.1 18 3 18C4.1 18 5 17.1 5 16Z"
            fill="currentColor"
            className="opacity-70"
          />
        </g>

        {/* Primary Gemini 4-Point Star Core */}
        <g className="animate-ai-star-breathe origin-center">
          <path
            d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
            fill="currentColor"
            className="drop-shadow-xs"
          />
          {/* Subtle Inner Highlight Prism */}
          <path
            d="M12 6C12 9.3 14.7 12 18 12C14.7 12 12 14.7 12 18C12 14.7 9.3 12 6 12C9.3 12 12 9.3 12 6Z"
            fill="white"
            fillOpacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
};
