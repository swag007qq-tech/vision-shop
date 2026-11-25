import React from 'react';

export function SparkleIcon({
  className = 'w-4 h-4',
  filled = true,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? 0 : 2.1}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2C12.8 7.6 16.4 11.2 22 12C16.4 12.8 12.8 16.4 12 22C11.2 16.4 7.6 12.8 2 12C7.6 11.2 11.2 7.6 12 2Z" />
    </svg>
  );
}

export function OutlineStarIcon({className = 'w-5 h-5'}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5L14.9 8.4L21.4 9.3L16.7 13.9L17.8 20.4L12 17.3L6.2 20.4L7.3 13.9L2.6 9.3L9.1 8.4L12 2.5Z" />
    </svg>
  );
}

export function PawPrintIcon({className = 'w-8 h-8'}: {className?: string}) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <ellipse cx="15" cy="25" rx="5.2" ry="7.2" transform="rotate(-22 15 25)" />
      <ellipse cx="26.5" cy="15.5" rx="5.2" ry="7.5" transform="rotate(-8 26.5 15.5)" />
      <ellipse cx="39.5" cy="16" rx="5.2" ry="7.5" transform="rotate(10 39.5 16)" />
      <ellipse cx="50" cy="26" rx="5.2" ry="7.2" transform="rotate(24 50 26)" />
      <path d="M32 28C22 28 16 36.5 16 44C16 50.5 21.5 53 26.5 51.5C29.5 50.6 34.5 50.6 37.5 51.5C42.5 53 48 50.5 48 44C48 36.5 42 28 32 28Z" />
    </svg>
  );
}

export function GemIcon({className = 'w-4 h-4'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6.5 4H17.5L22 9.5L12 20.5L2 9.5L6.5 4Z" fill="#3B9DF8" />
      <path d="M6.5 4H17.5L15.5 9.5H8.5L6.5 4Z" fill="#7AC3FF" />
      <path d="M8.5 9.5H15.5L12 20.5L8.5 9.5Z" fill="#2383E2" />
      <path d="M2 9.5H8.5L12 20.5L2 9.5Z" fill="#4BA8FA" />
      <path d="M15.5 9.5H22L12 20.5L15.5 9.5Z" fill="#1B6EC2" />
      <path
        d="M12 7.5L12.6 10.1L15.2 10.7L12.6 11.3L12 13.9L11.4 11.3L8.8 10.7L11.4 10.1L12 7.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function PlaceholderStarIcon({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="currentColor" aria-hidden="true">
      <path d="M60 12C63.6 12 66.8 14.1 68.3 17.4L78.4 39.2L102.3 42.3C105.9 42.8 108.9 45.3 110 48.8C111.1 52.3 110.1 56.1 107.4 58.6L89.8 75.2L94.3 98.9C95 102.5 93.5 106.1 90.5 108.2C87.5 110.3 83.6 110.6 80.4 108.8L60 97.3L39.6 108.8C36.4 110.6 32.5 110.3 29.5 108.2C26.5 106.1 25 102.5 25.7 98.9L30.2 75.2L12.6 58.6C9.9 56.1 8.9 52.3 10 48.8C11.1 45.3 14.1 42.8 17.7 42.3L41.6 39.2L51.7 17.4C53.2 14.1 56.4 12 60 12Z" />
    </svg>
  );
}

export function UserSilhouetteIcon({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8" r="4.2" />
      <path d="M4.5 19.5C4.5 15.8 7.8 13.5 12 13.5C16.2 13.5 19.5 15.8 19.5 19.5C19.5 20.1 19 20.5 18.4 20.5H5.6C5 20.5 4.5 20.1 4.5 19.5Z" />
    </svg>
  );
}

export function DoubleNoteIcon({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9 17.5C9 19.16 7.43 20.5 5.5 20.5C3.57 20.5 2 19.16 2 17.5C2 15.84 3.57 14.5 5.5 14.5C6.06 14.5 6.59 14.62 7.05 14.82V6.3C7.05 5.65 7.5 5.08 8.13 4.94L18.13 2.75C19.01 2.56 19.85 3.23 19.85 4.13V15.5C19.85 17.16 18.28 18.5 16.35 18.5C14.42 18.5 12.85 17.16 12.85 15.5C12.85 13.84 14.42 12.5 16.35 12.5C16.91 12.5 17.44 12.62 17.9 12.82V7.12L9 9.08V17.5Z" />
    </svg>
  );
}

export function SolidCartIcon({className = 'w-5 h-5'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M2.5 4.5C2.5 3.95 2.95 3.5 3.5 3.5H5.8C6.31 3.5 6.75 3.88 6.81 4.39L7.1 6.5H20.3C21.02 6.5 21.52 7.21 21.28 7.89L19.05 14.22C18.88 14.7 18.42 15.02 17.91 15.02H8.15C7.61 15.02 7.14 14.66 7 14.13L5.05 5.5H3.5C2.95 5.5 2.5 5.05 2.5 4.5Z" />
      <circle cx="9" cy="18.7" r="1.8" />
      <circle cx="17.5" cy="18.7" r="1.8" />
    </svg>
  );
}

export function VisionLogo({className = 'w-64 h-auto'}: {className?: string}) {
  return (
    <img
      src="/assets/sprites/vision-logo.png"
      alt="Vision shop"
      referrerPolicy="no-referrer"
      className={className}
      draggable={false}
    />
  );
}

export function PeekingPuppy({className = 'w-48 h-auto'}: {className?: string}) {
  return (
    <img
      src="/assets/sprites/puppy-right.png"
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      className={className}
      draggable={false}
    />
  );
}
