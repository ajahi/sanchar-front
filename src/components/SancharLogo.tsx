import React from 'react';

interface SancharLogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * Sanchar Mailbox Logo
 * Faithful vector reproduction of the user's uploaded icons8-mailbox-600 graphic.
 * High-contrast postal dispatch mailbox with arched dome, mail slot, side flag, and mounting legs.
 */
export const SancharLogo: React.FC<SancharLogoProps> = ({
  className = 'w-16 h-16',
  size,
  color = 'currentColor',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 600"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      aria-label="Sanchar Mailbox Logo"
    >
      <g
        stroke={color}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Dual Mounting Posts / Legs Underneath */}
        <line x1="345" y1="430" x2="345" y2="550" stroke={color} strokeWidth="24" />
        <line x1="395" y1="430" x2="395" y2="550" stroke={color} strokeWidth="24" />

        {/* Main Body of the Mailbox (3D Isometric / Orthogonal Perspective) */}
        <path
          d="M 120 430 L 120 230 C 120 145, 195 125, 290 125 L 490 155 C 540 165, 560 205, 560 260 L 560 430 L 120 430 Z"
          fill="currentColor"
          fillOpacity="0.04"
          stroke={color}
          strokeWidth="26"
        />

        {/* Front Arched Face Contour Line */}
        <path
          d="M 120 430 L 120 230 C 120 145, 195 125, 290 125 L 310 145 L 310 430 L 120 430 Z"
          fill="none"
          stroke={color}
          strokeWidth="26"
        />

        {/* Horizontal Mail Insertion Slot */}
        <rect
          x="155"
          y="240"
          width="95"
          height="24"
          rx="12"
          fill={color}
          stroke="none"
        />

        {/* Mailbox Signal Flag Assembly (Pivot, Arm & Flag Plate) */}
        <circle cx="385" cy="230" r="22" fill={color} stroke="none" />
        <rect x="385" y="218" width="130" height="24" fill={color} stroke="none" />
        <rect x="465" y="218" width="50" height="70" fill={color} stroke="none" />
      </g>
    </svg>
  );
};
