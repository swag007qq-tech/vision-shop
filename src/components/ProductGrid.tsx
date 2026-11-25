import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Check, ChevronLeft, ChevronRight, Heart, Pencil} from 'lucide-react';
import {ProductItem} from '../data/products';
import {RarityBadge} from './RarityBadge';
import {
  GemIcon,
  PeekingPuppy,
  PlaceholderStarIcon,
  SolidCartIcon,
  SparkleIcon,
} from './VisionIllustrations';

interface ProductGridProps {
  products: ProductItem[];
  favoriteIds: number[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: ProductItem) => void;
  isAdmin?: boolean;
  onQuickEdit?: (id: number) => void;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  type: 'heart' | 'sparkle';
}

const BURST_PATTERN: Omit<BurstParticle, 'id'>[] = [
  {x: -22, y: -24, rotate: -22, scale: 0.9, type: 'heart'},
  {x: 0, y: -32, rotate: 8, scale: 1.05, type: 'heart'},
  {x: 22, y: -22, rotate: 24, scale: 0.85, type: 'heart'},
  {x: -26, y: -6, rotate: -15, scale: 0.8, type: 'sparkle'},
  {x: 24, y: -4, rotate: 18, scale: 0.85, type: 'sparkle'},
  {x: -10, y: -34, rotate: -10, scale: 0.75, type: 'sparkle'},
];

function AnimatedHeartButton({
  saved,
  onClick,
}: {
  saved: boolean;
  onClick: () => void;
}) {
  const [burstKey, setBurstKey] = useState(0);

  const handlePress = () => {
    if (!saved) {
      setBurstKey((prev) => prev + 1);
    }
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-pressed={saved}
      aria-label={saved ? 'Убрать из избранного' : 'Добавить в избранное'}
      className="relative w-11 h-11 rounded-full flex items-center justify-center bg-white border border-[#141414]/15 shadow-sm hover:bg-neutral-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
    >
      <AnimatePresence>
        {burstKey > 0 && saved && (
          <motion.span
            key={`ring-${burstKey}`}
            initial={{scale: 0.4, opacity: 0.85}}
            animate={{scale: 1.9, opacity: 0}}
            exit={{opacity: 0}}
            transition={{duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
            className="absolute inset-1 rounded-full border-2 border-[#E11D48] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {burstKey > 0 &&
          saved &&
          BURST_PATTERN.map((p, idx) => (
            <motion.span
              key={`particle-${burstKey}-${idx}`}
              initial={{x: 0, y: 0, scale: 0.25, opacity: 0, rotate: 0}}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0.25, p.scale, 0.4],
                opacity: [0, 1, 0],
                rotate: p.rotate,
              }}
              transition={{
                duration: 0.65,
                delay: idx * 0.025,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute pointer-events-none text-[#E11D48]"
            >
              {p.type === 'heart' ? (
                <Heart className="w-3.5 h-3.5 fill-current" />
              ) : (
                <SparkleIcon className="w-3 h-3 text-[#141414]" />
              )}
            </motion.span>
          ))}
      </AnimatePresence>

      <motion.span
        key={saved ? `saved-${burstKey}` : 'unsaved'}
        initial={saved && burstKey > 0 ? {scale: 0.75} : false}
        animate={
          saved && burstKey > 0
            ? {
                scale: [0.75, 1.48, 0.86, 1.15, 1],
                rotate: [0, -14, 12, -4, 0],
              }
            : {scale: 1, rotate: 0}
        }
        transition={{duration: 0.48, ease: [0.16, 1, 0.3, 1]}}
        whileTap={{scale: 0.85}}
        className={`relative z-10 flex items-center justify-center transition-colors duration-150 ${
          saved ? 'text-[#E11D48]' : 'text-[#141414]'
        }`}
      >
        <Heart
          className={`w-6 h-6 transition-all duration-150 ${saved ? 'fill-current' : ''}`}
          strokeWidth={2.6}
        />
      </motion.span>
    </button>
  );
}

const PAGE_SIZE = 4;

export function ProductGrid({
  products,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  isAdmin = false,
  onQuickEdit,
}: ProductGridProps) {
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const visibleProducts = products.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handlePrevPage = () => {
    if (totalPages <= 1) return;
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNextPage = () => {
    if (totalPages <= 1) return;
    setPage((prev) => (prev + 1) % totalPages);
  };

  const handleBuyClick = (item: ProductItem) => {
    onAddToCart(item);
    setRecentlyAddedId(item.id);
    window.setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === item.id ? null : curr));
    }, 850);
  };

  return (
    <section
      aria-label="Каталог товаров"
      className="relative z-10 w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-1 pb-4"
    >
      {/* Peeking dalmatian puppy sitting directly on the top-right edge of card 4 */}
      <div className="hidden md:flex justify-end pr-12 lg:pr-14 xl:pr-16 -mb-5 lg:-mb-6 relative z-20 pointer-events-none select-none">
        <PeekingPuppy className="w-48 lg:w-64 xl:w-72 h-auto" />
      </div>

      {/* Carousel container with flanking arrows on md+ */}
      <div className="relative flex items-center gap-3 lg:gap-5">
        {/* Left Arrow Button (tablet/desktop) */}
        <button
          type="button"
          onClick={handlePrevPage}
          aria-label="Предыдущие товары"
          className="hidden md:flex w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.1)] items-center justify-center text-[#141414] shrink-0 transition-transform duration-150 hover:bg-neutral-50 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.8} />
        </button>

        {/* Responsive Product Grid */}
        {visibleProducts.length === 0 ? (
          <div className="w-full py-16 px-6 rounded-[30px] bg-white border-[1.5px] border-[#1A1A1A] text-center shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
            <p className="text-[18px] font-extrabold text-[#141414]">Каталог пока пуст</p>
            <p className="text-[14px] font-medium text-neutral-500 mt-1">
              Администратор скоро добавит новые товары.
            </p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 min-[460px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleProducts.map((item) => {
              const isSaved = favoriteIds.includes(item.id);
              const isAdded = recentlyAddedId === item.id;
              const showImage = Boolean(item.imageUrl) && !failedImages[item.id];

              return (
                <article
                  key={item.id}
                  className="group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-[30px] bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {/* Product Thumbnail */}
                  <div className="relative w-full aspect-[1.22/1] rounded-[20px] bg-[#F4F4F4] border border-[#141414]/10 flex items-center justify-center overflow-visible">
                    <div className="w-full h-full rounded-[20px] overflow-hidden flex items-center justify-center">
                      {showImage ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name || `Товар #${item.id}`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({...prev, [item.id]: true}))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PlaceholderStarIcon className="w-24 h-24 sm:w-28 sm:h-28 text-[#D0D0D0]" />
                      )}
                    </div>

                    {(item.rarity || (isAdmin && onQuickEdit)) && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {item.rarity && (
                          <RarityBadge rarity={item.rarity} sizeClass="w-8 h-8 sm:w-9 sm:h-9" />
                        )}
                        {isAdmin && onQuickEdit && (
                          <button
                            type="button"
                            onClick={() => onQuickEdit(item.id)}
                            aria-label="Редактировать товар"
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#141414] flex items-center justify-center text-[#141414] hover:bg-neutral-50 active:scale-90 transition-transform cursor-pointer shadow-sm"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Heart icon button in top-right with burst animation */}
                    <div className="absolute top-2 right-2">
                      <AnimatedHeartButton
                        saved={isSaved}
                        onClick={() => onToggleFavorite(item.id)}
                      />
                    </div>
                  </div>

                  {/* Optional name + Price & Gem Value */}
                  <div className="px-1.5 pt-3.5 pb-3 flex flex-col gap-1">
                    {item.name && (
                      <div className="text-[14px] font-bold text-[#141414] truncate pl-7">
                        {item.name}
                      </div>
                    )}
                    <div className="text-[22px] sm:text-[23px] font-extrabold text-[#141414] leading-tight tabular-nums pl-7">
                      {item.price} ₴
                    </div>
                    <div className="flex items-center gap-2.5 text-[15px] font-semibold text-[#141414] tabular-nums">
                      <GemIcon className="w-4 h-4 shrink-0" />
                      <span>{item.gemValue}</span>
                    </div>
                  </div>

                  {/* Buy CTA Button */}
                  <motion.button
                    type="button"
                    whileTap={{scale: 0.96}}
                    onClick={() => handleBuyClick(item)}
                    className="w-full min-h-[46px] py-2.5 px-4 rounded-full bg-[#141414] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2.5 transition-colors duration-150 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black cursor-pointer"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5 shrink-0" strokeWidth={2.8} />
                        <span>В корзине</span>
                      </>
                    ) : (
                      <>
                        <SolidCartIcon className="w-5 h-5 shrink-0" />
                        <span>Купить</span>
                      </>
                    )}
                  </motion.button>
                </article>
              );
            })}
          </div>
        )}

        {/* Right Arrow Button (tablet/desktop) */}
        <button
          type="button"
          onClick={handleNextPage}
          aria-label="Следующие товары"
          className="hidden md:flex w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.1)] items-center justify-center text-[#141414] shrink-0 transition-transform duration-150 hover:bg-neutral-50 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.8} />
        </button>
      </div>

      {/* Mobile Carousel Arrows (< md): centered cleanly below grid with zero horizontal overflow */}
      <div className="flex md:hidden items-center justify-center gap-4 pt-5">
        <button
          type="button"
          onClick={handlePrevPage}
          aria-label="Предыдущие товары"
          className="w-11 h-11 rounded-full bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-[#141414] active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.7} />
        </button>
        {totalPages > 1 && (
          <span className="text-[13px] font-bold text-[#141414] tabular-nums">
            {page + 1} / {totalPages}
          </span>
        )}
        <button
          type="button"
          onClick={handleNextPage}
          aria-label="Следующие товары"
          className="w-11 h-11 rounded-full bg-white border-[1.5px] border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-[#141414] active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-black"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.7} />
        </button>
      </div>
    </section>
  );
}
