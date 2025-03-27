import React from 'react';

/**
 * Simple spinner loader component
 * @param {Object} props - Component props
 * @param {number} props.size - Size of the loader in pixels
 * @param {string} props.color - Color of the loader
 */
export const ClipLoader = ({ size = 24, color = 'currentColor' }) => {
  return (
    <div 
      style={{ 
        display: 'inline-block',
        width: size,
        height: size
      }}
      className="animate-spin"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="none"
          strokeLinecap="round"
          strokeWidth="4"
          stroke={color}
          d="M12 2a10 10 0 0 1 10 10"
        />
      </svg>
    </div>
  );
};
