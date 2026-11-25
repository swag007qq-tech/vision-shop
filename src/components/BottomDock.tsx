import React from 'react';
import {motion} from 'motion/react';
import {Heart} from 'lucide-react';
import {SolidCartIcon} from './VisionIllustrations';

interface BottomDockProps {
  favoritesCount: number;
  cartCount: number;
  onOpenFavorites: () => void;
  onOpenCart: () => void;
}

export function BottomDock({
  favoritesCount,
  cartCount,
  onOpenFavorites,
  onOpenCart,
}: BottomDockProps) {
  return (
    <div className="relative z-20 w-full flex justify-center px-3 sm:px-6 pt-3 pb-6 sm:pb-8">
      <div className="inline-flex items-center gap-1.5 min-[380px]:gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-full bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_8px_22px_rgba(0,0,0,0.12)] max-w-full">
        <button
          type="button"
          onClick={onOpenFavorites}
          className="inline-flex items-center justify-center gap-1.5 min-[380px]:gap-2 sm:gap-2.5 px-2.5 min-[380px]:px-5 sm:px-8 py-2.5 sm:py-3 min-h-[44px] rounded-full bg-[#141414] text-white text-[12px] min-[380px]:text-[15px] sm:text-[16px] font-bold transition-all duration-150 hover:bg-black active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black whitespace-nowrap cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${
              favoritesCount > 0 ? 'text-[#FB7185] fill-current' : 'text-white'
            }`}
            strokeWidth={2.4}
          />
          <span>Избранное</span>
          {favoritesCount > 0 && (
            <motion.span
              key={`fav-${favoritesCount}`}
              initial={{scale: 0.7}}
              animate={{scale: [1.3, 1]}}
              transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
              className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#141414] text-[11px] font-black inline-flex items-center justify-center tabular-nums"
            >
              {favoritesCount}
            </motion.span>
          )}
        </button>

        <span aria-hidden="true" className="w-[1.5px] h-7 bg-[#1A1A1A] shrink-0" />

        <button
          type="button"
          onClick={onOpenCart}
          className="inline-flex items-center justify-center gap-1.5 min-[380px]:gap-2 sm:gap-2.5 px-2.5 min-[380px]:px-5 sm:px-8 py-2.5 sm:py-3 min-h-[44px] rounded-full bg-[#141414] text-white text-[12px] min-[380px]:text-[15px] sm:text-[16px] font-bold transition-all duration-150 hover:bg-black active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black whitespace-nowrap cursor-pointer"
        >
          <SolidCartIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>Корзина</span>
          {cartCount > 0 && (
            <motion.span
              key={`cart-${cartCount}`}
              initial={{scale: 0.7}}
              animate={{scale: [1.3, 1]}}
              transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
              className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#141414] text-[11px] font-black inline-flex items-center justify-center tabular-nums"
            >
              {cartCount}
            </motion.span>
          )}
        </button>
      </div>
    </div>
  );
}
