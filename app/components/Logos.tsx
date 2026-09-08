import React from 'react';

// 1. ShopEase Main Brand Icon Logo (Shopping Bag + Speed Spark)
export function BrandIconLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 110 110"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="brandIconGrad" x1="5" y1="5" x2="90" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6"/>
          <stop offset="0.42" stopColor="#2563EB"/>
          <stop offset="0.75" stopColor="#0EA5E9"/>
          <stop offset="1" stopColor="#06B6D4"/>
        </linearGradient>

        <linearGradient id="secondaryIconGrad" x1="30" y1="20" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#818CF8"/>
          <stop offset="1" stopColor="#22D3EE"/>
        </linearGradient>

        <linearGradient id="foldIconGrad" x1="55" y1="45" x2="88" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1D4ED8"/>
          <stop offset="1" stopColor="#0891B2"/>
        </linearGradient>

        <filter id="logoShadowIconFilter" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.15"/>
        </filter>
      </defs>

      <g filter="url(#logoShadowIconFilter)">
        {/* Handle outer */}
        <path
          d="M25 43 V29 C25 14 35 7 49 7 C63 7 73 14 73 29 V43"
          stroke="url(#brandIconGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />

        {/* Handle inner highlight */}
        <path
          d="M34 38 V29 C34 19 40 15 49 15 C58 15 64 19 64 29 V38"
          stroke="url(#secondaryIconGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Main bag */}
        <path d="M10 38 H88 L81 96 H17 Z" fill="url(#brandIconGrad)"/>

        {/* Top edge */}
        <path d="M10 38 H88 L84 47 H14 Z" fill="#4338CA" opacity="0.35"/>

        {/* Dynamic folded side */}
        <path d="M88 38 L81 96 L60 75 V38 Z" fill="url(#foldIconGrad)"/>

        {/* Fold highlight */}
        <path d="M60 38 H88 L60 64 Z" fill="#FFFFFF" opacity="0.09"/>

        {/* S SYMBOL */}
        <path
          d="M65 52 C61 46 55 43 48 43 C39 43 32 47 32 53 C32 60 38 63 48 66 C58 69 64 73 64 80 C64 88 57 92 48 92 C39 92 31 88 27 82"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* S highlight */}
        <path
          d="M35 52 C39 48 43 47 48 47"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>

      {/* SPEED / EASE SPARK */}
      <path
        d="M94 19 L98 27 L106 31 L98 35 L94 43 L90 35 L82 31 L90 27 Z"
        fill="url(#secondaryIconGrad)"
      />
      <circle cx="103" cy="17" r="2.5" fill="#22D3EE"/>
    </svg>
  );
}

// 2. Support System Logo Component (Headset inside Cyan Chat Bubble)
export function SupportChatLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="supportGradientComp" x1="8" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06B6D4"/>
          <stop offset="0.45" stopColor="#0EA5E9"/>
          <stop offset="0.75" stopColor="#2563EB"/>
          <stop offset="1" stopColor="#4F46E5"/>
        </linearGradient>

        <linearGradient id="supportHighlightComp" x1="20" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#67E8F9"/>
          <stop offset="1" stopColor="#818CF8"/>
        </linearGradient>

        <filter id="supportShadowComp" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.18"/>
        </filter>
      </defs>

      {/* CHAT BUBBLE */}
      <g filter="url(#supportShadowComp)">
        <path
          d="M18 12 H76 C84 12 90 18 90 26 V59 C90 67 84 73 76 73 H49 L31 88 C28 90 25 88 25 85 V73 H18 C10 73 4 67 4 59 V26 C4 18 10 12 18 12 Z"
          fill="url(#supportGradientComp)"
        />
      </g>

      {/* SUPPORT HEADSET */}
      <path
        d="M27 48 V43 C27 30 36 22 47 22 C58 22 67 30 67 43 V48"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="23" y="43" width="10" height="18" rx="5" fill="white"/>
      <rect x="62" y="43" width="10" height="18" rx="5" fill="white"/>

      <path
        d="M67 59 C67 66 61 70 54 70 H49"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="47" cy="70" r="3" fill="white"/>

      {/* CHAT DOTS */}
      <circle cx="17" cy="31" r="2.5" fill="white" opacity="0.65"/>
      <circle cx="82" cy="25" r="3" fill="url(#supportHighlightComp)"/>

      {/* Small help accent */}
      <path
        d="M78 72 C78 68 81 65 85 65 C89 65 92 68 92 72 C92 75 90 77 88 78 L88 81"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="88" cy="85" r="1.8" fill="white"/>
    </svg>
  );
}

// 3. Sales Agent Logo Component (Sales "S" inside Purple Chat Bubble)
export function SalesAgentLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="salesGradientComp" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6"/>
          <stop offset="0.45" stopColor="#2563EB"/>
          <stop offset="0.75" stopColor="#0EA5E9"/>
          <stop offset="1" stopColor="#06B6D4"/>
        </linearGradient>

        <linearGradient id="salesHighlightComp" x1="25" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#93C5FD"/>
          <stop offset="1" stopColor="#22D3EE"/>
        </linearGradient>

        <filter id="salesShadowComp" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.18"/>
        </filter>
      </defs>

      {/* CHAT BUBBLE */}
      <g filter="url(#salesShadowComp)">
        <path
          d="M18 14 H75 C82 14 87 19 87 26 V61 C87 68 82 73 75 73 H49 L31 88 C29 90 26 89 26 86 V73 H18 C11 73 6 68 6 61 V26 C6 19 11 14 18 14 Z"
          fill="url(#salesGradientComp)"
        />
        <path
          d="M19 21 H73 C77 21 80 24 80 29 V58 C80 62 77 65 73 65 H47 L32 77 V65 H19 C15 65 12 62 12 58 V29 C12 24 15 21 19 21 Z"
          fill="white"
          opacity="0.07"
        />
      </g>

      {/* SALES S */}
      <path
        d="M65 33 C62 29 57 27 51 27 C43 27 37 31 37 36 C37 42 42 44 51 47 C60 49 65 53 65 59 C65 66 59 70 51 70 C43 70 36 67 32 62"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* CHAT DOTS */}
      <circle cx="24" cy="45" r="3" fill="white" opacity="0.9"/>
      <circle cx="81" cy="82" r="3" fill="#22D3EE"/>

      {/* SALES / AI SPARK */}
      <path
        d="M78 8 L81 14 L87 17 L81 20 L78 26 L75 20 L69 17 L75 14 Z"
        fill="url(#salesHighlightComp)"
      />
    </svg>
  );
}
