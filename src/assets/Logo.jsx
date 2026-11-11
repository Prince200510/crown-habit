import React from 'react';

export default function CrownLogo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CROWN HABIT Logo"
    >
      <rect width="120" height="120" rx="28" fill="#173B68" />
      <path
        d="M26 78L20 42L44 56L60 30L76 56L100 42L94 78H26Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="26" y="84" width="68" height="10" rx="5" fill="#2563EB" />
      <circle cx="20" cy="36" r="5" fill="#0F9D91" />
      <circle cx="60" cy="24" r="6" fill="#0F9D91" />
      <circle cx="100" cy="36" r="5" fill="#0F9D91" />
      <path
        d="M47 61L56 70L75 50"
        stroke="#0F9D91"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
