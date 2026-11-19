import React from 'react';

export function TrackSprintIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="4" r="2" />
      <path d="m18 19 1-7-6 1" />
      <path d="m5 8 3 3 1 7" />
      <path d="m4 17 5-2 3-6 4 1" />
    </svg>
  );
}

export function LongJumpIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="17" cy="5" r="2" />
      <path d="M14 9l-4 3 2 4" />
      <path d="M7 17l4-2 3-5 5 1" />
      <path d="M3 21h18" strokeDasharray="2 2" />
      <path d="M19 19c-1.5-2-3-2-5 0" />
    </svg>
  );
}

export function ShotPutIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="5" r="2" />
      <circle cx="15" cy="6" r="3" fill={color} />
      <path d="M8 11l4 2 3-4" />
      <path d="M6 19l4-4 2 2 3-6" />
      <path d="M2 22a8 8 0 0 1 12 0" />
    </svg>
  );
}

export function DiscusIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="7" ry="3" transform="rotate(-30 12 12)" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function BallThrowIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M7 5a9 9 0 0 0 0 14" strokeDasharray="1 1" />
      <path d="M17 5a9 9 0 0 1 0 14" strokeDasharray="1 1" />
      <path d="M4 12h16" strokeDasharray="1 1" />
    </svg>
  );
}

export function RelayBatonIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="20" x2="20" y2="4" strokeWidth="4" />
      <line x1="7" y1="17" x2="9" y2="15" stroke="white" strokeWidth="2" />
      <line x1="15" y1="9" x2="17" y2="7" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function PodiumMedalIcon({ rank = 1, className = "w-8 h-8" }) {
  const colors = {
    1: { bg: "bg-amber-400", border: "border-amber-300", text: "text-amber-950", label: "1º" },
    2: { bg: "bg-slate-300", border: "border-slate-200", text: "text-slate-900", label: "2º" },
    3: { bg: "bg-amber-700", border: "border-amber-600", text: "text-amber-100", label: "3º" },
  };

  const c = colors[rank] || colors[1];

  return (
    <div className={`inline-flex items-center justify-center rounded-full font-black border-2 shadow-lg ${c.bg} ${c.border} ${c.text} ${className}`}>
      {c.label}
    </div>
  );
}
