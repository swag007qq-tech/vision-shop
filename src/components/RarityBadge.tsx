import React from 'react';
import {RARITY_OPTIONS, RarityCode, RarityToken, parseRarityCodes} from '../data/products';

interface SingleRarityIconProps {
  token: RarityToken;
  sizeClass?: string;
}

export function SingleRarityIcon({token, sizeClass = 'w-8 h-8'}: SingleRarityIconProps) {
  const match = RARITY_OPTIONS.find((opt) => opt.code === token);
  if (!match) return null;

  return (
    <span
      title={`Редкость ${match.label}`}
      className={`inline-flex items-center justify-center overflow-hidden bg-white shadow-sm ring-[1.5px] ring-white shrink-0 ${
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

interface RarityBadgeProps {
  rarity: RarityCode;
  sizeClass?: string;
  gapClass?: string;
  className?: string;
}

export function RarityBadge({
  rarity,
  sizeClass = 'w-8 h-8',
  gapClass = 'gap-1',
  className = '',
}: RarityBadgeProps) {
  const tokens = parseRarityCodes(rarity);
  if (tokens.length === 0) return null;

  return (
    <span className={`inline-flex items-center ${gapClass} shrink-0 ${className}`}>
      {tokens.map((token, index) => (
        <SingleRarityIcon key={`${token}-${index}`} token={token} sizeClass={sizeClass} />
      ))}
    </span>
  );
}
