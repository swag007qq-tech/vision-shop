import React from 'react';
import {RARITY_OPTIONS, RarityCode} from '../data/products';

interface RarityBadgeProps {
  rarity: RarityCode;
  sizeClass?: string;
}

export function RarityBadge({rarity, sizeClass = 'w-8 h-8'}: RarityBadgeProps) {
  if (!rarity) return null;
  const match = RARITY_OPTIONS.find((opt) => opt.code === rarity);
  if (!match) return null;

  return (
    <span
      title={`Редкость ${match.label}`}
      className={`inline-flex items-center justify-center overflow-hidden bg-white shadow-sm shrink-0 ${
        match.isSquare ? 'rounded-[7px]' : 'rounded-full'
      } ${sizeClass}`}
    >
      <img
        src={match.src}
        alt={`Редкость ${match.label}`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover scale-[1.95] pointer-events-none select-none"
        draggable={false}
      />
    </span>
  );
}
