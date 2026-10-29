import React from 'react';

interface AiChatLineIconProps {
  className?: string;
  isActive?: boolean;
}

/**
 * Konsep 2: The Neural Orb / Quantum AI Core
 * Glowing holographic orb surrounded by two 3D-angled orbital rings
 * with orbiting photon nodes and ambient core breathing pulse.
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
        {/* Ambient Outer Halo Pulse */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          className={isActive ? 'animate-ping opacity-25' : 'animate-pulse opacity-15'}
          fill="currentColor"
        />

        {/* Primary Orbital Ring (Rotates Clockwise around Core) */}
        <g className="animate-quantum-ring-1 origin-[12px_12px]">
          {/* Elliptical orbit path */}
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="3.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeDasharray="24 8"
            className="opacity-70"
          />
          {/* Orbiting Photon Satellite Node 1 */}
          <circle cx="21" cy="12" r="1.3" fill="currentColor" className="drop-shadow-xs" />
          <circle cx="21" cy="12" r="0.6" fill="white" />
        </g>

        {/* Secondary Orbital Ring (Crossed & Counter-Rotating) */}
        <g className="animate-quantum-ring-2 origin-[12px_12px]">
          {/* Intersecting elliptical orbit path */}
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="3.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeDasharray="18 10"
            className="opacity-60"
          />
          {/* Orbiting Photon Satellite Node 2 */}
          <circle cx="3" cy="12" r="1.3" fill="currentColor" className="drop-shadow-xs" />
          <circle cx="3" cy="12" r="0.6" fill="white" />
        </g>

        {/* Central Neural Orb Core with Gentle Breathing Pulse */}
        <g className="animate-neural-orb origin-[12px_12px]">
          {/* Soft Core Aura */}
          <circle cx="12" cy="12" r="5" fill="currentColor" className="opacity-25 filter blur-xs" />
          
          {/* Main Sphere Body */}
          <circle cx="12" cy="12" r="4.2" fill="currentColor" className="opacity-90" />
          
          {/* 3D Glassmorphic Specular Highlight */}
          <ellipse
            cx="10.8"
            cy="10.5"
            rx="1.8"
            ry="1.1"
            transform="rotate(-25 10.8 10.5)"
            fill="white"
            fillOpacity="0.55"
          />

          {/* Micro Quantum Sparkle in Center */}
          <circle cx="12" cy="12" r="1.2" fill="white" />
        </g>
      </svg>
    </div>
  );
};
