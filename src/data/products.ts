export type RarityToken = 'N' | 'M' | 'R' | 'F';
export type RarityCode = string;

export const MAX_RARITY_BADGES = 3;

export interface ProductItem {
  id: number;
  dbKey?: string;
  name: string;
  price: number;
  gemValue: number;
  imageUrl: string;
  rarity: RarityCode;
}

export function parseRarityCodes(rarity: string | undefined | null): RarityToken[] {
  if (!rarity) return [];
  const result: RarityToken[] = [];
  for (const ch of rarity.toUpperCase()) {
    if (ch === 'N' || ch === 'M' || ch === 'R' || ch === 'F') {
      result.push(ch);
      if (result.length >= MAX_RARITY_BADGES) break;
    }
  }
  return result;
}

export function normalizeRarityString(rarity: string | undefined | null): RarityCode {
  return parseRarityCodes(rarity).join('');
}

export function toggleRarityToken(current: string, token: RarityToken): RarityCode {
  const tokens = parseRarityCodes(current);
  const existingIndex = tokens.indexOf(token);
  if (existingIndex !== -1) {
    tokens.splice(existingIndex, 1);
    return tokens.join('');
  }
  if (tokens.length >= MAX_RARITY_BADGES) {
    return tokens.join('');
  }
  return [...tokens, token].join('');
}

export const RARITY_OPTIONS: Array<{
  code: RarityToken;
  label: string;
  src: string;
  isSquare?: boolean;
}> = [
  {
    code: 'N',
    label: 'N',
    src: '/assets/aistudio/cdc44daa1f51157faf2dab9f0752a1cf_5af3c6dc.jpg',
  },
  {
    code: 'M',
    label: 'M',
    src: '/assets/aistudio/d2db29c472026812b4cfb14b90b2c275_811816c7.jpg',
    isSquare: true,
  },
  {
    code: 'R',
    label: 'R',
    src: '/assets/aistudio/0c62440b648c5cb38b22efa5b95f9aa2_57dfd5ef.jpg',
  },
  {
    code: 'F',
    label: 'F',
    src: '/assets/aistudio/0d9f33642bba385841cc986e510e9c6f_42624f06.jpg',
  },
];

export const DEFAULT_PRODUCTS: ProductItem[] = [
  {id: 1, name: '', price: 49, gemValue: 1.2, imageUrl: '', rarity: ''},
  {id: 2, name: '', price: 99, gemValue: 2.5, imageUrl: '', rarity: ''},
  {id: 3, name: '', price: 149, gemValue: 3.7, imageUrl: '', rarity: ''},
  {id: 4, name: '', price: 199, gemValue: 5, imageUrl: '', rarity: ''},
];
