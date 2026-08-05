import React from 'react';

/* ROAM · Outpost wordmark — the planted-flag mark + "Outpost" in Playfair.
   `currentColor` on the text so it adapts to light/dark; flag in ROAM gold. */
export const LogoTextComponent = () => {
  return (
    <svg
      width="150"
      height="34"
      viewBox="0 0 150 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="translate(2 3) scale(1.15)"
        stroke="#C6975B"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 21V3" />
        <path d="M7 3h10l-2.6 3L17 9H7" />
        <path d="M4.5 21h6" />
      </g>
      <text
        x="38"
        y="24"
        fill="currentColor"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="23"
        fontWeight="600"
        letterSpacing="0.2"
      >
        Outpost
      </text>
    </svg>
  );
};
