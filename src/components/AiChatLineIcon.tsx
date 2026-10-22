import React from 'react';

interface AiChatLineIconProps {
  className?: string;
  isActive?: boolean;
}

export const AiChatLineIcon: React.FC<AiChatLineIconProps> = ({
  className = 'w-5 h-5',
  isActive = false,
}) => {
  // Speech bubble path (perimeter ~76px)
  const chatBubblePath = 'M20 14a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9z';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} overflow-visible`}
      >
        {/* Static Base Guide Track */}
        <path
          d={chatBubblePath}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-25"
        />

        {/* Dynamic Running Line with Connection Glow */}
        <path
          d={chatBubblePath}
          stroke={isActive ? '#facc15' : 'currentColor'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-chat-line-run"
        />

        {/* Micro Tech Node Pulse in Center */}
        <circle cx="9" cy="10" r="1.2" fill="currentColor" className="opacity-70" />
        <circle cx="13" cy="10" r="1.2" fill="currentColor" className="opacity-90" />
        <circle cx="17" cy="10" r="1.2" fill="currentColor" className="opacity-70" />
      </svg>
    </div>
  );
};
